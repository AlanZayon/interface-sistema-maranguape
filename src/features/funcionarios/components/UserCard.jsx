import React from "react";
import { Badge, Button, Form } from "react-bootstrap";
import { isElevatedRole } from "@features/auth";

const PLACEHOLDER_PHOTO =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

/**
 * Card compacto de funcionário — hierarquia clara e ações no rodapé.
 * Detalhes abrem via onDetails (modal), não expandem no grid.
 */
export default function UserCard({
  user,
  style,
  role,
  selectionActive = false,
  selected = false,
  onSelect,
  onDetails,
  onEdit,
  onDelete,
}) {
  if (!user) return null;

  const canManage = isElevatedRole(role);

  return (
    <div style={style} className="user-card-cell">
      <article className="user-card">
        <header className="user-card__header">
          <div className="user-card__title-row">
            {selectionActive && (
              <Form.Check
                type="checkbox"
                checked={selected}
                onChange={() => onSelect?.(user._id)}
                className="user-card__checkbox"
                aria-label={`Selecionar ${user.nome}`}
              />
            )}
            <h3 className="user-card__name" title={user.nome}>
              {user.nome}
            </h3>
          </div>
          {user.natureza ? (
            <Badge bg="secondary" className="user-card__badge">
              {user.natureza}
            </Badge>
          ) : null}
        </header>

        <div className="user-card__body">
          <img
            src={user.fotoUrl || PLACEHOLDER_PHOTO}
            alt=""
            className="user-card__photo"
          />
          <dl className="user-card__meta">
            <div className="user-card__meta-item user-card__meta-item--primary">
              <dt>Função</dt>
              <dd title={user.funcao || undefined}>{user.funcao || "—"}</dd>
            </div>
            <div className="user-card__meta-item">
              <dt>Secretaria</dt>
              <dd title={user.secretaria || undefined}>{user.secretaria || "—"}</dd>
            </div>
            {user.referencia ? (
              <div className="user-card__meta-item">
                <dt>Referência</dt>
                <dd title={user.referencia}>{user.referencia}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <footer className="user-card__actions">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onDetails?.(user)}
            aria-label={`Ver detalhes de ${user.nome}`}
          >
            <i className="bi bi-info-circle me-1" aria-hidden="true" />
            Detalhes
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onEdit?.(user._id)}
                aria-label={`Editar ${user.nome}`}
              >
                <i className="bi bi-pencil me-1" aria-hidden="true" />
                Editar
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete?.(user._id)}
                aria-label={`Excluir ${user.nome}`}
              >
                <i className="bi bi-trash me-1" aria-hidden="true" />
                Excluir
              </Button>
            </>
          )}
        </footer>
      </article>
    </div>
  );
}
