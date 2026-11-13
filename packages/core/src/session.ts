import { mkdir, readFile, rename, writeFile, chmod } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/**
 * O mínimo para renovar o acesso fora do navegador.
 * Compatível com o session.json do spike (mesmas chaves).
 */
export interface B3Session {
  refresh_token: string;
  client_id?: string;
  policy?: string;
  scope?: string;
  /** ISO. Quando este refresh_token foi emitido (preenchido pela biblioteca). */
  obtained_at?: string;
  /** ISO. Quando este refresh_token deixa de valer, se a resposta informou. */
  refresh_expires_at?: string;
}

/** Onde a sessão mora. Troque por cofre, banco etc. implementando esta interface. */
export interface TokenStore {
  load(): Promise<B3Session | null>;
  save(session: B3Session): Promise<void>;
}

export function defaultSessionPath(): string {
  return process.env.B3_SESSION_FILE || join(homedir(), ".config", "b3-investidor", "session.json");
}

/** Arquivo JSON com modo 600, gravado de forma atômica (tmp + rename). */
export class FileTokenStore implements TokenStore {
  constructor(readonly path: string = defaultSessionPath()) {}

  async load(): Promise<B3Session | null> {
    try {
      const parsed = JSON.parse(await readFile(this.path, "utf8")) as B3Session;
      return parsed?.refresh_token ? parsed : null;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async save(session: B3Session): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const tmp = `${this.path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(session, null, 2), { mode: 0o600 });
    await rename(tmp, this.path);
    await chmod(this.path, 0o600).catch(() => {}); // Windows ignora
  }
}

export class MemoryTokenStore implements TokenStore {
  constructor(private session: B3Session | null = null) {}
  async load() {
    return this.session;
  }
  async save(session: B3Session) {
    this.session = session;
  }
}
