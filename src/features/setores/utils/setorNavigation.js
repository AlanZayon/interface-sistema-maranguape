/**
 * Navegação hierárquica de setores / subsetores.
 * URLs canônicas (workspace):
 *   /estrutura
 *   /estrutura/:nodeId
 */

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function isObjectId(value) {
  return typeof value === "string" && OBJECT_ID_RE.test(value);
}

export function resolveCurrentSetorId(setorIdParam, subPath) {
  if (subPath) {
    const parts = subPath.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return setorIdParam;
}

export function parseIdChainFromRoute(setorIdParam, subPath) {
  const fromSplat = (subPath || "").split("/").filter(Boolean);
  const idsFromSplat = fromSplat.filter(isObjectId);
  if (idsFromSplat.length) return idsFromSplat;
  if (isObjectId(setorIdParam)) return [setorIdParam];
  return [];
}

export function buildEstruturaUrl(nodeId, view = null) {
  const path = nodeId ? `/estrutura/${nodeId}` : "/estrutura";
  if (!view || view === "lista" || view === "painel") return path;
  return `${path}?view=${encodeURIComponent(view)}`;
}

/** Filhos de um nó (apenas subsetores no modelo novo). */
export function getNodeChildren(node) {
  if (!node) return [];
  if (Array.isArray(node.children) && node.children.length) {
    return node.children;
  }
  // Compat: API antiga podia enviar coordenadorias
  return [
    ...(node.subsetores || []),
    ...(node.coordenadorias || []),
  ];
}

export function normalizeNodeTipo(tipo) {
  const t = String(tipo || "").toLowerCase();
  // Legado: Coordenadoria/Divisão passa a ser tratado como Subsetor
  if (t === "coordenadoria" || t === "divisao" || t === "divisão") {
    return "subsetor";
  }
  if (t === "subsetor") return "subsetor";
  if (t === "setor") return "setor";
  return t || "setor";
}

/** @deprecated Divisões não existem mais */
export function isDivisaoTipo() {
  return false;
}

export function getTipoLabel(tipo) {
  const n = normalizeNodeTipo(tipo);
  if (n === "subsetor") return "Subsetor";
  if (n === "setor") return "Setor";
  return tipo || "Nó";
}

/** Contagem no nó + subtree. Prefer API subtree field when present. */
export function countEmployeesInSubtree(node) {
  if (!node) return 0;
  if (node.quantidadeFuncionariosSubtree != null) {
    return Number(node.quantidadeFuncionariosSubtree) || 0;
  }
  const own = Number(node.quantidadeFuncionarios || node.employees || 0);
  const children = getNodeChildren(node);
  return (
    own +
    children.reduce((sum, child) => sum + countEmployeesInSubtree(child), 0)
  );
}

export function findNodeInTree(setores, targetId) {
  if (!setores?.length || !targetId) return null;
  const target = String(targetId);

  const walk = (nodes) => {
    for (const node of nodes || []) {
      const id = String(node._id ?? node.id);
      if (id === target) return node;
      const found = walk(getNodeChildren(node));
      if (found) return found;
    }
    return null;
  };

  return walk(setores);
}

export function buildSetorUrl(ancestry) {
  if (!ancestry?.length) return "/estrutura";
  return buildEstruturaUrl(ancestry[ancestry.length - 1].id);
}

export function buildParentUrl(ancestry) {
  if (!ancestry?.length || ancestry.length === 1) return "/estrutura";
  return buildEstruturaUrl(ancestry[ancestry.length - 2].id);
}

export function findAncestryInTree(setores, targetId) {
  if (!setores?.length || !targetId) return null;
  const target = String(targetId);

  const walk = (nodes, path) => {
    for (const node of nodes || []) {
      const id = String(node._id ?? node.id);
      const next = [
        ...path,
        {
          id,
          name: node.nome ?? node.name,
          tipo: node.tipo ?? node.type,
        },
      ];
      if (id === target) return next;

      const found = walk(getNodeChildren(node), next);
      if (found) return found;
    }
    return null;
  };

  return walk(setores, []);
}

export function buildBreadcrumbItems(ancestry, view = null) {
  const items = [
    { label: "Organização", to: buildEstruturaUrl(null, view) },
  ];

  if (!ancestry?.length) return items;

  ancestry.forEach((node, index) => {
    const isLast = index === ancestry.length - 1;
    items.push({
      label: node.name,
      to: isLast ? undefined : buildEstruturaUrl(node.id, view),
      active: isLast,
    });
  });

  return items;
}

export function getExpandedIdsForSelection(ancestry) {
  if (!ancestry?.length) return [];
  return ancestry.slice(0, -1).map((n) => n.id);
}

export function filterTreeByQuery(nodes, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return nodes || [];

  const filterNode = (node) => {
    const name = String(node.nome ?? node.name ?? "").toLowerCase();
    const children = getNodeChildren(node)
      .map(filterNode)
      .filter(Boolean);
    const selfMatch = name.includes(q);
    if (!selfMatch && children.length === 0) return null;
    return {
      ...node,
      subsetores: children,
      children,
      _selfMatch: selfMatch,
    };
  };

  return (nodes || []).map(filterNode).filter(Boolean);
}

export function buildAncestryFromIdChain(idChain, nameHints = {}) {
  if (!idChain?.length) return [];
  return idChain.map((id, index) => ({
    id,
    name:
      nameHints[id] ||
      (index === idChain.length - 1
        ? nameHints.leaf || "…"
        : index === 0
          ? nameHints.root || "…"
          : "…"),
  }));
}

/** Lotação id from funcionario (setorId canônico, coordenadoria legado). */
export function lotacaoIdOf(funcionario) {
  if (!funcionario) return null;
  return funcionario.setorId || funcionario.coordenadoria || null;
}
