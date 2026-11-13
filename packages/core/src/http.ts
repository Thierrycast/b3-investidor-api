export type FetchLike = typeof fetch;

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  /** Repetir também em respostas HTTP transitórias (429/502/503/504). Use só em requisições idempotentes. */
  retryOnStatus?: boolean;
}

const TRANSIENT = new Set([429, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch com backoff exponencial. Já vimos EHOSTUNREACH intermitente na API da B3,
 * então erros de rede são sempre repetidos.
 */
export async function fetchWithRetry(
  fetchImpl: FetchLike,
  url: string | URL,
  init: RequestInit,
  { retries = 3, baseDelayMs = 500, retryOnStatus = true }: RetryOptions = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchImpl(url, init);
      if (retryOnStatus && TRANSIENT.has(res.status) && attempt < retries) {
        await res.body?.cancel().catch(() => {});
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
      return res;
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}
