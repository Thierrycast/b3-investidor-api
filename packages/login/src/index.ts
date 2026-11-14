import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright-core";
import { B3AuthError, buildAuthorizeUrl, createPkce, exchangeCode, LOGIN_REDIRECT_URI, type B3Session } from "@b3-investidor/core";

/**
 * Login assistido.
 *
 * Como funciona (detalhes em docs/auth.md → "Login assistido"):
 * - Abre direto o /authorize do Azure AD B2C, com PKCE próprio. O site www.investidor.b3.com.br
 *   (que fica atrás de um desafio do Cloudflare) não é carregado: o redirecionamento final para ele
 *   é lido para obter o `code` e respondido com uma página local.
 * - Preenche CPF/CNPJ e senha quando informados.
 * - Código de verificação (e-mail): no headless, se houver `askCode`, a pessoa digita o código no
 *   terminal; sem `askCode`, abre a janela. CAPTCHA sempre vai para a janela.
 *   A ferramenta nunca resolve nem contorna desafios.
 * - Troca o `code` por tokens e devolve a sessão (refresh_token).
 */
export interface LoginOptions {
  cpf?: string;
  senha?: string;
  /** auto = headless se houver CPF e senha, senão janela; headless = só tenta sem janela; headed = sempre janela. */
  mode?: "auto" | "headless" | "headed";
  /** Quanto esperar a pessoa concluir na janela. Padrão: 10 min. */
  headedTimeoutMs?: number;
  /** Quanto esperar no headless antes de desistir (sem contar o tempo de digitar o código). Padrão: 90 s. */
  headlessTimeoutMs?: number;
  /** Pede à pessoa o código de verificação enviado pela B3 (ex.: por e-mail). Usado só no headless. */
  askCode?: (motivo: string) => Promise<string>;
  /** Grava a ESTRUTURA de cada tela (ids, tipos, textos de botão; nunca valores digitados) para depuração. */
  debugDir?: string;
  /** Canal do navegador instalado (chrome, msedge). Padrão: chrome, depois msedge. */
  channel?: string;
  executablePath?: string;
  /** Mensagens de progresso (nunca recebem segredos). */
  onStatus?: (msg: string) => void;
}

/** Motivo que faz o headless desistir e passar a vez para a janela. */
class NeedsHuman extends Error {}

const DONE_HTML = `<!doctype html><meta charset="utf-8"><title>B3 — login concluído</title>
<body style="font-family:system-ui;padding:3rem;max-width:36rem;margin:auto">
<h1>Login concluído</h1><p>A sessão foi capturada pelo <code>b3 login</code>. Pode fechar esta janela.</p></body>`;

