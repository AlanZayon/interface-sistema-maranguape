import React, { useMemo, useState } from "react";
import { Badge, Button, Form, Table } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as tenantsApi from "@shared/api/tenants";
import { useAuth } from "@features/auth";
import {
  PageHeader,
  AppBreadcrumb,
  EmptyState,
  LoadingState,
  ConfirmDialog,
} from "@shared/ui";
import { tenantHostUrl } from "@shared/lib/tenant";

const tenantsKeys = {
  all: ["tenants"],
  list: () => [...tenantsKeys.all, "list"],
};

export default function TenantsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toDeactivate, setToDeactivate] = useState(null);
  const [q, setQ] = useState("");

  const enabled = role === "superadmin";

  const { data, isLoading, error } = useQuery({
    queryKey: tenantsKeys.list(),
    queryFn: tenantsApi.list,
    enabled,
  });

  const deactivateMutation = useMutation({
    mutationFn: tenantsApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKeys.all });
      toast.success("Tenant desativado");
      setToDeactivate(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao desativar tenant");
    },
  });

  const tenants = Array.isArray(data) ? data : [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter(
      (t) =>
        t.name?.toLowerCase().includes(term) ||
        t.slug?.toLowerCase().includes(term)
    );
  }, [tenants, q]);

  if (!enabled) {
    return <Navigate to="/tenants" replace />;
  }

  const openTenantSite = (slug) => {
    window.open(tenantHostUrl(slug, "/"), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-3">
      <AppBreadcrumb items={[{ label: "Tenants" }]} />
      <PageHeader
        title="Tenants"
        subtitle="Crie e gerencie os municípios da plataforma. Cada tenant administra seus próprios dados."
        actions={
          <Button variant="primary" onClick={() => navigate("/tenants/new")}>
            Novo tenant
          </Button>
        }
      />

      <Form.Control
        className="mb-3"
        style={{ maxWidth: 320 }}
        placeholder="Buscar por nome ou slug…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {isLoading && <LoadingState label="Carregando tenants…" />}
      {error && (
        <EmptyState title="Erro" description="Não foi possível listar tenants." />
      )}
      {!isLoading && !filtered.length && (
        <EmptyState
          title="Nenhum tenant"
          description="Crie o primeiro tenant para uma prefeitura."
          action={
            <Button onClick={() => navigate("/tenants/new")}>Criar tenant</Button>
          }
        />
      )}

      {!!filtered.length && (
        <Table responsive hover className="bg-white">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Cor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t._id}>
                <td>
                  <Link to={`/tenants/${t._id}`}>{t.name}</Link>
                </td>
                <td>
                  <code>{t.slug}</code>
                </td>
                <td>
                  <Badge bg={t.status === "active" ? "success" : "secondary"}>
                    {t.status}
                  </Badge>
                </td>
                <td>
                  <span
                    title={t.branding?.primaryColor}
                    style={{
                      display: "inline-block",
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: t.branding?.primaryColor || "#ccc",
                      border: "1px solid #ddd",
                    }}
                  />
                </td>
                <td className="text-end">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => openTenantSite(t.slug)}
                    disabled={t.status !== "active"}
                    title="Abre o site do município (login da prefeitura)"
                  >
                    Abrir site
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => navigate(`/tenants/${t._id}`)}
                  >
                    Gerenciar
                  </Button>
                  {t.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setToDeactivate(t)}
                    >
                      Desativar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        show={!!toDeactivate}
        title="Desativar tenant"
        message={`Desativar "${toDeactivate?.name}"? Usuários desse município não conseguirão acessar.`}
        confirmLabel="Desativar"
        variant="danger"
        onConfirm={() => deactivateMutation.mutate(toDeactivate._id)}
        onHide={() => setToDeactivate(null)}
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}
