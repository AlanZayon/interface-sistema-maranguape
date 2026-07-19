import React from "react";
import { Card, ListGroup } from "react-bootstrap";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmptyState, LoadingState } from "@shared/ui";

const ACTION_LABELS = {
  CREATE: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Excluiu",
  LOGIN: "Login",
};

const ENTITY_LABELS = {
  setor: "setor",
  funcionario: "funcionário",
  user: "usuário",
  referencia: "referência",
  tenant: "tenant",
};

function describeAction(item) {
  const verb = ACTION_LABELS[item.action] || item.action || "Ação";
  const entity = ENTITY_LABELS[item.entity] || item.entity || "registro";
  const name =
    item.meta?.nome ||
    item.meta?.name ||
    item.meta?.username ||
    null;

  if (name) {
    return `${verb} ${entity} “${name}”`;
  }
  return `${verb} ${entity}`;
}

export default function AuditFeed({ data, isLoading, error }) {
  const items = data?.items || [];

  return (
    <Card className="border h-100">
      <Card.Header className="bg-white fw-semibold py-2">
        Atividade recente
      </Card.Header>
      <Card.Body className="p-0">
        {isLoading ? (
          <div className="p-3">
            <LoadingState label="Carregando auditoria…" />
          </div>
        ) : error ? (
          <div className="p-3 text-danger small">
            Não foi possível carregar o log de auditoria.
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="bi-clock-history"
            title="Sem atividade"
            description="Ainda não há eventos de auditoria registrados."
          />
        ) : (
          <ListGroup variant="flush" className="dashboard-scroll-body">
            {items.map((item) => {
              const when = item.createdAt
                ? formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })
                : "—";
              const who = item.username || "sistema";
              return (
                <ListGroup.Item key={item._id} className="py-2">
                  <div className="fw-medium small">{describeAction(item)}</div>
                  <div className="text-muted small">
                    {who} · {when}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
