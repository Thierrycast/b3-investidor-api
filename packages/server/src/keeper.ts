import { B3AuthError, type B3Client } from "@b3-investidor/core";

export type SessionHealth = "ok" | "degradado" | "sem-sessao";

export interface KeeperState {
  status: SessionHealth;
  ultimaRenovacao?: string;
  proximaRenovacao?: string;
  refreshExpiraEm?: string;
  ultimoErro?: { code: string; message: string; em: string };
}

export interface KeeperOptions {
  intervalMs?: number;
  /** Avisar quando faltar menos que isso para o refresh_token vencer. */
  avisoAntesMs?: number;
  alertWebhook?: string;
  log?: (msg: string, extra?: Record<string, unknown>) => void;
}

/**
 * Mantém a sessão viva: renova periodicamente (o refresh_token gira e é regravado)
 * e avisa quando é preciso logar de novo.
 *
 * Observado em 2026-11: a validade do refresh_token NÃO avança a cada renovação; ela fica
 * presa a ~24 h depois do login. Renovar mantém o access_token, mas um login novo por dia
 * continua necessário. Ver docs/auth.md.
 */
export class SessionKeeper {
  readonly state: KeeperState = { status: "sem-sessao" };
  private timer?: NodeJS.Timeout;
  private avisado?: string;

  constructor(
    private readonly client: B3Client,
    private readonly opts: KeeperOptions = {},
  ) {}

  start() {
    const every = this.opts.intervalMs ?? 6 * 3600_000;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), every);
    this.timer.unref();
  }

  stop() {
    clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    const every = this.opts.intervalMs ?? 6 * 3600_000;
    try {
      const r = await this.client.refresh();
      this.state.status = "ok";
      this.state.ultimaRenovacao = new Date().toISOString();
      this.state.refreshExpiraEm = r.refreshExpiresAt;
      this.state.ultimoErro = undefined;
      this.opts.log?.("sessão renovada", { refreshExpiraEm: r.refreshExpiresAt });

      const falta = r.refreshExpiresAt ? Date.parse(r.refreshExpiresAt) - Date.now() : Infinity;
      if (falta < (this.opts.avisoAntesMs ?? 3 * 3600_000) && this.avisado !== r.refreshExpiresAt) {
        this.avisado = r.refreshExpiresAt;
        await this.alert("sessao-vencendo", `A sessão da B3 vence em ${r.refreshExpiresAt}. Rode \`b3 login\` para continuar.`);
      }
    } catch (e) {
      const code = e instanceof B3AuthError ? e.code : "erro";
      const message = e instanceof Error ? e.message : String(e);
      this.state.status = code === "no_session" ? "sem-sessao" : "degradado";
      this.state.ultimoErro = { code, message, em: new Date().toISOString() };
      this.opts.log?.("falha ao renovar a sessão", { code });
      if (e instanceof B3AuthError && e.needsLogin && code !== "no_session") {
        await this.alert("login-necessario", `A renovação falhou (${code}). É preciso rodar \`b3 login\`.`);
      }
    } finally {
      this.state.proximaRenovacao = new Date(Date.now() + every).toISOString();
    }
  }

  private async alert(tipo: string, mensagem: string) {
    if (!this.opts.alertWebhook) return;
    await fetch(this.opts.alertWebhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ origem: "b3-investidor-api", tipo, mensagem, em: new Date().toISOString() }),
    }).catch(() => this.opts.log?.("webhook de alerta falhou"));
  }
}
