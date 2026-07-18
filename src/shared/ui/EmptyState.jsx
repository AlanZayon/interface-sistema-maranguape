import React from "react";

/**
 * @param {{ icon?: string, title: string, description?: string, action?: React.ReactNode }} props
 */
export default function EmptyState({
  icon = "bi-inbox",
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state" role="status">
      <i className={`bi ${icon} empty-state__icon`} aria-hidden="true" />
      <div className="empty-state__title">{title}</div>
      {description ? (
        <p className="empty-state__description mb-0">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
