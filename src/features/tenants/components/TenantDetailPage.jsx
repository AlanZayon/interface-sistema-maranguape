import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as tenantsApi from "@shared/api/tenants";
import { useAuth } from "@features/auth";
import {
  PageHeader,
  AppBreadcrumb,
  LoadingState,
  EmptyState,
} from "@shared/ui";
import { tenantHostUrl } from "@shared/lib/tenant";
import BrandingPreview from "./BrandingPreview";
import {
  COLOR_PICKER_LABELS,
  DEFAULT_BRANDING_POLICY,
  isEditableField,
} from "../lib/brandingHelpers";

export default function TenantDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const enabled = role === "superadmin" && !!id;

  const { data: policy = DEFAULT_BRANDING_POLICY } = useQuery({
    queryKey: ["tenants", "branding-policy"],
    queryFn: tenantsApi.getBrandingPolicy,
    staleTime: 60_000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenants", id],
    queryFn: () => tenantsApi.getById(id),
    enabled,
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        status: data.status || "active",
        branding: { ...(data.branding || {}) },
        settings: {
          vocabulary: { ...(data.settings?.vocabulary || {}) },
          seedOnCreate: data.settings?.seedOnCreate !== false,
        },
      });
    }
  }, [data]);

  const editableColors = useMemo(
    () => COLOR_PICKER_LABELS.filter(([key]) => isEditableField(policy, key)),
    [policy]
  );

  const cssLen = String(form?.branding?.customCss || "").length;
  const cssMax = policy.customCssMaxLength || 20_000;
  const cssOverLimit = cssLen > cssMax;
  const showCss =
    policy.customCssEnabled && isEditableField(policy, "customCss");

  const updateMutation = useMutation({
    mutationFn: (payload) => tenantsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant atualizado");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, kind }) => tenantsApi.uploadAsset(id, file, kind),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["tenants", id] });
      toast.success("Asset enviado");
      if (res?.tenant?.branding) {
        setForm((prev) =>
          prev
            ? { ...prev, branding: { ...prev.branding, ...res.tenant.branding } }
            : prev
        );
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro no upload");
    },
  });

  if (role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading || !form) {
    return (
      <div className="p-3">
        <LoadingState label="Carregando tenant…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <EmptyState title="Tenant não encontrado" />
      </div>
    );
  }

  const updateBranding = (key, value) => {
    setForm((prev) => ({
      ...prev,
      branding: { ...prev.branding, [key]: value },
    }));
  };

  const handleSave = () => {
    if (showCss && cssOverLimit) {
      toast.error(`CSS excede o limite de ${cssMax} caracteres`);
      return;
    }
    updateMutation.mutate(form);
  };

  const handleUpload = (kind, file) => {
    if (!file) return;
    const maxBytes = policy.assetMaxBytes || 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Imagem excede o limite de ${Math.round(maxBytes / 1024)} KB`);
      return;
    }
    uploadMutation.mutate({ file, kind });
  };

  return (
    <div className="p-3">
      <AppBreadcrumb
        items={[
          { label: "Tenants", to: "/tenants" },
          { label: data.name },
        ]}
      />
      <PageHeader
        title={data.name}
        subtitle={`${data.slug} · ${data.status}`}
        actions={
          <>
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={() =>
                window.open(
                  tenantHostUrl(data.slug, "/"),
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              Abrir site do município
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/tenants")}>
              Voltar
            </Button>
          </>
        }
      />

      <Row className="g-3">
        <Col lg={7}>
          <div className="bg-white border rounded p-3">
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </Form.Select>
            </Form.Group>

            <h6 className="mt-3">Branding</h6>
            {isEditableField(policy, "displayName") && (
              <Form.Group className="mb-2">
                <Form.Label>Display name</Form.Label>
                <Form.Control
                  value={form.branding.displayName || ""}
                  onChange={(e) => updateBranding("displayName", e.target.value)}
                />
              </Form.Group>
            )}
            <Row>
              {editableColors.map(([key, label]) => (
                <Col md={3} key={key} className="mb-2">
                  <Form.Label>{label}</Form.Label>
                  <Form.Control
                    type="color"
                    value={form.branding[key] || "#000000"}
                    onChange={(e) => updateBranding(key, e.target.value)}
                  />
                </Col>
              ))}
            </Row>
            {isEditableField(policy, "themeMode") && (
              <Form.Group className="mb-2">
                <Form.Label>Tema</Form.Label>
                <Form.Select
                  value={form.branding.themeMode || "light"}
                  onChange={(e) => updateBranding("themeMode", e.target.value)}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </Form.Select>
              </Form.Group>
            )}
            {isEditableField(policy, "fontFamily") && (
              <Form.Group className="mb-2">
                <Form.Label>Font family</Form.Label>
                <Form.Control
                  value={form.branding.fontFamily || ""}
                  onChange={(e) => updateBranding("fontFamily", e.target.value)}
                />
              </Form.Group>
            )}
            {isEditableField(policy, "fontUrl") && (
              <Form.Group className="mb-2">
                <Form.Label>Font URL</Form.Label>
                <Form.Control
                  value={form.branding.fontUrl || ""}
                  onChange={(e) => updateBranding("fontUrl", e.target.value)}
                />
                <Form.Text>
                  Hosts: {(policy.fontUrlHosts || []).join(", ")}
                </Form.Text>
              </Form.Group>
            )}
            {showCss ? (
              <Form.Group className="mb-2">
                <Form.Label>CSS custom</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={form.branding.customCss || ""}
                  onChange={(e) => updateBranding("customCss", e.target.value)}
                  isInvalid={cssOverLimit}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                />
                <div className="d-flex justify-content-between">
                  <Form.Text>
                    {(policy.allowedSelectors || []).join(", ")}
                  </Form.Text>
                  <Form.Text className={cssOverLimit ? "text-danger" : ""}>
                    {cssLen} / {cssMax}
                  </Form.Text>
                </div>
              </Form.Group>
            ) : (
              <p className="small text-muted">
                CSS customizado desabilitado pela policy do servidor.
              </p>
            )}

            <Row className="mb-3">
              {isEditableField(policy, "logoUrl") && (
                <Col md={6}>
                  <Form.Label>Upload logo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleUpload("logo", e.target.files?.[0])
                    }
                  />
                </Col>
              )}
              {isEditableField(policy, "faviconUrl") && (
                <Col md={6}>
                  <Form.Label>Upload favicon</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleUpload("favicon", e.target.files?.[0])
                    }
                  />
                </Col>
              )}
            </Row>

            <Button
              disabled={updateMutation.isPending || (showCss && cssOverLimit)}
              onClick={handleSave}
            >
              Salvar alterações
            </Button>
          </div>
        </Col>
        <Col lg={5}>
          <div className="sticky-top" style={{ top: 72 }}>
            <BrandingPreview branding={form.branding} name={form.name} />
          </div>
        </Col>
      </Row>
    </div>
  );
}
