import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

/**
 * @param {{
 *   icon: string,
 *   title: string,
 *   value: React.ReactNode,
 *   subtitle?: string,
 *   variant?: string,
 *   alert?: boolean,
 *   to?: string,
 *   hrefHash?: string,
 * }} props
 */
export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  variant = "primary",
  alert = false,
  to,
  hrefHash,
}) {
  const className = `h-100 border dashboard-stat${alert ? " dashboard-stat--alert" : ""}${
    to || hrefHash ? " dashboard-stat--clickable" : ""
  }`;

  const body = (
    <Card.Body className="d-flex align-items-start gap-3 py-3">
      <div
        className={`rounded p-2 text-white bg-${variant} d-inline-flex`}
        aria-hidden="true"
      >
        <i className={`bi ${icon} fs-5`} />
      </div>
      <div className="min-w-0 flex-grow-1">
        <div className="text-muted small">{title}</div>
        <div className="fs-4 fw-semibold lh-1 text-truncate">{value ?? "—"}</div>
        {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
        {(to || hrefHash) && (
          <div className="small text-primary mt-1">Ver detalhes →</div>
        )}
      </div>
    </Card.Body>
  );

  if (to) {
    return (
      <Card as={Link} to={to} className={`${className} text-decoration-none text-reset`}>
        {body}
      </Card>
    );
  }

  if (hrefHash) {
    return (
      <Card
        as="a"
        href={hrefHash}
        className={`${className} text-decoration-none text-reset`}
        onClick={(e) => {
          const el = document.querySelector(hrefHash);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        {body}
      </Card>
    );
  }

  return <Card className={className}>{body}</Card>;
}
