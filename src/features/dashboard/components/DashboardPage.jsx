import React from "react";
import { Row, Col, Card, Alert, Badge, ListGroup } from "react-bootstrap";
import { useDashboardSummary } from "@features/dashboard";
import {
  PageHeader,
  AppBreadcrumb,
  EmptyState,
  LoadingState,
} from "@shared/ui";

function StatCard({ icon, title, value, subtitle, variant = "primary" }) {
  return (
    <Card className="h-100 border">
      <Card.Body className="d-flex align-items-start gap-3 py-3">
        <div
          className={`rounded p-2 text-white bg-${variant} d-inline-flex`}
          aria-hidden="true"
        >
          <i className={`bi ${icon} fs-5`} />
        </div>
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fs-4 fw-semibold lh-1">{value ?? "—"}</div>
          {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}

function normalizeContratos(contratosAVencer) {
  if (Array.isArray(contratosAVencer)) return contratosAVencer;
  if (!contratosAVencer || typeof contratosAVencer !== "object") return [];

  return [
    { label: "Próximos 30 dias", count: contratosAVencer.next30Days ?? 0, janela: "30d" },
    { label: "Próximos 60 dias", count: contratosAVencer.next60Days ?? 0, janela: "60d" },
    { label: "Próximos 90 dias", count: contratosAVencer.next90Days ?? 0, janela: "90d" },
  ];
}

function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return <LoadingState label="Carregando dashboard..." />;
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error.response?.data?.message || "Falha ao carregar o dashboard"}
      </Alert>
    );
  }

  const headcount = data?.headcount ?? data?.totalFuncionarios ?? 0;
  const cotasList = Array.isArray(data?.cotasSimbologia)
    ? data.cotasSimbologia
    : Array.isArray(data?.cotas)
      ? data.cotas
      : [];
  const contratosList = normalizeContratos(data?.contratosAVencer ?? data?.contratos);
  const contratosTotal = contratosList.reduce(
    (sum, item) => sum + (typeof item.count === "number" ? item.count : 1),
    0
  );

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: "Início", to: "/estrutura" },
          { label: "Dashboard", active: true },
        ]}
      />
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral de headcount, cotas e contratos"
      />

      <Row className="g-3 mb-3">
        <Col md={4}>
          <StatCard
            icon="bi-people"
            title="Headcount"
            value={headcount}
            subtitle="Funcionários ativos"
            variant="primary"
          />
        </Col>
        <Col md={4}>
          <StatCard
            icon="bi-pie-chart"
            title="Cotas"
            value={cotasList.length}
            subtitle="Simbologias monitoradas"
            variant="success"
          />
        </Col>
        <Col md={4}>
          <StatCard
            icon="bi-file-earmark-text"
            title="Contratos a vencer"
            value={contratosTotal}
            subtitle="Próximos 30/60/90 dias"
            variant="warning"
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border h-100">
            <Card.Header className="bg-white fw-semibold py-2">
              Cotas (simbologia)
            </Card.Header>
            <Card.Body className="p-0">
              {cotasList.length === 0 ? (
                <EmptyState
                  icon="bi-pie-chart"
                  title="Nenhuma cota disponível"
                  description="Não há simbologias monitoradas no momento."
                />
              ) : (
                <ListGroup variant="flush">
                  {cotasList.map((cota, idx) => {
                    const nome =
                      cota.simbologia || cota.nome || cota.cargo || `Cota ${idx + 1}`;
                    const ocupadas = cota.ocupadas ?? cota.used ?? 0;
                    const vagas = cota.vagas ?? cota.limite ?? cota.total ?? "—";
                    return (
                      <ListGroup.Item
                        key={cota._id || nome}
                        className="d-flex justify-content-between align-items-center py-2"
                      >
                        <span>{nome}</span>
                        <Badge bg="secondary">
                          {ocupadas} / {vagas}
                        </Badge>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border h-100">
            <Card.Header className="bg-white fw-semibold py-2">
              Contratos a vencer
            </Card.Header>
            <Card.Body className="p-0">
              {contratosList.length === 0 ? (
                <EmptyState
                  icon="bi-file-earmark-text"
                  title="Nenhum contrato próximo do vencimento"
                  description="Não há contratos nas janelas de 30, 60 ou 90 dias."
                />
              ) : (
                <ListGroup variant="flush">
                  {contratosList.map((item, idx) => {
                    const nome =
                      item.label ||
                      item.nome ||
                      item.funcionario ||
                      `Contrato ${idx + 1}`;
                    const count = item.count;
                    return (
                      <ListGroup.Item
                        key={item._id || `${nome}-${idx}`}
                        className="d-flex justify-content-between align-items-center py-2"
                      >
                        <span>{nome}</span>
                        {typeof count === "number" ? (
                          <Badge bg="warning" text="dark">
                            {count}
                          </Badge>
                        ) : (
                          <Badge bg="secondary">{item.janela || "—"}</Badge>
                        )}
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
