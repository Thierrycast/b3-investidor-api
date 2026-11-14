// Descrição OpenAPI (Swagger) da API: texto, tags, erros e formatos das rotas de sessão.
// As rotas da B3 vêm do registro do core; aqui fica só o que o registro não sabe dizer.

type Schema = Record<string, unknown>;

const obj = (properties: Record<string, Schema>, required: string[] = []): Schema => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});
const texto = (description: string, example?: string): Schema => ({ type: "string", description, ...(example ? { example } : {}) });
const data = (description: string): Schema => ({ type: "string", format: "date-time", description });

// ---------- erros ----------

const erroB3 = obj(
  {
    erro: texto("Mensagem", "HTTP 500: erro inesperado"),
    tipo: texto("Categoria: `validacao`, `regra` ou `http`", "http"),
    statusB3: { type: "integer", description: "Status HTTP que a B3 devolveu", example: 500 },
    detalhes: { description: "Corpo de erro da B3, quando houver" },
  },
  ["erro"],
);

export const LOGIN_ESTADO: Schema = obj(
  {
    fase: { type: "string", enum: ["parado", "entrando", "aguardando_codigo", "concluido", "erro"], description: "Em que ponto o login está" },
    desde: data("Quando a fase começou"),
    mensagem: texto("Explicação da fase"),
    codigoAte: data("Até quando o código do e-mail pode ser enviado"),
    ultimoLogin: data("Último login concluído"),
    erro: obj({ code: texto("Código do erro"), message: texto("Mensagem") }),
  },
  ["fase"],
);

/** Respostas de erro comuns a todas as rotas que falam com a B3. */
export const ERROS_B3: Record<string, Schema> = {
  400: {
    description: "Parâmetro ausente ou inválido",
    ...obj(
      {
        erro: texto("Resumo", "parâmetros inválidos"),
        detalhes: { type: "array", items: obj({ campo: texto("Nome do parâmetro", "id"), mensagem: texto("O que está errado", "Invalid input: expected string, received undefined") }) },
      },
      ["erro"],
    ),
  },
  401: {
    description: "`x-api-key` ausente ou inválida, ou a sessão da B3 venceu e é preciso rodar `b3 login` (`precisaLogin: true`)",
    ...obj({ erro: texto("Mensagem", "x-api-key ausente ou inválida"), code: texto("Código", "no_session"), precisaLogin: { type: "boolean" } }, ["erro"]),
  },
  "4xx": { description: "A B3 recusou a consulta; o status dela é repassado (ex.: 404, 422)", ...erroB3 },
  502: { description: "A B3 falhou ou está fora do ar (qualquer 5xx dela vira 502 aqui)", ...erroB3 },
  503: {
    description:
      "A sessão venceu e o login automático está esperando o código de verificação do e-mail. Envie em `POST /v1/login/codigo` e repita a chamada.",
    ...obj({ erro: texto("Mensagem"), precisaCodigo: { type: "boolean", example: true }, enviarEm: texto("Rota para enviar o código", "POST /v1/login/codigo"), login: LOGIN_ESTADO }, ["erro"]),
  },
};

/** Para rotas sem parâmetros o 400 não existe. */
export const errosB3 = (comParametros: boolean) => {
  if (comParametros) return ERROS_B3;
  const { 400: _sem, ...resto } = ERROS_B3;
  return resto;
};

// ---------- rotas de sessão ----------

const erroSimples = (descricao: string) => ({ description: descricao, ...obj({ erro: texto("Mensagem") }, ["erro"]) });

