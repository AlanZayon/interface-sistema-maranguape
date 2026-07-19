import { useMemo, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Spinner } from "react-bootstrap";
import { useTenant } from "@shared/context/TenantContext";
import { applyBrandingVars } from "@shared/lib/tenant";
import { useRelatorioData } from "../hooks/useRelatorioData";
import RelatorioDocument from "./RelatorioDocument";
import { TITULOS_TIPO } from "../utils/format";
import "../styles/relatorio.css";

const TIPOS_VALIDOS = ["geral", "salarial", "referencias", "localidade"];

export default function RelatorioPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { branding: contextBranding } = useTenant();

  const { ids, tipo } = useMemo(() => {
    const stateIds = location.state?.ids;
    const stateTipo = location.state?.tipo;
    const queryTipo = searchParams.get("tipo");
    const resolvedTipo = TIPOS_VALIDOS.includes(stateTipo)
      ? stateTipo
      : TIPOS_VALIDOS.includes(queryTipo)
        ? queryTipo
        : "geral";
    return {
      ids: Array.isArray(stateIds) ? stateIds : [],
      tipo: resolvedTipo,
    };
  }, [location.state, searchParams]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useRelatorioData(ids, tipo, ids.length > 0);

  /** Prefer branding snapshot from the API (tenant at report time). */
  const branding = useMemo(() => {
    if (data?.branding) {
      return { ...contextBranding, ...data.branding };
    }
    return contextBranding;
  }, [data?.branding, contextBranding]);

  const tipoLabel = TITULOS_TIPO[tipo] || "Relatório";

  useEffect(() => {
    if (data?.branding) {
      applyBrandingVars(data.branding);
    }
  }, [data?.branding]);

  useEffect(() => {
    const prev = document.title;
    const date = new Date().toISOString().split("T")[0];
    const org = branding?.displayName;
    document.title = data?.titulo
      ? `${data.titulo} — ${date}`
      : org
        ? `${tipoLabel} — ${org} — ${date}`
        : `${tipoLabel} — ${date}`;
    return () => {
      document.title = prev;
    };
  }, [data?.titulo, tipoLabel, branding?.displayName]);

  const handleBack = () => {
    const returnTo = location.state?.returnTo;
    if (typeof returnTo === "string" && returnTo.startsWith("/")) {
      navigate(returnTo);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/estrutura?view=funcionarios");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relatorio-preview">
      <header className="relatorio-toolbar no-print">
        <div className="relatorio-toolbar__left">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleBack}
            className="relatorio-toolbar__btn"
          >
            <i className="bi bi-arrow-left me-1" aria-hidden />
            Voltar
          </Button>
          <div className="relatorio-toolbar__info">
            <span className="relatorio-toolbar__title">{tipoLabel}</span>
            <span className="relatorio-toolbar__hint">
              Confira o documento abaixo. Use &quot;Gerar PDF&quot; e escolha
              &quot;Salvar como PDF&quot; no diálogo de impressão.
            </span>
          </div>
        </div>
        <div className="relatorio-toolbar__actions">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => refetch()}
            disabled={!ids.length || isFetching}
            className="relatorio-toolbar__btn"
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden />
            Atualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={!data || isLoading}
            className="relatorio-toolbar__btn"
          >
            <i className="bi bi-file-earmark-pdf me-1" aria-hidden />
            Gerar PDF
          </Button>
        </div>
      </header>

      <main className="relatorio-preview__stage">
        {ids.length === 0 && (
          <div className="relatorio-state no-print">
            <i className="bi bi-exclamation-circle relatorio-state__icon" />
            <h2>Nenhum funcionário selecionado</h2>
            <p>
              Volte à lista de funcionários, selecione os registros e abra a
              pré-visualização novamente.
            </p>
            <Button variant="primary" onClick={handleBack}>
              Voltar à lista
            </Button>
          </div>
        )}

        {ids.length > 0 && isLoading && (
          <div className="relatorio-state no-print">
            <Spinner animation="border" role="status" />
            <p className="mt-3 mb-0">Carregando relatório…</p>
          </div>
        )}

        {ids.length > 0 && isError && (
          <div className="relatorio-state no-print">
            <i className="bi bi-x-circle relatorio-state__icon text-danger" />
            <h2>Não foi possível carregar o relatório</h2>
            <p>
              {error?.response?.data?.error ||
                error?.message ||
                "Erro desconhecido."}
            </p>
            <Button variant="outline-primary" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {data && !isLoading && (
          <RelatorioDocument data={data} branding={branding} />
        )}
      </main>
    </div>
  );
}
