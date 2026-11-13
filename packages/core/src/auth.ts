import { createHash, randomBytes } from "node:crypto";
import { B2C_AUTHORIZE_URL, B2C_TOKEN_URL, B3_WEB_ORIGIN, DEFAULT_CLIENT_ID, DEFAULT_POLICY, DEFAULT_SCOPE } from "./constants";
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

// ---------- login (authorization code + PKCE) ----------


/** redirect_uri registrado no B2C para o cliente do site. Só ele é aceito (AADB2C90006 para os demais). */
export const LOGIN_REDIRECT_URI = "https://www.investidor.b3.com.br/";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function createPkce() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export interface AuthorizeParams {
  challenge: string;
  state: string;
  nonce: string;
  /**
   * Obrigatório na política B2C_1A_SIGN_IN (sem ele o B2C devolve "An exception has occurred").
   * O site manda o CPF/CNPJ só com dígitos; o valor pré-preenche o campo da tela.
   */
  docHint: string;
  policy?: string;
  clientId?: string;
  scope?: string;
}

export function buildAuthorizeUrl(p: AuthorizeParams): string {
  const u = new URL(B2C_AUTHORIZE_URL);
  const q = u.searchParams;
  q.set("p", p.policy ?? DEFAULT_POLICY);
  q.set("client_id", p.clientId ?? DEFAULT_CLIENT_ID);
  q.set("response_type", "code");
  q.set("redirect_uri", LOGIN_REDIRECT_URI);
  q.set("response_mode", "query");
  q.set("scope", `openid ${p.scope ?? DEFAULT_SCOPE} offline_access`);
  q.set("prompt", "login");
  q.set("state", p.state);
  q.set("nonce", p.nonce);
  q.set("code_challenge", p.challenge);
  q.set("code_challenge_method", "S256");
  q.set("doc_hint", p.docHint);
  return u.toString();
}

/** Troca o código do /authorize por tokens (grant_type=authorization_code), como o site faz. */
export async function exchangeCode(
  args: { code: string; verifier: string; policy?: string; clientId?: string; scope?: string },
  fetchImpl: FetchLike = fetch,
): Promise<RefreshResult> {
  const policy = args.policy ?? DEFAULT_POLICY;
  const clientId = args.clientId ?? DEFAULT_CLIENT_ID;
  const scope = args.scope ?? DEFAULT_SCOPE;
  const res = await fetchWithRetry(
    fetchImpl,
    `${B2C_TOKEN_URL}?p=${encodeURIComponent(policy)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: B3_WEB_ORIGIN },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        scope: `openid ${scope} offline_access`,
        code: args.code,
        redirect_uri: LOGIN_REDIRECT_URI,
        code_verifier: args.verifier,
      }),
    },
    { retryOnStatus: false },
  );
  const body = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !body.access_token || !body.refresh_token) {
    const desc = body.error_description?.split(/\r?\n/)[0] ?? "";
    const code = desc.match(/AAD(?:B2C|STS)\d+/)?.[0] ?? body.error ?? `http_${res.status}`;
    throw new B3AuthError(`Falha ao trocar o código de login (${code})${desc ? `: ${desc.slice(0, 160)}` : ""}`, code, true, res.status);
  }
  const now = Date.now();
  return {
    access: { token: body.access_token, expiresAt: now + (body.expires_in ?? 3600) * 1000 },
    session: {
      refresh_token: body.refresh_token,
      client_id: clientId,
      policy,
      scope,
      obtained_at: new Date(now).toISOString(),
      refresh_expires_at: body.refresh_token_expires_in ? new Date(now + body.refresh_token_expires_in * 1000).toISOString() : undefined,
    },
  };
}