export const SESSAO = {
  health: {
    200: {
      description: "Estado do servidor",
      ...obj(
        {
          ok: { type: "boolean" },
          sessao: obj({
            status: { type: "string", enum: ["iniciando", "ok", "degradado", "sem-sessao"], description: "`ok`: renovando normalmente; `degradado`: a última renovação falhou; `sem-sessao`: falta `b3 login`" },
            ultimaRenovacao: data("Última renovação com sucesso"),
            proximaRenovacao: data("Próxima renovação programada"),
            refreshExpiraEm: data("Quando o refresh_token vence (janela de cerca de 24 h)"),
            ultimoErro: obj({ code: texto("Código"), message: texto("Mensagem"), em: data("Quando") }),
          }),
          login: { ...LOGIN_ESTADO, properties: { automatico: { type: "boolean", description: "Há credenciais para login automático" }, ...(LOGIN_ESTADO.properties as Record<string, Schema>) } },
        },
        ["ok"],
      ),
    },
  },
  login: { 200: { description: "Estado do login automático", ...LOGIN_ESTADO } },
  iniciarLogin: {
    200: { description: "Login concluído", ...LOGIN_ESTADO },
    202: { description: "Em andamento ou esperando o código do e-mail (`fase: aguardando_codigo`)", ...LOGIN_ESTADO },
    409: erroSimples("Login automático desligado: faltam B3_CPF e B3_SENHA (ou `b3 credenciais salvar`)"),
  },
  codigo: {
    200: { description: "Código aceito, login concluído", ...LOGIN_ESTADO },
    202: { description: "Código enviado; a B3 ainda processa", ...LOGIN_ESTADO },
    400: ERROS_B3[400]!,
    409: erroSimples("Nenhum login está esperando código agora"),
    422: { description: "A B3 recusou o código ou o login falhou (`fase: erro`)", ...LOGIN_ESTADO },
  },
  sessao: {
    200: { description: "Sessão gravada e validada com uma renovação", ...obj({ ok: { type: "boolean" }, refreshExpiraEm: { ...texto("Quando o refresh_token vence"), nullable: true } }, ["ok"]) },
    400: ERROS_B3[400]!,
    401: ERROS_B3[401]!,
  },
};

// ---------- documento ----------

export const TAGS = [
  { name: "Sessão", description: "Saúde da sessão com a B3, login automático e envio do código de verificação. Não consultam a B3 diretamente." },
  { name: "Mercado", description: "Cotação, indicadores e análises de qualquer ativo (dados Bridgewise, servidos pela B3). Não dependem da sua carteira, exceto `lista-ativos`." },
  { name: "Renda Fixa", description: "Títulos públicos e privados (debêntures, CRA, CRI) e cálculo de preço unitário (PU)." },
  { name: "Carteira", description: "Posição e patrimônio: o que você tem, onde e quanto vale." },
  { name: "Extratos", description: "Movimentações e negociações no período." },
  { name: "Proventos", description: "Dividendos, JCP e rendimentos: recebidos, a receber e calendário." },
  { name: "Início", description: "Os cards da página inicial do portal." },
  { name: "Investidor", description: "Cadastro, perfil e tabelas de referência (instituições, tipos de movimentação)." },
  { name: "Transferência", description: "Portabilidade e transferência de ativos, inclusive listados em balcão." },
  { name: "Sistema", description: "Data da última carga de dados da B3." },
];

export const INFO = {
  title: "B3 Investidor API (não oficial)",
  description: [
    "API HTTP sobre a Área do Investidor da B3. **Não oficial e sem vínculo com a B3.** Use só com os seus próprios dados.",
    "",
    "## Como usar",
    "1. Faça login uma vez (`b3 login`, ou `POST /v1/login` + `POST /v1/login/codigo`). A B3 envia um código por e-mail a cada login.",
    "2. Mande o header `x-api-key` em todas as rotas (botão **Authorize**). `/docs` e `/openapi.json` são abertas.",
    "3. A sessão dura cerca de 24 h e é renovada sozinha. Se vencer, o login automático começa e a chamada responde `503` até você mandar o código.",
    "",
    "## Convenções",
    "- Datas em `AAAA-MM-DD`. Parâmetros de data acima da última carga são limitados a ela, e o header `x-b3-ajustes` diz o que mudou.",
    "- `x-b3-status`: status original da B3 (ex.: `206`, quando ela entrega resposta parcial). `204` vira `204` aqui também.",
    "- Os valores numéricos de mercado chegam como texto já formatado (`\"R$ 10,00\"`, `\"12,3%\"`), do jeito que a B3 manda.",
    "- Campos novos que a B3 acrescentar passam adiante; `x-b3-divergencias-schema` conta quantos não bateram com o formato conhecido.",
    "- Cada rota mostra se está ✅ confirmada ou 🟡 com campos pendentes.",
  ].join("\n"),
  license: { name: "MIT", url: "https://opensource.org/license/mit" },
};

export const COMPONENTES = {
  securitySchemes: {
    apiKey: { type: "apiKey" as const, in: "header" as const, name: "x-api-key", description: "Chave definida em `B3_API_KEY` (mínimo 16 caracteres)." },
  },
};

/** Headers das respostas 200, no formato do @fastify/swagger (JSON Schema + description). */
export const CABECALHOS_B3 = {
  "x-b3-status": { type: "integer", description: "Status HTTP original da B3 (ex.: 206)" },
  "x-b3-ajustes": { type: "string", description: "JSON com os parâmetros que foram limitados à data da última carga" },
  "x-b3-divergencias-schema": { type: "integer", description: "Quantos campos da resposta não bateram com o formato conhecido" },
};
