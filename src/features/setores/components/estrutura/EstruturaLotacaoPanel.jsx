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

const SCOPE_KEY = "estrutura.lotacaoScope";

/**
 * Painel de lotação para Setor ou Subsetor: lista de funcionários + ações.
 * Escopo: apenas este nó | nó + filhos recursivos.
 */
export default function EstruturaLotacaoPanel({ node, onDeleted }) {
  const queryClient = useQueryClient();
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
  const { total, isLoading, isFetching, refetch } = activeQuery;

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

  const count = total ?? 0;

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
                className="btn btn-sm btn-primary"
                disabled={renameMutation.isPending || !editName.trim()}
                onClick={() => renameMutation.mutate(editName.trim())}
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
          <p className="estrutura-divisao__meta text-muted mb-0">
            {isLoading || isFetching ? "Carregando…" : countLabel}
          </p>
        </div>

        <div className="estrutura-divisao__actions d-flex flex-wrap gap-2 align-items-center">
          <div className="btn-group btn-group-sm" role="group" aria-label="Escopo">
            <button
              type="button"
              className={`btn ${scope === "node" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => changeScope("node")}
            >
              Só este nó
            </button>
            <button
              type="button"
              className={`btn ${scope === "subtree" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => changeScope("subtree")}
            >
              Com filhos
            </button>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => refetch()}
            title="Atualizar lista"
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setEditing(true)}
          >
            Renomear
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setShowDelete(true)}
          >
            Excluir
          </button>
          {shell?.openCreateFuncionario && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() =>
                shell.openCreateFuncionario({
                  setorId: id,
                  secretaria: name,
                })
              }
            >
              Novo funcionário
            </button>
          )}
        </div>
      </div>

      <FuncionariosList
        coordenadoriaId={id}
        departmentName={name}
        lotacaoScope={includeSubtree ? "subtree" : "node"}
      />

      <ConfirmDeleteModal
        show={showDelete}
        onHide={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        entityName={name}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
