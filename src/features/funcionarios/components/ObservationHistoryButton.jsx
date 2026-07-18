import React from "react";
import { Button } from "react-bootstrap";

/**
 * @param {{
 *   onClick?: () => void,
 *   className?: string,
 *   count?: number,
 *   label?: string,
 *   variant?: string,
 *   size?: string,
 * }} props
 */
function ObservationHistoryButton({
  onClick,
  className = "",
  count,
  label = "Observações",
  variant = "outline-secondary",
  size = "sm",
}) {
  const hasCount = typeof count === "number" && count > 0;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`obs-history-btn${className ? ` ${className}` : ""}`}
      onClick={onClick}
      aria-label={
        hasCount
          ? `${label} (${count} ${count === 1 ? "registro" : "registros"})`
          : label
      }
    >
      <i className="bi bi-journal-text" aria-hidden="true" />
      <span>{label}</span>
      {hasCount ? (
        <span className="obs-history-btn__count" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

export default ObservationHistoryButton;
