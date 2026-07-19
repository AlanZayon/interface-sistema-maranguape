import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";
import * as setoresApi from "@shared/api/setores";
import { getNodeChildren, normalizeNodeTipo } from "@features/setores/utils/setorNavigation";
import { funcionariosKeys } from "../hooks/useFuncionarios";
import { toast } from "react-toastify";

function collectLeaves(setores = []) {
  const leaves = [];

  const walk = (nodes, path) => {
    for (const node of nodes || []) {
      const tipo = normalizeNodeTipo(node.tipo);
      const nextPath = [...path, { type: tipo, id: node._id, nome: node.nome }];
      leaves.push({ id: node._id, nome: node.nome, path: nextPath, item: node });
      walk(getNodeChildren(node), nextPath);
    }
  };

  walk(setores, []);
  return leaves;
}

function getChildrenAtStack(setores, stack) {
  if (!stack.length) {
    return (setores || []).map((setor) => {
      const children = getNodeChildren(setor);
      return {
        type: "setor",
        id: setor._id,
        nome: setor.nome,
        item: setor,
        childCount: children.length,
      };
    });
  }

  const current = stack[stack.length - 1];
  return getNodeChildren(current.item).map((child) => {
    const tipo = normalizeNodeTipo(child.tipo) || "subsetor";
    const grandchildren = getNodeChildren(child);
    return {
      type: tipo,
      id: child._id,
      nome: child.nome,
      item: child,
      childCount: grandchildren.length,
    };
  });
}

function formatPath(path = []) {
  return path.map((p) => p.nome).join(" › ");
}

