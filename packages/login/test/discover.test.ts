import { describe, expect, it } from "vitest";
import { matchRegistry, templatePath } from "../src/discover";

// Valores sintéticos.
describe("discover: modelo de rota", () => {
  it("troca números, uuids, datas, tickers e ids por marcadores", () => {
    expect(templatePath("/negocio-x/api/v1/itens/3")).toBe("/negocio-x/api/v1/itens/{n}");
    expect(templatePath("/a/0f8fad5b-d9cb-469f-a165-70867728950e/b")).toBe("/a/{uuid}/b");
    expect(templatePath("/a/2026-01-31")).toBe("/a/{data}");
    expect(templatePath("/ativos/ABCD3")).toBe("/ativos/{ticker}");
    expect(templatePath("/doc/00000000000")).toBe("/doc/{n}");
    expect(templatePath("/x/AB12345")).toBe("/x/{id}");
  });

  it("mantém versões e nomes", () => {
    expect(templatePath("/negocio-investidor/api/investidor/v1.3/cadastro")).toBe("/negocio-investidor/api/investidor/v1.3/cadastro");
    expect(templatePath("/negocio-home/api/home/v2/evolucao-patrimonial")).toBe("/negocio-home/api/home/v2/evolucao-patrimonial");
  });

  it("reconhece rotas do registro, inclusive com parâmetro no caminho", () => {
    expect(matchRegistry("/negocio-posicao/api/extrato-posicao/v2/posicao")).toBe("posicao");
    expect(matchRegistry(templatePath("/negocio-negociacaoativos/api/extrato-negociacao-ativos/v1/negociacao-ativos/2"))).toBeTruthy();
    expect(matchRegistry("/negocio-nada/api/v1/coisa")).toBeUndefined();
  });
});
