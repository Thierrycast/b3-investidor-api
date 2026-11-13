import { randomUUID } from "node:crypto";
import { refreshSession, type AccessToken } from "./auth";
import { B3_API_BASE, B3_WEB_ORIGIN } from "./constants";
import { endpoints, type EndpointDef, type EndpointId, type EndpointQuery, type EndpointResult } from "./endpoints";
import { B3AuthError, parseApiError } from "./errors";
import { fetchWithRetry, type FetchLike } from "./http";
import { FileTokenStore, type B3Session, type TokenStore } from "./session";

export interface Logger {
  debug?(msg: string, data?: Record<string, unknown>): void;
  warn?(msg: string, data?: Record<string, unknown>): void;
}

export interface B3ClientOptions {
  store?: TokenStore;
  fetch?: FetchLike;
  logger?: Logger;
  /** Renovar o access_token quando faltar menos que isso para vencer. Padrão: 2 min. */
  refreshMarginMs?: number;
  /** Quanto tempo reaproveitar a data da última carga. Padrão: 10 min. */
  cargaTtlMs?: number;
  retries?: number;
}

export interface CallMeta {
  /** Parâmetros efetivamente enviados (depois de padrões e limites). */
  params: Record<string, string>;
  /** Parâmetros que foram limitados à data da última carga. */
  ajustes: { campo: string; pedido: string; usado: string }[];
  /** Divergências entre a resposta e o schema conhecido (a resposta é devolvida mesmo assim). */
  schemaIssues: string[];
  status: number;
}

export interface RawResponse {
  status: number;
  body: unknown;
  contentType: string | null;
}

export class B3Client {
  readonly store: TokenStore;
  private readonly fetchImpl: FetchLike;
  private readonly logger: Logger;
  private readonly refreshMarginMs: number;
  private readonly cargaTtlMs: number;
  private readonly retries: number;
  /** A B3 usa um UUID fixo por sessão do navegador. Mantemos um por instância. */
  private readonly cacheGuid = randomUUID();
  private access?: AccessToken;
  private refreshing?: Promise<AccessToken>;
  private carga?: { value: string; at: number };
  /** Quando o refresh_token atual vence (se conhecido). */
  refreshExpiresAt?: string;

  constructor(opts: B3ClientOptions = {}) {
    this.store = opts.store ?? new FileTokenStore();
    this.fetchImpl = opts.fetch ?? fetch;
    this.logger = opts.logger ?? {};
    this.refreshMarginMs = opts.refreshMarginMs ?? 120_000;
    this.cargaTtlMs = opts.cargaTtlMs ?? 600_000;
    this.retries = opts.retries ?? 3;
  }

  // ---------- autenticação ----------

  /** Força a renovação e grava o refresh_token girado. */
  async refresh(): Promise<{ accessExpiresAt: number; refreshExpiresAt?: string }> {
    this.access = undefined;
    const a = await this.accessToken();
    return { accessExpiresAt: a.expiresAt, refreshExpiresAt: this.refreshExpiresAt };
  }

  private async accessToken(): Promise<AccessToken> {
    if (this.access && this.access.expiresAt - Date.now() > this.refreshMarginMs) return this.access;
    // Uma renovação por vez: o refresh_token gira, chamadas concorrentes o invalidariam.
    this.refreshing ??= (async () => {
      try {
        const session = await this.store.load();
        if (!session) throw new B3AuthError("Nenhuma sessão salva. Rode `b3 login`.", "no_session", true);
        const { access, session: next } = await refreshSession(session, this.fetchImpl);
        await this.store.save(next);
        this.refreshExpiresAt = next.refresh_expires_at;
        this.access = access;
        this.logger.debug?.("sessão renovada", { accessExpiresAt: new Date(access.expiresAt).toISOString(), refreshExpiresAt: next.refresh_expires_at });
        return access;
      } finally {
        this.refreshing = undefined;
      }
    })();
    return this.refreshing;
  }

  /** Grava uma sessão nova (ex.: vinda do `b3 login`) e descarta o access_token em cache. */
  async setSession(session: B3Session): Promise<void> {
    await this.store.save(session);
    this.access = undefined;
  }

  // ---------- HTTP ----------

