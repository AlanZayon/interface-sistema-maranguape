import React from "react";

/**
 * @param {{ title: string, subtitle?: string, actions?: React.ReactNode, children?: React.ReactNode }} props
 */
export default function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="page-header">
      <div className="page-header__titles">
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {(actions || children) && (
        <div className="page-header__toolbar">{actions || children}</div>
      )}
    </div>
  );
}
