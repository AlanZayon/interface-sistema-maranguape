import React, { useMemo, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as tenantsApi from "@shared/api/tenants";
import { useAuth } from "@features/auth";
import { PageHeader, AppBreadcrumb } from "@shared/ui";
import { getBaseDomain } from "@shared/lib/tenant";
import BrandingPreview from "./BrandingPreview";
import {
  COLOR_PICKER_LABELS,
  DEFAULT_BRANDING_POLICY,
  DEFAULT_CUSTOM_CSS,
  isEditableField,
} from "../lib/brandingHelpers";

const FONT_PRESETS = [
  { label: "Sistema", fontFamily: "system-ui, sans-serif", fontUrl: "" },
  {
    label: "Inter",
    fontFamily: "Inter, system-ui, sans-serif",
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
  },
  {
    label: "Source Sans 3",
    fontFamily: '"Source Sans 3", system-ui, sans-serif',
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&display=swap",
  },
];

const initialForm = {
  name: "",
  slug: "",
  status: "active",
  admin: { username: "", password: "", id: "" },
  branding: {
    displayName: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#1a5f2a",
    secondaryColor: "#0d6efd",
    primaryContrast: "#ffffff",
    headerBg: "#1b1f24",
    headerText: "#f8f9fa",
    sidebarBg: "#ffffff",
    sidebarText: "#343a40",
    surfaceBg: "#ffffff",
    pageBg: "#f3f4f6",
    textColor: "#212529",
    mutedColor: "#6c757d",
    borderColor: "#dee2e6",
    themeMode: "light",
    fontFamily: "system-ui, sans-serif",
    fontUrl: "",
    customCss: DEFAULT_CUSTOM_CSS,
  },
  settings: {
    seedOnCreate: true,
    vocabulary: {
      funcionario: "Funcionário",
      setor: "Setor",
      subsetor: "Subsetor",
      cargo: "Cargo",
      referencia: "Referência",
    },
  },
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildSteps(policy) {
  const steps = ["Identidade", "Admin", "Marca"];
  if (
    isEditableField(policy, "fontFamily") ||
    isEditableField(policy, "fontUrl")
  ) {
    steps.push("Tipografia");
  }
  if (policy.customCssEnabled && isEditableField(policy, "customCss")) {
    steps.push("CSS");
  }
  steps.push("Vocabulário", "Revisão");
  return steps;
}

export default function TenantWizardPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const { data: policy = DEFAULT_BRANDING_POLICY } = useQuery({
    queryKey: ["tenants", "branding-policy"],
    queryFn: tenantsApi.getBrandingPolicy,
    staleTime: 60_000,
  });

  const steps = useMemo(() => buildSteps(policy), [policy]);
  const stepId = steps[step] || "Identidade";

  const cssLen = String(form.branding.customCss || "").length;
  const cssMax = policy.customCssMaxLength || 20_000;
  const cssOverLimit = cssLen > cssMax;

  const editableColors = useMemo(
    () => COLOR_PICKER_LABELS.filter(([key]) => isEditableField(policy, key)),
    [policy]
  );

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const created = await tenantsApi.create(payload);
      const tenantId = created?.tenant?._id;
      if (tenantId && logoFile) {
        await tenantsApi.uploadAsset(tenantId, logoFile, "logo");
      }
      if (tenantId && faviconFile) {
        await tenantsApi.uploadAsset(tenantId, faviconFile, "favicon");
      }
      return created;
    },
    onSuccess: (data) => {
      toast.success(`Tenant ${data.tenant?.slug} criado`);
      navigate(`/tenants/${data.tenant?._id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao criar tenant");
    },
  });

  const domainHint = useMemo(() => {
    const base = getBaseDomain() || "localhost";
    const slug = form.slug || "slug";
    return `${slug}.${base}`;
  }, [form.slug]);

  const update = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const handleNameChange = (name) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.name = name;
      if (!slugTouched) next.slug = slugify(name);
      if (!displayNameTouched) next.branding.displayName = name;
      return next;
    });
  };

  const handleImageUpload = async (kind, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    const maxBytes = policy.assetMaxBytes || 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Imagem excede o limite de ${Math.round(maxBytes / 1024)} KB`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (kind === "logo") {
        setLogoFile(file);
        update("branding.logoUrl", dataUrl);
      } else {
        setFaviconFile(file);
        update("branding.faviconUrl", dataUrl);
      }
    } catch {
      toast.error("Não foi possível ler a imagem");
    }
  };

  const canNext = () => {
    if (stepId === "Identidade") return form.name.trim() && form.slug.trim();
    if (stepId === "Admin")
      return form.admin.username.trim() && form.admin.password.trim();
    if (stepId === "CSS" && cssOverLimit) return false;
    return true;
  };

  const submit = () => {
    if (cssOverLimit) {
      toast.error(`CSS excede o limite de ${cssMax} caracteres`);
      return;
    }
    createMutation.mutate({
      name: form.name.trim(),
      slug: form.slug.trim(),
      status: form.status,
      branding: {
        ...form.branding,
        displayName: form.branding.displayName || form.name,
        logoUrl: logoFile ? null : form.branding.logoUrl || null,
        faviconUrl: faviconFile ? null : form.branding.faviconUrl || null,
        fontUrl: form.branding.fontUrl || null,
        customCss: policy.customCssEnabled
          ? form.branding.customCss || null
          : null,
      },
      settings: form.settings,
      admin: {
        username: form.admin.username.trim(),
        password: form.admin.password,
        id: form.admin.id.trim() || undefined,
        role: "owner",
      },
    });
  };

  if (role !== "superadmin") {
    return <Navigate to="/tenants" replace />;
  }

  return (
    <div className="p-3">
      <AppBreadcrumb
        items={[
          { label: "Tenants", to: "/tenants" },
          { label: "Novo" },
        ]}
      />
      <PageHeader
        title="Novo tenant"
        subtitle={`Passo ${step + 1} de ${steps.length}: ${stepId}`}
      />

      <Row className="g-3">
        <Col lg={7}>
          <div className="bg-white border rounded p-3">
            {stepId === "Identidade" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Slug (subdomínio)</Form.Label>
                  <Form.Control
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      update("slug", slugify(e.target.value));
                    }}
                  />
                  <Form.Text>Acesso em https://{domainHint}</Form.Text>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}

            {stepId === "Admin" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Usuário dono (owner)</Form.Label>
                  <Form.Control
                    value={form.admin.username}
                    onChange={(e) => update("admin.username", e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Senha</Form.Label>
                  <Form.Control
                    type="password"
                    value={form.admin.password}
                    onChange={(e) => update("admin.password", e.target.value)}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>ID opcional</Form.Label>
                  <Form.Control
                    value={form.admin.id}
                    onChange={(e) => update("admin.id", e.target.value)}
                    placeholder="UUID gerado automaticamente se vazio"
                  />
                </Form.Group>
              </>
            )}

            {stepId === "Marca" && (
              <>
                {isEditableField(policy, "displayName") && (
                  <Form.Group className="mb-3">
                    <Form.Label>Nome de exibição</Form.Label>
                    <Form.Control
                      value={form.branding.displayName}
                      onChange={(e) => {
                        setDisplayNameTouched(true);
                        update("branding.displayName", e.target.value);
                      }}
                    />
                  </Form.Group>
                )}
                {isEditableField(policy, "logoUrl") && (
                  <Form.Group className="mb-3">
                    <Form.Label>Logo</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload("logo", e.target.files?.[0])
                      }
                    />
                    {form.branding.logoUrl ? (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <img
                          src={form.branding.logoUrl}
                          alt="Logo"
                          style={{
                            maxHeight: 40,
                            maxWidth: 120,
                            objectFit: "contain",
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => {
                            setLogoFile(null);
                            update("branding.logoUrl", "");
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : null}
                  </Form.Group>
                )}
                {isEditableField(policy, "faviconUrl") && (
                  <Form.Group className="mb-3">
                    <Form.Label>Favicon</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload("favicon", e.target.files?.[0])
                      }
                    />
                    {form.branding.faviconUrl ? (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <img
                          src={form.branding.faviconUrl}
                          alt="Favicon"
                          width={24}
                          height={24}
                          style={{ objectFit: "contain" }}
                        />
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => {
                            setFaviconFile(null);
                            update("branding.faviconUrl", "");
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : null}
                  </Form.Group>
                )}
                {isEditableField(policy, "themeMode") && (
                  <Form.Group className="mb-3">
                    <Form.Label>Tema</Form.Label>
                    <Form.Select
                      value={form.branding.themeMode}
                      onChange={(e) =>
                        update("branding.themeMode", e.target.value)
                      }
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                    </Form.Select>
                  </Form.Group>
                )}
                <Row>
                  {editableColors.map(([key, label]) => (
                    <Col md={4} key={key} className="mb-2">
                      <Form.Label>{label}</Form.Label>
                      <Form.Control
                        type="color"
                        value={form.branding[key] || "#000000"}
                        onChange={(e) =>
                          update(`branding.${key}`, e.target.value)
                        }
                      />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {stepId === "Tipografia" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Preset de fonte</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      const preset = FONT_PRESETS[Number(e.target.value)];
                      if (!preset) return;
                      setForm((prev) => {
                        const next = structuredClone(prev);
                        if (isEditableField(policy, "fontFamily")) {
                          next.branding.fontFamily = preset.fontFamily;
                        }
                        if (isEditableField(policy, "fontUrl")) {
                          next.branding.fontUrl = preset.fontUrl;
                        }
                        return next;
                      });
                    }}
                    defaultValue="0"
                  >
                    {FONT_PRESETS.map((p, i) => (
                      <option key={p.label} value={i}>
                        {p.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {isEditableField(policy, "fontFamily") && (
                  <Form.Group className="mb-3">
                    <Form.Label>font-family</Form.Label>
                    <Form.Control
                      value={form.branding.fontFamily}
                      onChange={(e) =>
                        update("branding.fontFamily", e.target.value)
                      }
                    />
                  </Form.Group>
                )}
                {isEditableField(policy, "fontUrl") && (
                  <Form.Group>
                    <Form.Label>URL da fonte (CSS)</Form.Label>
                    <Form.Control
                      value={form.branding.fontUrl}
                      onChange={(e) =>
                        update("branding.fontUrl", e.target.value)
                      }
                    />
                    <Form.Text>
                      Hosts permitidos:{" "}
                      {(policy.fontUrlHosts || []).join(", ") || "qualquer"}
                    </Form.Text>
                  </Form.Group>
                )}
              </>
            )}

            {stepId === "CSS" && (
              <Form.Group>
                <Form.Label>CSS customizado</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={14}
                  value={form.branding.customCss}
                  onChange={(e) => update("branding.customCss", e.target.value)}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                  isInvalid={cssOverLimit}
                />
                <div className="d-flex justify-content-between mt-1">
                  <Form.Text>
                    Seletores permitidos:{" "}
                    {(policy.allowedSelectors || []).join(", ")}
                  </Form.Text>
                  <Form.Text className={cssOverLimit ? "text-danger" : ""}>
                    {cssLen} / {cssMax}
                  </Form.Text>
                </div>
              </Form.Group>
            )}

            {stepId === "Vocabulário" && (
              <>
                <Form.Check
                  className="mb-3"
                  type="switch"
                  id="seedOnCreate"
                  label="Criar setor raiz e simbologia inicial"
                  checked={form.settings.seedOnCreate}
                  onChange={(e) =>
                    update("settings.seedOnCreate", e.target.checked)
                  }
                />
                {Object.keys(form.settings.vocabulary).map((key) => (
                  <Form.Group className="mb-2" key={key}>
                    <Form.Label>{key}</Form.Label>
                    <Form.Control
                      value={form.settings.vocabulary[key]}
                      onChange={(e) =>
                        update(`settings.vocabulary.${key}`, e.target.value)
                      }
                    />
                  </Form.Group>
                ))}
              </>
            )}

            {stepId === "Revisão" && (
              <div>
                <p>
                  <strong>{form.name}</strong> · <code>{form.slug}</code>
                </p>
                <p>
                  Host: <code>{domainHint}</code>
                </p>
                <p>
                  Admin: <code>{form.admin.username}</code>
                </p>
                <p>
                  Tema: {form.branding.themeMode} · Cor{" "}
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      background: form.branding.primaryColor,
                      verticalAlign: "middle",
                    }}
                  />
                </p>
                <p>Seed: {form.settings.seedOnCreate ? "sim" : "não"}</p>
                <p>
                  Logo: {form.branding.logoUrl ? "sim" : "não"} · Favicon:{" "}
                  {form.branding.faviconUrl ? "sim" : "não"}
                </p>
                <p>
                  CSS custom:{" "}
                  {policy.customCssEnabled
                    ? `${cssLen} chars`
                    : "desabilitado pela policy"}
                </p>
              </div>
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="outline-secondary"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Voltar
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  disabled={!canNext()}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  disabled={createMutation.isPending || cssOverLimit}
                  onClick={submit}
                >
                  {createMutation.isPending ? "Criando…" : "Criar tenant"}
                </Button>
              )}
            </div>
          </div>
        </Col>
        <Col lg={5}>
          <div className="sticky-top" style={{ top: 72 }}>
            <div className="small text-muted mb-2">Pré-visualização</div>
            <BrandingPreview branding={form.branding} name={form.name} />
          </div>
        </Col>
      </Row>
    </div>
  );
}
