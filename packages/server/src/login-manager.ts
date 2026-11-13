import type { B3Client, B3Session } from "@b3-investidor/core";

/**
 * Login automático do servidor, como uma aplicação comum:
 * - sessão válida → usa;
 * - sessão vencida ou ausente → entra sozinho com CPF/senha da configuração (B3_CPF/B3_SENHA ou cofre).
 *
 * A B3 pede um código por e-mail a cada login. Esse passo é da pessoa: o servidor para em
 * `aguardando_codigo`, avisa pelo webhook e espera o código em `POST /v1/login/codigo`.
 * CAPTCHA ou tela desconhecida → `erro`, e a saída é `b3 login` com janela.
 */
export type LoginFase = "parado" | "entrando" | "aguardando_codigo" | "concluido" | "erro";

export interface LoginState {
  fase: LoginFase;
  desde?: string;
  mensagem?: string;
  /** Até quando o código pode ser enviado. */
  codigoAte?: string;
  ultimoLogin?: string;
  erro?: { code: string; message: string };
}

export type LoginFn = (o: {
  cpf: string;
  senha: string;
  askCode: (motivo: string) => Promise<string>;
  onStatus: (m: string) => void;
}) => Promise<B3Session>;

export interface LoginManagerOptions {
  client: B3Client;
  credentials: () => { cpf?: string; senha?: string };
  /** Padrão: login headless do @b3-investidor/login. Injetável para testes. */
  loginFn?: LoginFn;
  /** Quanto esperar o código chegar pela API. Padrão: 10 min. */
  codigoTimeoutMs?: number;
  alert?: (tipo: string, mensagem: string) => Promise<void> | void;
  log?: (msg: string, extra?: Record<string, unknown>) => void;
  /** Chamado depois de gravar a sessão nova (ex.: atualizar o keeper). */
  onSession?: () => Promise<void> | void;
}

const defaultLogin: LoginFn = async (o) => {
  const { login } = await import("@b3-investidor/login");
  return login({ ...o, mode: "headless" });
};

export class LoginManager {
  readonly state: LoginState = { fase: "parado" };
  private running?: Promise<void>;
  private pendingCode?: { resolve: (c: string) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };
  private listeners = new Set<() => void>();

  constructor(private readonly o: LoginManagerOptions) {}

  /** Há CPF e senha configurados? Sem eles o login automático fica desligado. */
  get enabled(): boolean {
    const c = this.o.credentials();
    return Boolean(c.cpf && c.senha);
  }

  private set(fase: LoginFase, extra: Partial<LoginState> = {}) {
    Object.assign(this.state, { fase, desde: new Date().toISOString(), mensagem: undefined, codigoAte: undefined, erro: undefined }, extra);
    for (const l of this.listeners) l();
  }

  /** Inicia o login (idempotente: se já estiver rodando, devolve o mesmo). */
  start(): Promise<void> {
    if (this.running) return this.running;
    const cred = this.o.credentials();
    if (!cred.cpf || !cred.senha) {
      this.set("erro", { erro: { code: "sem_credenciais", message: "Configure B3_CPF/B3_SENHA (ou `b3 credenciais salvar`) para o login automático." } });
      return Promise.resolve();
    }
    this.set("entrando", { mensagem: "abrindo o login da B3" });
    this.o.log?.("login automático iniciado");
    this.running = (async () => {
      try {
        const session = await (this.o.loginFn ?? defaultLogin)({
          cpf: cred.cpf!,
          senha: cred.senha!,
          askCode: (motivo) => this.waitCode(motivo),
          onStatus: (m) => {
            if (this.state.fase === "entrando") this.state.mensagem = m;
          },
        });
        await this.o.client.setSession(session);
        this.set("concluido", { ultimoLogin: new Date().toISOString(), mensagem: "sessão nova gravada" });
        this.o.log?.("login automático concluído");
        await this.o.onSession?.();
      } catch (e) {
        const code = (e as { code?: string }).code ?? "erro";
        const message = e instanceof Error ? e.message : String(e);
        this.set("erro", { erro: { code, message } });
        this.o.log?.("login automático falhou", { code });
        await this.o.alert?.("login-falhou", `O login automático falhou (${code}). Rode \`b3 login\` com janela.`);
      } finally {
        this.clearPending(new Error("login encerrado"));
        this.running = undefined;
      }
    })();
    return this.running;
  }

  private waitCode(motivo: string): Promise<string> {
    const ms = this.o.codigoTimeoutMs ?? 600_000;
    this.clearPending(new Error("substituído"));
    this.set("aguardando_codigo", { mensagem: `${motivo}. Envie em POST /v1/login/codigo.`, codigoAte: new Date(Date.now() + ms).toISOString() });
    void this.o.alert?.("codigo-necessario", "A B3 enviou um código de verificação por e-mail. Envie-o em POST /v1/login/codigo.");
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(Object.assign(new Error("Tempo esgotado esperando o código de verificação."), { code: "codigo_timeout" })), ms);
      timer.unref();
      this.pendingCode = { resolve, reject, timer };
    });
  }

  private clearPending(err: Error) {
    if (!this.pendingCode) return;
    clearTimeout(this.pendingCode.timer);
    this.pendingCode.reject(err);
    this.pendingCode = undefined;
  }

  /** Entrega o código digitado pela pessoa. false se ninguém está esperando. */
  submitCode(code: string): boolean {
    const p = this.pendingCode;
    if (!p || this.state.fase !== "aguardando_codigo") return false;
    clearTimeout(p.timer);
    this.pendingCode = undefined;
    this.set("entrando", { mensagem: "verificando o código" });
    p.resolve(code);
    return true;
  }

  /** Espera sair de `entrando` (ou até `ms`). Devolve a fase em que parou. */
  async settle(ms: number): Promise<LoginFase> {
    if (this.state.fase !== "entrando") return this.state.fase;
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(t);
        this.listeners.delete(onChange);
        resolve();
      };
      const onChange = () => {
        if (this.state.fase !== "entrando") finish();
      };
      const t = setTimeout(finish, ms);
      t.unref();
      this.listeners.add(onChange);
    });
    return this.state.fase;
  }
}
