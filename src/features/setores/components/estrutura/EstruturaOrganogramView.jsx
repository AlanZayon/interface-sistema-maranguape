import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  countEmployeesInSubtree,
  getNodeChildren,
  getTipoLabel,
  normalizeNodeTipo,
} from "../../utils/setorNavigation";
import { EmptyState } from "@shared/ui";

function transformApiNodes(setores) {
  const transformNode = (node) => {
    const tipo = normalizeNodeTipo(node.tipo || node.type);
    const id = String(node._id ?? node.id);
    const children = getNodeChildren(node).map(transformNode);
    return {
      id,
      name: node.nome ?? node.name,
      type: tipo,
      employees: countEmployeesInSubtree(node),
      children: children.length ? children : undefined,
      raw: node,
    };
  };
  return (setores || []).map(transformNode);
}

function collectDescendantIds(node, set = new Set()) {
  if (!node?.children) return set;
  for (const child of node.children) {
    set.add(child.id);
    collectDescendantIds(child, set);
  }
  return set;
}

function findTransformed(nodes, id) {
  for (const n of nodes || []) {
    if (n.id === id) return n;
    const found = findTransformed(n.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Interactive organogram canvas: select, expand, drag-to-reparent, zoom/pan.
 * Expansion is controlled by the parent so the side tree stays in sync.
 */
export default function EstruturaOrganogramView({
  nodes = [],
  selectedId = null,
  onSelect,
  onCreateChild,
  onCreateRoot,
  onMove,
  focusBranchId = null,
  expandedIds,
  onExpandedChange,
}) {
  const [localExpanded, setLocalExpanded] = useState(() => new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const [dragId, setDragId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropInvalid, setDropInvalid] = useState(false);
  const viewportRef = useRef(null);
  const selectedRef = useRef(null);
  const didInitExpand = useRef(false);

  const isControlled = expandedIds != null && typeof onExpandedChange === "function";
  const expandedNodes = isControlled ? expandedIds : localExpanded;
  const setExpandedNodes = isControlled ? onExpandedChange : setLocalExpanded;

  const tree = useMemo(() => transformApiNodes(nodes), [nodes]);

  const displayTree = useMemo(() => {
    if (!focusBranchId) return tree;
    const focused = findTransformed(tree, focusBranchId);
    return focused ? [focused] : tree;
  }, [tree, focusBranchId]);

  const root = useMemo(
    () => ({
      id: "root",
      name: "Organograma",
      type: "root",
      children: displayTree,
    }),
    [displayTree]
  );

  useEffect(() => {
    if (!displayTree.length || didInitExpand.current) return;
    if (expandedNodes.size > 0) {
      didInitExpand.current = true;
      return;
    }
    didInitExpand.current = true;
    setExpandedNodes(new Set(displayTree.map((n) => n.id)));
  }, [displayTree, expandedNodes.size, setExpandedNodes]);

  useEffect(() => {
    if (!selectedId || !selectedRef.current) return;
    selectedRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedId, expandedNodes]);

  const invalidDropTargets = useMemo(() => {
    if (!dragId) return new Set();
    const node = findTransformed(tree, dragId);
    const set = new Set([dragId]);
    if (node) collectDescendantIds(node, set);
    return set;
  }, [dragId, tree]);

  const toggleExpanded = useCallback(
    (id) => {
      const next = new Set(expandedNodes);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedNodes(next);
    },
    [expandedNodes, setExpandedNodes]
  );

  const expandAll = useCallback(() => {
    const ids = new Set();
    const walk = (list) => {
      for (const n of list || []) {
        if (n.children?.length) {
          ids.add(n.id);
          walk(n.children);
        }
      }
    };
    walk(displayTree);
    setExpandedNodes(ids);
  }, [displayTree, setExpandedNodes]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, [setExpandedNodes]);

  const fitView = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest(".organogram-node")) return;
      setIsPanning(true);
      setStartPanPoint({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    },
    [panPosition]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning) return;
      setPanPosition({
        x: e.clientX - startPanPoint.x,
        y: e.clientY - startPanPoint.y,
      });
    },
    [isPanning, startPanPoint]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const typeClass = (type) => {
    if (type === "setor") return "org-node-setor";
    if (type === "subsetor") return "org-node-subsetor";
    return "org-node-default";
  };

  const handleDragStart = (e, id) => {
    e.stopPropagation();
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragId || dragId === targetId) {
      setDropTargetId(null);
      setDropInvalid(false);
      return;
    }
    const invalid = invalidDropTargets.has(targetId);
    setDropTargetId(targetId);
    setDropInvalid(invalid);
    e.dataTransfer.dropEffect = invalid ? "none" : "move";
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    setDropTargetId(null);
    setDropInvalid(false);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = dragId || e.dataTransfer.getData("text/plain");
    setDragId(null);
    setDropTargetId(null);
    setDropInvalid(false);
    if (!sourceId || sourceId === targetId) return;
    if (invalidDropTargets.has(targetId)) return;
    onMove?.(sourceId, targetId);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropTargetId(null);
    setDropInvalid(false);
  };

  const renderLevel = (node, depth = 0) => {
    if (!node?.children?.length) return null;

    return (
      <div className={`organogram-level level-${depth}`}>
        {node.children.map((child) => {
          const expanded = expandedNodes.has(child.id);
          const hasKids = Boolean(child.children?.length);
          const isSelected = selectedId === child.id;
          const isDrop =
            dropTargetId === child.id && dragId && dragId !== child.id;
          const nodeClass = [
            "organogram-node",
            typeClass(child.type),
            isSelected ? "organogram-node--selected" : "",
            dragId === child.id ? "organogram-node--dragging" : "",
            isDrop && !dropInvalid ? "organogram-node--drop-ok" : "",
            isDrop && dropInvalid ? "organogram-node--drop-bad" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={child.id} className="organogram-node-container">
              <div
                ref={isSelected ? selectedRef : null}
                className={nodeClass}
                role="button"
                tabIndex={0}
                draggable
                title={child.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(child.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect?.(child.id);
                  }
                }}
                onDragStart={(e) => handleDragStart(e, child.id)}
                onDragOver={(e) => handleDragOver(e, child.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, child.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="organogram-node__accent" aria-hidden="true" />
                <div className="organogram-node__body">
                  <div className="organogram-node__top">
                    <span className={`organogram-node__tipo organogram-node__tipo--${child.type}`}>
                      {getTipoLabel(child.type)}
                    </span>
                    <button
                      type="button"
                      className="organogram-node__add"
                      title="Novo filho"
                      aria-label="Novo filho"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(child.id);
                        onCreateChild?.(child.id);
                      }}
                    >
                      <i className="bi bi-plus-lg" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="organogram-node__title">{child.name}</div>
                  <div className="organogram-node__meta">
                    <span className="organogram-node__meta-item">
                      <i className="bi bi-people" aria-hidden="true" />
                      {child.employees > 0
                        ? `${child.employees} na subárvore`
                        : "Sem lotados"}
                    </span>
                  </div>
                </div>
                {hasKids && (
                  <button
                    type="button"
                    className={`organogram-node__toggle${expanded ? " is-expanded" : ""}`}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Recolher" : "Expandir"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(child.id);
                    }}
                  >
                    <i
                      className={`bi ${expanded ? "bi-chevron-up" : "bi-chevron-down"}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
              {hasKids && expanded && (
                <>
                  <div className="node-connector-vertical" aria-hidden="true" />
                  {renderLevel(child, depth + 1)}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="estrutura-organogram organograma-canvas">
      <div className="estrutura-organogram__toolbar">
        <div className="organograma-canvas__tools">
          <div className="organograma-canvas__tool-group" role="group" aria-label="Zoom">
            <button
              type="button"
              className="organograma-canvas__tool-btn"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.5))}
              title="Diminuir zoom"
            >
              <i className="bi bi-zoom-out" aria-hidden="true" />
            </button>
            <span className="organograma-canvas__zoom-label">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              className="organograma-canvas__tool-btn"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 2))}
              title="Aumentar zoom"
            >
              <i className="bi bi-zoom-in" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="organograma-canvas__tool-btn"
              onClick={fitView}
              title="Encaixar na tela"
            >
              <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
            </button>
          </div>
          <div className="organograma-canvas__tool-group" role="group" aria-label="Expandir">
            <button
              type="button"
              className="organograma-canvas__tool-btn organograma-canvas__tool-btn--text"
              onClick={expandAll}
              title="Expandir tudo"
            >
              Expandir
            </button>
            <button
              type="button"
              className="organograma-canvas__tool-btn organograma-canvas__tool-btn--text"
              onClick={collapseAll}
              title="Recolher tudo"
            >
              Recolher
            </button>
          </div>
        </div>
        <p className="organograma-canvas__hint d-none d-md-block">
          Clique para selecionar · arraste o nó para mover · arraste o fundo para navegar
        </p>
      </div>

      <div
        ref={viewportRef}
        className="estrutura-organogram__viewport organogram-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        <div
          className="organogram-container"
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
            transformOrigin: "0 0",
          }}
        >
          {displayTree.length === 0 ? (
            <div className="organograma-canvas__empty">
              <EmptyState
                icon="bi-diagram-3"
                title="Nenhum setor ainda"
                description="Crie o primeiro setor para montar o organograma."
              />
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                onClick={() => onCreateRoot?.()}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Criar primeiro setor
              </button>
            </div>
          ) : (
            renderLevel(root)
          )}
        </div>
      </div>
    </div>
  );
}
