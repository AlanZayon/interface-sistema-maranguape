import { formatarReais } from "../utils/format";

function RelatorioTable({ columns, rows, emptyMessage = "Sem dados." }) {
  if (!rows?.length) {
    return <p className="relatorio-empty">{emptyMessage}</p>;
  }

  return (
    <table className="relatorio-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.align ? `is-${col.align}` : undefined}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id || row.chave || idx}>
            {columns.map((col) => (
              <td
                key={col.key}
                className={col.align ? `is-${col.align}` : undefined}
              >
                {col.render ? col.render(row, idx) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RelatorioKpis({ resumo }) {
  if (!resumo) return null;
  return (
    <div className="relatorio-kpis">
      <div className="relatorio-kpi">
        <span className="relatorio-kpi__label">Funcionários</span>
        <span className="relatorio-kpi__value">{resumo.totalFuncionarios}</span>
      </div>
      <div className="relatorio-kpi">
        <span className="relatorio-kpi__label">Folha total</span>
        <span className="relatorio-kpi__value">
          {formatarReais(resumo.totalSalarios)}
        </span>
      </div>
      <div className="relatorio-kpi">
        <span className="relatorio-kpi__label">Média salarial</span>
        <span className="relatorio-kpi__value">
          {formatarReais(resumo.mediaSalarial)}
        </span>
      </div>
    </div>
  );
}

export function RelatorioSection({ title, children, breakBefore = false }) {
  return (
    <section
      className={`relatorio-section${breakBefore ? " relatorio-section--break" : ""}`}
    >
      <h2 className="relatorio-section__title">{title}</h2>
      {children}
    </section>
  );
}

export { RelatorioTable };
