import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as setoresApi from "@shared/api/setores";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import { setoresKeys } from "../../hooks/useSetores";
import {
  buildBreadcrumbItems,
  countEmployeesInSubtree,
  findAncestryInTree,
  getNodeChildren,
  getTipoLabel,
  normalizeNodeTipo,
} from "../../utils/setorNavigation";
import { AppBreadcrumb, AppModal, AppModalFooter, EmptyState } from "@shared/ui";

function collectMoveTargets(nodes, excludeId, excludeDescendantIds) {
  const options = [{ id: null, label: "— Raiz (sem pai) —", depth: 0 }];
  const walk = (list, depth) => {
    for (const n of list || []) {
      const id = String(n._id ?? n.id);
      if (id === excludeId || excludeDescendantIds.has(id)) {
        continue;
      }
      const name = n.nome ?? n.name ?? id;
      options.push({
        id,
        label: `${"\u00A0".repeat(depth * 2)}${name}`,
        depth,
      });
      walk(getNodeChildren(n), depth + 1);
    }
  };
  walk(nodes, 0);
  return options;
}

function collectDescendantIds(node, set = new Set()) {
  if (!node) return set;
  for (const child of getNodeChildren(node)) {
    const id = String(child._id ?? child.id);
    set.add(id);
    collectDescendantIds(child, set);
  }
  return set;
}

/**
 * Inspector for the Organograma view: rename, create child, move, delete.
 */
