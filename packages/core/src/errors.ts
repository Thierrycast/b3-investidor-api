export class B3Error extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Falha de autenticação. `needsLogin` = só um login novo resolve
 * (sessão ausente, refresh_token vencido/revogado).
 */
export class B3AuthError extends B3Error {
  constructor(message: string, code: string, readonly needsLogin: boolean, status?: number) {
    super(message, code, status);
  }
}

/**
 * Erro devolvido pela API de dados. A B3 usa dois formatos:
 *  - regra de negócio: corpo é uma string JSON, ex. "A data informada é maior que a data de carga do sistema!"
 *  - validação (ASP.NET): application/problem+json com { title, status, errors: { campo: [msgs] }, traceId }
 */
export type B3ApiErrorKind = "regra" | "validacao" | "http";

export class B3ApiError extends B3Error {
  constructor(
    message: string,
    readonly kind: B3ApiErrorKind,
    status: number,
    readonly path: string,
    details?: unknown,
  ) {
    super(message, `b3_${kind}`, status, details);
  }
}

export function parseApiError(status: number, path: string, text: string): B3ApiError {
  let body: unknown = undefined;
  try {
    body = JSON.parse(text);
  } catch {
    /* corpo não-JSON (ex. página HTML de erro do gateway) */
  }
  if (typeof body === "string") return new B3ApiError(body, "regra", status, path);
  if (body && typeof body === "object" && "errors" in body) {
    // Os valores costumam ser listas de mensagens, mas já vieram como texto ou objeto.
    const b = body as { title?: string; errors?: Record<string, unknown> };
    const fields = Object.entries(b.errors ?? {})
      .map(([k, v]) => `${k}: ${(Array.isArray(v) ? v : [v]).map((m) => (typeof m === "string" ? m : JSON.stringify(m))).join("; ")}`)
      .join(" | ");
    return new B3ApiError(fields || b.title || "Erro de validação", "validacao", status, path, b.errors);
  }
  const snippet = text.length > 200 ? `${text.slice(0, 200)}…` : text;
  return new B3ApiError(`HTTP ${status}${snippet ? `: ${snippet}` : ""}`, "http", status, path);
}
