import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Form,
  Badge,
} from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as usersApi from "@shared/api/users";
import { useAuth, canManageUsers, isElevatedRole } from "@features/auth";
import { Navigate } from "react-router-dom";
import {
  PageHeader,
  AppBreadcrumb,
  EmptyState,
  LoadingState,
  ConfirmDialog,
  AppModal,
  AppModalFooter,
  AppNotice,
} from "@shared/ui";

const ROLE_LABELS = {
  owner: "Dono",
  admin: "Admin",
  user: "Usuário",
  readonly: "Somente leitura",
  superadmin: "Superadmin",
};

const usersKeys = {
  all: ["users"],
  list: () => [...usersKeys.all, "list"],
};

function UsersPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [form, setForm] = useState({
    id: "",
    username: "",
    password: "",
    role: "user",
  });

  const canManage = canManageUsers(role);

  const { data, isLoading, error } = useQuery({
    queryKey: usersKeys.list(),
    queryFn: usersApi.listUsers,
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("Usuário criado com sucesso");
      setShowModal(false);
      setForm({ id: "", username: "", password: "", role: "user" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao criar usuário");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success("Usuário removido");
      setUserToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao remover usuário");
    },
  });

  if (!canManage) {
    return <Navigate to="/estrutura" replace />;
  }

  const users = Array.isArray(data) ? data : data?.users || data?.data || [];

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const username = form.username.trim() || form.id.trim();
    if (!username || !form.password) {
      toast.warn("Preencha usuário e senha");
      return;
    }
    createMutation.mutate({
      id: form.id.trim() || username,
      username,
      password: form.password,
      role: form.role,
    });
  };

  const badgeBg = (userRole) => {
    if (userRole === "owner") return "success";
    if (isElevatedRole(userRole)) return "primary";
    return "secondary";
  };

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: "Início", to: "/estrutura" },
          { label: "Usuários", active: true },
        ]}
      />
      <PageHeader
        title="Usuários"
        subtitle="Gerencie contas de acesso ao sistema"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus me-1" aria-hidden="true" />
            Novo usuário
          </Button>
        }
      />

      {error && (
        <AppNotice variant="danger">
          {error.response?.data?.message || "Falha ao carregar usuários"}
        </AppNotice>
      )}

      <Card className="border">
        <Card.Body className="p-0">
          {isLoading ? (
            <LoadingState label="Carregando usuários..." minHeight="10rem" />
          ) : users.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title="Nenhum usuário encontrado"
              description="Crie o primeiro usuário para liberar acesso ao sistema."
              action={
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                  Novo usuário
                </Button>
              }
            />
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Papel</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id || user.id}>
                    <td>{user.id || user.username || user.login}</td>
                    <td>
                      <Badge bg={badgeBg(user.role)}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setUserToDelete(user)}
                        disabled={
                          deleteMutation.isPending || user.role === "owner"
                        }
                        aria-label={`Remover ${user.id || user.username}`}
                        title={
                          user.role === "owner"
                            ? "O dono do tenant não pode ser removido"
                            : undefined
                        }
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={Boolean(userToDelete)}
        onHide={() => setUserToDelete(null)}
        onConfirm={() =>
          deleteMutation.mutate(userToDelete._id || userToDelete.id)
        }
        title="Remover usuário"
        message={`Tem certeza que deseja remover o usuário "${
          userToDelete?.id || userToDelete?.username || ""
        }"?`}
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
      />

      <AppModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Criar usuário"
        subtitle="Defina credenciais e papel de acesso"
        icon="bi-person-plus"
        footer={
          <AppModalFooter
            onCancel={() => setShowModal(false)}
            onConfirm={handleSubmit}
            cancelLabel="Cancelar"
            confirmLabel={createMutation.isPending ? "Salvando..." : "Criar"}
            loading={createMutation.isPending}
          />
        }
      >
        <Form
          id="create-user-form"
          onSubmit={handleSubmit}
        >
            <Form.Group className="mb-3" controlId="userLoginId">
              <Form.Label>ID de login</Form.Label>
              <Form.Control
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="Ex: joao.silva"
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="userDisplayName">
              <Form.Label>Nome de exibição (opcional)</Form.Label>
              <Form.Control
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="Usa o ID se vazio"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="userPassword">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
              />
            </Form.Group>
            <Form.Group controlId="userRole">
              <Form.Label>Papel</Form.Label>
              <Form.Select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </Form.Select>
              <Form.Text muted>
                O dono do tenant é o usuário criado no console master.
              </Form.Text>
            </Form.Group>
        </Form>
      </AppModal>
    </div>
  );
}

export default UsersPage;
