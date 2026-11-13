import { B2C_TOKEN_URL, B3_WEB_ORIGIN, DEFAULT_CLIENT_ID, DEFAULT_POLICY, DEFAULT_SCOPE } from "./constants";
import { B3AuthError } from "./errors";
import { fetchWithRetry, type FetchLike } from "./http";
import type { B3Session } from "./session";

export interface AccessToken {
  token: string;
  /** epoch ms */
  expiresAt: number;
}

export interface RefreshResult {
  access: AccessToken;
  /** Sessão com o refresh_token novo (o B2C gira o token a cada uso). Guarde-a. */
  session: B3Session;
}

/** Corpo devolvido pelo /token (nomes observados; valores nunca são logados). */
interface TokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

export function scopeFor(session: Pick<B3Session, "scope">): string {
  const base = session.scope?.split(/\s+/).filter((s) => s && s !== "openid" && s !== "offline_access") ?? [];
  return [...(base.length ? base : [DEFAULT_SCOPE]), "openid", "offline_access"].join(" ");
}

/** Troca o refresh_token por um access_token novo (grant_type=refresh_token). */
export async function refreshSession(session: B3Session, fetchImpl: FetchLike = fetch): Promise<RefreshResult> {
  const policy = session.policy || DEFAULT_POLICY;
  const res = await fetchWithRetry(
    fetchImpl,
    `${B2C_TOKEN_URL}?p=${encodeURIComponent(policy)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: B3_WEB_ORIGIN },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: session.client_id || DEFAULT_CLIENT_ID,
        refresh_token: session.refresh_token,
        scope: scopeFor(session),
      }),
    },
    // POST: repete só erro de rede, nunca status (o token pode ter sido consumido).
    { retryOnStatus: false },
  );
  const body = (await res.json().catch(() => ({}))) as TokenResponse;

  if (!res.ok || !body.access_token) {
    const desc = body.error_description?.split(/\r?\n/)[0] ?? "";
    const aad = desc.match(/AAD(?:B2C|STS)\d+/)?.[0];
    const code = aad ?? body.error ?? `http_${res.status}`;
    // invalid_grant = refresh_token vencido, revogado ou já usado: só login novo resolve.
    const needsLogin = body.error === "invalid_grant" || res.status === 400 || res.status === 401;
    throw new B3AuthError(`Falha ao renovar a sessão (${code})${desc ? `: ${desc.slice(0, 160)}` : ""}`, code, needsLogin, res.status);
  }

  const now = Date.now();
  const next: B3Session = {
    ...session,
    refresh_token: body.refresh_token ?? session.refresh_token,
    client_id: session.client_id || DEFAULT_CLIENT_ID,
    policy,
    scope: session.scope || DEFAULT_SCOPE,
  };
  if (body.refresh_token) {
    next.obtained_at = new Date(now).toISOString();
    if (body.refresh_token_expires_in) next.refresh_expires_at = new Date(now + body.refresh_token_expires_in * 1000).toISOString();
  }
  return { access: { token: body.access_token, expiresAt: now + (body.expires_in ?? 3600) * 1000 }, session: next };
}
