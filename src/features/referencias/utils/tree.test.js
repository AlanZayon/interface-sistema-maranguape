import { describe, expect, it } from "vitest";
import {
  buildTree,
  collectExpandableIds,
  countByTipo,
  countDescendants,
  filterTree,
  findNode,
  getAncestorChain,
  isDescendant,
  treeDepth,
  walkTree,
} from "./tree";

const ref = (id, parentId = null) => ({ _id: id, name: id, parentId });
const func = (id, referenciaId) => ({ _id: id, nome: id, referenciaId });
const names = (nodes) => nodes.map((node) => node.name);

/** Cadeia A -> B -> C -> D -> E -> FUNC, para exercitar profundidade real. */
function cadeiaProfunda() {
  return buildTree(
    [ref("A"), ref("B", "A"), ref("C", "B"), ref("D", "C"), ref("E", "D")],
    [func("FUNC", "E")]
  );
}

describe("buildTree", () => {
  it("desce por quantos níveis existirem", () => {
    const arvore = cadeiaProfunda();

    const caminho = [];
    let node = arvore[0];
    caminho.push(node.name);
    while (node.children.length) {
      node = node.children[0];
      caminho.push(node.name);
    }

    expect(caminho).toEqual(["A", "B", "C", "D", "E", "FUNC"]);
    expect(treeDepth(arvore)).toBe(6);
  });

  it("agrupa múltiplos filhos, com referências antes de funcionários", () => {
    const arvore = buildTree(
      [ref("A"), ref("B", "A"), ref("C", "A"), ref("D", "A")],
      [func("FUNC X", "A")]
    );

    expect(names(arvore[0].children)).toEqual(["B", "C", "D", "FUNC X"]);
  });

  it("monta a árvore completa do cenário 5", () => {
    const arvore = buildTree(
      [ref("A"), ref("B", "A"), ref("C", "B"), ref("D", "A")],
      [func("FUNC 1", "C"), func("FUNC 2", "B"), func("FUNC 3", "D")]
    );

    expect(names(arvore)).toEqual(["A"]);
    expect(names(findNode(arvore, "B").children)).toEqual(["C", "FUNC 2"]);
    expect(names(findNode(arvore, "C").children)).toEqual(["FUNC 1"]);
    expect(names(findNode(arvore, "D").children)).toEqual(["FUNC 3"]);
    expect(findNode(arvore, "FUNC 1").tipo).toBe("funcionario");
  });

  it("trata referências sem parent como raízes", () => {
    expect(names(buildTree([ref("B"), ref("C")], []))).toEqual(["B", "C"]);
  });

  it("recorta a subárvore quando rootId é informado", () => {
    const arvore = buildTree(
      [ref("A"), ref("B", "A"), ref("C", "B")],
      [],
      "B"
    );

    expect(names(arvore)).toEqual(["B"]);
    expect(names(arvore[0].children)).toEqual(["C"]);
  });

  it("não trava com um ciclo nos dados", () => {
    const arvore = buildTree(
      [ref("A", "C"), ref("B", "A"), ref("C", "B")],
      []
    );

    const visitados = [];
    walkTree(arvore, (node) => visitados.push(node.name));
    expect(visitados.sort()).toEqual(["A", "B", "C"]);
  });
});

describe("navegação recursiva", () => {
  it("getAncestorChain devolve o caminho da raiz até o nó", () => {
    const arvore = cadeiaProfunda();
    expect(names(getAncestorChain(arvore, "FUNC"))).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "FUNC",
    ]);
  });

  it("getAncestorChain devolve vazio para um id inexistente", () => {
    expect(getAncestorChain(cadeiaProfunda(), "ZZZ")).toEqual([]);
  });

  it("isDescendant enxerga qualquer profundidade", () => {
    const [raiz] = cadeiaProfunda();
    expect(isDescendant(raiz, "FUNC")).toBe(true);
    expect(isDescendant(raiz, "A")).toBe(false);
  });

  it("countDescendants e countByTipo contam a subárvore inteira", () => {
    const [raiz] = cadeiaProfunda();
    expect(countDescendants(raiz)).toBe(5);
    expect(countByTipo(raiz)).toEqual({ referencias: 4, funcionarios: 1 });
  });

  it("collectExpandableIds ignora as folhas", () => {
    const arvore = buildTree(
      [ref("A"), ref("B", "A"), ref("C", "A")],
      [func("FUNC", "B")]
    );

    expect(collectExpandableIds(arvore).sort()).toEqual(["A", "B"]);
  });
});

describe("filterTree", () => {
  it("preserva os ancestrais do nó encontrado", () => {
    const arvore = cadeiaProfunda();
    const filtrada = filterTree(arvore, "func");

    expect(names(getAncestorChain(filtrada, "FUNC"))).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "FUNC",
    ]);
  });

  it("descarta ramos sem correspondência", () => {
    const arvore = buildTree([ref("A"), ref("B", "A"), ref("C", "A")], []);
    const filtrada = filterTree(arvore, "B");

    expect(names(filtrada[0].children)).toEqual(["B"]);
  });

  it("devolve a árvore original quando não há termo", () => {
    const arvore = cadeiaProfunda();
    expect(filterTree(arvore, "  ")).toBe(arvore);
  });
});
