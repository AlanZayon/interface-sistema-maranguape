import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AppNotice } from "@shared/ui";

/**
 * Highlights the strongest operational signal when sectors lack staff.
 */
export default function AttentionBanner({ estrutura }) {
  const count = estrutura?.setoresSemLotacao ?? 0;
  const vazios = estrutura?.setoresVazios || [];

  if (count <= 0) return null;

  return (
    <AppNotice variant="warning" className="dashboard-attention mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <div className="fw-semibold">
            {count} setor{count === 1 ? "" : "es"} sem funcionários lotados
          </div>
          {vazios.length > 0 && (
            <div className="small mt-1">
              {vazios.slice(0, 4).map((s, i) => (
                <span key={s.id}>
                  {i > 0 && " · "}
                  <Link to={`/estrutura/${s.id}`} className="app-notice__link">
                    {s.nome || "Sem nome"}
                  </Link>
                </span>
              ))}
              {count > vazios.length && (
                <span className="text-muted">
                  {" "}
                  e mais {count - vazios.length}
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          as={Link}
          to="/estrutura"
          size="sm"
          variant="outline-dark"
          className="flex-shrink-0"
        >
          Abrir estrutura
        </Button>
      </div>
    </AppNotice>
  );
}
