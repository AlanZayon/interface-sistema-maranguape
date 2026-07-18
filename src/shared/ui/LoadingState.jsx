import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * @param {{ label?: string, minHeight?: string | number }} props
 */
export default function LoadingState({
  label = "Carregando...",
  minHeight = "12rem",
}) {
  return (
    <div
      className="loading-state"
      role="status"
      aria-live="polite"
      style={{ minHeight }}
    >
      <Spinner animation="border" variant="primary" className="loading-state__icon">
        <span className="visually-hidden">{label}</span>
      </Spinner>
      <span className="small">{label}</span>
    </div>
  );
}