const REDIRECT_ORIGIN = new URL(LOGIN_REDIRECT_URI).origin;
const digits = (s?: string) => (s ?? "").replace(/\D/g, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SUBMIT = [
  "#next",
  "#continue",
  "#Btn_CONTINUE",
  "button[type=submit]",
  "button:has-text('Enviar')",
  "button:has-text('Entrar')",
  "button:has-text('Continuar')",
  "button:has-text('Acessar')",
  "button:has-text('Verificar')",
  "button:has-text('Confirmar')",
];

/** Tela "Código de autenticação" (observada em 13/11/2026): INPUT_OTP_EMAIL + Btn_VERIFY_CODE. */
const VERIFY = ["#Btn_VERIFY_CODE", "button:has-text('Verificar')", "button:has-text('Confirmar')"];

/** Botão "Enviar Novo código" da tela do código. Só é clicado quando a pessoa pede (`r`), nunca sozinho. */
const RESEND = ["button:has-text('Enviar Novo')", "a:has-text('Enviar Novo')", "button:has-text('Reenviar')", "a:has-text('Reenviar')"];
/** Reenvios seguidos que aceitamos antes de parar (a B3 pode limitar e o último código é o único válido). */
const MAX_RESENDS = 3;

/** `r`, `reenviar` ou `resend` no lugar do código pedem um novo e-mail à B3. */
export const isResend = (typed: string) => /^(r|reenviar|resend)$/i.test(typed.trim());

async function launch(headless: boolean, o: LoginOptions): Promise<Browser> {
  if (o.executablePath) return chromium.launch({ headless, executablePath: o.executablePath });
  const channels = o.channel ? [o.channel] : ["chrome", "msedge"];
  let last: unknown;
  for (const channel of channels) {
    try {
      return await chromium.launch({ headless, channel });
    } catch (e) {
      last = e;
    }
  }
  throw new Error(
    `Nenhum navegador encontrado (${channels.join(", ")}). Instale o Google Chrome ou informe executablePath. Detalhe: ${String(last).slice(0, 200)}`,
  );
}

type Need = { kind: "captcha" | "codigo" | "erro"; detail: string };

// Scripts que rodam DENTRO do navegador vão como texto: transpiladores (tsx/esbuild com keepNames)
// injetam helpers como `__name` em funções, que não existem na página e fariam o evaluate falhar calado.
const JS_HUMAN_NEEDED = `(() => {
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
  const frames = [...document.querySelectorAll("iframe")].filter(visible).map((f) => f.src);
  if (frames.some((s) => /recaptcha\\/(api2|enterprise)\\/bframe|hcaptcha|challenges\\.cloudflare/.test(s))) return { kind: "captcha", detail: "captcha" };
  const otp = [...document.querySelectorAll("input")].find((i) => visible(i) && i.type !== "hidden" && i.type !== "password" &&
    (i.autocomplete === "one-time-code" || /c[oó]digo|code|token|otp|verifica/i.test(i.id + " " + i.name + " " + i.placeholder)));
  if (otp) return { kind: "codigo", detail: "código de verificação" };
  const err = [...document.querySelectorAll(".error.pageLevel, .error.itemLevel, [role=alert]")].find((e) => visible(e) && (e.textContent || "").trim().length > 0);
  if (err) return { kind: "erro", detail: "mensagem da B3: " + (err.textContent || "").trim().slice(0, 120) };
  return null;
})()`;

const JS_STRUCTURE = `(() => {
  const vis = (e) => e.getBoundingClientRect().width > 0;
  return {
    title: document.title,
    path: location.origin + location.pathname,
    inputs: [...document.querySelectorAll("input,select,textarea")].map((x) => ({ tag: x.tagName.toLowerCase(), id: x.id, name: x.name, type: x.type, autocomplete: x.autocomplete, placeholder: x.placeholder, visivel: vis(x) })),
    botoes: [...document.querySelectorAll("button,input[type=submit],a.button")].map((b) => ({ id: b.id, texto: (b.textContent || b.value || "").trim().slice(0, 40), visivel: vis(b) })),
    frames: [...document.querySelectorAll("iframe")].map((f) => f.src.split("?")[0]),
    mensagens: [...document.querySelectorAll(".error, [role=alert], .intro, h1, h2")].filter(vis).map((e) => (e.textContent || "").trim().slice(0, 100)).filter(Boolean),
  };
})()`;

/** Procura sinais de que a B3 está pedindo algo que só uma pessoa pode fazer. */
async function humanNeeded(page: Page): Promise<Need | null> {
  return (page.evaluate(JS_HUMAN_NEEDED) as Promise<Need | null>).catch(() => null);
}

/** Estrutura da tela, sem valores: para entender telas novas sem expor dados. */
async function dumpStructure(page: Page, dir: string, n: number) {
  const s = await page.evaluate(JS_STRUCTURE).catch(() => null);
  if (!s) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `tela-${String(n).padStart(2, "0")}.json`), JSON.stringify(s, null, 2));
}

