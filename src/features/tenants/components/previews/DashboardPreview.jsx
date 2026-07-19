import React from "react";

/**
 * Mini dashboard matching production layout (PageHeader + KPI StatCards + chart row).
 * Do NOT use `.app-shell` here — that class is a horizontal flex layout and breaks this preview.
 */
export default function DashboardPreview({ branding = {}, name = "" }) {
  const displayName = branding.displayName || name || "Preview";
  const primary = branding.primaryColor || "#1a5f2a";
  const secondary = branding.secondaryColor || "#0d6efd";

  const kpis = [
    {
      icon: "bi-people",
      title: "Funcionários",
      value: "128",
      subtitle: "Total cadastrado",
      color: primary,
    },
    {
      icon: "bi-pie-chart",
      title: "Cotas",
      value: "72%",
      subtitle: "Preenchidas",
      color: "#198754",
    },
    {
      icon: "bi-file-earmark-text",
      title: "Contratos",
      value: "5",
      subtitle: "Em 30 dias",
      color: "#ffc107",
    },
    {
      icon: "bi-currency-dollar",
      title: "Folha",
      value: "R$ 1,2M",
      subtitle: "Total mensal",
      color: secondary,
    },
  ];

  return (
    <div
      className="dashboard-page"
      style={{
        minHeight: 360,
        padding: 12,
        background: "var(--brand-bg)",
        color: "var(--brand-text)",
        fontFamily: "var(--font-family)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.3,
            color: "var(--brand-text)",
          }}
        >
          Dashboard
        </div>
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 2 }}>
          Visão geral · {displayName}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="dashboard-stat"
            style={{
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              borderRadius: 8,
              padding: "10px 10px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: kpi.color,
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 13,
              }}
            >
              <i className={`bi ${kpi.icon}`} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--brand-muted)" }}>
                {kpi.title}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: "var(--brand-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 2 }}>
                {kpi.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 8,
            padding: 10,
            minHeight: 88,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            Por natureza
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
            {[65, 40, 80, 55].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: "3px 3px 0 0",
                  background:
                    i % 2 === 0
                      ? primary
                      : `color-mix(in srgb, ${primary} 45%, transparent)`,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 8,
            padding: 10,
            minHeight: 88,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            Por secretaria
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Saúde", pct: 70 },
              { label: "Educação", pct: 45 },
              { label: "Admin", pct: 30 },
            ].map((row) => (
              <div key={row.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 9,
                    color: "var(--brand-muted)",
                    marginBottom: 2,
                  }}
                >
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background: "var(--brand-bg)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${row.pct}%`,
                      height: "100%",
                      background: secondary,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-brand"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: 0,
          borderRadius: 6,
          padding: "7px 12px",
          background: primary,
          color: branding.primaryContrast || "#fff",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "var(--font-family)",
          whiteSpace: "nowrap",
        }}
      >
        <i className="bi bi-arrow-clockwise" aria-hidden="true" />
        Atualizar
      </button>
    </div>
  );
}
