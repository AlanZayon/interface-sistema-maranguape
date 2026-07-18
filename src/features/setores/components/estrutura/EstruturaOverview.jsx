import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as setoresApi from "@shared/api/setores";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { setoresKeys } from "../../hooks/useSetores";
import {
  countEmployeesInSubtree,
  getNodeChildren,
  getTipoLabel,
  normalizeNodeTipo,
} from "../../utils/setorNavigation";
import { AppModal, AppModalFooter, EmptyState } from "@shared/ui";

/**
 * Overview for Setor/Subsetor (or root): children + CRUD.
 */
export default function EstruturaOverview({
  node,
  nodes,
  onSelectChild,
  onCreated,
}) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createTipo, setCreateTipo] = useState("Subsetor");
  const [createName, setCreateName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isRoot = !node;
  const children = isRoot ? nodes || [] : getNodeChildren(node);
  const totalEmployees = isRoot
    ? (nodes || []).reduce((s, n) => s + countEmployeesInSubtree(n), 0)
    : countEmployeesInSubtree(node);

  const parentId = isRoot ? null : String(node._id ?? node.id);
  const canCreateRootSetor = isRoot;
  const canCreateChild = !isRoot;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: setoresKeys.all });

  const createMutation = useMutation({
    mutationFn: (data) => setoresApi.createSetor(data),
    onSuccess: (data) => {
      invalidate();
      setShowCreate(false);
      setCreateName("");
      toast.success("Criado com sucesso");
      onCreated?.(data);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao criar");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, nome }) => setoresApi.renameSetor(id, nome),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success("Nome atualizado");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao renomear");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => setoresApi.deleteSetor(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Excluído com sucesso");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao excluir");
    },
  });

  const openCreate = (tipo) => {
    setCreateTipo(tipo);
    setCreateName("");
    setShowCreate(true);
  };

  const handleCreate = () => {
    if (!createName.trim()) {
      toast.warn("Informe um nome");
      return;
    }
    const payload = {
      nome: createName.trim(),
      tipo: createTipo,
    };
    if (createTipo !== "Setor") {
      payload.parent = parentId;
    }
    createMutation.mutate(payload);
  };

  const title = isRoot
    ? "Organograma"
    : node.nome ?? node.name;
  const subtitle = isRoot
    ? `${(nodes || []).length} setor(es) · ${totalEmployees} funcionário(s)`
    : `${getTipoLabel(node.tipo || node.type)} · ${children.length} filho(s) · ${totalEmployees} funcionário(s)`;

  return (
    <div className="estrutura-overview">
      <div className="estrutura-overview__header">
        <div>
          <h2 className="estrutura-overview__title">{title}</h2>
          <p className="estrutura-overview__subtitle text-muted mb-0">
            {subtitle}
          </p>
        </div>
        <div className="estrutura-overview__actions">
          {canCreateRootSetor && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => openCreate("Setor")}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Novo setor
            </button>
          )}
          {canCreateChild && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => openCreate("Subsetor")}
            >
              <i className="bi bi-folder-plus me-1" aria-hidden="true" />
              Novo subsetor
            </button>
          )}
        </div>
      </div>

      {children.length === 0 ? (
        <EmptyState
          icon="bi-diagram-3"
          title={isRoot ? "Nenhum setor ainda" : "Sem filhos"}
          description={
            isRoot
              ? "Crie o primeiro setor para montar o organograma."
              : "Adicione um subsetor neste nó."
          }
        />
      ) : (
        <ul className="estrutura-overview__list">
          {children.map((child) => {
            const id = String(child._id ?? child.id);
            const tipo = normalizeNodeTipo(child.tipo || child.type);
            const count = countEmployeesInSubtree(child);
            const isEditing = editingId === id;

            return (
              <li key={id} className="estrutura-overview__card">
                {isEditing ? (
                  <div className="d-flex gap-2 align-items-center w-100">
                    <input
                      className="form-control form-control-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renameMutation.mutate({ id, nome: editName });
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() =>
                        renameMutation.mutate({ id, nome: editName })
                      }
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="estrutura-overview__card-main"
                      onClick={() => onSelectChild?.(id)}
                    >
                      <span className="estrutura-overview__card-tipo">
                        {getTipoLabel(tipo)}
                      </span>
                      <span className="estrutura-overview__card-name">
                        {child.nome ?? child.name}
                      </span>
                      {count > 0 && (
                        <span className="estrutura-overview__card-count">
                          <i className="bi bi-person" aria-hidden="true" />
                          {count}
                        </span>
                      )}
                    </button>
                    <div className="estrutura-overview__card-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        title="Renomear"
                        onClick={() => {
                          setEditingId(id);
                          setEditName(child.nome ?? child.name ?? "");
                        }}
                      >
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger"
                        title="Excluir"
                        onClick={() =>
                          setDeleteTarget({
                            id,
                            tipo: getTipoLabel(tipo),
                            name: child.nome ?? child.name,
                          })
                        }
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AppModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        title={
          createTipo === "Setor"
            ? "Novo setor"
            : "Novo subsetor"
        }
        icon="bi-plus-circle"
        footer={
          <AppModalFooter
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
            confirmLabel="Criar"
            disableConfirm={!createName.trim() || createMutation.isPending}
          />
        }
      >
        <label className="form-label" htmlFor="estrutura-create-name">
          Nome
        </label>
        <input
          id="estrutura-create-name"
          className="form-control"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="Digite o nome"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
      </AppModal>

      <ConfirmDeleteModal
        showModal={Boolean(deleteTarget)}
        handleClose={() => setDeleteTarget(null)}
        handleConfirmDelete={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        entityId={deleteTarget?.id}
        entityType={deleteTarget?.tipo}
      />
    </div>
  );
}
