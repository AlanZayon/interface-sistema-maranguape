import {
  RelatorioKpis,
  RelatorioSection,
  RelatorioTable,
} from "./RelatorioShared";
import { formatarReais } from "../utils/format";

const columns = [
  {
    key: "idx",
    label: "#",
    align: "right",
    render: (_row, idx) => idx + 1,
  },
  { key: "nome", label: "Nome" },
  {
    key: "secretaria",
    label: "Secretaria",
    render: (row) => row.secretaria || "—",
  },
  {
    key: "funcao",
    label: "Função",
    render: (row) => row.funcao || "—",
  },
  {
    key: "natureza",
    label: "Natureza",
    render: (row) => row.natureza || "—",
  },
  {
    key: "salarioBruto",
    label: "Salário bruto",
    align: "right",
    render: (row) => formatarReais(row.salarioBruto),
  },
];

export default function RelatorioGeral({ data }) {
  return (
    <>
      <RelatorioSection title="Resumo">
        <RelatorioKpis resumo={data.resumo} />
      </RelatorioSection>
      <RelatorioSection title="Listagem de funcionários">
        <RelatorioTable
          columns={columns}
          rows={data.funcionarios}
          emptyMessage="Nenhum funcionário neste relatório."
        />
      </RelatorioSection>
    </>
  );
}
