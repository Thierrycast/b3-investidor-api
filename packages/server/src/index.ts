import { B3Client, FileTokenStore } from "@b3-investidor/core";
import { buildServer } from "./app";
import { SessionKeeper } from "./keeper";
import { LoginManager, type LoginFn } from "./login-manager";

export { buildServer, type ServerOptions } from "./app";
export { SessionKeeper, type KeeperState } from "./keeper";
export { LoginManager, type LoginState, type LoginFase, type LoginFn } from "./login-manager";

export interface StartOptions {
  host?: string;
  port?: number;
  apiKey?: string;
  sessionFile?: string;
  alertWebhook?: string;
  refreshIntervalMs?: number;
  /** Login automático quando a sessão vence. Padrão: ligado se houver credenciais (B3_AUTO_LOGIN=0 desliga). */
  autoLogin?: boolean;
  loginFn?: LoginFn;
}

/** Sobe o servidor com renovação e login automáticos. Lê o .env quando a opção não vem. */
export async function startServer(o: StartOptions = {}) {
  const env = process.env;
  const client = new B3Client({ store: new FileTokenStore(o.sessionFile ?? env.B3_SESSION_FILE) });
  const log = (msg: string, extra?: Record<string, unknown>) => app.log.info(extra ?? {}, msg);

  const autoLogin = o.autoLogin ?? env.B3_AUTO_LOGIN !== "0";
  let loginManager: LoginManager | undefined;
  let keeper: SessionKeeper;

  if (autoLogin) {
    const { resolveCredentials } = await import("@b3-investidor/login");
    loginManager = new LoginManager({
      client,
      credentials: () => {
        const { cpf, senha } = resolveCredentials();
        return { cpf, senha };
      },
      loginFn: o.loginFn,
      alert: (tipo, msg) => keeper.alert(tipo, msg),
      log,
      onSession: () => keeper.tick(),
    });
  }

  keeper = new SessionKeeper(client, {
    intervalMs: o.refreshIntervalMs,
    alertWebhook: o.alertWebhook ?? (env.B3_ALERT_WEBHOOK || undefined),
    log,
    onNeedsLogin: loginManager?.enabled ? () => void loginManager!.start() : undefined,
  });

  const app = await buildServer({
    client,
    apiKey: o.apiKey ?? env.B3_API_KEY ?? "",
    keeper,
    loginManager,
    loginWaitMs: env.B3_LOGIN_ESPERA_MS ? Number(env.B3_LOGIN_ESPERA_MS) : undefined,
    logger: true,
  });
  const host = o.host ?? env.B3_HOST ?? "127.0.0.1";
  const port = o.port ?? Number(env.B3_PORT || 8790);
  await app.listen({ host, port });
  keeper.start();
  return { app, keeper, client, loginManager };
}
