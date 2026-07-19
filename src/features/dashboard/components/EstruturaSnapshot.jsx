import React, { useState } from "react";
import { Card, Badge, ListGroup, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { EmptyState } from "@shared/ui";

/**
 * Shows largest sectors or sectors without staff (actionable list).
 */
export default function EstruturaSnapshot({ estrutura }) {
  const topSetores = estrutura?.topSetores || [];
  const setoresVazios = estrutura?.setoresVazios || [];
  const semLotacao = estrutura?.setoresSemLotacao ?? 0;
  const defaultTab = semLotacao > 0 && topSetores.length === 0 ? "vazios" : "maiores";
  const [tab, setTab] = useState(defaultTab);

  const list = tab === "vazios" ? setoresVazios : topSetores;
  const showTabs = semLotacao > 0 && topSetores.length > 0;

  return (
    <Card id="dashboard-estrutura" className="border h-100">
      <Card.Header className="bg-white fw-semibold py-2 d-flex justify-content-between align-items-center gap-2">
        <span>{tab === "vazios" ? "Setores sem lotação" : "Maiores setores"}</span>
        <Link to="/estrutura" className="small text-decoration-none">
          Ver organização
        </Link>
      </Card.Header>
      {showTabs && (
        <Nav variant="tabs" className="px-2 pt-1 dashboard-estrutura-tabs">
          <Nav.Item>
            <Nav.Link
              active={tab === "maiores"}
              onClick={() => setTab("maiores")}
              className="py-1 px-2 small"
            >
              Maiores
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={tab === "vazios"}
              onClick={() => setTab("vazios")}
              className="py-1 px-2 small"
            >
              Sem lotação
              <Badge bg="warning" text="dark" pill className="ms-1">
                {semLotacao}
              </Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}
      <Card.Body className="p-0">
        {list.length === 0 ? (
          <EmptyState
            icon="bi-diagram-3"
            title={
              tab === "vazios"
                ? "Todos os setores têm lotação"
                : "Nenhum setor com lotação"
            }
            description={
              tab === "vazios"
                ? "A organização está completa em termos de lotação."
                : "Cadastre funcionários com lotação para ver o ranking."
            }
          />
        ) : (
          <ListGroup variant="flush" className="dashboard-scroll-body">
            {list.map((setor, idx) => (
              <ListGroup.Item
                key={setor.id}
                className="d-flex justify-content-between align-items-center py-2"
                action
                as={Link}
                to={`/estrutura/${setor.id}`}
              >
                <span className="text-truncate">
                  <span className="text-muted me-2">{idx + 1}.</span>
                  {setor.nome || "Sem nome"}
                </span>
                {tab === "vazios" ? (
                  <Badge bg="warning" text="dark" pill>
                    vazio
                  </Badge>
                ) : (
                  <Badge bg="primary" pill>
                    {setor.total}
                  </Badge>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
