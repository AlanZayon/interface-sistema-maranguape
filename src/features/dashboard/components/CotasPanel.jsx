import React from "react";
import { Card, Badge, ProgressBar, ListGroup, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { EmptyState } from "@shared/ui";

export default function CotasPanel({ cotas = [], isAdmin = false }) {
  const isEmpty = cotas.length === 0;

  return (
    <Card
      id="dashboard-cotas"
      className={`border h-100${isEmpty ? " dashboard-card--compact" : ""}`}
    >
      <Card.Header className="bg-white fw-semibold py-2 d-flex justify-content-between align-items-center">
        <span>Cotas (simbologia)</span>
        {isAdmin && (
          <Link to="/cargos-comissionados" className="small text-decoration-none">
            Gerenciar
          </Link>
        )}
      </Card.Header>
      <Card.Body className={isEmpty ? "py-3" : "p-0"}>
        {isEmpty ? (
          <EmptyState
            icon="bi-pie-chart"
            title="Nenhuma cota configurada"
            description="Cadastre simbologias para monitorar vagas de comissionados."
            action={
              isAdmin ? (
                <Button as={Link} to="/cargos-comissionados" size="sm" variant="outline-primary">
                  Configurar cotas
                </Button>
              ) : null
            }
          />
        ) : (
          <ListGroup variant="flush">
            {cotas.map((cota) => {
              const limite = cota.limite ?? cota.vagas ?? 0;
              const ocupadas = cota.ocupadas ?? 0;
              const pct =
                typeof cota.pct === "number"
                  ? Math.min(cota.pct, 100)
                  : limite > 0
                    ? Math.min(Math.round((ocupadas / limite) * 100), 100)
                    : 0;
              const estourada = cota.estourada || ocupadas > limite;
              const variant = estourada ? "danger" : pct >= 90 ? "warning" : "success";

              return (
                <ListGroup.Item key={cota.simbologia} className="py-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium">{cota.simbologia}</span>
                    <Badge bg={estourada ? "danger" : "secondary"}>
                      {ocupadas} / {limite}
                      {estourada ? " · estourada" : ""}
                    </Badge>
                  </div>
                  <ProgressBar now={pct} variant={variant} style={{ height: 8 }} />
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
