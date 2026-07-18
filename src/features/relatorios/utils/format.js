export function formatarReais(valor) {
  const n = typeof valor === "number" && !Number.isNaN(valor) ? valor : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR")}`;
}

export function formatarPercentual(valor) {
  const n = typeof valor === "number" && !Number.isNaN(valor) ? valor : 0;
  return `${n.toFixed(2).replace(".", ",")}%`;
}

export const TITULOS_TIPO = {
  geral: "Relatório Geral",
  salarial: "Relatório Salarial",
  referencias: "Relatório de Indicações",
  localidade: "Relatório de Localidade",
};
