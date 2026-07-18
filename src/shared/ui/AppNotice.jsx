import React from "react";

const VARIANT_META = {
  danger: { icon: "bi-exclamation-triangle-fill", role: "alert" },
  warning: { icon: "bi-exclamation-circle-fill", role: "status" },
  success: { icon: "bi-check-circle-fill", role: "status" },
  info: { icon: "bi-info-circle-fill", role: "status" },
};

/**
 * Aviso inline do design system — substitui react-bootstrap Alert.
 *
 * @param {{
 *   variant?: 'danger' | 'warning' | 'success' | 'info',
 *   children: React.ReactNode,
 *   className?: string,
 *   dismissible?: boolean,
 *   onClose?: () => void,
 *   icon?: string | false,
 * }} props
 */
export default function AppNotice({
  variant = "danger",
  children,
  className = "",
  dismissible = false,
  onClose,
  icon,
}) {
  const meta = VARIANT_META[variant] || VARIANT_META.danger;
  const iconClass = icon === false ? null : icon || meta.icon;

  return (
    <div
      className={`app-notice app-notice--${variant}${className ? ` ${className}` : ""}`}
      role={meta.role}
    >
      {iconClass ? (
        <i className={`bi ${iconClass} app-notice__icon`} aria-hidden="true" />
      ) : null}
      <div className="app-notice__body">{children}</div>
      {dismissible && onClose ? (
        <button
          type="button"
          className="app-notice__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
