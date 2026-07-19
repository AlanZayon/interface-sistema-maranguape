import React from "react";
import { Row, Col } from "react-bootstrap";
import { format } from "date-fns";
import { useAuth, isElevatedRole } from "@features/auth";
import {
  PageHeader,
  AppBreadcrumb,
  LoadingState,
  AppNotice,
} from "@shared/ui";
import {
  useDashboardSummary,
  useDashboardContratos,
  useDashboardPayroll,
  useAuditFeed,
  useRefreshDashboard,
} from "../hooks/useDashboard";
import QuickActions from "./QuickActions";
import AttentionBanner from "./AttentionBanner";
import KpiRow from "./KpiRow";
import NaturezaChart from "./NaturezaChart";
import SecretariasChart from "./SecretariasChart";
import CotasPanel from "./CotasPanel";
import ContratosTable from "./ContratosTable";
import EstruturaSnapshot from "./EstruturaSnapshot";
import PayrollPanel from "./PayrollPanel";
import AuditFeed from "./AuditFeed";
import "./dashboard.css";

function DashboardPage() {
  const { role } = useAuth();
  const isAdmin = isElevatedRole(role);

  const {
    data,
    isLoading,
    isFetching,
    error,
    dataUpdatedAt,
  } = useDashboardSummary();

  const { data: contratosData } = useDashboardContratos(
    { within: 90, limit: 20 },
    { enabled: !isLoading && !error }
  );

  const payrollQuery = useDashboardPayroll({ enabled: isAdmin });
  const auditQuery = useAuditFeed({ limit: 10 }, { enabled: isAdmin });
  const refresh = useRefreshDashboard();

  if (isLoading) {
    return <LoadingState label="Carregando dashboard..." />;
  }

  if (error) {
    return (
      <AppNotice variant="danger">
        {error.response?.data?.message || "Falha ao carregar o dashboard"}
      </AppNotice>
    );
  }

  const updatedLabel = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), "dd/MM/yyyy HH:mm")
    : data?.generatedAt
      ? format(new Date(data.generatedAt), "dd/MM/yyyy HH:mm")
      : null;

  return (
    <div className="dashboard-page">
      <AppBreadcrumb items={[{ label: "Dashboard", active: true }]} />
      <PageHeader
        title="Dashboard"
        subtitle={
          updatedLabel
            ? `Visão geral do quadro · atualizado em ${updatedLabel}`
            : "Visão geral do quadro de pessoal"
        }
        actions={
          <QuickActions onRefresh={refresh} refreshing={isFetching} />
        }
      />

      <AttentionBanner estrutura={data?.estrutura} />

      <KpiRow data={data} payroll={payrollQuery.data} isAdmin={isAdmin} />

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <NaturezaChart data={data?.byNatureza} />
        </Col>
        <Col lg={6}>
          <SecretariasChart data={data?.bySecretaria} />
        </Col>
      </Row>

      <Row className="g-3 mb-3 align-items-stretch">
        <Col lg={5}>
          <CotasPanel cotas={data?.cotasSimbologia} isAdmin={isAdmin} />
        </Col>
        <Col lg={7}>
          <ContratosTable
            items={contratosData?.items}
            buckets={data?.contratosAVencer}
          />
        </Col>
      </Row>

      <Row className="g-3 mb-3 align-items-stretch">
        <Col lg={isAdmin ? 6 : 12}>
          <EstruturaSnapshot estrutura={data?.estrutura} />
        </Col>
        {isAdmin ? (
          <Col lg={6}>
            <PayrollPanel
              data={payrollQuery.data}
              isLoading={payrollQuery.isLoading}
              error={payrollQuery.error}
            />
          </Col>
        ) : null}
      </Row>

      {isAdmin && (
        <Row className="g-3 mb-3">
          <Col lg={6}>
            <AuditFeed
              data={auditQuery.data}
              isLoading={auditQuery.isLoading}
              error={auditQuery.error}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}

export default DashboardPage;
