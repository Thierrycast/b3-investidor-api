import { describe, expect, it } from "vitest";
import { isResend } from "../src/index";

describe("login: pedido de novo código", () => {
  it("reconhece r, reenviar e resend, sem ligar para caixa e espaços", () => {
    for (const t of ["r", "R", " r ", "reenviar", "Reenviar", "RESEND"]) expect(isResend(t)).toBe(true);
  });

  it("não confunde um código de verificação com o pedido", () => {
    for (const t of ["", "123456", "086 695", "ré", "reenviar123"]) expect(isResend(t)).toBe(false);
  });
});
