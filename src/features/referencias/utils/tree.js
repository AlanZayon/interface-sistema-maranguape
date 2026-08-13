/**
 * Utilidades recursivas para a hierarquia de referências.
 *
 * Um nó tem a forma:
 * `{ id, tipo: "referencia" | "funcionario", name, cargo, telefone, origem, parentId, children }`
 *
 * Nenhuma função aqui assume profundidade máxima: a recursão desce enquanto
 * houver `children`.
 */

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Converte o catálogo plano (`/referencias-dados`) em floresta. */
export function buildTree(referencias = [], funcionarios = [], rootId = null) {
  const nodes = new Map();

  referencias.forEach((referencia) => {
    const id = String(referencia._id ?? referencia.id);
    nodes.set(id, {
      id,
      tipo: "referencia",
      name: referencia.name || "",
      cargo: referencia.cargo || null,
      telefone: referencia.telefone || null,
      origem: referencia.origem || null,
      funcionarioId: referencia.funcionarioId
        ? String(referencia.funcionarioId)
        : null,
      parentId: referencia.parentId ? String(referencia.parentId) : null,
      children: [],
    });
  });

  const roots = [];
  nodes.forEach((node) => {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  });

  funcionarios.forEach((funcionario) => {
    const parentId = funcionario.referenciaId
      ? String(funcionario.referenciaId)
      : null;
    const parent = parentId ? nodes.get(parentId) : null;
    if (!parent) return;
    parent.children.push({
      id: String(funcionario._id ?? funcionario.id),
      tipo: "funcionario",
      name: funcionario.nome || "",
      cargo: funcionario.funcao || null,
      telefone: null,
      origem: funcionario.natureza || null,
      funcionarioId: String(funcionario._id ?? funcionario.id),
      parentId,
      children: [],
    });
  });

  // Um ciclo nos dados deixaria os nós envolvidos fora de `roots`; sem este
  // resgate eles sumiriam silenciosamente da tela.
  const alcancados = new Set();
  const marcar = (node) => {
    if (alcancados.has(node.id)) return;
    alcancados.add(node.id);
    node.children.forEach(marcar);
  };
  roots.forEach(marcar);
  nodes.forEach((node) => {
    if (alcancados.has(node.id)) return;
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) {
      parent.children = parent.children.filter((child) => child !== node);
    }
    roots.push(node);
    marcar(node);
  });

  const resultado = rootId
    ? [nodes.get(String(rootId))].filter(Boolean)
    : roots;
  resultado.forEach(sortNode);
  return resultado.sort(compareNodes);
}

function compareNodes(a, b) {
  if (a.tipo !== b.tipo) return a.tipo === "referencia" ? -1 : 1;
  return collator.compare(a.name || "", b.name || "");
}

function sortNode(node) {
  node.children.sort(compareNodes);
  node.children.forEach(sortNode);
}

/** Percorre a árvore em profundidade, chamando `fn(node, depth, parent)`. */
export function walkTree(nodes = [], fn, depth = 0, parent = null) {
  nodes.forEach((node) => {
    fn(node, depth, parent);
    walkTree(node.children || [], fn, depth + 1, node);
  });
}

export function findNode(nodes = [], predicate) {
  const test =
    typeof predicate === "function"
      ? predicate
      : (node) => node.id === String(predicate);

  for (const node of nodes) {
    if (test(node)) return node;
    const encontrado = findNode(node.children || [], test);
    if (encontrado) return encontrado;
  }
  return null;
}

/** Caminho da raiz até o nó, inclusive. `[]` se o nó não existir. */
export function getAncestorChain(nodes = [], id) {
  const alvo = String(id);

  const descer = (node, caminho) => {
    const atual = [...caminho, node];
    if (node.id === alvo) return atual;
    for (const child of node.children || []) {
      const encontrado = descer(child, atual);
      if (encontrado) return encontrado;
    }
    return null;
  };

  for (const node of nodes) {
    const encontrado = descer(node, []);
    if (encontrado) return encontrado;
  }
  return [];
}

export function isDescendant(node, id) {
  if (!node) return false;
  const alvo = String(id);
  return (node.children || []).some(
    (child) => child.id === alvo || isDescendant(child, alvo)
  );
}

export function countDescendants(node) {
  return (node?.children || []).reduce(
    (total, child) => total + 1 + countDescendants(child),
    0
  );
}

export function countByTipo(node) {
  let referencias = 0;
  let funcionarios = 0;
  walkTree(node?.children || [], (child) => {
    if (child.tipo === "funcionario") funcionarios += 1;
    else referencias += 1;
  });
  return { referencias, funcionarios };
}

export function collectIds(nodes = []) {
  const ids = [];
  walkTree(nodes, (node) => ids.push(node.id));
  return ids;
}

/** Ids de todos os nós que possuem filhos — usado para expandir tudo. */
export function collectExpandableIds(nodes = []) {
  const ids = [];
  walkTree(nodes, (node) => {
    if (node.children?.length) ids.push(node.id);
  });
  return ids;
}

/**
 * Mantém apenas os ramos que contêm o termo, preservando os ancestrais para que
 * a hierarquia continue legível.
 */
export function filterTree(nodes = [], termo = "") {
  const q = String(termo || "")
    .trim()
    .toLowerCase();
  if (!q) return nodes;

  const matches = (node) =>
    [node.name, node.cargo, node.telefone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);

  const filtrar = (node) => {
    const children = (node.children || [])
      .map(filtrar)
      .filter(Boolean);
    if (matches(node) || children.length) return { ...node, children };
    return null;
  };

  return nodes.map(filtrar).filter(Boolean);
}

export function treeDepth(nodes = []) {
  if (!nodes.length) return 0;
  return 1 + Math.max(...nodes.map((node) => treeDepth(node.children || [])));
}
