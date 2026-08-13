import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ReferenciaChain from "./ReferenciaChain";

const cadeia = [
  { id: "a", tipo: "referencia", name: "A", cargo: "SECRETARIO" },
  { id: "b", tipo: "referencia", name: "B" },
  { id: "c", tipo: "referencia", name: "C" },
  { id: "f", tipo: "funcionario", name: "FUNCIONARIO X" },
];

describe("ReferenciaChain", () => {
  it("renderiza a cadeia da raiz até o alvo, na ordem", () => {
    render(<ReferenciaChain cadeia={cadeia} />);

    // O avatar exibe as iniciais, então a busca é restrita ao rótulo do nó.
    const nomes = screen
      .getAllByRole("listitem")
      .map(
        (item) =>
          within(item).getByText((_, el) =>
            el?.classList.contains("referencia-chain__name")
          ).textContent
      );

    expect(nomes).toEqual(["A", "B", "C", "FUNCIONARIO X"]);
  });

  it("marca a raiz e o alvo", () => {
    render(<ReferenciaChain cadeia={cadeia} />);

    const itens = screen.getAllByRole("listitem");
    expect(within(itens[0]).getByText("Raiz")).toBeInTheDocument();
    expect(within(itens[3]).getByText("Funcionário")).toBeInTheDocument();
  });

  it("suporta qualquer profundidade", () => {
    const longa = Array.from({ length: 12 }, (_, index) => ({
      id: `n${index}`,
      tipo: "referencia",
      name: `N${index}`,
    }));

    render(<ReferenciaChain cadeia={longa} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
  });

  it("não exibe selos quando há um único item", () => {
    render(<ReferenciaChain cadeia={[cadeia[0]]} />);
    expect(screen.queryByText("Raiz")).not.toBeInTheDocument();
  });

  it("mostra a mensagem vazia sem cadeia", () => {
    render(<ReferenciaChain cadeia={[]} emptyLabel="Sem indicação" />);
    expect(screen.getByText("Sem indicação")).toBeInTheDocument();
  });
});