async function clickVisible(page: Page, selectors: string[]) {
  for (const sel of selectors) {
    const loc = page.locator(sel).filter({ visible: true }).first();
    if (await loc.count()) {
      await loc.click({ timeout: 5000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

/** Preenche o que der. Nunca lança: quem decide se deu certo é a captura do `code`. */
async function autofill(page: Page, o: LoginOptions, status: (m: string) => void) {
  const cpf = digits(o.cpf);
  const doc = page.locator("#DOC_INPUT");
  if (cpf && (await doc.waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false))) {
    if (!(await doc.inputValue().catch(() => ""))) await doc.fill(cpf).catch(() => {});
    const terms = page.locator("#termos_e_politicas");
    if ((await terms.count()) && !(await terms.isChecked().catch(() => true))) await terms.check().catch(() => {});
    status("CPF/CNPJ preenchido");
    await clickVisible(page, ["#Btn_CONTINUE", "#continue", "button:has-text('Continuar')"]);
  }
  if (o.senha) {
    const pwd = page.locator("input[type=password]").filter({ visible: true }).first();
    if (await pwd.waitFor({ state: "visible", timeout: 30_000 }).then(() => true, () => false)) {
      await pwd.fill(o.senha).catch(() => {});
      status("senha preenchida; enviando");
      const before = page.url();
      await clickVisible(page, SUBMIT);
      await sleep(1500);
      // Se nada mudou (botão não encontrado ou ignorado), tenta Enter no campo.
      if (page.url() === before && (await pwd.isVisible().catch(() => false))) await pwd.press("Enter").catch(() => {});
    }
  }
}

/** Preenche o código de verificação digitado pela pessoa e envia. */
async function fillCode(page: Page, code: string) {
  const input = page
    .locator("input:not([type=hidden]):not([type=password])")
    .filter({ visible: true })
    .filter({ hasNot: page.locator("[type=checkbox]") });
  const candidates = await input.all();
  for (const c of candidates) {
    const meta = [await c.getAttribute("id"), await c.getAttribute("name"), await c.getAttribute("placeholder"), await c.getAttribute("autocomplete")].join(" ");
    if (/c[oó]digo|code|token|otp|verifica|one-time/i.test(meta)) {
      // O campo visível (INPUT_OTP_EMAIL) é uma fachada: o script da página copia o valor para o campo
      // real do B2C (VerificationCode, oculto) em eventos de tecla. `fill` não dispara tecla; digitamos.
      await c.click().catch(() => {});
      await c.fill("").catch(() => {});
      await c.pressSequentially(code.replace(/\s/g, ""), { delay: 60 });
      await sleep(300);
      // Só o botão de verificar: a tela também tem "Voltar" e "Enviar Novo código", que não podem ser clicados.
      if (!(await clickVisible(page, VERIFY))) await c.press("Enter").catch(() => {});
      return true;
    }
  }
  return false;
}

async function attempt(headless: boolean, o: LoginOptions): Promise<B3Session> {
  const status = (m: string) => o.onStatus?.(`[${headless ? "headless" : "janela"}] ${m}`);
  const pkce = createPkce();
  const state = randomUUID();
  const browser = await launch(headless, o);
  const timers: NodeJS.Timeout[] = [];
  try {
    const context = await browser.newContext({ locale: "pt-BR" });
    let resolveCode!: (c: string) => void;
    let rejectCode!: (e: Error) => void;
    const codeP = new Promise<string>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    // Lê o code de qualquer requisição/navegação para o redirect_uri (redirecionamento HTTP, JS ou formulário).
    const inspect = (raw: string) => {
      let u: URL;
      try {
        u = new URL(raw);
      } catch {
        return false;
      }
      if (u.origin !== REDIRECT_ORIGIN) return false;
      const code = u.searchParams.get("code");
      const err = u.searchParams.get("error_description") ?? u.searchParams.get("error");
      if (code && u.searchParams.get("state") === state) resolveCode(code);
      else if (err) rejectCode(new B3AuthError(`Login recusado pela B3: ${err.split(/\r?\n/)[0]?.slice(0, 160)}`, "login_error", true));
      return true;
    };
    context.on("request", (r) => void inspect(r.url()));
    // Responde com página local em vez de carregar o site (que fica atrás do Cloudflare).
    await context.route(
      (u) => u.origin === REDIRECT_ORIGIN,
      (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: DONE_HTML }),
    );

    const page = await context.newPage();
    page.on("framenavigated", (f) => void inspect(f.url()));

    let shots = 0;
    if (o.debugDir) {
      const dir = o.debugDir;
      page.on("load", () => void dumpStructure(page, dir, ++shots));
    }

    status("abrindo o login da B3");
    await page.goto(buildAuthorizeUrl({ challenge: pkce.challenge, state, nonce: randomUUID(), docHint: digits(o.cpf) }), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const fill = autofill(page, o, status);

    let code: string;
    if (headless) {
      const watchdog = (async () => {
        await fill;
        let deadline = Date.now() + (o.headlessTimeoutMs ?? 90_000);
        let asked = 0;
        let resends = 0;
        while (Date.now() < deadline) {
          const need = await humanNeeded(page);
          if (need?.kind === "codigo" && o.askCode && asked < 3) {
            if (o.debugDir) await dumpStructure(page, o.debugDir, ++shots);
            asked++;
            const typed = await o.askCode(
              resends > 0
                ? "Novo código pedido à B3 (veja seu e-mail; vale só o mais recente)"
                : asked === 1
                  ? "A B3 enviou um código de verificação (veja seu e-mail)"
                  : "A tela do código continua aberta (código recusado ou expirado?); digite o mais recente",
            );
            if (isResend(typed)) {
              if (resends >= MAX_RESENDS) throw new NeedsHuman(`limite de ${MAX_RESENDS} reenvios atingido; aguarde alguns minutos e rode o login de novo`);
              if (!(await clickVisible(page, RESEND))) throw new NeedsHuman("não achei o botão de reenviar o código");
              resends++;
              asked--; // pedir reenvio não gasta uma das tentativas de digitar o código
              status(`novo código pedido (${resends}/${MAX_RESENDS})`);
              deadline = Date.now() + (o.headlessTimeoutMs ?? 90_000);
              await sleep(2000);
              continue;
            }
            if (!(await fillCode(page, typed))) throw new NeedsHuman("não achei o campo do código");
            status("código enviado");
            deadline = Date.now() + (o.headlessTimeoutMs ?? 90_000);
            await sleep(3000);
            if (o.debugDir) await dumpStructure(page, o.debugDir, ++shots);
            continue;
          }
          if (need && need.kind !== "codigo") throw new NeedsHuman(need.detail);
          if (need?.kind === "codigo") throw new NeedsHuman(need.detail);
          await sleep(1000);
        }
        if (o.debugDir) await dumpStructure(page, o.debugDir, ++shots);
        throw new NeedsHuman("tempo esgotado sem concluir o login");
      })();
      code = await Promise.race([codeP, watchdog]);
    } else {
      status("conclua o login na janela (CAPTCHA, código de verificação etc. ficam com você)");
      const timeout = o.headedTimeoutMs ?? 600_000;
      code = await Promise.race([
        codeP,
        new Promise<never>((_, rej) => {
          timers.push(setTimeout(() => rej(new B3AuthError("Tempo esgotado esperando o login na janela.", "login_timeout", true)), timeout));
        }),
        new Promise<never>((_, rej) => browser.on("disconnected", () => rej(new B3AuthError("A janela foi fechada antes de concluir o login.", "login_closed", true)))),
      ]);
    }

    status("login concluído; trocando o código pela sessão");
    const { session } = await exchangeCode({ code, verifier: pkce.verifier });
    return session;
  } finally {
    timers.forEach(clearTimeout);
    await browser.close().catch(() => {});
  }
}

export * from "./credentials";
export { discover, templatePath, matchRegistry, type DiscoverOptions, type DiscoveredRoute } from "./discover";

/** Faz login e devolve a sessão. Não grava nada: quem chama decide onde guardar. */
export async function login(o: LoginOptions = {}): Promise<B3Session> {
  const mode = o.mode ?? "auto";
  // O B2C decide o fluxo pelo doc_hint: sem o CPF/CNPJ real ele cai na tela de cadastro.
  if (!digits(o.cpf)) throw new B3AuthError("Informe o CPF/CNPJ (B3_CPF, `b3 credenciais salvar` ou digite quando pedido).", "cpf_ausente", true);
  const canHeadless = Boolean(o.senha);

  if (mode === "headed" || (mode === "auto" && !canHeadless)) return attempt(false, o);

  try {
    return await attempt(true, o);
  } catch (e) {
    if (!(e instanceof NeedsHuman)) throw e;
    if (mode === "headless") throw new B3AuthError(`Login headless precisa de uma pessoa (${e.message}).`, "needs_human", true);
    o.onStatus?.(`headless parou (${e.message}); abrindo a janela para você concluir`);
    return attempt(false, o);
  }
}
