import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as setoresApi from "@shared/api/setores";
import { setoresKeys } from "../../hooks/useSetores";
import {
  findAncestryInTree,
  getExpandedIdsForSelection,
} from "../../utils/setorNavigation";
import {
  AppModal,
  AppModalFooter,
  LoadingState,
  PanelResizeHandle,
  useResizableWidth,
} from "@shared/ui";
import EstruturaTree from "./EstruturaTree";
import EstruturaOrganogramView from "./EstruturaOrganogramView";
import OrganogramaInspector from "./OrganogramaInspector";

const TREE_WIDTH_KEY = "estrutura.organograma.treeWidth";
const INSPECTOR_WIDTH_KEY = "estrutura.organograma.inspectorWidth";
const TREE_VISIBLE_KEY = "estrutura.organograma.treeVisible";
const INSPECTOR_VISIBLE_KEY = "estrutura.organograma.inspectorVisible";

function readBool(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === "0" || raw === "false") return false;
    if (raw === "1" || raw === "true") return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Autonomous Organograma workspace: tree + canvas + inspector.
 * Side panels are collapsible on desktop for more canvas space.
 */
export default function OrganogramaWorkspace({
  nodes = [],
  selectedId = null,
  selectedNode = null,
  onSelect,
  onDeleted,
  loading = false,
}) {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  /** Mobile drawers */
  const [treeDrawerOpen, setTreeDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  /** Desktop panel visibility */
  const [treeVisible, setTreeVisible] = useState(() =>
    readBool(TREE_VISIBLE_KEY, true)
  );
  const [inspectorVisible, setInspectorVisible] = useState(() =>
    readBool(INSPECTOR_VISIBLE_KEY, true)
  );
  const [focusCreate, setFocusCreate] = useState(false);
  const [focusRename, setFocusRename] = useState(false);
  const [focusDelete, setFocusDelete] = useState(false);
  const [focusBranchId, setFocusBranchId] = useState(null);
  const [showCreateRoot, setShowCreateRoot] = useState(false);
  const [createRootName, setCreateRootName] = useState("");

  const {
    width: treeWidth,
    onResizeStart: onTreeResizeStart,
    adjustWidth: adjustTreeWidth,
  } = useResizableWidth({
    defaultWidth: 260,
    minWidth: 180,
    maxWidth: 480,
    storageKey: TREE_WIDTH_KEY,
    edge: "right",
  });

  const {
    width: inspectorWidth,
    onResizeStart: onInspectorResizeStart,
    adjustWidth: adjustInspectorWidth,
  } = useResizableWidth({
    defaultWidth: 300,
    minWidth: 220,
    maxWidth: 480,
    storageKey: INSPECTOR_WIDTH_KEY,
    edge: "left",
  });

  const hideTree = useCallback(() => {
    setTreeVisible(false);
    writeBool(TREE_VISIBLE_KEY, false);
  }, []);

  const showTree = useCallback(() => {
    setTreeVisible(true);
    writeBool(TREE_VISIBLE_KEY, true);
  }, []);

  const hideInspector = useCallback(() => {
    setInspectorVisible(false);
    writeBool(INSPECTOR_VISIBLE_KEY, false);
  }, []);

  const showInspector = useCallback(() => {
    setInspectorVisible(true);
    writeBool(INSPECTOR_VISIBLE_KEY, true);
  }, []);

  const openInspector = useCallback(() => {
    showInspector();
    setInspectorDrawerOpen(true);
  }, [showInspector]);

  useEffect(() => {
    if (!selectedId || !nodes.length) return;
    const ancestry = findAncestryInTree(nodes, selectedId);
    if (!ancestry) return;
    const ids = getExpandedIdsForSelection(ancestry);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedId, nodes]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: setoresKeys.all });

  const createRootMutation = useMutation({
    mutationFn: (data) => setoresApi.createSetor(data),
    onSuccess: (data) => {
      invalidate();
      setShowCreateRoot(false);
      setCreateRootName("");
      toast.success("Setor criado");
      const newId = data?._id ?? data?.id;
      if (newId) onSelect?.(String(newId));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao criar setor");
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, parent }) => setoresApi.moveSetor(id, parent),
    onSuccess: () => {
      invalidate();
      toast.success("Nó movido");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao mover");
    },
  });

  const handleSelect = useCallback(
    (id) => {
      onSelect?.(id);
      setTreeDrawerOpen(false);
    },
    [onSelect]
  );

  const handleCanvasSelect = useCallback(
    (id) => {
      onSelect?.(id);
      setTreeDrawerOpen(false);
      openInspector();
    },
    [onSelect, openInspector]
  );

  const handleCreateRoot = () => {
    if (!createRootName.trim()) {
      toast.warn("Informe um nome");
      return;
    }
    createRootMutation.mutate({
      nome: createRootName.trim(),
      tipo: "Setor",
      parent: null,
    });
  };

  const handleMove = useCallback(
    (id, parentId) => {
      moveMutation.mutate({ id, parent: parentId });
    },
    [moveMutation]
  );

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showTree();
        setTreeDrawerOpen(true);
        requestAnimationFrame(() => {
          document
            .querySelector(".organograma-workspace .estrutura-tree__search input")
            ?.focus();
        });
        return;
      }

      if (e.key === "Escape") {
        setTreeDrawerOpen(false);
        setInspectorDrawerOpen(false);
        return;
      }

      if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (treeVisible) hideTree();
        else showTree();
        return;
      }

      if (e.key === "]" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (inspectorVisible) hideInspector();
        else showInspector();
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setFocusCreate(true);
        openInspector();
        return;
      }

      if (e.key === "F2" && selectedId) {
        e.preventDefault();
        setFocusRename(true);
        openInspector();
        return;
      }

      if (e.key === "Delete" && selectedId) {
        e.preventDefault();
        setFocusDelete(true);
        openInspector();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedId,
    treeVisible,
    inspectorVisible,
    hideTree,
    showTree,
    hideInspector,
    showInspector,
    openInspector,
  ]);

  if (loading) {
    return <LoadingState label="Carregando organograma…" />;
  }

  return (
    <div className="organograma-workspace">
      <div className="organograma-workspace__mobile-bar d-lg-none">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setTreeDrawerOpen(true)}
        >
          <i className="bi bi-list-nested me-1" aria-hidden="true" />
          Árvore
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setInspectorDrawerOpen(true)}
        >
          <i className="bi bi-sliders me-1" aria-hidden="true" />
          Inspetor
        </button>
        {selectedId && (
          <button
            type="button"
            className={`btn btn-sm ${focusBranchId === selectedId ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() =>
              setFocusBranchId((prev) =>
                prev === selectedId ? null : selectedId
              )
            }
            title="Focar neste ramo"
          >
            <i className="bi bi-eye me-1" aria-hidden="true" />
            Focar
          </button>
        )}
      </div>

      <div className="organograma-workspace__body">
        {treeDrawerOpen && (
          <div
            className="organograma-workspace__overlay d-lg-none"
            onClick={() => setTreeDrawerOpen(false)}
            aria-hidden="true"
          />
        )}
        {inspectorDrawerOpen && (
          <div
            className="organograma-workspace__overlay organograma-workspace__overlay--inspector d-lg-none"
            onClick={() => setInspectorDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {!treeVisible && (
          <button
            type="button"
            className="organograma-workspace__edge-btn organograma-workspace__edge-btn--left d-none d-lg-flex"
            onClick={showTree}
            title="Mostrar árvore ([)"
            aria-label="Mostrar árvore"
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
            <span className="organograma-workspace__edge-label">Árvore</span>
          </button>
        )}

        <aside
          className={`organograma-workspace__tree${
            treeDrawerOpen ? " organograma-workspace__tree--open" : ""
          }${treeVisible ? "" : " organograma-workspace__tree--hidden"}`}
          style={
            treeVisible
              ? { width: treeWidth }
              : { width: 0, minWidth: 0, maxWidth: 0, flex: "0 0 0" }
          }
          aria-label="Árvore do organograma"
          aria-hidden={!treeVisible}
          data-collapsed={treeVisible ? "false" : "true"}
        >
          <div className="organograma-workspace__drawer-header d-lg-none">
            <strong>Árvore</strong>
            <button
              type="button"
              className="btn btn-sm btn-link"
              onClick={() => setTreeDrawerOpen(false)}
              aria-label="Fechar"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="organograma-workspace__panel-chrome d-none d-lg-flex">
            <span className="organograma-workspace__panel-title">Árvore</span>
            <div className="organograma-workspace__panel-actions">
              {selectedId && (
                <button
                  type="button"
                  className={`btn btn-sm ${focusBranchId === selectedId ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() =>
                    setFocusBranchId((prev) =>
                      prev === selectedId ? null : selectedId
                    )
                  }
                  title="Focar neste ramo no canvas"
                >
                  <i className="bi bi-eye" aria-hidden="true" />
                </button>
              )}
              {focusBranchId && (
                <button
                  type="button"
                  className="btn btn-sm btn-link"
                  onClick={() => setFocusBranchId(null)}
                  title="Limpar foco"
                >
                  Limpar
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-link text-muted"
                onClick={hideTree}
                title="Esconder árvore ([)"
                aria-label="Esconder árvore"
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
            </div>
          </div>
          <EstruturaTree
            nodes={nodes}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            onSelect={handleSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            multiSelect={false}
            loading={false}
          />
          {treeVisible && (
            <PanelResizeHandle
              edge="right"
              className="d-none d-lg-block"
              onResizeStart={onTreeResizeStart}
              onAdjust={adjustTreeWidth}
              label="Redimensionar árvore"
            />
          )}
        </aside>

        <section
          className="organograma-workspace__canvas"
          aria-label="Canvas do organograma"
        >
          <EstruturaOrganogramView
            nodes={nodes}
            selectedId={selectedId}
            onSelect={handleCanvasSelect}
            onCreateChild={() => {
              setFocusCreate(true);
              openInspector();
            }}
            onCreateRoot={() => {
              setShowCreateRoot(true);
              setCreateRootName("");
            }}
            onMove={handleMove}
            focusBranchId={focusBranchId}
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
          />
        </section>

        <aside
          className={`organograma-workspace__inspector${
            inspectorDrawerOpen
              ? " organograma-workspace__inspector--open"
              : ""
          }${inspectorVisible ? "" : " organograma-workspace__inspector--hidden"}`}
          style={
            inspectorVisible
              ? { width: inspectorWidth }
              : { width: 0, minWidth: 0, maxWidth: 0, flex: "0 0 0" }
          }
          aria-label="Inspetor do nó"
          aria-hidden={!inspectorVisible}
          data-collapsed={inspectorVisible ? "false" : "true"}
        >
          {inspectorVisible && (
            <PanelResizeHandle
              edge="left"
              className="d-none d-lg-block"
              onResizeStart={onInspectorResizeStart}
              onAdjust={adjustInspectorWidth}
              label="Redimensionar inspetor"
            />
          )}
          <div className="organograma-workspace__drawer-header d-lg-none">
            <strong>Inspetor</strong>
            <button
              type="button"
              className="btn btn-sm btn-link"
              onClick={() => setInspectorDrawerOpen(false)}
              aria-label="Fechar"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="organograma-workspace__panel-chrome d-none d-lg-flex">
            <button
              type="button"
              className="btn btn-sm btn-link text-muted"
              onClick={hideInspector}
              title="Esconder inspetor (])"
              aria-label="Esconder inspetor"
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
            <span className="organograma-workspace__panel-title ms-auto">
              Inspetor
            </span>
          </div>
          <OrganogramaInspector
            nodes={nodes}
            selectedNode={selectedNode}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDeleted={onDeleted}
            onRequestCreateRoot={() => {
              setShowCreateRoot(true);
              setCreateRootName("");
            }}
            focusCreate={focusCreate}
            onFocusCreateHandled={() => setFocusCreate(false)}
            focusRename={focusRename}
            onFocusRenameHandled={() => setFocusRename(false)}
            focusDelete={focusDelete}
            onFocusDeleteHandled={() => setFocusDelete(false)}
          />
        </aside>

        {!inspectorVisible && (
          <button
            type="button"
            className="organograma-workspace__edge-btn organograma-workspace__edge-btn--right d-none d-lg-flex"
            onClick={showInspector}
            title="Mostrar inspetor (])"
            aria-label="Mostrar inspetor"
          >
            <span className="organograma-workspace__edge-label">Inspetor</span>
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
        )}
      </div>

      <AppModal
        show={showCreateRoot}
        onHide={() => setShowCreateRoot(false)}
        title="Novo setor raiz"
        icon="bi-building"
        footer={
          <AppModalFooter
            onCancel={() => setShowCreateRoot(false)}
            onConfirm={handleCreateRoot}
            confirmLabel="Criar"
            disableConfirm={
              !createRootName.trim() || createRootMutation.isPending
            }
          />
        }
      >
        <label className="form-label" htmlFor="org-create-root">
          Nome
        </label>
        <input
          id="org-create-root"
          className="form-control"
          value={createRootName}
          onChange={(e) => setCreateRootName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreateRoot()}
        />
      </AppModal>
    </div>
  );
}
