// Valores públicos observados no front da B3 (aparecem na URL de login de qualquer pessoa).
// Não são segredos: o cliente é público (SPA, sem client_secret). Detalhes em docs/auth.md.

/** Origem do front. O endpoint de token só aceita CORS dessa origem e a API confere Origin/Referer. */
export const B3_WEB_ORIGIN = "https://www.investidor.b3.com.br";

/** Host da API de dados (sem "www"). Não fica atrás do desafio do Cloudflare que protege o front. */
export const B3_API_BASE = "https://investidor.b3.com.br";

/** Tenant Azure AD B2C da B3. */
export const B2C_TENANT_BASE = "https://b3investidor.b2clogin.com/b3Investidor.onmicrosoft.com";
export const B2C_TOKEN_URL = `${B2C_TENANT_BASE}/oauth2/v2.0/token`;
export const B2C_AUTHORIZE_URL = `${B2C_TENANT_BASE}/oauth2/v2.0/authorize`;

/** Custom policy (IEF) usada no login. */
export const DEFAULT_POLICY = "B2C_1A_SIGN_IN";

/** client_id público do front (aparece no parâmetro client_id do /authorize). */
export const DEFAULT_CLIENT_ID = "711b0677-3672-4464-b183-76734fb21907";

/** Escopo da API de dados. */
export const DEFAULT_SCOPE = "https://b3Investidor.onmicrosoft.com/802348e6-6f23-4d99-9445-45836861cdf4/Read.All";

/** Vidas observadas (s). O refresh_token gira a cada uso: guarde sempre o novo. */
export const ACCESS_TOKEN_TTL_S = 3600;
export const REFRESH_TOKEN_TTL_S = 86400;