function Step3Form({
  newUser,
  previousStep,
  handleCloseModal,
  onSubmittingChange,
}) {
  const queryClient = useQueryClient();
  const searchRef = useRef(null);

  const [query, setQuery] = useState("");
  const [stack, setStack] = useState([]);
  const [destino, setDestino] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const setSubmitting = (v) => {
    setIsLoading(v);
    onSubmittingChange?.(v);
  };

  const { data, isLoading: loadingSetores, isError, refetch, isFetching } =
    useQuery({
      queryKey: ["setores"],
      queryFn: () => setoresApi.getSetoresOrganizados(),
    });

  const setores = data?.setores || [];

  useEffect(() => {
    setQuery("");
    setStack([]);
    setDestino(null);
  }, []);

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
      id: leaf.id,
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
      setDestino({ id: row.id, nome: row.nome, path });
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

  const refreshAll = () => {
    setQuery("");
    setStack([]);
    setDestino(null);
    refetch();
  };

  const handleSubmit = async () => {
    if (!destino?.id) {
      toast.warn("Selecione um setor ou subsetor antes de continuar");
      return;
    }

    setSubmitting(true);

    const redes = (newUser.redesSociais || []).filter(
      (item) => item.link && item.nome
    );
    const secretaria =
      destino.path?.[0]?.nome || destino.nome || newUser.secretaria || "";

    const formData = new FormData();
    formData.append("nome", newUser.nome);
    if (newUser.foto instanceof File) formData.append("foto", newUser.foto);
    formData.append("secretaria", secretaria);
    formData.append("natureza", newUser.natureza);
    formData.append("referencia", newUser.referencia || "");
    formData.append("salarioBruto", newUser.salarioBruto || 0);
    formData.append("salarioLiquido", Number(newUser.salarioLiquido || 0));
    formData.append("funcao", newUser.funcao);
    formData.append("tipo", newUser.tipo || "");
    formData.append("observacoes", JSON.stringify(newUser.observacoes || []));
    formData.append("setorId", destino.id);
    formData.append("coordenadoria", destino.id);
    formData.append("endereco", newUser.endereco || "");
    formData.append("bairro", newUser.bairro || "");
    formData.append("telefone", newUser.telefone || "");
    formData.append("cidade", newUser.cidade || "");
    formData.append("inicioContrato", newUser.inicioContrato || "");
    formData.append("fimContrato", newUser.fimContrato || "");
    if (newUser.arquivo instanceof File) {
      formData.append("arquivo", newUser.arquivo);
    }
    formData.append("redesSociais", JSON.stringify(redes));

    try {
      const created = await funcionariosApi.createFuncionario(formData);
      queryClient.invalidateQueries({ queryKey: funcionariosKeys.all });
      queryClient.invalidateQueries({ queryKey: ["setores"] });
      handleCloseModal({ force: true });
      toast.success("Funcionário cadastrado com sucesso");
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Ocorreu um erro ao cadastrar. Tente novamente.";
      toast.error(typeof msg === "string" ? msg : "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form>
      <div className="hierarchy-picker">
        <div className="hierarchy-picker__toolbar">
          <Button onClick={refreshAll} variant="outline-secondary" size="sm">
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Recarregar
          </Button>
          <span className="small text-muted ms-auto">
            Selecione o setor ou subsetor de lotação
          </span>
        </div>

        <div className="p-3 border-bottom">
          <div className="input-group input-group-sm">
            <span className="input-group-text">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <Form.Control
              ref={searchRef}
              type="search"
              placeholder="Buscar setor ou subsetor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query ? (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
              >
                <i className="bi bi-x" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="hierarchy-picker__path">
          <button
            type="button"
            className={`btn btn-sm ${stack.length === 0 ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => jumpToCrumb(-1)}
          >
            Raiz
          </button>
          {stack.map((node, index) => (
            <React.Fragment key={`${node.type}-${node.id}`}>
              <span className="text-muted" aria-hidden="true">
                ›
              </span>
              <button
                type="button"
                className={`btn btn-sm ${
                  index === stack.length - 1 ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => jumpToCrumb(index)}
              >
                {node.nome}
              </button>
            </React.Fragment>
          ))}
        </div>

        {destino ? (
          <div className="px-3 py-2 small border-bottom bg-light">
            Lotação selecionada:{" "}
            <strong>{formatPath(destino.path)}</strong>
          </div>
        ) : (
          <div className="px-3 py-2 small text-muted border-bottom">
            Nenhum destino selecionado — clique em um item para lotar aqui
          </div>
        )}

        <div className="hierarchy-picker__list">
          {loadingSetores || (isFetching && !setores.length) ? (
            <div className="p-4 text-center text-muted">
              <Spinner animation="border" size="sm" className="me-2" />
              Carregando estrutura…
            </div>
          ) : isError ? (
            <div className="p-4 text-center">
              <p className="text-danger mb-2">Não foi possível carregar os setores</p>
              <Button size="sm" variant="outline-secondary" onClick={() => refetch()}>
                Recarregar
              </Button>
            </div>
          ) : isSearching ? (
            searchResults.length === 0 ? (
              <div className="p-4 text-center text-muted">
                Nenhum resultado para &ldquo;{query}&rdquo;
              </div>
            ) : (
              searchResults.map((leaf) => {
                const selected = destino?.id === leaf.id;
                return (
                  <button
                    key={leaf.id}
                    type="button"
                    className={`hierarchy-picker__item${selected ? " is-selected" : ""}`}
                    onClick={() => selectLeaf(leaf)}
                  >
                    <span>
                      <strong className="d-block">{leaf.nome}</strong>
                      <small className="text-muted">
                        {formatPath(leaf.path.slice(0, -1)) || "Raiz"}
                      </small>
                    </span>
                    <span className="badge text-bg-light">Lotação</span>
                  </button>
                );
              })
            )
          ) : browseRows.length === 0 ? (
            <div className="p-4 text-center text-muted">
              Nada neste nível. Volte no caminho ou busque pelo nome.
            </div>
          ) : (
            browseRows.map((row) => {
              const selected = destino?.id === row.id;
              const hasChildren = row.childCount > 0;
              return (
                <div
                  key={`${row.type}-${row.id}`}
                  className={`hierarchy-picker__item${selected ? " is-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="btn btn-link text-start text-decoration-none flex-grow-1 p-0"
                    onClick={() => selectLeafFromBrowse(row)}
                  >
                    <strong className="d-block text-body">{row.nome}</strong>
                    <small className="text-muted">
                      {row.type === "setor" ? "Setor" : "Subsetor"}
                      {hasChildren
                        ? ` · ${row.childCount} filho(s)`
                        : " · clique para lotar aqui"}
                    </small>
                  </button>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      title="Abrir"
                      onClick={() => openFolder(row)}
                    >
                      <i className="bi bi-chevron-right" aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="badge text-bg-light">
                      {row.type === "setor" ? "Setor" : "Subsetor"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="app-form-actions">
        <Button variant="outline-secondary" size="sm" onClick={previousStep}>
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Voltar
        </Button>

        {isLoading ? (
          <Spinner animation="border" size="sm" role="status">
            <span className="visually-hidden">Salvando...</span>
          </Spinner>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!destino}
          >
            <i className="bi bi-check-lg me-1" aria-hidden="true" />
            {destino ? "Salvar" : "Selecione um setor ou subsetor"}
          </Button>
        )}
      </div>
    </Form>
  );
}

export default Step3Form;
