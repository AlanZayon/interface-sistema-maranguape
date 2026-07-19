import RelatorioGeral from "./RelatorioGeral";
import RelatorioSalarial from "./RelatorioSalarial";
import RelatorioReferencias from "./RelatorioReferencias";
import RelatorioLocalidade from "./RelatorioLocalidade";
import { formatarDataHora } from "../utils/format";

function RelatorioBody({ data }) {
  switch (data.tipo) {
    case "salarial":
      return <RelatorioSalarial data={data} />;
    case "referencias":
      return <RelatorioReferencias data={data} />;
    case "localidade":
      return <RelatorioLocalidade data={data} />;
    case "geral":
    default:
      return <RelatorioGeral data={data} />;
  }
}

/** CSS vars scoped to the print document so PDF mirrors tenant branding. */
function buildDocumentStyle(branding) {
  if (!branding) return undefined;
  const style = {};
  if (branding.primaryColor) {
    style["--relatorio-brand"] = branding.primaryColor;
  }
  if (branding.textColor) {
    style["--relatorio-ink"] = branding.textColor;
  }
  if (branding.mutedColor) {
    style["--relatorio-muted"] = branding.mutedColor;
  }
  if (branding.borderColor) {
    style["--relatorio-border"] = branding.borderColor;
  }
  if (branding.surfaceBg) {
    style["--relatorio-surface"] = branding.surfaceBg;
  }
  if (branding.pageBg || branding.surfaceBg) {
    style["--relatorio-paper"] = branding.surfaceBg || "#ffffff";
  }
  if (branding.fontFamily) {
    style.fontFamily = branding.fontFamily;
  }
  return Object.keys(style).length ? style : undefined;
}

export default function RelatorioDocument({ data, branding }) {
  const logoUrl = branding?.logoUrl;
  const orgao =
    branding?.displayName ||
    branding?.orgName ||
    "Organização";

  return (
    <article
      className="relatorio-document"
      aria-label={data.titulo}
      style={buildDocumentStyle(branding)}
    >
      <header className="relatorio-doc-header">
        <div className="relatorio-doc-header__brand">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="relatorio-doc-header__logo"
            />
          ) : (
            <div className="relatorio-doc-header__logo-fallback" aria-hidden>
              <i className="bi bi-building" />
            </div>
          )}
          <div>
            <p className="relatorio-doc-header__orgao">{orgao}</p>
            <p className="relatorio-doc-header__sub">
              Sistema de Gestão de Pessoal
            </p>
          </div>
        </div>
        <div className="relatorio-doc-header__meta">
          <p>
            Emitido em{" "}
            <strong>{formatarDataHora(data.geradoEm)}</strong>
          </p>
          <p>
            Escopo:{" "}
            <strong>
              {data.resumo?.totalFuncionarios ?? data.funcionarios?.length ?? 0}{" "}
              funcionário(s)
            </strong>
          </p>
        </div>
      </header>

      <h1 className="relatorio-doc-title">{data.titulo}</h1>

      {data.avisos?.length > 0 && (
        <div className="relatorio-avisos" role="status">
          {data.avisos.map((aviso) => (
            <p key={aviso}>{aviso}</p>
          ))}
        </div>
      )}

      <RelatorioBody data={data} />

      <footer className="relatorio-doc-footer">
        <span>{orgao}</span>
        <span>{formatarDataHora(data.geradoEm)}</span>
      </footer>
    </article>
  );
}
