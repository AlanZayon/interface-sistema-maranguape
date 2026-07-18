import React from "react";
import { Card, Table, Badge } from "react-bootstrap";
import { EmptyState, LoadingState } from "@shared/ui";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PayrollPanel({ data, isLoading, error }) {
  if (isLoading) {
    return (
      <Card id="dashboard-folha" className="border h-100">
        <Card.Header className="bg-white fw-semibold py-2">Folha salarial</Card.Header>
        <Card.Body>
          <LoadingState label="Carregando folha…" />
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card id="dashboard-folha" className="border h-100">
        <Card.Header className="bg-white fw-semibold py-2">Folha salarial</Card.Header>
        <Card.Body className="text-danger small">
          Não foi possível carregar os dados salariais.
        </Card.Body>
      </Card>
    );
  }

  const byNatureza = data?.byNatureza || [];

  return (
    <Card id="dashboard-folha" className="border h-100">
      <Card.Header className="bg-white fw-semibold py-2 d-flex justify-content-between align-items-center">
        <span>Folha salarial</span>
        <Badge bg="dark">{formatCurrency(data?.total)}</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        {byNatureza.length === 0 ? (
          <EmptyState
            icon="bi-currency-dollar"
            title="Sem dados salariais"
            description="Não há salários cadastrados para agregar."
          />
        ) : (
          <div className="table-responsive">
            <Table className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Natureza</th>
                  <th>Qtd</th>
                  <th>Total</th>
                  <th>Média</th>
                </tr>
              </thead>
              <tbody>
                {byNatureza.map((row) => (
                  <tr key={row.natureza}>
                    <td>{row.natureza}</td>
                    <td>{row.count}</td>
                    <td>{formatCurrency(row.total)}</td>
                    <td>{formatCurrency(row.media)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
