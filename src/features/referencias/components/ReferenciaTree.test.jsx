import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReferenciaTree from "./ReferenciaTree";
import { buildTree } from "../utils/tree";

const ref = (id, parentId = null) => ({ _id: id, name: id, parentId });
const func = (id, referenciaId) => ({ _id: id, nome: id, referenciaId });

/** A -> B -> C -> D -> FUNCIONARIO X, mais um segundo ramo A -> E. */
function arvoreProfunda() {
  return buildTree(
    [ref("A"), ref("B", "A"), ref("C", "B"), ref("D", "C"), ref("E", "A")],
    [func("FUNCIONARIO X", "D"), func("FUNCIONARIO Y", "E")]
  );
}

// O avatar mostra as iniciais, que colidem com nomes curtos; por isso as buscas
// são restritas ao rótulo do nó.
const NOME = ".referencia-tree__name";
const no = (nome, escopo = screen) =>
  escopo.getByText(nome, { selector: NOME });
const semNo = (nome) => screen.queryByText(nome, { selector: NOME });
const toggleDe = (nome) =>
  screen.getByLabelText(
    new RegExp(`(Expandir|Recolher) indicações de ${nome}$`)
  );
const expandirTudo = () =>
  userEvent.click(screen.getByRole("button", { name: /Expandir tudo/i }));

describe("ReferenciaTree", () => {
  it("renderiza todos os níveis quando tudo está expandido", async () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);
    await expandirTudo();

    ["A", "B", "C", "D", "FUNCIONARIO X", "E", "FUNCIONARIO Y"].forEach(
      (nome) => expect(no(nome)).toBeInTheDocument()
    );
  });

  it("recolhe e expande um ramo inteiro", async () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);
    await expandirTudo();
    expect(no("FUNCIONARIO X")).toBeInTheDocument();

    await userEvent.click(toggleDe("B"));
    expect(semNo("C")).toBeNull();
    expect(semNo("FUNCIONARIO X")).toBeNull();
    expect(no("B")).toBeInTheDocument();

    await userEvent.click(toggleDe("B"));
    expect(no("C")).toBeInTheDocument();
  });

  it("recolher tudo deixa apenas as raízes visíveis", async () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Recolher tudo/i })
    );

    expect(no("A")).toBeInTheDocument();
    expect(semNo("B")).toBeNull();
  });

  it("aninha os filhos dentro do nó pai", async () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);
    await expandirTudo();

    const itemA = no("A").closest("li");
    expect(no("FUNCIONARIO X", within(itemA))).toBeInTheDocument();

    const itemE = no("E").closest("li");
    expect(
      within(itemE).queryByText("C", { selector: NOME })
    ).toBeNull();
  });

  it("distingue referências de funcionários", async () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);
    await expandirTudo();

    const linhaFuncionario = no("FUNCIONARIO X").closest(
      ".referencia-tree__row"
    );
    expect(
      within(linhaFuncionario).getByText("Funcionário")
    ).toBeInTheDocument();

    const linhaReferencia = no("C").closest(".referencia-tree__row");
    expect(within(linhaReferencia).getByText("Referência")).toBeInTheDocument();
  });

  it("informa a profundidade e o número de raízes", () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);
    expect(screen.getByText(/1 raiz · 5 níveis/)).toBeInTheDocument();
  });

  it("filtra mantendo os ancestrais do resultado", async () => {
    render(<ReferenciaTree nodes={arvoreProfunda()} />);

    await userEvent.type(
      screen.getByLabelText("Buscar na árvore de referências"),
      "FUNCIONARIO X"
    );

    ["A", "B", "C", "D", "FUNCIONARIO X"].forEach((nome) =>
      expect(no(nome)).toBeInTheDocument()
    );
    expect(semNo("FUNCIONARIO Y")).toBeNull();
    expect(semNo("E")).toBeNull();
  });

  it("dispara onSelect com o nó clicado", async () => {
    const onSelect = vi.fn();
    render(<ReferenciaTree nodes={arvoreProfunda()} onSelect={onSelect} />);

    await userEvent.click(no("A"));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "A", tipo: "referencia" })
    );
  });

  it("mostra estado vazio sem nenhuma referência", () => {
    render(<ReferenciaTree nodes={[]} />);
    expect(
      screen.getByText("Nenhuma referência cadastrada")
    ).toBeInTheDocument();
  });
});
