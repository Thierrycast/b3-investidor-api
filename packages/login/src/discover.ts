import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { chromium, type Browser, type Response } from "playwright-core";
import { B3_API_BASE, B3_WEB_ORIGIN, endpointList, shape, type Shape } from "@b3-investidor/core";

/**
 * `b3 discover`: mapeia rotas da API enquanto a pessoa navega no portal.
 *
 * - Abre o Chrome instalado como processo comum (perfil próprio, porta de depuração local) e se conecta
 *   por CDP. Não é um navegador "automatizado": a pessoa passa pelo Cloudflare e faz login sozinha.
 * - Registra só a FORMA das chamadas ao host da API: método, rota como modelo (números, ids, datas e
 *   tickers viram {n}, {id}, {data}, {ticker}), NOMES dos parâmetros, status e árvore de tipos.
 *   Nenhum valor (corpo, query, header) é gravado.
 */
export interface DiscoverOptions {
  /** Arquivo de saída (JSON). */
  out: string;
  port?: number;
  chromePath?: string;
  /** Perfil do Chrome usado só pelo discover. */
  profileDir?: string;
  onStatus?: (msg: string) => void;
  onRoute?: (r: DiscoveredRoute) => void;
}

export interface DiscoveredRoute {
  metodo: string;
  rota: string;
  /** id no registro do projeto, se a rota já for conhecida. */
  conhecida?: string;
  status: Record<string, number>;
  parametros: string[];
  contentType?: string;
  shape?: Shape;
  vistaEm: string;
}

const API_HOST = new URL(B3_API_BASE).host;
const IGNORE_PARAMS = new Set(["cache-guid"]);

/** Troca partes variáveis do caminho por marcadores, para não gravar dados (ids, datas, tickers). */
export function templatePath(path: string): string {
  return path
    .split("/")
    .map((s) => {
      if (!s) return s;
      if (/^\d+$/.test(s)) return "{n}";
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return "{uuid}";
      if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{2}[-.]\d{2}[-.]\d{4}$/.test(s)) return "{data}";
      if (/^[A-Z]{4}\d{1,2}[A-Z]?$/.test(s)) return "{ticker}";
      if (/\d{4,}/.test(s) || /^[A-Z0-9]{5,}$/.test(s)) return "{id}";
      return s;
    })
    .join("/");
}

/** Casa um modelo descoberto com o registro (onde `{pagina}` etc. viram curinga). */
export function matchRegistry(rota: string): string | undefined {
  for (const ep of endpointList) {
    const re = new RegExp(`^${ep.b3Path.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{[^}]+\}/g, "[^/]+")}$`);
    if (re.test(rota)) return ep.id;
  }
  return undefined;
}

function findChrome(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.B3_CHROME,
    ...(process.platform === "win32"
      ? [
          join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
          join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
          join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
          join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Microsoft\\Edge\\Application\\msedge.exe"),
        ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
        : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"]),
  ].filter(Boolean) as string[];
  const found = candidates.find((c) => existsSync(c));
  if (!found) throw new Error("Chrome/Edge não encontrado. Informe o caminho com --chrome ou B3_CHROME.");
  return found;
}

async function connect(port: number, timeoutMs = 20_000): Promise<Browser> {
  const deadline = Date.now() + timeoutMs;
  let last: unknown;
  while (Date.now() < deadline) {
    try {
      return await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Não conectei ao Chrome na porta ${port}: ${String(last).slice(0, 160)}`);
}

export async function discover(o: DiscoverOptions): Promise<DiscoveredRoute[]> {
  const status = (m: string) => o.onStatus?.(m);
  const port = o.port ?? 9333;
  const profile = o.profileDir ?? join(process.env.B3_CONFIG_DIR ?? join(homedir(), ".config", "b3-investidor"), "chrome-discover");
  mkdirSync(profile, { recursive: true });

  const chrome = findChrome(o.chromePath);
  const proc: ChildProcess = spawn(chrome, [`--remote-debugging-port=${port}`, "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", `${B3_WEB_ORIGIN}/`], {
    stdio: "ignore",
    detached: false,
  });
  status(`Chrome aberto (perfil próprio em ${profile}). Faça login e navegue pelas telas que quer mapear; feche o Chrome para terminar.`);

  const browser = await connect(port);
  const routes = new Map<string, DiscoveredRoute>();

  const save = () => {
    mkdirSync(dirname(o.out), { recursive: true });
    const list = [...routes.values()].sort((a, b) => a.rota.localeCompare(b.rota));
    writeFileSync(
      o.out,
      JSON.stringify({ geradoEm: new Date().toISOString(), aviso: "Só nomes e tipos; nenhum valor. Revise antes de compartilhar.", rotas: list }, null, 2),
    );
    return list;
  };

  const onResponse = async (res: Response) => {
    const req = res.request();
    let u: URL;
    try {
      u = new URL(req.url());
    } catch {
      return;
    }
    if (u.host !== API_HOST || req.method() === "OPTIONS") return;
    const rota = templatePath(u.pathname);
    const key = `${req.method()} ${rota}`;
    const isNew = !routes.has(key);
    const r: DiscoveredRoute = routes.get(key) ?? {
      metodo: req.method(),
      rota,
      conhecida: matchRegistry(rota),
      status: {},
      parametros: [],
      vistaEm: new Date().toISOString(),
    };
    r.status[res.status()] = (r.status[res.status()] ?? 0) + 1;
    r.parametros = [...new Set([...r.parametros, ...[...u.searchParams.keys()].filter((k) => !IGNORE_PARAMS.has(k))])].sort();
    const ct = res.headers()["content-type"];
    if (ct) r.contentType = ct.split(";")[0];
    if (ct?.includes("json") && res.status() < 300) {
      const body = await res.json().catch(() => undefined);
      // Guarda a forma mais informativa (a com mais texto), útil quando uma tela traz lista vazia e outra cheia.
      if (body !== undefined) {
        const s = shape(body);
        if (!r.shape || JSON.stringify(s).length > JSON.stringify(r.shape).length) r.shape = s;
      }
    }
    routes.set(key, r);
    if (isNew) {
      o.onRoute?.(r);
      save();
    }
  };

  const watch = (ctx: ReturnType<Browser["contexts"]>[number]) => ctx.on("response", (r) => void onResponse(r));
  browser.contexts().forEach(watch);

  await new Promise<void>((resolve) => {
    browser.on("disconnected", () => resolve());
    proc.on("exit", () => resolve());
    process.once("SIGINT", () => resolve());
  });
  const list = save();
  await browser.close().catch(() => {});
  if (proc.exitCode === null) proc.kill();
  return list;
}
