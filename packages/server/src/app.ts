import { timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import { B3ApiError, B3AuthError, B3Client, endpointList, type EndpointId } from "@b3-investidor/core";
import { SessionKeeper } from "./keeper";
import type { LoginManager } from "./login-manager";

export interface ServerOptions {
  client: B3Client;
  /** Exigida no header x-api-key em todas as rotas, menos /docs e /openapi.json. */
  apiKey: string;
  keeper?: SessionKeeper;
  /** Login automático quando a sessão vence (se houver credenciais). */
  loginManager?: LoginManager;
  /** Quanto uma requisição espera o login automático antes de responder 503. Padrão: 90 s. */
  loginWaitMs?: number;
  logger?: boolean;
  version?: string;
}

const jsonSchema = (s: z.ZodType, io: "input" | "output") => {
  try {
    const { $schema: _ignored, ...rest } = z.toJSONSchema(s, { io, target: "openapi-3.0", unrepresentable: "any" }) as Record<string, unknown>;
    return rest;
  } catch {
    return {};
  }
};

const STATUS_LABEL = {
  confirmado: "✅ Rota e campos confirmados com dados reais.",
  "campos-pendentes": "🟡 Rota confirmada, mas os campos dos itens ainda não foram mapeados (a conta usada não tinha dados). Veja ROADMAP.md.",
};

const SessionBody = z.object({
  refresh_token: z.string().min(10),
  client_id: z.string().optional(),
  policy: z.string().optional(),
  scope: z.string().optional(),
});

const CodigoBody = z.object({
  codigo: z.string().trim().regex(/^\d{4,8}$/, "o código tem de 4 a 8 dígitos"),
});

/** A sessão venceu e o login automático está esperando algo da pessoa (código do e-mail). */
class LoginPendente extends Error {
  constructor(readonly estado: unknown) {
    super("A sessão venceu e o login automático está esperando o código de verificação enviado por e-mail.");
  }
}

function sameKey(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function buildServer(opts: ServerOptions): Promise<FastifyInstance> {
  if (!opts.apiKey || opts.apiKey.length < 16) throw new Error("B3_API_KEY ausente ou curta demais (mínimo 16 caracteres).");
  const { client } = opts;

  const app = Fastify({
    logger: opts.logger
      ? { redact: { paths: ["req.headers.authorization", 'req.headers["x-api-key"]'], censor: "[oculto]" } }
      : false,
    // Validação e serialização ficam com o zod; os JSON Schemas servem só para a documentação.
    ajv: { customOptions: { strict: false } },
  });
  app.setValidatorCompiler(() => () => true);
  app.setSerializerCompiler(() => (data) => JSON.stringify(data));

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "B3 Investidor API (não oficial)",
        version: opts.version ?? "0.1.0",
        description:
          "API HTTP sobre a Área do Investidor da B3. **Não oficial e sem vínculo com a B3.** Use só com os seus próprios dados.\n\n" +
          "Todas as rotas exigem o header `x-api-key`. Datas no formato AAAA-MM-DD. " +
          "Quando um parâmetro é limitado à data da última carga, o header `x-b3-ajustes` informa o que mudou.",
      },
      tags: [
        { name: "Sessão", description: "Estado e envio da sessão (refresh_token)" },
        { name: "Sistema" },
        { name: "Carteira" },
        { name: "Extratos" },
        { name: "Proventos" },
        { name: "Início", description: "Cards da página inicial do portal" },
        { name: "Investidor", description: "Cadastro e perfil (dados pessoais)" },
      ],
      components: { securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } } },
      security: [{ apiKey: [] }],
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());

  app.addHook("onRequest", async (req, reply) => {
    const path = req.url.split("?")[0] ?? "";
    if (path === "/openapi.json" || path === "/docs" || path.startsWith("/docs/")) return;
    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || !sameKey(key, opts.apiKey)) {
      return reply.code(401).send({ erro: "x-api-key ausente ou inválida" });
    }
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError) {
      return reply.code(400).send({ erro: "parâmetros inválidos", detalhes: err.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })) });
    }
    if (err instanceof LoginPendente) {
      return reply
        .code(503)
        .header("retry-after", "30")
        .send({ erro: err.message, precisaCodigo: true, enviarEm: "POST /v1/login/codigo", login: err.estado });
    }
    if (err instanceof B3AuthError) {
      return reply.code(err.needsLogin ? 401 : 502).send({ erro: err.message, code: err.code, precisaLogin: err.needsLogin });
    }
    if (err instanceof B3ApiError) {
      const status = err.status && err.status < 500 ? err.status : 502;
      return reply.code(status).send({ erro: err.message, tipo: err.kind, statusB3: err.status, detalhes: err.details });
    }
    app.log.error(err);
    return reply.code(500).send({ erro: "erro interno" });
  });

  const lm = opts.loginManager;
  const loginWait = opts.loginWaitMs ?? 90_000;

  /**
   * Executa a chamada; se a sessão estiver vencida/ausente e houver credenciais, faz login sozinho
   * e repete. Se o login parar esperando o código do e-mail, responde 503 com `precisaCodigo`.
   */
  async function comSessao<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof B3AuthError && e.needsLogin && lm?.enabled)) throw e;
      void lm.start();
      const fase = await lm.settle(loginWait);
      if (fase === "concluido") return fn();
      if (fase === "aguardando_codigo" || fase === "entrando") throw new LoginPendente(lm.state);
      throw e;
    }
  }

  // ---------- sessão ----------

  app.get("/v1/health", { schema: { tags: ["Sessão"], summary: "Estado da sessão, da renovação e do login automático" } }, async () => ({
    ok: true,
    sessao: opts.keeper?.state ?? { status: "desconhecido" },
    login: lm ? { automatico: lm.enabled, ...lm.state } : { automatico: false },
  }));

  app.get("/v1/login", { schema: { tags: ["Sessão"], summary: "Estado do login automático" } }, async () => ({
    automatico: lm?.enabled ?? false,
    ...(lm?.state ?? { fase: "parado" }),
  }));

  app.post(
    "/v1/login",
    {
      schema: {
        tags: ["Sessão"],
        summary: "Inicia um login agora (com as credenciais da configuração)",
        description:
          "Abre o login da B3 sem janela, com B3_CPF/B3_SENHA (ou o cofre). A B3 envia um código por e-mail; " +
          "a resposta volta com `fase: aguardando_codigo` e o código vai em `POST /v1/login/codigo`. " +
          "CAPTCHA ou tela desconhecida → `fase: erro` (use `b3 login` com janela).",
      },
    },
    async (_req, reply) => {
      if (!lm?.enabled) return reply.code(409).send({ erro: "Login automático desligado: configure B3_CPF e B3_SENHA (ou `b3 credenciais salvar`)." });
      void lm.start();
      await lm.settle(loginWait);
      return reply.code(lm.state.fase === "concluido" ? 200 : 202).send(lm.state);
    },
  );

  app.post(
    "/v1/login/codigo",
    {
      schema: {
        tags: ["Sessão"],
        summary: "Envia o código de verificação recebido por e-mail",
        description: "Só funciona com o login em `fase: aguardando_codigo`. O código nunca é registrado em log.",
        body: jsonSchema(CodigoBody, "input"),
      },
    },
    async (req, reply) => {
      const { codigo } = CodigoBody.parse(req.body);
      if (!lm || !lm.submitCode(codigo)) return reply.code(409).send({ erro: "Nenhum login esperando código agora.", login: lm?.state ?? null });
      await lm.settle(loginWait);
      const s = lm.state;
      return reply.code(s.fase === "concluido" ? 200 : s.fase === "erro" ? 422 : 202).send(s);
    },
  );

  app.post(
    "/v1/session",
    {
      schema: {
        tags: ["Sessão"],
        summary: "Grava uma sessão nova (enviada pelo `b3 login --push`)",
        description: "O refresh_token é validado na hora (uma renovação) e gravado no armazenamento do servidor. Nunca é devolvido.",
        body: jsonSchema(SessionBody, "input"),
      },
    },
    async (req) => {
      const body = SessionBody.parse(req.body);
      await client.setSession(body);
      const r = await client.refresh();
      if (opts.keeper) await opts.keeper.tick();
      return { ok: true, refreshExpiraEm: r.refreshExpiresAt ?? null };
    },
  );

  // ---------- rotas da B3 (geradas do registro) ----------

  for (const ep of endpointList) {
    const paginada = Boolean(ep.pagination);
    const query = paginada ? ep.query.extend({ todasPaginas: z.stringbool().optional().describe("Busca todas as páginas e devolve os itens concatenados") }) : ep.query;
    const description = [ep.description, STATUS_LABEL[ep.status], ...(ep.notes ?? []).map((n) => `- ${n}`), `\nRota original: \`GET ${ep.b3Path}\``]
      .filter(Boolean)
      .join("\n\n");

    app.get(
      ep.route,
      {
        schema: {
          tags: [ep.tag],
          summary: ep.summary,
          description,
          operationId: ep.id,
          querystring: jsonSchema(query, "input"),
          response: {
            200: { description: "Resposta da B3 (campos desconhecidos são repassados)", ...jsonSchema(ep.response, "output") },
            204: { description: "A B3 respondeu sem conteúdo (ex.: nenhum dado para o filtro)", type: "null" },
          },
        },
      },
      async (req, reply) => {
        const { todasPaginas, ...q } = query.parse(req.query ?? {}) as Record<string, unknown> & { todasPaginas?: boolean };
        if (paginada && todasPaginas) return comSessao(() => client.all(ep.id as EndpointId, q as never));
        const { data, meta } = await comSessao(() => client.callWithMeta(ep.id as EndpointId, q as never));
        if (meta.ajustes.length) reply.header("x-b3-ajustes", JSON.stringify(meta.ajustes));
        if (meta.schemaIssues.length) reply.header("x-b3-divergencias-schema", String(meta.schemaIssues.length));
        if (meta.status === 204) return reply.code(204).send();
        return data;
      },
    );
  }

  return app;
}
