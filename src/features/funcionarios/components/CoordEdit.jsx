import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Modal } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@features/auth";
import * as setoresApi from "@shared/api/setores";
import * as funcionariosApi from "@shared/api/funcionarios";
import { getNodeChildren, normalizeNodeTipo } from "@features/setores/utils/setorNavigation";
import { funcionariosKeys } from "../hooks/useFuncionarios";
import { toast } from "react-toastify";
import "../styles/lotacao-mover.css";

function initials(nome = "") {
  const parts = String(nome).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function collectLeaves(setores = []) {
  const leaves = [];

  const walk = (nodes, path) => {
    for (const node of nodes || []) {
      const tipo = normalizeNodeTipo(node.tipo);
      const nextPath = [...path, { type: tipo, id: node._id, nome: node.nome }];
      leaves.push({
        id: node._id,
        nome: node.nome,
        path: nextPath,
      });
      walk(getNodeChildren(node), nextPath);
    }
  };

  walk(setores, []);
  return leaves;
}

function formatPath(path = [], { highlightLast = false } = {}) {
  if (!path.length) return null;
  const names = path.map((p) => p.nome);
  if (!highlightLast) return names.join(" › ");
  const head = names.slice(0, -1).join(" › ");
  const last = names[names.length - 1];
  return (
    <>
      {head ? `${head} › ` : null}
      <mark>{last}</mark>
    </>
  );
}

function getChildrenAtStack(setores, stack) {
  if (!stack.length) {
    return (setores || []).map((setor) => ({
      kind: "node",
      type: "setor",
      id: setor._id,
      nome: setor.nome,
      item: setor,
      childCount: getNodeChildren(setor).length,
    }));
  }

  const current = stack[stack.length - 1];
  return getNodeChildren(current.item).map((child) => {
    const tipo = normalizeNodeTipo(child.tipo) || "subsetor";
    return {
      kind: "node",
      type: tipo,
      id: child._id,
      nome: child.nome,
      item: child,
      childCount: getNodeChildren(child).length,
    };
  });
}

function LotacaoMover({
  show,
  onHide,
  usuariosIds = [],
  pessoas = [],
  setShowSelectionControlsEdit,
  setActivateModified,
}) {
  const { addFuncionarios, addFuncionariosPath } = useAuth();
  const queryClient = useQueryClient();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState([]);
  const [destino, setDestino] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["setores"],
    queryFn: () => setoresApi.getSetoresOrganizados(),
    enabled: show,
  });

  const setores = data?.setores || [];

  useEffect(() => {
    if (!show) return;
    setQuery("");
    setStack([]);
    setDestino(null);
    setIsSaving(false);
    const t = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [show]);

  const leaves = useMemo(() => collectLeaves(setores), [setores]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return leaves
      .filter(
        (leaf) =>
          leaf.nome.toLowerCase().includes(q) ||
          leaf.path.some((p) => p.nome.toLowerCase().includes(q))
      )
      .slice(0, 80);
  }, [leaves, query]);

  const browseRows = useMemo(
    () => getChildrenAtStack(setores, stack),
    [setores, stack]
  );

  const isSearching = query.trim().length > 0;

  const openFolder = useCallback((row) => {
    setStack((prev) => [
      ...prev,
      { type: row.type, id: row.id, nome: row.nome, item: row.item },
    ]);
    setQuery("");
  }, []);

  const selectLeaf = useCallback((leaf) => {
    setDestino({
      id: String(leaf.id),
      nome: leaf.nome,
      path: leaf.path,
    });
  }, []);

  const selectLeafFromBrowse = useCallback(
    (row) => {
      const path = [
        ...stack.map((s) => ({ type: s.type, id: s.id, nome: s.nome })),
        { type: row.type, id: row.id, nome: row.nome },
      ];
      setDestino({ id: String(row.id), nome: row.nome, path });
    },
    [stack]
  );

  const jumpToCrumb = (index) => {
    if (index < 0) {
      setStack([]);
      return;
    }
    setStack((prev) => prev.slice(0, index + 1));
  };

  const selectCurrentLevel = useCallback(() => {
    if (!stack.length) return;
    const current = stack[stack.length - 1];
    setDestino({
      id: String(current.id),
      nome: current.nome,
      path: stack.map((s) => ({ type: s.type, id: s.id, nome: s.nome })),
    });
  }, [stack]);

  const handleClose = () => {
    if (isSaving) return;
    onHide?.();
  };

  const handleSubmit = useCallback(async () => {
    if (!destino?.id) {
      toast.warn("Selecione o setor ou subsetor de destino");
      return;
    }
    if (!usuariosIds?.length) {
      toast.warn("Nenhum funcionário selecionado");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await funcionariosApi.updateLotacao(
        usuariosIds,
        destino.id
      );
      try {
        addFuncionarios(updated);
        addFuncionariosPath(updated);
        setShowSelectionControlsEdit?.(false);
        setActivateModified?.(true);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: funcionariosKeys.all }),
          queryClient.invalidateQueries({ queryKey: ["setores"] }),
        ]);
      } catch (stateErr) {
        console.error("Transferência OK, falha ao atualizar UI:", stateErr);
      }
      toast.success(
        `${usuariosIds.length} funcionário(s) transferido(s) com sucesso`
      );
      onHide?.({ transferred: true });
    } catch (error) {
      console.error("Erro ao transferir lotação:", error);
      const data = error?.response?.data;
      const apiMessage =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error === "string" && data.error) ||
        null;
      toast.error(
        apiMessage
          ? `Não foi possível transferir: ${apiMessage}`
          : "Não foi possível transferir. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    destino,
    usuariosIds,
    addFuncionarios,
    addFuncionariosPath,
    setShowSelectionControlsEdit,
    setActivateModified,
    onHide,
    queryClient,
  ]);

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (query.trim() && searchResults.length === 1) {
      selectLeaf(searchResults[0]);
      return;
    }
    if (destino && !isSaving) {
      handleSubmit();
    }
  };

  const count = usuariosIds.length;
  const peopleList =
    pessoas.length > 0
      ? pessoas
      : usuariosIds.map((id) => ({ _id: id, nome: `ID ${String(id).slice(-6)}` }));

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop="static"
      dialogClassName="lotacao-mover-dialog"
      contentClassName="lotacao-mover-content"
      enforceFocus={false}
    >
      <div className="lotacao-mover" role="dialog" aria-labelledby="lotacao-mover-title">
        <header className="lotacao-mover__header">
          <div className="lotacao-mover__header-copy">
            <p className="lotacao-mover__eyebrow">Lotação</p>
            <h2 id="lotacao-mover-title" className="lotacao-mover__title">
              Transferir lotação
            </h2>
            <p className="lotacao-mover__subtitle">
              Escolha o destino e confirme. Busque o setor/subsetor ou navegue na
              hierarquia.
            </p>
          </div>
          <button
            type="button"
            className="lotacao-mover__close"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Fechar"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="lotacao-mover__body">
          <aside className="lotacao-mover__people" aria-label="Funcionários a transferir">
            <div className="lotacao-mover__panel-head">
              <p className="lotacao-mover__panel-label">Movendo</p>
              <span className="lotacao-mover__count">{count}</span>
            </div>
            <ul className="lotacao-mover__people-list">
              {peopleList.map((pessoa) => (
                <li key={pessoa._id} className="lotacao-mover__person">
                  <span className="lotacao-mover__avatar" aria-hidden="true">
                    {initials(pessoa.nome)}
                  </span>
                  <span className="lotacao-mover__person-name" title={pessoa.nome}>
                    {pessoa.nome}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          <section className="lotacao-mover__dest" aria-label="Destino da lotação">
            <div className="lotacao-mover__search-wrap">
              <div className="lotacao-mover__search">
                <i
                  className="bi bi-search lotacao-mover__search-icon"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  className="lotacao-mover__search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Buscar setor ou subsetor…"
                  autoComplete="off"
                  disabled={isSaving}
                />
                {query ? (
                  <button
                    type="button"
                    className="lotacao-mover__search-clear"
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                  >
                    <i className="bi bi-x" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <p className="lotacao-mover__hint">
                Digite o nome do setor/subsetor ou navegue pela hierarquia abaixo.
              </p>
            </div>

            {!isSearching ? (
              <nav className="lotacao-mover__crumb" aria-label="Caminho atual">
                <button
                  type="button"
                  className={`lotacao-mover__crumb-btn${stack.length === 0 ? " is-current" : ""}`}
                  onClick={() => jumpToCrumb(-1)}
                >
                  Raiz
                </button>
                {stack.map((node, index) => (
                  <React.Fragment key={`${node.type}-${node.id}`}>
                    <span className="lotacao-mover__crumb-sep" aria-hidden="true">
                      ›
                    </span>
                    <button
                      type="button"
                      className={`lotacao-mover__crumb-btn${
                        index === stack.length - 1 ? " is-current" : ""
                      }`}
                      onClick={() => jumpToCrumb(index)}
                    >
                      {node.nome}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            ) : null}

            {isLoading || (isFetching && !setores.length) ? (
              <div className="lotacao-mover__loading">
                <span
                  className="lotacao-mover__spinner lotacao-mover__spinner--muted"
                  aria-hidden="true"
                />
                Carregando organização…
              </div>
            ) : isError ? (
              <div className="lotacao-mover__empty">
                <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                <strong>Não foi possível carregar os setores</strong>
                <span>Verifique a conexão e tente novamente.</span>
                <button
                  type="button"
                  className="lotacao-mover__btn lotacao-mover__btn--ghost"
                  onClick={() => refetch()}
                >
                  Recarregar
                </button>
              </div>
            ) : isSearching ? (
              searchResults.length === 0 ? (
                <div className="lotacao-mover__empty">
                  <i className="bi bi-search" aria-hidden="true" />
                  <strong>Nenhum resultado encontrado</strong>
                  <span>
                    Tente outro termo ou limpe a busca para navegar na hierarquia.
                  </span>
                </div>
              ) : (
                <ul className="lotacao-mover__list" role="listbox">
                  {searchResults.map((leaf) => {
                    const selected = String(destino?.id) === String(leaf.id);
                    return (
                      <li key={leaf.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`lotacao-mover__row${selected ? " is-selected" : ""}`}
                          onClick={() => selectLeaf(leaf)}
                        >
                          <span
                            className="lotacao-mover__row-icon lotacao-mover__row-icon--leaf"
                            aria-hidden="true"
                          >
                            <i className="bi bi-geo-alt-fill" />
                          </span>
                          <span className="lotacao-mover__row-main">
                            <span className="lotacao-mover__row-title">{leaf.nome}</span>
                            <span className="lotacao-mover__row-meta">
                              {formatPath(leaf.path.slice(0, -1))}
                            </span>
                          </span>
                          <span className="lotacao-mover__row-badge">Lotação</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <ul className="lotacao-mover__list" role="listbox">
                {stack.length > 0 ? (
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={
                        String(destino?.id) ===
                        String(stack[stack.length - 1].id)
                      }
                      className={`lotacao-mover__row${
                        String(destino?.id) ===
                        String(stack[stack.length - 1].id)
                          ? " is-selected"
                          : ""
                      }`}
                      onClick={selectCurrentLevel}
                    >
                      <span
                        className="lotacao-mover__row-icon lotacao-mover__row-icon--leaf"
                        aria-hidden="true"
                      >
                        <i className="bi bi-geo-alt-fill" />
                      </span>
                      <span className="lotacao-mover__row-main">
                        <span className="lotacao-mover__row-title">
                          Lotar em “{stack[stack.length - 1].nome}”
                        </span>
                        <span className="lotacao-mover__row-meta">
                          Usar o nível atual como destino
                        </span>
                      </span>
                      <span className="lotacao-mover__row-badge">Aqui</span>
                    </button>
                  </li>
                ) : null}

                {browseRows.length === 0 ? (
                  <li className="lotacao-mover__empty lotacao-mover__empty--inline">
                    <i className="bi bi-folder2-open" aria-hidden="true" />
                    <strong>Nada neste nível</strong>
                    <span>
                      {stack.length > 0
                        ? "Você pode lotar no nível atual acima, ou voltar no caminho."
                        : "Volte no caminho acima ou busque pelo nome."}
                    </span>
                  </li>
                ) : (
                  browseRows.map((row) => {
                    const selected = String(destino?.id) === String(row.id);
                    const hasChildren = row.childCount > 0;
                    return (
                      <li key={`${row.type}-${row.id}`}>
                        <div
                          className={`lotacao-mover__row-group${
                            selected ? " is-selected" : ""
                          }`}
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={`lotacao-mover__row${
                              selected ? " is-selected" : ""
                            }`}
                            onClick={() => selectLeafFromBrowse(row)}
                            onDoubleClick={() => {
                              if (hasChildren) openFolder(row);
                              else selectLeafFromBrowse(row);
                            }}
                          >
                            <span
                              className={`lotacao-mover__row-icon ${
                                hasChildren
                                  ? "lotacao-mover__row-icon--folder"
                                  : "lotacao-mover__row-icon--leaf"
                              }`}
                              aria-hidden="true"
                            >
                              <i
                                className={`bi ${
                                  row.type === "setor"
                                    ? "bi-building"
                                    : hasChildren
                                      ? "bi-folder2"
                                      : "bi-geo-alt"
                                }`}
                              />
                            </span>
                            <span className="lotacao-mover__row-main">
                              <span className="lotacao-mover__row-title">
                                {row.nome}
                              </span>
                              <span className="lotacao-mover__row-meta">
                                {row.type === "setor" ? "Setor" : "Subsetor"}
                                {hasChildren
                                  ? ` · ${row.childCount} filho(s) · clique para lotar`
                                  : " · clique para lotar aqui"}
                              </span>
                            </span>
                            <span className="lotacao-mover__row-badge">
                              {row.type === "setor" ? "Setor" : "Subsetor"}
                            </span>
                          </button>
                          {hasChildren ? (
                            <button
                              type="button"
                              className="lotacao-mover__drill"
                              title={`Abrir ${row.nome}`}
                              aria-label={`Abrir ${row.nome}`}
                              onClick={() => openFolder(row)}
                            >
                              <i
                                className="bi bi-chevron-right"
                                aria-hidden="true"
                              />
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </section>
        </div>

        <footer className="lotacao-mover__dock">
          <div className="lotacao-mover__dock-dest">
            <p className="lotacao-mover__dock-label">Destino</p>
            {destino ? (
              <p className="lotacao-mover__dock-path">
                {formatPath(destino.path, { highlightLast: true })}
              </p>
            ) : (
              <p className="lotacao-mover__dock-path is-empty">
                Selecione um setor ou subsetor para habilitar a transferência
              </p>
            )}
          </div>
          <div className="lotacao-mover__actions">
            <button
              type="button"
              className="lotacao-mover__btn lotacao-mover__btn--ghost"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="lotacao-mover__btn lotacao-mover__btn--primary"
              onClick={handleSubmit}
              disabled={!destino?.id || isSaving || count === 0}
            >
              {isSaving ? (
                <>
                  <span className="lotacao-mover__spinner" aria-hidden="true" />
                  Transferindo…
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                  Transferir {count}
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}

export default React.memo(LotacaoMover);
