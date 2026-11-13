import { B3Client, FileTokenStore } from "@b3-investidor/core";
import { buildServer } from "./app";
import { SessionKeeper } from "./keeper";

export { buildServer, type ServerOptions } from "./app";
export { SessionKeeper, type KeeperState } from "./keeper";

export interface StartOptions {
  host?: string;
  port?: number;
  apiKey?: string;
  sessionFile?: string;
  alertWebhook?: string;
  refreshIntervalMs?: number;
}

/** Sobe o servidor com renovação automática. Lê o .env quando a opção não vem. */
export async function startServer(o: StartOptions = {}) {
  const env = process.env;
  const client = new B3Client({ store: new FileTokenStore(o.sessionFile ?? env.B3_SESSION_FILE) });
  const keeper = new SessionKeeper(client, {
    intervalMs: o.refreshIntervalMs,
    alertWebhook: o.alertWebhook ?? (env.B3_ALERT_WEBHOOK || undefined),
    log: (msg, extra) => app.log.info(extra ?? {}, msg),
  });
  const app = await buildServer({ client, apiKey: o.apiKey ?? env.B3_API_KEY ?? "", keeper, logger: true });
  const host = o.host ?? env.B3_HOST ?? "127.0.0.1";
  const port = o.port ?? Number(env.B3_PORT || 8790);
  await app.listen({ host, port });
  keeper.start();
  return { app, keeper, client };
}
