#!/usr/bin/env node
import { parseArgs } from "node:util";
import {
  B3AuthError,
  B3Client,
  B3Error,
  FileTokenStore,
  camposNaoDescritos,
  endpointList,
  endpoints,
  shape,
  type EndpointId,
} from "@b3-investidor/core";

const HELP = `b3 — Área do Investidor da B3 (não oficial)

Uso: b3 <comando> [opções]

  login                   Faz login na B3 e grava a sessão. Usa B3_CPF/B3_SENHA se existirem:
                          tenta sem janela e, se a B3 pedir CAPTCHA/código, abre a janela para você.
      --headed            sempre com janela      --headless   nunca abre janela
      --push <url>        envia a sessão a um servidor (POST <url>/v1/session, x-api-key = B3_PUSH_KEY ou B3_API_KEY)
  refresh                 Renova a sessão (grava o refresh_token novo) e mostra as validades.
  probe                   Teste rápido: renova, chama última carga e posição; só status e tipos.
  shapes [ids...] [--all] Árvore de TIPOS das respostas (nunca valores) e campos fora do schema.
                          Seguro para colar em issues. Sem ids: rotas confirmadas.
  endpoints               Lista as rotas conhecidas e o status de mapeamento.
  serve                   Sobe a API HTTP com Swagger em /docs (exige B3_API_KEY).

Opções:
  --session <arquivo>     Sessão (padrão: $B3_SESSION_FILE ou ~/.config/b3-investidor/session.json)
  --json                  Saída em JSON
  -h, --help
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    session: { type: "string" },
    all: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
    headed: { type: "boolean", default: false },
    headless: { type: "boolean", default: false },
    push: { type: "string" },
  },
});

const [cmd, ...args] = positionals;
const client = () => new B3Client({ store: new FileTokenStore(values.session) });
const out = (o: unknown) => console.log(values.json ? JSON.stringify(o) : typeof o === "string" ? o : JSON.stringify(o, null, 2));

async function main() {
  if (values.help || !cmd) return console.log(HELP);

  switch (cmd) {
    case "login": {
      const { login } = await import("@b3-investidor/login");
      const session = await login({
        cpf: process.env.B3_CPF || undefined,
        senha: process.env.B3_SENHA || undefined,
        mode: values.headed ? "headed" : values.headless ? "headless" : "auto",
        onStatus: (m) => console.error(`· ${m}`),
      });
      if (values.push) {
        const key = process.env.B3_PUSH_KEY || process.env.B3_API_KEY;
        if (!key) throw new Error("Defina B3_PUSH_KEY (ou B3_API_KEY) com a chave do servidor de destino.");
        const res = await fetch(new URL("/v1/session", values.push), {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": key },
          body: JSON.stringify(session),
        });
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) throw new Error(`Servidor recusou a sessão (HTTP ${res.status}): ${String(body.erro ?? "")}`);
        return out({ ok: true, destino: values.push, refreshExpiraEm: body.refreshExpiraEm ?? session.refresh_expires_at });
      }
      const store = new FileTokenStore(values.session);
      await store.save(session);
      return out({ ok: true, arquivo: store.path, refreshExpiraEm: session.refresh_expires_at ?? "(não informado)" });
    }

    case "refresh": {
      const r = await client().refresh();
      return out({
        ok: true,
        accessExpiresAt: new Date(r.accessExpiresAt).toISOString(),
        refreshExpiresAt: r.refreshExpiresAt ?? "(não informado)",
      });
    }

    case "probe": {
      const c = client();
      const r = await c.refresh();
      console.log(`refresh: ok (access até ${new Date(r.accessExpiresAt).toISOString()}, refresh até ${r.refreshExpiresAt ?? "?"})`);
      for (const id of ["ultimaCarga", "posicao"] as const) {
        const { data, meta } = await c.callWithMeta(id);
        console.log(`\n${id}: ${meta.status}${meta.ajustes.length ? ` (ajustado: ${meta.ajustes.map((a) => a.campo).join(", ")})` : ""}`);
        console.log(JSON.stringify(shape(data), null, 2));
        if (meta.schemaIssues.length) console.log("divergências do schema:", meta.schemaIssues);
      }
      return;
    }

    case "shapes": {
      const c = client();
      const ids = (args.length ? args : endpointList.filter((e) => values.all || e.status === "confirmado").map((e) => e.id)) as EndpointId[];
      const result: Record<string, unknown> = {};
      for (const id of ids) {
        const ep = endpoints[id];
        if (!ep) {
          result[id] = { erro: "rota desconhecida (veja `b3 endpoints`)" };
          continue;
        }
        try {
          const { data, meta } = await c.callWithMeta(id);
          result[id] = {
            status: meta.status,
            parametros: Object.keys(meta.params),
            camposForaDoSchema: camposNaoDescritos(ep.response, data),
            divergencias: meta.schemaIssues,
            shape: shape(data),
          };
        } catch (e) {
          result[id] = { erro: e instanceof B3Error ? `${e.code} ${e.status ?? ""} ${e.message}`.trim() : String(e) };
        }
      }
      return out(result);
    }

    case "endpoints": {
      const rows = endpointList.map((e) => ({ id: e.id, status: e.status, rota: e.route, b3: e.b3Path, resumo: e.summary }));
      if (values.json) return out(rows);
      for (const r of rows) console.log(`${r.status === "confirmado" ? "✅" : "🟡"} ${r.id.padEnd(26)} ${r.rota.padEnd(34)} ${r.resumo}`);
      return;
    }

    case "serve": {
      const { startServer } = await import("@b3-investidor/server");
      const { app } = await startServer({ sessionFile: values.session });
      const addr = app.server.address();
      const where = typeof addr === "object" && addr ? `http://${addr.address}:${addr.port}` : String(addr);
      console.error(`B3 Investidor API em ${where} — documentação em ${where}/docs`);
      return;
    }

    default:
      console.error(`Comando desconhecido: ${cmd}\n`);
      console.log(HELP);
      process.exitCode = 2;
  }
}

main().catch((e) => {
  if (e instanceof B3AuthError) {
    console.error(`Erro de autenticação (${e.code}): ${e.message}${e.needsLogin ? "\n→ É preciso logar de novo: b3 login" : ""}`);
  } else if (e instanceof B3Error) {
    console.error(`Erro da B3 (${e.code}, HTTP ${e.status ?? "?"}): ${e.message}`);
  } else console.error(e);
  process.exitCode = 1;
});
