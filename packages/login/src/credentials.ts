import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Cofre de credenciais no sistema operacional. CPF e senha nunca vão para o repositório nem para logs.
 *
 * - Windows: DPAPI (cifra atrelada ao seu usuário do Windows), arquivo em ~/.config/b3-investidor/credenciais.dpapi
 * - macOS: Keychain (`security`)
 * - Linux: Secret Service / libsecret (`secret-tool`); em servidor sem sessão gráfica, use B3_CPF/B3_SENHA no ambiente.
 *
 * Os segredos passam por stdin dos utilitários, nunca por argumento de linha de comando.
 */
export interface Credentials {
  cpf: string;
  senha: string;
}

const SERVICE = "b3-investidor";
const ACCOUNT = "credenciais";
const dpapiFile = () => join(process.env.B3_CONFIG_DIR ?? join(homedir(), ".config", "b3-investidor"), "credenciais.dpapi");

function run(cmd: string, args: string[], input?: string) {
  // PSModulePath herdado do pwsh 7 quebra o Windows PowerShell 5; não passamos adiante.
  const { PSModulePath: _drop, ...env } = process.env;
  const r = spawnSync(cmd, args, { input, encoding: "utf8", windowsHide: true, env });
  if (r.error) throw new Error(`${cmd} indisponível: ${r.error.message}`);
  return r;
}

const PS = ["-NoProfile", "-NonInteractive", "-Command"];
// Entrada e saída em base64 para não depender da codificação do console.
// DPAPI direto pela API .NET (ProtectedData, escopo CurrentUser): não depende de módulos do PowerShell.
const PS_DPAPI = (op: "Protect" | "Unprotect") =>
  "Add-Type -AssemblyName System.Security;" +
  "$b=[Convert]::FromBase64String([Console]::In.ReadToEnd().Trim());" +
  `$e=[Text.Encoding]::UTF8.GetBytes('${SERVICE}');` +
  `$r=[Security.Cryptography.ProtectedData]::${op}($b,$e,[Security.Cryptography.DataProtectionScope]::CurrentUser);` +
  "[Convert]::ToBase64String($r)";
const PS_ENCRYPT = PS_DPAPI("Protect");
const PS_DECRYPT = PS_DPAPI("Unprotect");

export function vaultName(): string {
  return process.platform === "win32" ? "DPAPI do Windows" : process.platform === "darwin" ? "Keychain do macOS" : "Secret Service (secret-tool)";
}

export function saveCredentials(c: Credentials): void {
  const payload = JSON.stringify({ cpf: c.cpf.replace(/\D/g, ""), senha: c.senha });
  if (process.platform === "win32") {
    const r = run("powershell.exe", [...PS, PS_ENCRYPT], Buffer.from(payload, "utf8").toString("base64"));
    if (r.status !== 0 || !r.stdout.trim()) throw new Error("Falha ao cifrar com DPAPI.");
    const file = dpapiFile();
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, r.stdout.trim(), { mode: 0o600 });
    renameSync(tmp, file);
    try {
      chmodSync(file, 0o600);
    } catch {}
    return;
  }
  if (process.platform === "darwin") {
    run("security", ["delete-generic-password", "-s", SERVICE, "-a", ACCOUNT]);
    // `security -i` lê o comando do stdin: o segredo (em hex) não aparece na lista de processos.
    const hex = Buffer.from(payload, "utf8").toString("hex");
    const r = run("security", ["-i"], `add-generic-password -s ${SERVICE} -a ${ACCOUNT} -X ${hex} -U\n`);
    if (r.status !== 0) throw new Error("Falha ao gravar no Keychain.");
    return;
  }
  const r = run("secret-tool", ["store", "--label=B3 Investidor", "service", SERVICE, "account", ACCOUNT], payload);
  if (r.status !== 0) throw new Error("Falha ao gravar com secret-tool (sem sessão gráfica? use B3_CPF/B3_SENHA no ambiente).");
}

export function loadCredentials(): Credentials | null {
  let raw: string | null = null;
  try {
    if (process.platform === "win32") {
      const file = dpapiFile();
      if (!existsSync(file)) return null;
      const r = run("powershell.exe", [...PS, PS_DECRYPT], readFileSync(file, "utf8").trim());
      if (r.status !== 0) throw new Error("Falha ao decifrar (o arquivo só abre no mesmo usuário do Windows que o criou).");
      raw = Buffer.from(r.stdout.trim(), "base64").toString("utf8");
    } else if (process.platform === "darwin") {
      const r = run("security", ["find-generic-password", "-s", SERVICE, "-a", ACCOUNT, "-w"]);
      if (r.status !== 0) return null;
      raw = r.stdout.trim();
    } else {
      const r = run("secret-tool", ["lookup", "service", SERVICE, "account", ACCOUNT]);
      if (r.status !== 0 || !r.stdout) return null;
      raw = r.stdout;
    }
  } catch (e) {
    if (process.platform === "win32") throw e;
    return null; // utilitário ausente: segue só com o ambiente
  }
  const c = JSON.parse(raw) as Partial<Credentials>;
  return c.cpf && c.senha ? { cpf: c.cpf, senha: c.senha } : null;
}

export function deleteCredentials(): boolean {
  if (process.platform === "win32") {
    const file = dpapiFile();
    if (!existsSync(file)) return false;
    rmSync(file);
    return true;
  }
  if (process.platform === "darwin") return run("security", ["delete-generic-password", "-s", SERVICE, "-a", ACCOUNT]).status === 0;
  return run("secret-tool", ["clear", "service", SERVICE, "account", ACCOUNT]).status === 0;
}

/** Ambiente primeiro (B3_CPF/B3_SENHA), depois o cofre. Diz de onde veio, nunca o valor. */
export function resolveCredentials(): { cpf?: string; senha?: string; origem: "ambiente" | "cofre" | "nenhuma" } {
  const cpf = process.env.B3_CPF?.trim();
  const senha = process.env.B3_SENHA;
  if (cpf && senha) return { cpf, senha, origem: "ambiente" };
  const v = loadCredentials();
  if (v) return { cpf: cpf || v.cpf, senha: senha || v.senha, origem: "cofre" };
  return { cpf: cpf || undefined, senha: senha || undefined, origem: "nenhuma" };
}

/** Lê do terminal mostrando `*` no lugar de cada caractere. Só funciona num terminal interativo. */
export async function promptHidden(question: string): Promise<string> {
  const { stdin, stderr } = process;
  if (!stdin.isTTY) throw new Error("Precisa de um terminal interativo para digitar sem eco.");
  stderr.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let buf = "";
    const done = (err?: Error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stderr.write("\n");
      err ? reject(err) : resolve(buf);
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return done();
        if (ch === "\u0003") return done(new Error("Cancelado."));
        if (ch === "\u007f" || ch === "\b") {
          if (buf) stderr.write("\b \b"); // apaga um asterisco
          buf = buf.slice(0, -1);
        } else if (ch >= " ") {
          buf += ch;
          stderr.write("*"); // mostra que digitou/colou, sem revelar o valor
        }
      }
    };
    stdin.on("data", onData);
  });
}