export default function OrganogramaInspector({
  nodes = [],
  selectedNode = null,
  selectedId = null,
  onSelect,
  onDeleted,
  onRequestCreateRoot,
  focusCreate = false,
  onFocusCreateHandled,
  focusRename = false,
  onFocusRenameHandled,
  focusDelete = false,
  onFocusDeleteHandled,
}) {
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [moveParentId, setMoveParentId] = useState("");

  const ancestry = selectedId
    ? findAncestryInTree(nodes, selectedId)
    : null;
  const breadcrumbItems = buildBreadcrumbItems(ancestry, "organograma");

  const isRootView = !selectedNode;
  const tipo = selectedNode
    ? normalizeNodeTipo(selectedNode.tipo || selectedNode.type)
    : null;
  const children = selectedNode ? getNodeChildren(selectedNode) : nodes || [];
  const directCount = selectedNode
    ? Number(selectedNode.quantidadeFuncionarios || 0)
    : 0;
  const subtreeCount = selectedNode
    ? countEmployeesInSubtree(selectedNode)
    : (nodes || []).reduce((s, n) => s + countEmployeesInSubtree(n), 0);

  const descendantIds = useMemo(() => {
    if (!selectedNode) return new Set();
    return collectDescendantIds(selectedNode);
  }, [selectedNode]);

  const moveOptions = useMemo(() => {
    if (!selectedId) return [];
    return collectMoveTargets(nodes, selectedId, descendantIds);
  }, [nodes, selectedId, descendantIds]);

  useEffect(() => {
    if (!selectedNode) {
      setEditing(false);
      setEditName("");
      setMoveParentId("");
      return;
    }
    setEditName(selectedNode.nome ?? selectedNode.name ?? "");
    setEditing(false);
    const parentId = selectedNode.parent
      ? String(selectedNode.parent)
      : "";
    setMoveParentId(parentId);
  }, [selectedNode]);

  useEffect(() => {
    if (!focusCreate) return;
    if (isRootView) {
      onRequestCreateRoot?.();
    } else {
      setShowCreate(true);
      setCreateName("");
    }
    onFocusCreateHandled?.();
  }, [
    focusCreate,
    isRootView,
    onRequestCreateRoot,
    onFocusCreateHandled,
  ]);

  useEffect(() => {
    if (!focusRename || isRootView) return;
    setEditing(true);
    onFocusRenameHandled?.();
  }, [focusRename, isRootView, onFocusRenameHandled]);

  useEffect(() => {
    if (!focusDelete || isRootView) return;
    setShowDelete(true);
    onFocusDeleteHandled?.();
  }, [focusDelete, isRootView, onFocusDeleteHandled]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: setoresKeys.all });

  const renameMutation = useMutation({
    mutationFn: ({ id, nome }) => setoresApi.renameSetor(id, nome),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      toast.success("Nome atualizado");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao renomear");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => setoresApi.createSetor(data),
    onSuccess: (data) => {
      invalidate();
      setShowCreate(false);
      setCreateName("");
      toast.success("Criado com sucesso");
      const newId = data?._id ?? data?.id;
      if (newId) onSelect?.(String(newId));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao criar");
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

  const deleteMutation = useMutation({
    mutationFn: (id) => setoresApi.deleteSetor(id),
    onSuccess: () => {
      invalidate();
      setShowDelete(false);
      toast.success("Excluído com sucesso");
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao excluir");
    },
  });

  const saveRename = () => {
    if (!selectedId || !editName.trim()) {
      toast.warn("Informe um nome");
      return;
    }
    renameMutation.mutate({ id: selectedId, nome: editName.trim() });
  };

  const handleCreate = () => {
    if (!createName.trim()) {
      toast.warn("Informe um nome");
      return;
    }
    createMutation.mutate({
      nome: createName.trim(),
      tipo: "Subsetor",
      parent: selectedId,
    });
  };

  const handleMove = () => {
    if (!selectedId) return;
    const next =
      moveParentId === "" || moveParentId === "null" ? null : moveParentId;
    const current = selectedNode?.parent
      ? String(selectedNode.parent)
      : null;
    if (next === current) {
      toast.info("O nó já está neste local");
      return;
    }
    if (tipo !== "setor" && next === null) {
      toast.warn("Apenas Setor pode ser raiz");
      return;
    }
    moveMutation.mutate({ id: selectedId, parent: next });
  };

  if (isRootView) {
    return (
      <div className="organograma-inspector">
        <div className="organograma-inspector__chrome">
          <AppBreadcrumb items={breadcrumbItems} />
        </div>
        <div className="organograma-inspector__body">
          <EmptyState
            icon="bi-diagram-3"
            title="Organograma"
            description={
              (nodes || []).length === 0
                ? "Crie o primeiro setor para montar a hierarquia."
                : `${(nodes || []).length} setor(es) · ${subtreeCount} funcionário(s) na árvore. Selecione um nó no canvas ou na árvore.`
            }
          />
          <button
            type="button"
            className="btn btn-primary btn-sm mt-3"
            onClick={() => onRequestCreateRoot?.()}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            Novo setor raiz
          </button>
        </div>
      </div>
    );
  }

  const canPromoteRoot = tipo === "setor";

  return (
    <div className="organograma-inspector">
      <div className="organograma-inspector__chrome">
        <AppBreadcrumb items={breadcrumbItems} />
      </div>

      <div className="organograma-inspector__body">
        <div className="organograma-inspector__meta">
          <span className="badge text-bg-light">
            {getTipoLabel(tipo)}
          </span>
          <span className="text-muted small">
            {children.length} filho(s) · {directCount} lotado(s) ·{" "}
            {subtreeCount} na subárvore
          </span>
        </div>

        <div className="organograma-inspector__section">
          <label className="form-label small mb-1" htmlFor="org-insp-nome">
            Nome
          </label>
          {editing ? (
            <div className="d-flex gap-2">
              <input
                id="org-insp-nome"
                className="form-control form-control-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") {
                    setEditing(false);
                    setEditName(
                      selectedNode.nome ?? selectedNode.name ?? ""
                    );
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={saveRename}
                disabled={renameMutation.isPending}
              >
                Salvar
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <strong className="organograma-inspector__name text-truncate">
                {selectedNode.nome ?? selectedNode.name}
              </strong>
              <button
                type="button"
                className="btn btn-sm btn-link"
                title="Renomear (F2)"
                onClick={() => setEditing(true)}
              >
                <i className="bi bi-pencil" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="organograma-inspector__actions">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              setShowCreate(true);
              setCreateName("");
            }}
          >
            <i className="bi bi-folder-plus me-1" aria-hidden="true" />
            Novo filho
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setShowDelete(true)}
          >
            <i className="bi bi-trash me-1" aria-hidden="true" />
            Excluir
          </button>
        </div>

        <div className="organograma-inspector__section">
          <label className="form-label small mb-1" htmlFor="org-insp-move">
            Mover para
          </label>
          <div className="d-flex gap-2">
            <select
              id="org-insp-move"
              className="form-select form-select-sm"
              value={moveParentId === null || moveParentId === "" ? "" : moveParentId}
              onChange={(e) => setMoveParentId(e.target.value)}
            >
              {moveOptions.map((opt) => (
                <option
                  key={opt.id === null ? "root" : opt.id}
                  value={opt.id === null ? "" : opt.id}
                  disabled={opt.id === null && !canPromoteRoot}
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleMove}
              disabled={moveMutation.isPending}
            >
              Mover
            </button>
          </div>
        </div>

        {children.length > 0 && (
          <div className="organograma-inspector__section">
            <div className="form-label small mb-1">Filhos</div>
            <ul className="organograma-inspector__children">
              {children.map((child) => {
                const id = String(child._id ?? child.id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-start p-0"
                      onClick={() => onSelect?.(id)}
                    >
                      {child.nome ?? child.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <AppModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        title="Novo subsetor"
        icon="bi-folder-plus"
        footer={
          <AppModalFooter
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
            confirmLabel="Criar"
            disableConfirm={!createName.trim() || createMutation.isPending}
          />
        }
      >
        <label className="form-label" htmlFor="org-create-child">
          Nome
        </label>
        <input
          id="org-create-child"
          className="form-control"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
      </AppModal>

      <ConfirmDeleteModal
        showModal={showDelete}
        handleClose={() => setShowDelete(false)}
        handleConfirmDelete={() => {
          if (selectedId) return deleteMutation.mutateAsync(selectedId);
        }}
        entityId={selectedId}
        entityType={getTipoLabel(tipo)}
      />
    </div>
  );
}
