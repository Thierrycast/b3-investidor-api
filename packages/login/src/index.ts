import { randomUUID } from "node:crypto";
import { chromium, type Browser, type Page } from "playwright-core";
import { B3AuthError, buildAuthorizeUrl, createPkce, exchangeCode, LOGIN_REDIRECT_URI, type B3Session } from "@b3-investidor/core";

/**
 * Login assistido.
 *
 * Como funciona (detalhes em docs/auth.md → "Login assistido"):
 * - Abre direto o /authorize do Azure AD B2C, com PKCE próprio. O site www.investidor.b3.com.br
 *   (que fica atrás de um desafio do Cloudflare) nunca é carregado: o redirecionamento final
 *   para ele é interceptado só para ler o `code`.
 * - Preenche CPF/CNPJ e senha quando informados. Se a B3 pedir CAPTCHA, código de verificação
 *   ou qualquer outra interação, o modo headless desiste e reabre uma janela visível para a
 *   pessoa concluir. A ferramenta nunca resolve nem contorna desafios.
 * - Troca o `code` por tokens e devolve a sessão (refresh_token).
 */
export interface LoginOptions {
  cpf?: string;
  senha?: string;
  /** auto = headless se houver CPF e senha, senão janela; headless = só tenta sem janela; headed = sempre janela. */
  mode?: "auto" | "headless" | "headed";
  /** Quanto esperar a pessoa concluir na janela. Padrão: 10 min. */
  headedTimeoutMs?: number;
  /** Quanto esperar no headless antes de desistir. Padrão: 60 s. */
  headlessTimeoutMs?: number;
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

const digits = (s?: string) => (s ?? "").replace(/\D/g, "");

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

/** Procura sinais de que a B3 está pedindo algo que só uma pessoa pode fazer. */
async function humanNeeded(page: Page): Promise<string | null> {
  return page
    .evaluate(() => {
      const visible = (e: Element) => {
        const r = (e as HTMLElement).getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(e as HTMLElement).visibility !== "hidden";
      };
      const frames = [...document.querySelectorAll("iframe")].filter(visible).map((f) => f.src);
      if (frames.some((s) => /recaptcha\/(api2|enterprise)\/bframe|hcaptcha|challenges\.cloudflare/.test(s))) return "captcha";
      const otp = [...document.querySelectorAll("input")].find(
        (i) => visible(i) && (i.autocomplete === "one-time-code" || /c[oó]digo|token|otp|verifica/i.test(`${i.id} ${i.name} ${i.placeholder}`)),
      );
      if (otp) return "codigo-de-verificacao";
      const err = [...document.querySelectorAll(".error.pageLevel, .error.itemLevel, [role=alert]")].find(
        (e) => visible(e) && (e.textContent ?? "").trim().length > 0,
      );
      if (err) return `mensagem da B3: ${(err.textContent ?? "").trim().slice(0, 120)}`;
      return null;
    })
    .catch(() => null);
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
  if (cpf) {
    const doc = page.locator("#DOC_INPUT");
    if (await doc.waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false)) {
      await doc.fill(cpf).catch(() => {});
      const terms = page.locator("#termos_e_politicas");
      if ((await terms.count()) && !(await terms.isChecked().catch(() => true))) await terms.check().catch(() => {});
      status("CPF/CNPJ preenchido");
      await clickVisible(page, ["#Btn_CONTINUE", "#continue", "button:has-text('Continuar')"]);
    }
  }
  if (o.senha) {
    const pwd = page.locator("input[type=password]").filter({ visible: true }).first();
    if (await pwd.waitFor({ state: "visible", timeout: 30_000 }).then(() => true, () => false)) {
      await pwd.fill(o.senha).catch(() => {});
      status("senha preenchida");
      const clicked = await clickVisible(page, ["#next", "#Btn_CONTINUE", "#continue", "button[type=submit]", "button:has-text('Entrar')", "button:has-text('Continuar')", "button:has-text('Acessar')"]);
      if (!clicked) await pwd.press("Enter").catch(() => {});
    }
  }
}

async function attempt(headless: boolean, o: LoginOptions): Promise<B3Session> {
  const status = (m: string) => o.onStatus?.(`[${headless ? "headless" : "janela"}] ${m}`);
  const pkce = createPkce();
  const state = randomUUID();
  const browser = await launch(headless, o);
  try {
    const context = await browser.newContext({ locale: "pt-BR" });
    let resolveCode!: (c: string) => void;
    let rejectCode!: (e: Error) => void;
    const codeP = new Promise<string>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    // O redirecionamento final vai para o site; interceptamos para ler o code sem carregar o site.
    await context.route(`${LOGIN_REDIRECT_URI}**`, async (route) => {
      const u = new URL(route.request().url());
      const code = u.searchParams.get("code");
      const err = u.searchParams.get("error_description") ?? u.searchParams.get("error");
      if (code && u.searchParams.get("state") === state) resolveCode(code);
      else if (err) rejectCode(new B3AuthError(`Login recusado pela B3: ${err.split(/\r?\n/)[0]?.slice(0, 160)}`, "login_error", true));
      await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: DONE_HTML });
    });

    const page = await context.newPage();
    status("abrindo o login da B3");
    await page.goto(
      buildAuthorizeUrl({ challenge: pkce.challenge, state, nonce: randomUUID(), docHint: digits(o.cpf) || "0" }),
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );

    const fill = autofill(page, o, status);

    let code: string;
    if (headless) {
      const deadline = Date.now() + (o.headlessTimeoutMs ?? 60_000);
      const watchdog = (async () => {
        await fill;
        while (Date.now() < deadline) {
          const why = await humanNeeded(page);
          if (why) throw new NeedsHuman(why);
          await new Promise((r) => setTimeout(r, 1000));
        }
        throw new NeedsHuman("tempo esgotado sem concluir o login");
      })();
      code = await Promise.race([codeP, watchdog]);
    } else {
      status("conclua o login na janela (CAPTCHA, código de verificação etc. ficam com você)");
      const timeout = o.headedTimeoutMs ?? 600_000;
      code = await Promise.race([
        codeP,
        new Promise<never>((_, rej) => setTimeout(() => rej(new B3AuthError("Tempo esgotado esperando o login na janela.", "login_timeout", true)), timeout)),
        new Promise<never>((_, rej) => browser.on("disconnected", () => rej(new B3AuthError("A janela foi fechada antes de concluir o login.", "login_closed", true)))),
      ]);
    }

    status("login concluído; trocando o código pela sessão");
    const { session } = await exchangeCode({ code, verifier: pkce.verifier });
    return session;
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Faz login e devolve a sessão. Não grava nada: quem chama decide onde guardar. */
export async function login(o: LoginOptions = {}): Promise<B3Session> {
  const mode = o.mode ?? "auto";
  const canHeadless = Boolean(digits(o.cpf) && o.senha);

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
