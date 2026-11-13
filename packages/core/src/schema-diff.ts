import type { z } from "zod";

type Def = { type: string; shape?: Record<string, z.ZodType>; element?: z.ZodType; innerType?: z.ZodType };
const defOf = (s: z.ZodType): Def => (s as unknown as { _zod: { def: Def } })._zod.def;

function unwrap(s: z.ZodType): z.ZodType {
  let cur = s;
  for (let i = 0; i < 10; i++) {
    const d = defOf(cur);
    if ((d.type === "optional" || d.type === "nullable" || d.type === "default" || d.type === "prefault") && d.innerType) cur = d.innerType;
    else break;
  }
  return cur;
}

/**
 * Campos presentes na resposta que o schema não descreve (caminhos como `itens[].posicoes[].novoCampo`).
 * Serve para descobrir campos novos sem expor valores.
 */
export function camposNaoDescritos(schema: z.ZodType, data: unknown, path = ""): string[] {
  const s = unwrap(schema);
  const d = defOf(s);
  if (d.type === "unknown" || d.type === "any") {
    return data !== null && data !== undefined ? [`${path || "(raiz)"} (rota sem schema)`] : [];
  }
  if (d.type === "array" && Array.isArray(data) && d.element) {
    const out = new Set<string>();
    for (const x of data.slice(0, 200)) for (const p of camposNaoDescritos(d.element, x, `${path}[]`)) out.add(p);
    return [...out];
  }
  if (d.type === "object" && d.shape && data && typeof data === "object" && !Array.isArray(data)) {
    const out: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      const child = d.shape[k];
      const p = path ? `${path}.${k}` : k;
      if (!child) out.push(p);
      else out.push(...camposNaoDescritos(child, v, p));
    }
    return out;
  }
  return [];
}
