import React, { useMemo, useState, useEffect } from "react";
import {
  countEmployeesInSubtree,
  filterTreeByQuery,
  getNodeChildren,
  getTipoLabel,
  normalizeNodeTipo,
} from "../../utils/setorNavigation";

function TreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  multiSelect,
  selectedSetorIds,
  onToggleSetor,
}) {
  const id = String(node._id ?? node.id);
  const children = getNodeChildren(node);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(id);
  const isSelected = selectedId === id;
  const tipo = normalizeNodeTipo(node.tipo || node.type);
  const count = countEmployeesInSubtree(node);
  const checked = selectedSetorIds?.has(id);

  const icon =
    tipo === "setor"
      ? "bi-building"
      : "bi-folder2";

  return (
    <li className="estrutura-tree__item">
      <div
        className={`estrutura-tree__row${isSelected ? " estrutura-tree__row--selected" : ""}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="estrutura-tree__toggle"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Recolher" : "Expandir"}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(id);
            }}
          >
            <i
              className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="estrutura-tree__toggle estrutura-tree__toggle--spacer" />
        )}

        {multiSelect && (
          <input
            type="checkbox"
            className="estrutura-tree__check form-check-input"
            checked={Boolean(checked)}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSetor?.(id);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Selecionar ${node.nome ?? node.name}`}
          />
        )}

        <button
          type="button"
          className="estrutura-tree__label"
          onClick={() => onSelect(id)}
          title={node.nome ?? node.name}
        >
          <i className={`bi ${icon} estrutura-tree__icon`} aria-hidden="true" />
          <span className="estrutura-tree__name text-truncate">
            {node.nome ?? node.name}
          </span>
          <span className="estrutura-tree__meta">
            <span className="estrutura-tree__tipo">{getTipoLabel(tipo)}</span>
            {count > 0 && (
              <span className="estrutura-tree__count" title="Funcionários">
                {count}
              </span>
            )}
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="estrutura-tree__list" role="group">
          {children.map((child) => (
            <TreeNode
              key={String(child._id ?? child.id)}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              multiSelect={multiSelect}
              selectedSetorIds={selectedSetorIds}
              onToggleSetor={onToggleSetor}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * @param {{
 *   nodes: any[],
 *   selectedId?: string | null,
 *   expandedIds: Set<string>,
 *   onExpandedChange: (next: Set<string>) => void,
 *   onSelect: (id: string) => void,
 *   searchQuery?: string,
 *   onSearchChange?: (q: string) => void,
 *   multiSelect?: boolean,
 *   selectedDivisaoIds?: Set<string>,
 *   onToggleDivisao?: (id: string) => void,
 *   onConfirmMultiSelect?: () => void,
 *   loading?: boolean,
 * }} props
 */
export default function EstruturaTree({
  nodes = [],
  selectedId = null,
  expandedIds,
  onExpandedChange,
  onSelect,
  searchQuery = "",
  onSearchChange,
  multiSelect = true,
  selectedSetorIds,
  onToggleSetor,
  onConfirmMultiSelect,
  loading = false,
}) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const filtered = useMemo(
    () => filterTreeByQuery(nodes, localQuery),
    [nodes, localQuery]
  );

  useEffect(() => {
    if (!localQuery.trim()) return;
    const ids = new Set(expandedIds);
    const walk = (list) => {
      for (const n of list || []) {
        const id = String(n._id ?? n.id);
        const kids = getNodeChildren(n);
        if (kids.length) {
          ids.add(id);
          walk(kids);
        }
      }
    };
    walk(filtered);
    onExpandedChange(ids);
    // Only expand when query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQuery]);

  const handleToggle = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onExpandedChange(next);
  };

  const selectedCount = selectedSetorIds?.size || 0;

  return (
    <div className="estrutura-tree">
      <div className="estrutura-tree__toolbar">
        <div className="estrutura-tree__search input-group input-group-sm">
          <span className="input-group-text">
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder="Buscar na estrutura…"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            aria-label="Buscar na estrutura"
          />
        </div>
        {multiSelect && (
          <button
            type="button"
            className="btn btn-sm btn-primary estrutura-tree__multi-btn"
            disabled={selectedCount === 0}
            onClick={onConfirmMultiSelect}
          >
            Ver selecionados ({selectedCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="estrutura-tree__empty text-muted">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="estrutura-tree__empty text-muted">
          {localQuery ? "Nenhum resultado" : "Nenhum setor cadastrado"}
        </div>
      ) : (
        <ul className="estrutura-tree__list" role="tree">
          {filtered.map((node) => (
            <TreeNode
              key={String(node._id ?? node.id)}
              node={node}
              depth={0}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onSelect={onSelect}
              multiSelect={multiSelect}
              selectedSetorIds={selectedSetorIds}
              onToggleSetor={onToggleSetor}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
