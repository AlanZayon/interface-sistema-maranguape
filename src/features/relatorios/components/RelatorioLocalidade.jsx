import {
  RelatorioSection,
  RelatorioTable,
} from "./RelatorioShared";
import { formatarPercentual } from "../utils/format";

const cidadeColumns = [
  { key: "chave", label: "Cidade" },
  {
    key: "count",
    label: "Servidores",
    align: "right",
  },
  {
    key: "percentual",
    label: "%",
    align: "right",
    render: (row) => formatarPercentual(row.percentual),
  },
];

const bairroColumns = [
  { key: "chave", label: "Bairro" },
  {
    key: "cidade",
    label: "Cidade",
    render: (row) => row.cidade || "—",
  },
  {
    key: "count",
    label: "Servidores",
    align: "right",
  },
  {
    key: "percentual",
    label: "%",
    align: "right",
    render: (row) => formatarPercentual(row.percentual),
  },
];

export default function RelatorioLocalidade({ data }) {
  const { porCidade = [], porBairro = [] } = data.agrupamentos || {};

  return (
    <>
      <RelatorioSection title="Distribuição por cidade">
        <p className="relatorio-meta-line">
          Total de servidores no escopo:{" "}
          <strong>{data.resumo?.totalFuncionarios ?? 0}</strong>
        </p>
        <RelatorioTable columns={cidadeColumns} rows={porCidade} />
      </RelatorioSection>
      <RelatorioSection title="Detalhamento por bairro" breakBefore>
        <RelatorioTable columns={bairroColumns} rows={porBairro} />
      </RelatorioSection>
    </>
  );
}
