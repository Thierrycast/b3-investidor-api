// Gera docs/endpoints.md a partir do registro (packages/core/src/endpoints.ts).
// Rode com: pnpm docs:gen   — e confira no CI com: pnpm docs:check
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { endpointList } from "../packages/core/src/index";

type JS = { type?: string | string[]; properties?: Record<string, JS>; items?: JS; anyOf?: JS[]; description?: string; required?: string[]; default?: unknown; pattern?: string; minimum?: number; maximum?: number; additionalProperties?: unknown };

const js = (s: z.ZodType, io: "input" | "output") => z.toJSONSchema(s, { io, target: "openapi-3.0", unrepresentable: "any" }) as JS;

function typeName(s: JS): string {
  if (s.anyOf) return s.anyOf.map(typeName).filter((t) => t !== "null").join(" | ") || "null";
  if (s.type === "array") return `${s.items ? typeName(s.items) : "unknown"}[]`;
  if (s.type === "object") return s.properties && Object.keys(s.properties).length ? "objeto" : "objeto (não mapeado)";
  return Array.isArray(s.type) ? s.type.join(" | ") : (s.type ?? "qualquer");
}

function unwrapNull(s: JS): JS {
  return s.anyOf?.find((x) => x.type !== "null") ?? s;
}

function tree(s: JS, indent = "", out: string[] = []): string[] {
  const base = unwrapNull(s);
  const obj = base.type === "array" ? unwrapNull(base.items ?? {}) : base;
  for (const [k, v] of Object.entries(obj.properties ?? {})) {
    const inner = unwrapNull(v);
    out.push(`${indent}- \`${k}\`: ${typeName(v)}${v.description || inner.description ? ` — ${v.description ?? inner.description}` : ""}`);
    const child = inner.type === "array" ? unwrapNull(inner.items ?? {}) : inner;
    if (child.properties && Object.keys(child.properties).length) tree(inner, `${indent}  `, out);
  }
  return out;
}

const STATUS = { confirmado: "✅ confirmado", "campos-pendentes": "🟡 campos pendentes" } as const;
const tags = [...new Set(endpointList.map((e) => e.tag))];

const md: string[] = [
  "# Rotas",
  "",
  "> Arquivo gerado por `pnpm docs:gen` a partir de `packages/core/src/endpoints.ts`. Não edite à mão.",
  "",
  "Todas as rotas da B3 são `GET https://investidor.b3.com.br<rota>` com `Authorization: Bearer <access_token>` e `cache-guid=<uuid>`.",
  "A coluna **API** é a rota equivalente no servidor deste projeto (`b3 serve`), que exige o header `x-api-key`.",
  "",
  "| | id | API | Resumo |",
  "|---|---|---|---|",
  ...endpointList.map((e) => `| ${e.status === "confirmado" ? "✅" : "🟡"} | [\`${e.id}\`](#${e.id.toLowerCase()}) | \`${e.route}\` | ${e.summary} |`),
  "",
];

for (const tag of tags) {
  md.push(`## ${tag}`, "");
  for (const e of endpointList.filter((x) => x.tag === tag)) {
    md.push(`### ${e.id}`, "", `**${e.summary}** — ${STATUS[e.status]}`, "");
    if (e.description) md.push(e.description, "");
    md.push(`- B3: \`GET ${e.b3Path}\``, `- API: \`GET ${e.route}\``);
    if (e.pagination) md.push(`- Paginação: ${e.pagination === "path" ? "número da página **no caminho**" : "`pagina` na query"}; a API aceita \`todasPaginas=true\``);
    if (e.clampToCarga?.length) md.push(`- Limitado à data da última carga: ${e.clampToCarga.map((c) => `\`${c}\``).join(", ")}`);
    md.push("");
    const q = js(e.query, "input");
    const props = Object.entries(q.properties ?? {});
    if (props.length) {
      md.push("| Parâmetro | Tipo | Obrigatório | Descrição |", "|---|---|---|---|");
      for (const [k, v] of props) {
        const d = [v.description, v.default !== undefined ? `padrão \`${JSON.stringify(v.default)}\`` : "", v.pattern ? `formato \`${v.pattern}\`` : ""].filter(Boolean).join("; ");
        md.push(`| \`${k}\` | ${typeName(v)} | ${q.required?.includes(k) ? "sim" : "não"} | ${d} |`);
      }
      md.push("");
    }
    if (e.notes?.length) md.push("Observações:", "", ...e.notes.map((n) => `- ${n}`), "");
    const fields = tree(js(e.response, "output"));
    md.push("Resposta:", "", ...(fields.length ? fields : [`- ${typeName(js(e.response, "output"))}`]), "");
  }
}

const text = `${md.join("\n").trimEnd()}\n`;
const target = new URL("../docs/endpoints.md", import.meta.url);
if (process.argv.includes("--check")) {
  const cur = readFileSync(target, "utf8");
  if (cur !== text) {
    console.error("docs/endpoints.md desatualizado: rode pnpm docs:gen");
    process.exit(1);
  }
} else writeFileSync(target, text);
