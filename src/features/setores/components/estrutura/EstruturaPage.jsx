import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSetoresOrganizados } from "../../hooks/useSetores";
import {
  buildEstruturaUrl,
  findAncestryInTree,
  findNodeInTree,
  getExpandedIdsForSelection,
} from "../../utils/setorNavigation";
import { FuncionariosList } from "@features/funcionarios";
import { SectorModal } from "@features/organograma";
import { PanelResizeHandle, useResizableWidth } from "@shared/ui";
import EstruturaTree from "./EstruturaTree";
import EstruturaNodePanel from "./EstruturaNodePanel";
import OrganogramaWorkspace from "./OrganogramaWorkspace";

const VIEW_KEY = "estrutura.viewMode";
const TREE_WIDTH_KEY = "estrutura.painel.treeWidth";
const FUNCIONARIOS_IDS_KEY = "estrutura.funcionariosIds";
const VIEWS = ["lista", "organograma", "funcionarios"];

function readStoredFuncionariosIds() {
  try {
    const raw = sessionStorage.getItem(FUNCIONARIOS_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function persistFuncionariosIds(ids) {
  try {
    if (Array.isArray(ids) && ids.length > 0) {
      sessionStorage.setItem(FUNCIONARIOS_IDS_KEY, JSON.stringify(ids));
    } else {
      sessionStorage.removeItem(FUNCIONARIOS_IDS_KEY);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Unified workspace with three toolbar views:
 * Painel | Organograma (autonomous) | Funcionários
 */
export default function EstruturaPage() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isError, error } = useSetoresOrganizados();
  const nodes = data?.setores || [];

  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    const fromUrl = searchParams.get("view");
    if (fromUrl === "organograma" || fromUrl === "funcionarios") return fromUrl;
    if (fromUrl === "lista" || fromUrl === "painel") return "lista";
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      if (VIEWS.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    return "lista";
  });
  const [selectedSetorIds, setSelectedSetorIds] = useState(() => new Set());
  /** IDs confirmados no Painel via "Ver selecionados" (lista no painel direito). */
  const [painelSelecionadosIds, setPainelSelecionadosIds] = useState([]);
  /** IDs opcionais da aba Funcionários (filtro por setor). Persistidos para sobreviver à navegação (ex.: preview de relatório). */
  const [funcionariosIds, setFuncionariosIds] = useState(readStoredFuncionariosIds);
  const [showFuncionariosPicker, setShowFuncionariosPicker] = useState(false);

  const {
    width: treeWidth,
    onResizeStart: onTreeResizeStart,
    adjustWidth: adjustTreeWidth,
  } = useResizableWidth({
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 520,
    storageKey: TREE_WIDTH_KEY,
    edge: "right",
  });

  const selectedId = nodeId || null;
  const selectedNode = useMemo(
    () => (selectedId ? findNodeInTree(nodes, selectedId) : null),
    [nodes, selectedId]
  );

  const showTree = viewMode === "lista";
  const isOrganograma = viewMode === "organograma";

  useEffect(() => {
    persistFuncionariosIds(funcionariosIds);
  }, [funcionariosIds]);

  useEffect(() => {
    if (!selectedId || !nodes.length || !showTree) return;
    const ancestry = findAncestryInTree(nodes, selectedId);
    if (!ancestry) return;
    const ids = getExpandedIdsForSelection(ancestry);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedId, nodes, showTree]);

  const handleSelect = useCallback(
    (id) => {
      setPainelSelecionadosIds([]);
      navigate(buildEstruturaUrl(id, viewMode === "lista" ? null : viewMode));
      setTreeOpen(false);
    },
    [navigate, viewMode]
  );

  const handleDeleted = useCallback(() => {
    setPainelSelecionadosIds([]);
    navigate("/estrutura");
  }, [navigate]);

  const handleOrganogramaDeleted = useCallback(() => {
    navigate(buildEstruturaUrl(null, "organograma"));
  }, [navigate]);

  const handleOrganogramaSelect = useCallback(
    (id) => {
      navigate(buildEstruturaUrl(id, "organograma"));
    },
    [navigate]
  );

  useEffect(() => {
    const fromUrl = searchParams.get("view");
    if (fromUrl === "organograma" || fromUrl === "funcionarios") {
      setViewMode(fromUrl);
    } else if (!fromUrl || fromUrl === "lista" || fromUrl === "painel") {
      setViewMode("lista");
    }
  }, [searchParams]);

  useEffect(() => {
    if (viewMode !== "lista") setTreeOpen(false);
  }, [viewMode]);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
    const next = new URLSearchParams(searchParams);
    if (mode === "lista") next.delete("view");
    else next.set("view", mode);
    setSearchParams(next, { replace: true });
    if (mode === "funcionarios" && viewMode !== "funcionarios") {
      setFuncionariosIds([]);
      setShowFuncionariosPicker(false);
    }
    if (mode !== "funcionarios") {
      setFuncionariosIds([]);
      setShowFuncionariosPicker(false);
    }
    if (mode !== "lista") setPainelSelecionadosIds([]);
  };

  const handleToggleSetor = (id) => {
    setSelectedSetorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmMultiSelect = () => {
    const ids = [...selectedSetorIds];
    if (!ids.length) return;
    setPainelSelecionadosIds(ids);
    setTreeOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && showTree) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        document.querySelector(".estrutura-tree__search input")?.focus();
      }
      if (e.key === "Escape") setTreeOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showTree]);

  return (
    <div
      className={`estrutura-workspace${
        isOrganograma ? " estrutura-workspace--organograma" : ""
      }`}
    >
      <div className="estrutura-workspace__toolbar">
        {showTree && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-md-none"
            onClick={() => setTreeOpen(true)}
            aria-label="Abrir árvore"
          >
            <i className="bi bi-list-nested me-1" aria-hidden="true" />
            Organização
          </button>
        )}

        <div className="btn-group btn-group-sm" role="group" aria-label="Vista">
          <button
            type="button"
            className={`btn btn-outline-secondary${viewMode === "lista" ? " active" : ""}`}
            onClick={() => changeViewMode("lista")}
          >
            <i className="bi bi-layout-sidebar me-1" aria-hidden="true" />
            Painel
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary${viewMode === "organograma" ? " active" : ""}`}
            onClick={() => changeViewMode("organograma")}
          >
            <i className="bi bi-diagram-3 me-1" aria-hidden="true" />
            Organograma
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary${viewMode === "funcionarios" ? " active" : ""}`}
            onClick={() => changeViewMode("funcionarios")}
          >
            <i className="bi bi-people me-1" aria-hidden="true" />
            Funcionários
          </button>
        </div>

        {viewMode === "lista" &&
          (selectedId || painelSelecionadosIds.length > 0) && (
            <button
              type="button"
              className="btn btn-sm btn-link text-muted ms-auto"
              onClick={() => {
                setPainelSelecionadosIds([]);
                navigate("/estrutura");
              }}
            >
              Visão geral
            </button>
          )}
      </div>

      {isError && (
        <div className="alert alert-danger" role="alert">
          {error?.message || "Falha ao carregar a organização."}
        </div>
      )}

      {isOrganograma ? (
        <OrganogramaWorkspace
          nodes={nodes}
          selectedId={selectedId}
          selectedNode={selectedNode}
          onSelect={handleOrganogramaSelect}
          onDeleted={handleOrganogramaDeleted}
          loading={isLoading}
        />
      ) : (
        <div
          className={`estrutura-workspace__body${
            !showTree ? " estrutura-workspace__body--full" : ""
          }`}
        >
          {showTree && treeOpen && (
            <div
              className="estrutura-workspace__tree-overlay"
              onClick={() => setTreeOpen(false)}
              aria-hidden="true"
            />
          )}

          {showTree && (
            <aside
              className={`estrutura-workspace__tree${
                treeOpen ? " estrutura-workspace__tree--open" : ""
              }`}
              style={{ width: treeWidth }}
              aria-label="Árvore da organização"
            >
              <div className="estrutura-workspace__tree-header d-md-none">
                <strong>Organização</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-link"
                  onClick={() => setTreeOpen(false)}
                  aria-label="Fechar"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>
              <EstruturaTree
                nodes={nodes}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onExpandedChange={setExpandedIds}
                onSelect={handleSelect}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                multiSelect
                selectedSetorIds={selectedSetorIds}
                onToggleSetor={handleToggleSetor}
                onConfirmMultiSelect={handleConfirmMultiSelect}
                loading={isLoading}
              />
              <PanelResizeHandle
                edge="right"
                className="d-none d-md-block"
                onResizeStart={onTreeResizeStart}
                onAdjust={adjustTreeWidth}
                label="Redimensionar árvore"
              />
            </aside>
          )}

          <section className="estrutura-workspace__panel" aria-label="Conteúdo">
            {viewMode === "funcionarios" ? (
              <div className="estrutura-funcionarios-view">
                <div className="estrutura-funcionarios-view__bar">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowFuncionariosPicker(true)}
                  >
                    <i className="bi bi-diagram-3 me-1" aria-hidden="true" />
                    Selecionar funcionários
                  </button>
                  {funcionariosIds.length > 0 ? (
                    <>
                      <span className="text-muted small">
                        {funcionariosIds.length} setor(es)/subsetor(es) selecionado(s)
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-muted px-1"
                        onClick={() => {
                          setFuncionariosIds([]);
                          setSelectedSetorIds(new Set());
                        }}
                      >
                        Ver todos
                      </button>
                    </>
                  ) : (
                    <span className="text-muted small">
                      Todos os funcionários · selecione setores para refinar a busca
                    </span>
                  )}
                </div>
                {funcionariosIds.length > 0 ? (
                  <FuncionariosList
                    setorPathId="selected"
                    departmentName="SELECIONADOS"
                    idsDivisoes={funcionariosIds}
                  />
                ) : (
                  <FuncionariosList
                    setorPathId="mainscreen"
                    departmentName="mainscreen"
                  />
                )}
                <SectorModal
                  show={showFuncionariosPicker}
                  onHide={() => setShowFuncionariosPicker(false)}
                  onConfirm={(ids) => {
                    if (!ids?.length) return;
                    setFuncionariosIds(ids);
                    setSelectedSetorIds(new Set(ids));
                    setShowFuncionariosPicker(false);
                  }}
                />
              </div>
            ) : (
              <EstruturaNodePanel
                nodes={nodes}
                selectedNode={selectedNode}
                selectedId={selectedId}
                viewMode={viewMode}
                multiSelectIds={painelSelecionadosIds}
                onClearMultiSelect={() => setPainelSelecionadosIds([])}
                onSelect={handleSelect}
                onDeleted={handleDeleted}
                loading={isLoading}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
