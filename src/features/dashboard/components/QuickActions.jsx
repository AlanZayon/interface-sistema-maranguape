import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useShellActions } from "@shared/ui/AppShell";

export default function QuickActions({ onRefresh, refreshing }) {
  const navigate = useNavigate();
  const { openCreateFuncionario, openOrganogram } = useShellActions();

  return (
    <ButtonGroup size="sm">
      <Button
        variant="outline-secondary"
        onClick={onRefresh}
        disabled={refreshing}
        title="Atualizar"
      >
        <i className={`bi bi-arrow-clockwise${refreshing ? " spin" : ""}`} />
        <span className="ms-1 d-none d-md-inline">Atualizar</span>
      </Button>
      <Button variant="outline-primary" onClick={() => openCreateFuncionario()}>
        <i className="bi bi-person-plus" />
        <span className="ms-1 d-none d-md-inline">Novo</span>
      </Button>
      <Button variant="outline-primary" onClick={() => navigate("/estrutura")}>
        <i className="bi bi-diagram-3" />
        <span className="ms-1 d-none d-md-inline">Organização</span>
      </Button>
      <Button variant="outline-primary" onClick={() => openOrganogram()}>
        <i className="bi bi-bounding-box" />
        <span className="ms-1 d-none d-md-inline">Organograma</span>
      </Button>
    </ButtonGroup>
  );
}
