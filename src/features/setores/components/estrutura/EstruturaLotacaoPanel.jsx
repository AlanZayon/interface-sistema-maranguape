import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as setoresApi from "@shared/api/setores";
import { FuncionariosList } from "@features/funcionarios";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { useShellActions } from "@shared/ui";
import { setoresKeys } from "../../hooks/useSetores";
import { getTipoLabel } from "../../utils/setorNavigation";
import {
  useFuncionariosBySetorId,
  useFuncionariosBySetorSubtree,
} from "@features/funcionarios/hooks/useFuncionarios";
import { useAuth } from "@features/auth";

const SCOPE_KEY = "estrutura.lotacaoScope";

/**
 * Painel de lotação para Setor ou Subsetor: lista de funcionários + ações.
 * Escopo: apenas este nó | nó + filhos recursivos.
 */
export default function EstruturaLotacaoPanel({ node, onDeleted }) {
  const queryClient = useQueryClient();
  const { setFuncionarios } = useAuth();
  const shell = useShellActions();
  const id = String(node._id ?? node.id);
  const name = node.nome ?? node.name;
  const tipo = node.tipo || node.type;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showDelete, setShowDelete] = useState(false);
  const [scope, setScope] = useState(() => {
    try {
      return localStorage.getItem(SCOPE_KEY) === "subtree" ? "subtree" : "node";
    } catch {
      return "node";
    }
  });

  const includeSubtree = scope === "subtree";

  const nodeQuery = useFuncionariosBySetorId(id, {
    enabled: Boolean(id) && !includeSubtree,
  });
  const subtreeQuery = useFuncionariosBySetorSubtree(id, {
    enabled: Boolean(id) && includeSubtree,
  });

  const activeQuery = includeSubtree ? subtreeQuery : nodeQuery;
  const { data, isLoading, isFetching, refetch } = activeQuery;

  useEffect(() => {
    if (!data) return;
    const list = Array.isArray(data) ? data : data.funcionarios || [];
    setFuncionarios((prev) => ({
      ...(typeof prev === "object" && !Array.isArray(prev) ? prev : {}),
      [id]: list,
    }));
  }, [data, id, setFuncionarios, scope]);

  useEffect(() => {
    setEditName(name);
    setEditing(false);
  }, [id, name]);

  const changeScope = (next) => {
    setScope(next);
    try {
      localStorage.setItem(SCOPE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const renameMutation = useMutation({
    mutationFn: (nome) => setoresApi.renameSetor(id, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresKeys.all });
      setEditing(false);
      toast.success("Nome atualizado");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao renomear");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => setoresApi.deleteSetor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresKeys.all });
      setShowDelete(false);
      toast.success("Excluído com sucesso");
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao excluir");
    },
  });

  const count = Array.isArray(data)
    ? data.length
    : data?.funcionarios?.length ?? 0;

  const countLabel = includeSubtree
    ? `${count} funcionário(s) neste nó e nos filhos`
    : `${count} funcionário(s) neste nó`;

  return (
    <div className="estrutura-divisao">
      <div className="estrutura-divisao__header">
        <div className="estrutura-divisao__title-block">
          <span className="estrutura-divisao__badge">{getTipoLabel(tipo)}</span>
          {editing ? (
            <div className="d-flex gap-2 align-items-center">
              <input
                className="form-control form-control-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => renameMutation.mutate(editName)}
              >
                Salvar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setEditing(false);
                  setEditName(name);
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <h2 className="estrutura-divisao__title">{name}</h2>
          )}
          <p className="text-muted mb-0 small">
            {isLoading || isFetching ? "Carregando…" : countLabel}
          </p>
        </div>
        <div className="estrutura-divisao__actions">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => shell.openCreateFuncionario?.(id, name)}
          >
            <i className="bi bi-person-plus me-1" aria-hidden="true" />
            Novo funcionário
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setEditName(name);
              setEditing(true);
            }}
            title="Renomear"
          >
            <i className="bi bi-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setShowDelete(true)}
            title="Excluir"
          >
            <i className="bi bi-trash" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => refetch()}
            title="Atualizar lista"
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="btn-group btn-group-sm estrutura-lotacao__scope"
        role="group"
        aria-label="Escopo da lista de funcionários"
      >
        <button
          type="button"
          className={`btn btn-outline-secondary${scope === "node" ? " active" : ""}`}
          onClick={() => changeScope("node")}
          title="Somente funcionários lotados neste nó"
        >
          Só neste nó
        </button>
        <button
          type="button"
          className={`btn btn-outline-secondary${scope === "subtree" ? " active" : ""}`}
          onClick={() => changeScope("subtree")}
          title="Incluir funcionários dos subsetores filhos"
        >
          + filhos
        </button>
      </div>

      <div className="estrutura-divisao__list">
        <FuncionariosList
          key={`${id}-${scope}`}
          setorId={id}
          coordenadoriaId={id}
          lotacaoScope={includeSubtree ? "subtree" : "node"}
        />
      </div>

      <ConfirmDeleteModal
        showModal={showDelete}
        handleClose={() => setShowDelete(false)}
        handleConfirmDelete={() => deleteMutation.mutate()}
        entityId={id}
        entityType={getTipoLabel(tipo)}
      />
    </div>
  );
}
