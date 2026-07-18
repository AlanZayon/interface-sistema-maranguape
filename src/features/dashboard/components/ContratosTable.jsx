import React from "react";
import { Card, Badge, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { EmptyState } from "@shared/ui";

function windowBadge(dias) {
  if (dias <= 30) return { bg: "danger", label: "30d" };
  if (dias <= 60) return { bg: "warning", label: "60d" };
  return { bg: "secondary", label: "90d" };
}

export default function ContratosTable({ items = [], buckets }) {
  const isEmpty = !items || items.length === 0;
  const totalBuckets =
    (buckets?.in30 ?? 0) + (buckets?.in31to60 ?? 0) + (buckets?.in61to90 ?? 0);

  return (
    <Card
      id="dashboard-contratos"
      className={`border h-100${isEmpty ? " dashboard-card--compact" : ""}`}
    >
      <Card.Header className="bg-white fw-semibold py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span>Contratos a vencer</span>
        {buckets && totalBuckets > 0 && (
          <div className="d-flex gap-2 small">
            <Badge bg="danger">{buckets.in30 ?? 0} em 30d</Badge>
            <Badge bg="warning" text="dark">
              {buckets.in31to60 ?? 0} em 31–60d
            </Badge>
            <Badge bg="secondary">{buckets.in61to90 ?? 0} em 61–90d</Badge>
          </div>
        )}
      </Card.Header>
      <Card.Body className={isEmpty ? "py-3" : "p-0"}>
        {isEmpty ? (
          <EmptyState
            icon="bi-check-circle"
            title="Nenhum vencimento próximo"
            description="Não há contratos TEMPORÁRIO nas janelas de 30, 60 ou 90 dias."
          />
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nome</th>
                  <th>Natureza</th>
                  <th>Secretaria</th>
                  <th>Vencimento</th>
                  <th>Janela</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const badge = windowBadge(item.diasRestantes ?? 999);
                  const fim = item.fimContrato
                    ? format(new Date(item.fimContrato), "dd/MM/yyyy")
                    : "—";
                  return (
                    <tr key={item._id}>
                      <td>
                        <Link
                          to={`/search/${encodeURIComponent(item.nome)}`}
                          className="text-decoration-none"
                        >
                          {item.nome}
                        </Link>
                      </td>
                      <td className="small text-muted">{item.natureza || "—"}</td>
                      <td className="small text-muted">
                        {item.secretaria || "—"}
                      </td>
                      <td className="small">
                        {fim}
                        <div className="text-muted">
                          {item.diasRestantes ?? "—"} dias
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg={badge.bg}
                          text={badge.bg === "warning" ? "dark" : undefined}
                        >
                          {badge.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
