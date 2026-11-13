// Árvore de tipos de uma resposta, sem nenhum valor. É o formato que contribuidores
// podem colar numa issue com segurança (ver CONTRIBUTING.md).

const DATE_ISO = /^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
const DATE_BR = /^\d{2}\/\d{2}\/\d{4}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Shape = string | Shape[] | { [k: string]: Shape };

export function kind(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") {
    if (DATE_ISO.test(v)) return "date-iso";
    if (DATE_BR.test(v)) return "date-br";
    if (UUID.test(v)) return "uuid";
    if (/^\d+$/.test(v)) return "string(digits)";
    return "string";
  }
  return typeof v;
}

/** Mescla os itens de arrays (até `sample`) para mostrar todos os campos que aparecem. */
export function shape(v: unknown, depth = 0, sample = 200): Shape {
  if (depth > 10) return "…";
  if (Array.isArray(v)) {
    const merged: Record<string, Shape> = {};
    let primitive: string | undefined;
    for (const x of v.slice(0, sample)) {
      if (x && typeof x === "object" && !Array.isArray(x)) {
        for (const [k, s] of Object.entries(shape(x, depth + 1, sample) as Record<string, Shape>)) {
          if (!(k in merged) || merged[k] === "null") merged[k] = s;
        }
      } else primitive ??= kind(x);
    }
    if (Object.keys(merged).length) return [merged];
    return primitive ? [primitive] : [];
  }
  if (v && typeof v === "object") {
    const o: Record<string, Shape> = {};
    for (const [k, x] of Object.entries(v)) o[k] = x && typeof x === "object" ? shape(x, depth + 1, sample) : kind(x);
    return o;
  }
  return kind(v);
}
