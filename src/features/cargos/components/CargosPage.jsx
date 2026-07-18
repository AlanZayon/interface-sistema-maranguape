import React, { useRef, useState } from "react";
import {
  Card,
  Table,
  Button,
  Form,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";
import * as cargosApi from "@shared/api/cargos";
import { useAuth } from "@features/auth";
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

const cargosKeys = {
  all: ["cargos-comissionados"],
  list: () => [...cargosKeys.all, "list"],
};

const emptyForm = {
  id: "",
  tipo: "",
  cargo: "",
  simbologia: "",
  aDefinir: "",
  limite: "",
};

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function CargosPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const isAdmin = role === "admin" || role === "superadmin";

  const [showModal, setShowModal] = useState(false);
  const [cargoToDelete, setCargoToDelete] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [importErrors, setImportErrors] = useState([]);

  const { data, isLoading, error } = useQuery({
    queryKey: cargosKeys.list(),
    queryFn: cargosApi.listCargos,
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      form.id
        ? cargosApi.updateCargo(form.id, payload)
        : cargosApi.createCargo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cargosKeys.all });
      toast.success(form.id ? "Cargo atualizado" : "Cargo criado com sucesso");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao salvar cargo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cargosApi.deleteCargo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cargosKeys.all });
      toast.success("Cargo removido");
      setCargoToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao remover cargo");
    },
  });

  const importMutation = useMutation({
    mutationFn: cargosApi.importCargos,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: cargosKeys.all });
      const created = result?.created ?? 0;
      const updated = result?.updated ?? 0;
      const errors = result?.errors || [];
      setImportErrors(errors);
      toast.success(
        `Importação concluída: ${created} criado(s), ${updated} atualizado(s)`
      );
      if (errors.length) {
        toast.warn(`${errors.length} linha(s) com erro`);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Erro ao importar planilha");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const cargos = Array.isArray(data) ? data : [];

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({
      id: item._id,
      tipo: item.tipo || "",
      cargo: item.cargo || "",
      simbologia: item.simbologia || "",
      aDefinir: item.aDefinir ?? "",
      limite: item.simbologiaInfo?.limite ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!form.tipo.trim() || !form.cargo.trim() || !form.simbologia.trim()) {
      toast.warn("Preencha tipo, cargo e simbologia");
      return;
    }
    if (form.aDefinir === "" || Number.isNaN(Number(form.aDefinir))) {
      toast.warn("Informe um valor salarial válido");
      return;
    }

    const payload = {
      tipo: form.tipo.trim(),
      cargo: form.cargo.trim(),
      simbologia: form.simbologia.trim(),
      aDefinir: Number(form.aDefinir),
    };

    if (form.limite !== "" && form.limite !== null && form.limite !== undefined) {
      const limiteNum = Number(form.limite);
      if (Number.isNaN(limiteNum) || limiteNum < 0) {
        toast.warn("Limite deve ser um número >= 0");
        return;
      }
      payload.limite = limiteNum;
    }

    saveMutation.mutate(payload);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.warn("Envie um arquivo .xlsx");
      e.target.value = "";
      return;
    }
    setImportErrors([]);
    importMutation.mutate(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      await cargosApi.downloadTemplate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao baixar modelo");
    }
  };

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: "Início", to: "/dashboard" },
          { label: "Cargos comissionados", active: true },
        ]}
      />
      <PageHeader
        title="Cargos comissionados"
        subtitle="Cadastre cargos e simbologias usados no registro de funcionários comissionados"
        actions={
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <i className="bi bi-download me-1" aria-hidden="true" />
              Modelo
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleImportClick}
              disabled={importMutation.isPending}
            >
              <i className="bi bi-file-earmark-excel me-1" aria-hidden="true" />
              {importMutation.isPending ? "Importando..." : "Importar planilha"}
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Novo cargo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="d-none"
              onChange={handleFileChange}
            />
          </div>
        }
      />

      {error && (
        <AppNotice variant="danger">
          {error.response?.data?.message || "Falha ao carregar cargos"}
        </AppNotice>
      )}

      {importErrors.length > 0 && (
        <AppNotice
          variant="warning"
          dismissible
          onClose={() => setImportErrors([])}
        >
          <div className="fw-semibold mb-1">Erros na importação</div>
          <ul className="mb-0 small">
            {importErrors.slice(0, 10).map((err) => (
              <li key={`${err.row}-${err.message}`}>
                Linha {err.row}: {err.message}
              </li>
            ))}
            {importErrors.length > 10 && (
              <li>…e mais {importErrors.length - 10} erro(s)</li>
            )}
          </ul>
        </AppNotice>
      )}

      <Card className="border">
        <Card.Body className="p-0">
          {isLoading ? (
            <LoadingState label="Carregando cargos..." minHeight="10rem" />
          ) : cargos.length === 0 ? (
            <EmptyState
              icon="bi-briefcase"
              title="Nenhum cargo cadastrado"
              description="Cadastre manualmente ou importe uma planilha .xlsx."
              action={
                <div className="d-flex gap-2 justify-content-center">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleImportClick}
                  >
                    Importar planilha
                  </Button>
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    Novo cargo
                  </Button>
                </div>
              }
            />
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Tipo</th>
                  <th>Cargo</th>
                  <th>Simbologia</th>
                  <th>Salário</th>
                  <th>Limite</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cargos.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <Badge bg="secondary">{item.tipo}</Badge>
                    </td>
                    <td>{item.cargo}</td>
                    <td>{item.simbologia}</td>
                    <td>{formatCurrency(item.aDefinir)}</td>
                    <td>{item.simbologiaInfo?.limite ?? "—"}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(item)}
                          aria-label={`Editar ${item.cargo}`}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => setCargoToDelete(item)}
                          disabled={deleteMutation.isPending}
                          aria-label={`Remover ${item.cargo}`}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={Boolean(cargoToDelete)}
        onHide={() => setCargoToDelete(null)}
        onConfirm={() => deleteMutation.mutate(cargoToDelete._id)}
        title="Remover cargo"
        message={`Tem certeza que deseja remover o cargo "${
          cargoToDelete?.cargo || ""
        }"?`}
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
      />

      <AppModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setForm(emptyForm);
        }}
        title={form.id ? "Editar cargo" : "Novo cargo comissionado"}
        subtitle="Defina cargo, simbologia, salário e limite de vagas"
        icon="bi-briefcase"
        footer={
          <AppModalFooter
            onCancel={() => {
              setShowModal(false);
              setForm(emptyForm);
            }}
            onConfirm={handleSubmit}
            cancelLabel="Cancelar"
            confirmLabel={saveMutation.isPending ? "Salvando..." : "Salvar"}
            loading={saveMutation.isPending}
          />
        }
      >
        <Form id="cargo-form" onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="cargoTipo">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value }))
                  }
                  placeholder="Ex: DAS"
                  required
                  autoFocus
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="cargoSimbologia">
                <Form.Label>Simbologia</Form.Label>
                <Form.Control
                  value={form.simbologia}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, simbologia: e.target.value }))
                  }
                  placeholder="Ex: DAS-1"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="cargoNome">
                <Form.Label>Cargo</Form.Label>
                <Form.Control
                  value={form.cargo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cargo: e.target.value }))
                  }
                  placeholder="Ex: ASSESSOR ESPECIAL"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="cargoSalario">
                <Form.Label>Salário (aDefinir)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.aDefinir}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, aDefinir: e.target.value }))
                  }
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="cargoLimite">
                <Form.Label>Limite da simbologia</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="1"
                  value={form.limite}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, limite: e.target.value }))
                  }
                  placeholder={form.id ? "Opcional" : "Obrigatório se nova"}
                />
                <Form.Text className="text-muted">
                  Cria ou atualiza a cota da simbologia.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </AppModal>
    </div>
  );
}

export default CargosPage;