  /** GET cru numa rota da B3. Lança B3ApiError para status ≥ 400. 204 → body null. */
  async raw(path: string, params: Record<string, string> = {}): Promise<RawResponse> {
    const url = new URL(path, B3_API_BASE);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("cache-guid", this.cacheGuid);

    for (let attempt = 0; ; attempt++) {
      const { token } = await this.accessToken();
      const res = await fetchWithRetry(
        this.fetchImpl,
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            Origin: B3_WEB_ORIGIN,
            Referer: `${B3_WEB_ORIGIN}/`,
          },
        },
        { retries: this.retries },
      );
      if (res.status === 401 && attempt === 0) {
        this.access = undefined; // token recusado: renova uma vez e tenta de novo
        continue;
      }
      const text = await res.text();
      if (res.status >= 400) throw parseApiError(res.status, url.pathname, text);
      let body: unknown = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      return { status: res.status, body, contentType: res.headers.get("content-type") };
    }
  }

  // ---------- última carga ----------

  /** dataGeral da última carga (AAAA-MM-DD). Cacheada por `cargaTtlMs`. */
  async dataCarga(force = false): Promise<string> {
    if (!force && this.carga && Date.now() - this.carga.at < this.cargaTtlMs) return this.carga.value;
    const { body } = await this.raw(endpoints.ultimaCarga.b3Path);
    const value = String((body as { dataGeral?: string } | null)?.dataGeral ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Resposta de ultima-execucao sem dataGeral");
    this.carga = { value, at: Date.now() };
    return value;
  }

  // ---------- rotas do registro ----------

  /** Chama uma rota do registro e devolve só os dados. */
  async call<K extends EndpointId>(id: K, query?: EndpointQuery<K>): Promise<EndpointResult<K>> {
    return (await this.callWithMeta(id, query)).data;
  }

  async callWithMeta<K extends EndpointId>(
    id: K,
    query?: EndpointQuery<K>,
  ): Promise<{ data: EndpointResult<K>; meta: CallMeta }> {
    const ep = endpoints[id] as unknown as EndpointDef;
    const parsed = ep.query.parse(query ?? {}) as Record<string, unknown>;
    const ajustes: CallMeta["ajustes"] = [];

    const needsCarga = (ep.defaults && Object.keys(ep.defaults({ carga: "2000-01-01" })).some((k) => parsed[k] === undefined)) || ep.clampToCarga?.length;
    if (needsCarga) {
      const carga = await this.dataCarga();
      for (const [k, v] of Object.entries(ep.defaults?.({ carga }) ?? {})) if (parsed[k] === undefined) parsed[k] = v;
      for (const k of ep.clampToCarga ?? []) {
        const v = parsed[k];
        if (typeof v === "string" && v > carga) {
          ajustes.push({ campo: k, pedido: v, usado: carga });
          parsed[k] = carga;
        }
      }
    }

    let path = ep.b3Path;
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === undefined || v === null) continue;
      if (path.includes(`{${k}}`)) path = path.replace(`{${k}}`, encodeURIComponent(String(v)));
      else params[k] = String(v);
    }

    const res = await this.raw(path, params);
    const check = ep.response.safeParse(res.body);
    const schemaIssues = check.success
      ? []
      : check.error.issues.slice(0, 20).map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`);
    if (schemaIssues.length) this.logger.warn?.("resposta diverge do schema conhecido", { endpoint: id, issues: schemaIssues.length });

    const data = (check.success ? check.data : res.body) as EndpointResult<K>;
    return { data, meta: { params, ajustes, schemaIssues, status: res.status } };
  }

  /** Percorre todas as páginas de uma rota paginada e devolve os itens concatenados. */
  async all<K extends EndpointId>(id: K, query?: EndpointQuery<K>, maxPages = 200): Promise<{ itens: unknown[]; totalPaginas: number }> {
    const ep = endpoints[id] as unknown as EndpointDef;
    if (!ep.pagination) throw new Error(`Rota ${id} não é paginada`);
    const itens: unknown[] = [];
    let total = 1;
    for (let pagina = 1; pagina <= Math.min(total, maxPages); pagina++) {
      const data = (await this.call(id, { ...(query ?? {}), pagina } as EndpointQuery<K>)) as { itens?: unknown[]; totalPaginas?: number };
      itens.push(...(data.itens ?? []));
      total = data.totalPaginas ?? 1;
    }
    return { itens, totalPaginas: total };
  }
}
