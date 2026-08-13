import { Badge } from "react-bootstrap";
import { countByTipo } from "../utils/tree";

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Nó da árvore de referências. Renderiza a si mesmo para cada filho, então a
 * profundidade suportada é a mesma dos dados — não há nível máximo.
 */
export default function ReferenciaTreeNode({
  node,
  depth = 0,
  expandedIds,
  onToggle,
  onSelect,
  selectedId = null,
  actions = null,
}) {
  const isFuncionario = node.tipo === "funcionario";
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(node.id);
  const { referencias, funcionarios } = hasChildren
    ? countByTipo(node)
    : { referencias: 0, funcionarios: 0 };

  return (
    <li className="referencia-tree__item" role="none">
      <div
        className={`referencia-tree__row${
          selectedId === node.id ? " is-selected" : ""
        }`}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={selectedId === node.id}
        aria-level={depth + 1}
      >
        {hasChildren ? (
          <button
            type="button"
            className="referencia-tree__toggle"
            onClick={() => onToggle(node.id)}
            aria-label={
              expanded
                ? `Recolher indicações de ${node.name}`
                : `Expandir indicações de ${node.name}`
            }
          >
            <i
              className={`bi ${expanded ? "bi-chevron-down" : "bi-chevron-right"}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="referencia-tree__toggle is-leaf" aria-hidden="true" />
        )}

        <span
          className={`referencia-picker__avatar${
            isFuncionario ? " is-ext" : " is-func"
          }`}
          aria-hidden="true"
        >
          {initials(node.name)}
        </span>

        <button
          type="button"
          className="referencia-tree__label"
          onClick={() => onSelect?.(node)}
          disabled={!onSelect}
        >
          <span className="referencia-tree__name">{node.name}</span>
          <span className="referencia-tree__sub">
            {node.cargo || (isFuncionario ? "Sem função" : "Sem cargo")}
            {node.telefone ? ` · ${node.telefone}` : ""}
          </span>
        </button>

        <Badge
          bg={isFuncionario ? "secondary" : "primary"}
          className="referencia-tree__badge"
        >
          {isFuncionario ? "Funcionário" : "Referência"}
        </Badge>

        {hasChildren ? (
          <span className="referencia-tree__count text-muted">
            {referencias > 0
              ? `${referencias} ${referencias === 1 ? "referência" : "referências"}`
              : null}
            {referencias > 0 && funcionarios > 0 ? " · " : null}
            {funcionarios > 0
              ? `${funcionarios} ${
                  funcionarios === 1 ? "funcionário" : "funcionários"
                }`
              : null}
          </span>
        ) : null}

        {actions ? (
          <span className="referencia-tree__actions">{actions(node)}</span>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        <ul className="referencia-tree__children" role="group">
          {children.map((child) => (
            <ReferenciaTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              actions={actions}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
