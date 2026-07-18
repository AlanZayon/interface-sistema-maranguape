import {
  RelatorioKpis,
  RelatorioSection,
  RelatorioTable,
} from "./RelatorioShared";
import { formatarPercentual, formatarReais } from "../utils/format";

const aggColumns = [
  { key: "chave", label: "Grupo" },
  {
    key: "count",
    label: "Qtd.",
    align: "right",
  },
  {
    key: "percentual",
    label: "%",
    align: "right",
    render: (row) => formatarPercentual(row.percentual),
  },
  {
    key: "totalSalario",
    label: "Total salarial",
    align: "right",
    render: (row) => formatarReais(row.totalSalario),
  },
  {
    key: "mediaSalarial",
    label: "Média",
    align: "right",
    render: (row) => formatarReais(row.mediaSalarial),
  },
];

export default function RelatorioSalarial({ data }) {
  const { porNatureza = [], porSecretaria = [] } = data.agrupamentos || {};

  return (
    <>
      <RelatorioSection title="Resumo geral">
        <RelatorioKpis resumo={data.resumo} />
      </RelatorioSection>
      <RelatorioSection title="Distribuição por natureza do cargo">
        <RelatorioTable columns={aggColumns} rows={porNatureza} />
      </RelatorioSection>
      <RelatorioSection title="Distribuição por secretaria" breakBefore>
        <RelatorioTable columns={aggColumns} rows={porSecretaria} />
      </RelatorioSection>
    </>
  );
}
