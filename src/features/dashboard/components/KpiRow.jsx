import React from "react";
import { Row, Col } from "react-bootstrap";
import StatCard from "./StatCard";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/**
 * @param {{
 *   data: object,
 *   payroll?: object | null,
 *   isAdmin?: boolean,
 * }} props
 */
export default function KpiRow({ data, payroll, isAdmin }) {
  const headcount = data?.headcount ?? 0;
  const cotasPct = data?.cotasResumo?.pct ?? 0;
  const cotasLimite = data?.cotasResumo?.limite ?? 0;
  const cotasEstouradas = data?.cotasResumo?.estouradas ?? 0;
  const contratos30 = data?.contratosAVencer?.in30 ?? 0;
  const setoresSemLotacao = data?.estrutura?.setoresSemLotacao ?? 0;
  const totalSetores = data?.estrutura?.totalSetores ?? 0;

  const colProps = isAdmin
    ? { xs: 12, sm: 6, xl: true }
    : { xs: 12, sm: 6, md: 3 };

  return (
    <Row className="g-3 mb-3">
      <Col {...colProps}>
        <StatCard
          icon="bi-people"
          title="Funcionários"
          value={headcount.toLocaleString("pt-BR")}
          subtitle="Total cadastrado"
          variant="primary"
        />
      </Col>
      <Col {...colProps}>
        <StatCard
          icon="bi-pie-chart"
          title="Cotas preenchidas"
          value={cotasLimite > 0 ? `${cotasPct}%` : "—"}
          subtitle={
            cotasLimite === 0
              ? "Nenhuma cota configurada"
              : cotasEstouradas > 0
                ? `${cotasEstouradas} simbologia(s) estourada(s)`
                : `${data?.cotasResumo?.ocupadas ?? 0} / ${cotasLimite} vagas`
          }
          variant={cotasEstouradas > 0 ? "danger" : cotasLimite > 0 ? "success" : "secondary"}
          alert={cotasEstouradas > 0}
          to={isAdmin && cotasLimite === 0 ? "/cargos-comissionados" : undefined}
          hrefHash={cotasLimite > 0 ? "#dashboard-cotas" : undefined}
        />
      </Col>
      <Col {...colProps}>
        <StatCard
          icon="bi-file-earmark-text"
          title="Contratos em 30 dias"
          value={contratos30}
          subtitle="A vencer no mês"
          variant={contratos30 > 0 ? "warning" : "secondary"}
          alert={contratos30 > 0}
          hrefHash="#dashboard-contratos"
        />
      </Col>
      <Col {...colProps}>
        <StatCard
          icon="bi-diagram-3"
          title="Setores sem lotação"
          value={setoresSemLotacao}
          subtitle={`de ${totalSetores} na estrutura`}
          variant={setoresSemLotacao > 0 ? "warning" : "info"}
          alert={setoresSemLotacao > 0}
          hrefHash="#dashboard-estrutura"
        />
      </Col>
      {isAdmin && (
        <Col {...colProps}>
          <StatCard
            icon="bi-currency-dollar"
            title="Folha total"
            value={payroll ? formatCurrency(payroll.total) : "—"}
            subtitle={
              payroll
                ? `Média ${formatCurrency(payroll.media)}`
                : "Carregando…"
            }
            variant="dark"
            hrefHash="#dashboard-folha"
          />
        </Col>
      )}
    </Row>
  );
}
