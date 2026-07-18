import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Form, InputGroup, Button, Spinner } from "react-bootstrap";
import * as setoresApi from "@shared/api/setores";
import { AppModal, AppModalFooter, EmptyState, AppNotice } from "@shared/ui";

const TYPE_LABELS = {
  root: "Raiz",
  setor: "Setor",
  subsetor: "Subsetor",
};

/** Todos os nós Setor/Subsetor são selecionáveis para listagem. */
function collectSelectableNodes(node) {
  const nodes = [];
  const walk = (n) => {
    if (!n) return;
    if (n.type === "setor" || n.type === "subsetor") {
      nodes.push(n);
    }
    n.children?.forEach(walk);
  };
  walk(node);
  return nodes;
}

function getSelectionState(node, selectedNodes) {
  const selectable = collectSelectableNodes(node);
  if (selectable.length === 0) {
    return { checked: false, indeterminate: false, count: 0, total: 0 };
  }
  const selectedCount = selectable.filter((d) => selectedNodes.has(d.id)).length;
  return {
    checked: selectedCount === selectable.length,
    indeterminate: selectedCount > 0 && selectedCount < selectable.length,
    count: selectedCount,
    total: selectable.length,
  };
}

function TypePill({ type }) {
  return (
    <span className={`sector-picker__type sector-picker__type--${type || "default"}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

const SectorModal = ({
  show,
  onHide,
  onConfirm,
  initialSelected = [],
  embedded = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodes, setSelectedNodes] = useState(new Map());
  const [navigationPath, setNavigationPath] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const searchInputRef = useRef(null);
  const checkboxRefs = useRef(new Map());

  const resetStates = useCallback(() => {
    setSearchQuery("");
    setSelectedNodes(new Map());
    setNavigationPath([]);
    setIsLoading(true);
    setError(null);
    setHierarchyData(null);
  }, []);

  useEffect(() => {
    if (!initialSelected || initialSelected.length === 0) return;

    const newIds = initialSelected.map((node) => node.id).sort();
    const currentIds = Array.from(selectedNodes.keys()).sort();
    const isDifferent =
      newIds.length !== currentIds.length ||
      newIds.some((id, i) => id !== currentIds[i]);

    if (isDifferent) {
      const initialMap = new Map();
      initialSelected.forEach((node) => initialMap.set(node.id, node));
      setSelectedNodes(initialMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when initialSelected identity/content changes
  }, [initialSelected]);

  const transformData = useCallback((data) => {
    const transformNode = (node) => {
      const tipoRaw = String(node.tipo || "Setor").toLowerCase();
      const type =
        tipoRaw === "coordenadoria" || tipoRaw === "divisao"
          ? "subsetor"
          : tipoRaw;
      const transformedNode = {
        id: node._id,
        name: node.nome,
        type,
        employees: node.funcionarios?.length || node.quantidadeFuncionarios || 0,
      };

      const children = [
        ...(node.subsetores || []).map(transformNode),
        ...(node.coordenadorias || []).map((coord) => ({
          id: coord._id,
          name: coord.nome,
          type: "subsetor",
          employees: coord.quantidadeFuncionarios || 0,
        })),
      ];

      if (children.length > 0) {
        transformedNode.children = children;
      }

      return transformedNode;
    };

    return data.setores.map(transformNode);
  }, []);

  useEffect(() => {
    if (!show) return;

    const fetchHierarchy = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await setoresApi.getSetoresOrganizados();
        const transformedData = transformData(data);
        const rootNode = {
          id: "root",
          name: "Todos os setores",
          type: "root",
          children: transformedData,
        };
        setHierarchyData(rootNode);
        setNavigationPath([{ node: rootNode, index: 0 }]);
      } catch (err) {
        console.error("Erro ao carregar hierarquia:", err);
        setError("Falha ao carregar a hierarquia. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchy();
  }, [show, transformData]);

  useEffect(() => {
    if (show && !isLoading && !error) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [show, isLoading, error]);

  const currentNode =
    navigationPath[navigationPath.length - 1]?.node || hierarchyData;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !hierarchyData) return [];

    const query = searchQuery.toLowerCase().trim();
    const results = [];

    const searchInNode = (node, pathNames = []) => {
      const nextPath = [...pathNames, node.name];
      if (node.name.toLowerCase().includes(query)) {
        results.push({ ...node, pathLabel: pathNames.slice(1).join(" › ") });
      }
      node.children?.forEach((child) => searchInNode(child, nextPath));
    };

    hierarchyData.children?.forEach((child) =>
      searchInNode(child, [hierarchyData.name])
    );
    return results;
  }, [searchQuery, hierarchyData]);

  const isSearching = searchQuery.trim().length > 0;
  const displayNodes = useMemo(() => {
    if (isSearching) return searchResults;
    return currentNode?.children || [];
  }, [isSearching, searchResults, currentNode]);

  const allDivisions = useMemo(
    () => (hierarchyData ? collectSelectableNodes(hierarchyData) : []),
    [hierarchyData]
  );

  const allSelected =
    allDivisions.length > 0 &&
    allDivisions.every((div) => selectedNodes.has(div.id));

  const selectedEmployees = useMemo(() => {
    let total = 0;
    selectedNodes.forEach((node) => {
      total += node.employees || 0;
    });
    return total;
  }, [selectedNodes]);

  const setDivisionsSelection = useCallback((divisions, select) => {
    setSelectedNodes((prev) => {
      const next = new Map(prev);
      divisions.forEach((div) => {
        if (select) next.set(div.id, div);
        else next.delete(div.id);
      });
      return next;
    });
  }, []);

  const toggleNodeSelection = useCallback(
    (node, select) => {
      if (node.type === "setor" || node.type === "subsetor") {
        setDivisionsSelection([node], select);
        if (node.children?.length) {
          setDivisionsSelection(collectSelectableNodes(node).filter((n) => n.id !== node.id), select);
        }
        return;
      }
      setDivisionsSelection(collectSelectableNodes(node), select);
    },
    [setDivisionsSelection]
  );

  const toggleSelectAll = useCallback(() => {
    setDivisionsSelection(allDivisions, !allSelected);
  }, [allDivisions, allSelected, setDivisionsSelection]);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Map());
  }, []);

  const navigateToChild = useCallback((child) => {
    setSearchQuery("");
    setNavigationPath((prev) => [...prev, { node: child, index: prev.length }]);
  }, []);

  const navigateToBreadcrumb = useCallback((index) => {
    setSearchQuery("");
    setNavigationPath((prev) => prev.slice(0, index + 1));
  }, []);

  const handleConfirmSelection = useCallback(() => {
    const idsDivisoes = Array.from(selectedNodes.values()).map((n) => n.id);
    onConfirm(idsDivisoes);
    if (embedded) {
      // Parent keeps Funcionários view and shows the list from the confirmed ids.
      return;
    }
    resetStates();
    onHide();
  }, [selectedNodes, onConfirm, resetStates, onHide, embedded]);

  const handleCloseModal = useCallback(() => {
    resetStates();
    onHide();
  }, [resetStates, onHide]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!show) return;
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && selectedNodes.size > 0) {
        e.preventDefault();
        handleConfirmSelection();
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [show, selectedNodes.size, handleConfirmSelection]);

  const setCheckboxRef = useCallback((id, el, indeterminate) => {
    if (el) {
      el.indeterminate = Boolean(indeterminate);
      checkboxRefs.current.set(id, el);
    } else {
      checkboxRefs.current.delete(id);
    }
  }, []);

  const renderRow = (node) => {
    const hasChildren = Boolean(node.children?.length);
    const isLeaf = node.type === "setor" || node.type === "subsetor";
    const state = isLeaf && !hasChildren
      ? {
          checked: selectedNodes.has(node.id),
          indeterminate: false,
          count: selectedNodes.has(node.id) ? 1 : 0,
          total: 1,
        }
      : getSelectionState(node, selectedNodes);

    // Also allow selecting nodes that have children (staff can be on them)
    const directChecked = selectedNodes.has(node.id);
    const effectiveState = isLeaf
      ? {
          ...state,
          checked: directChecked || state.checked,
          indeterminate: !directChecked && state.indeterminate,
        }
      : state;

    return (
      <div
        key={node.id}
        className={`sector-picker__row${effectiveState.checked ? " is-selected" : ""}${
          effectiveState.indeterminate ? " is-partial" : ""
        }`}
      >
        <label className="sector-picker__check">
          <input
            type="checkbox"
            checked={effectiveState.checked}
            ref={(el) => setCheckboxRef(node.id, el, effectiveState.indeterminate)}
            onChange={(e) => toggleNodeSelection(node, e.target.checked)}
            aria-label={`Selecionar ${node.name}`}
          />
        </label>

        <button
          type="button"
          className="sector-picker__main-hit"
          onClick={() => {
            if (hasChildren) navigateToChild(node);
            else toggleNodeSelection(node, !effectiveState.checked);
          }}
        >
          <span className="sector-picker__icon" aria-hidden="true">
            <i
              className={`bi ${
                node.type === "setor"
                  ? "bi-building"
                  : hasChildren
                    ? "bi-folder2"
                    : "bi-folder"
              }`}
            />
          </span>
          <span className="sector-picker__meta">
            <span className="sector-picker__name">{node.name}</span>
            <span className="sector-picker__sub">
              <TypePill type={node.type} />
              {isLeaf && !hasChildren ? (
                <span className="sector-picker__count">
                  <i className="bi bi-people" aria-hidden="true" />
                  {node.employees}{" "}
                  {node.employees === 1 ? "funcionário" : "funcionários"}
                </span>
              ) : (
                <span className="sector-picker__count">
                  {effectiveState.count}/{effectiveState.total} selecionados
                  {typeof node.employees === "number" && node.employees > 0
                    ? ` · ${node.employees} func.`
                    : ""}
                  {hasChildren
                    ? ` · ${node.children.length} ${
                        node.children.length === 1 ? "item" : "itens"
                      }`
                    : ""}
                </span>
              )}
              {node.pathLabel ? (
                <span className="sector-picker__path-hint">{node.pathLabel}</span>
              ) : null}
            </span>
          </span>
        </button>

        {hasChildren ? (
          <button
            type="button"
            className="sector-picker__enter"
            onClick={() => navigateToChild(node)}
            aria-label={`Abrir ${node.name}`}
            title="Abrir"
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        ) : (
          <span className="sector-picker__enter-spacer" />
        )}
      </div>
    );
  };

  if (!show) return null;

  const pickerBody = (
      <div className={`sector-picker${embedded ? " sector-picker--embedded" : ""}`}>
        <div className="sector-picker__browse">
          <div className="sector-picker__toolbar">
            <InputGroup size="sm" className="sector-picker__search">
              <InputGroup.Text>
                <i className="bi bi-search" aria-hidden="true" />
              </InputGroup.Text>
              <Form.Control
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar setor ou subsetor..."
                aria-label="Buscar na hierarquia"
              />
              {searchQuery ? (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpar busca"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </Button>
              ) : null}
            </InputGroup>

            <div className="sector-picker__toolbar-actions">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={toggleSelectAll}
                disabled={!allDivisions.length || isLoading}
              >
                {allSelected ? "Desmarcar todas" : "Marcar todas"}
              </Button>
            </div>
          </div>

          {!isSearching && navigationPath.length > 0 ? (
            <nav className="sector-picker__crumbs" aria-label="Navegação">
              {navigationPath.map((path, index) => {
                const isLast = index === navigationPath.length - 1;
                return (
                  <React.Fragment key={path.node.id}>
                    {index > 0 ? (
                      <span className="sector-picker__crumb-sep" aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    {isLast ? (
                      <span className="sector-picker__crumb is-current">
                        {index === 0 ? "Início" : path.node.name}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="sector-picker__crumb"
                        onClick={() => navigateToBreadcrumb(index)}
                      >
                        {index === 0 ? (
                          <>
                            <i className="bi bi-house-door" aria-hidden="true" />
                            Início
                          </>
                        ) : (
                          path.node.name
                        )}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          ) : null}

          {isSearching ? (
            <div className="sector-picker__search-banner">
              Resultados para <strong>“{searchQuery.trim()}”</strong>
              <span className="text-muted ms-1">
                ({displayNodes.length})
              </span>
            </div>
          ) : null}

          <div className="sector-picker__list" role="list">
            {isLoading ? (
              <div className="sector-picker__state">
                <Spinner animation="border" variant="primary" size="sm" />
                <span>Carregando hierarquia...</span>
              </div>
            ) : error ? (
              <div className="sector-picker__state sector-picker__state--error">
                <AppNotice variant="danger" className="mb-0 w-100">
                  {error}
                </AppNotice>
              </div>
            ) : displayNodes.length === 0 ? (
              <EmptyState
                icon={isSearching ? "bi-search" : "bi-folder2-open"}
                title={
                  isSearching
                    ? "Nenhum resultado"
                    : "Nenhum item neste nível"
                }
                description={
                  isSearching
                    ? "Tente outro termo ou limpe a busca para navegar."
                    : "Volte um nível pelo caminho acima."
                }
              />
            ) : (
              displayNodes.map(renderRow)
            )}
          </div>
        </div>

        <aside className="sector-picker__aside" aria-label="Selecionados">
          <div className="sector-picker__aside-head">
            <div>
              <h3 className="sector-picker__aside-title">Selecionados</h3>
              <p className="sector-picker__aside-sub">
                {selectedNodes.size === 0
                  ? "Nenhum ainda"
                  : `${selectedNodes.size} ${
                      selectedNodes.size === 1 ? "setor" : "setores"
                    } · ~${selectedEmployees} func.`}
              </p>
            </div>
            {selectedNodes.size > 0 ? (
              <Button
                variant="link"
                size="sm"
                className="sector-picker__clear"
                onClick={clearSelection}
              >
                Limpar
              </Button>
            ) : null}
          </div>

          <div className="sector-picker__aside-body">
            {selectedNodes.size === 0 ? (
              <EmptyState
                icon="bi-ui-checks"
                title="Nada selecionado"
                description="Marque setores/subsetores à esquerda ou abra um nó e selecione em lote."
              />
            ) : (
              <ul className="sector-picker__chips">
                {Array.from(selectedNodes.values()).map((node) => (
                  <li key={node.id} className="sector-picker__chip">
                    <span className="sector-picker__chip-body">
                      <span className="sector-picker__chip-name">{node.name}</span>
                      <span className="sector-picker__chip-meta">
                        <i className="bi bi-people" aria-hidden="true" />
                        {node.employees}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="sector-picker__chip-remove"
                      onClick={() => toggleNodeSelection(node, false)}
                      aria-label={`Remover ${node.name}`}
                    >
                      <i className="bi bi-x" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
  );

  if (embedded) {
    return (
      <div className="estrutura-funcionarios-picker">
        <div className="estrutura-funcionarios-picker__head">
          <div>
            <h2 className="estrutura-funcionarios-picker__title">
              Selecionar funcionários
            </h2>
            <p className="text-muted small mb-0">
              Escolha setores ou subsetores para montar a lista
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={selectedNodes.size === 0}
              onClick={handleConfirmSelection}
            >
              Confirmar ({selectedNodes.size})
            </Button>
          </div>
        </div>
        {pickerBody}
      </div>
    );
  }

  return (
    <AppModal
      show={show}
      onHide={handleCloseModal}
      title="Selecionar funcionários"
      subtitle="Escolha setores ou subsetores para montar a lista de funcionários"
      icon="bi-people"
      size="xl"
      bodyClassName="p-0"
      dialogClassName="sector-picker-dialog"
      footer={
        <AppModalFooter
          onCancel={handleCloseModal}
          onConfirm={handleConfirmSelection}
          cancelLabel="Cancelar"
          confirmLabel={
            selectedNodes.size
              ? `Confirmar (${selectedNodes.size})`
              : "Confirmar"
          }
          confirmIcon="bi-check-lg"
          disableConfirm={selectedNodes.size === 0}
          extra={
            <span className="sector-picker__footer-hint d-none d-md-inline">
              Ctrl + Enter para confirmar
            </span>
          }
        />
      }
    >
      {pickerBody}
    </AppModal>
  );
};

export default SectorModal;
