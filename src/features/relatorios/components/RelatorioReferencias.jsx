import {
  RelatorioKpis,
  RelatorioSection,
  RelatorioTable,
} from "./RelatorioShared";
import { formatarPercentual, formatarReais } from "../utils/format";

const columns = [
  {
    key: "idx",
    label: "#",
    align: "right",
    render: (_row, idx) => idx + 1,
  },
  { key: "chave", label: "Referência / indicação" },
  {
    key: "count",
    label: "Indicações",
    align: "right",
  },
  {
    key: "percentual",
    label: "% do total",
    align: "right",
    render: (row) => formatarPercentual(row.percentual),
  },
  {
    key: "mediaSalarial",
    label: "Média salarial",
    align: "right",
    render: (row) => formatarReais(row.mediaSalarial),
  },
  {
    key: "totalSalario",
    label: "Total salarial",
    align: "right",
    render: (row) => formatarReais(row.totalSalario),
  },
];

export default function RelatorioReferencias({ data }) {
  const { porReferencia = [] } = data.agrupamentos || {};
  const totalRefs = porReferencia.length;

  return (
    <>
      <RelatorioSection title="Resumo de indicações">
        <RelatorioKpis resumo={data.resumo} />
        <p className="relatorio-meta-line">
          Referências identificadas: <strong>{totalRefs}</strong>
        </p>
      </RelatorioSection>
      <RelatorioSection title="Detalhamento por referência">
        <RelatorioTable
          columns={columns}
          rows={porReferencia}
          emptyMessage="Nenhuma referência encontrada."
        />
      </RelatorioSection>
    </>
  );
}
