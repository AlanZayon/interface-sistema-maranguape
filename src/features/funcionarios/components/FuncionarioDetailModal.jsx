import React, { useEffect, useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { AppModal } from "@shared/ui";
import ObservationHistoryButton from "./ObservationHistoryButton";
import * as funcionariosApi from "@shared/api/funcionarios";

const PLACEHOLDER_PHOTO =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

function formatCurrency(value) {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "—";
  if (value === "indeterminado") return "Indeterminado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function displayValue(value) {
  if (value == null || value === "") return "—";
  return value;
}

const TABS = [
  { id: "financeiro", label: "Financeiro", icon: "bi-cash-stack" },
  { id: "localidade", label: "Localidade", icon: "bi-geo-alt" },
  { id: "redes-sociais", label: "Redes", icon: "bi-share" },
  {
    id: "contrato",
    label: "Contrato",
    icon: "bi-file-earmark-text",
    onlyTemporario: true,
  },
];

export default function FuncionarioDetailModal({
  show,
  onHide,
  user,
  onViewObservations,
}) {
  const [activeTab, setActiveTab] = useState("financeiro");
  const [midia, setMidia] = useState({ fotoUrl: null, arquivoUrl: null });

  useEffect(() => {
    if (show) setActiveTab("financeiro");
  }, [show, user?._id]);

  useEffect(() => {
    if (!show || !user?._id) {
      setMidia({ fotoUrl: null, arquivoUrl: null });
      return;
    }
    const hasHttpFoto =
      typeof user.fotoUrl === "string" && /^https?:\/\//i.test(user.fotoUrl);
    const hasHttpArquivo =
      typeof user.arquivoUrl === "string" &&
      /^https?:\/\//i.test(user.arquivoUrl);
    if (hasHttpFoto || hasHttpArquivo) {
      setMidia({
        fotoUrl: hasHttpFoto ? user.fotoUrl : null,
        arquivoUrl: hasHttpArquivo ? user.arquivoUrl : null,
      });
      if (hasHttpFoto && hasHttpArquivo) return;
      // still fetch if one side is missing
    }
    let cancelled = false;
    funcionariosApi
      .buscarMidia(user._id)
      .then((data) => {
        if (!cancelled) {
          setMidia((prev) => ({
            fotoUrl: data?.fotoUrl || prev.fotoUrl || null,
            arquivoUrl: data?.arquivoUrl || prev.arquivoUrl || null,
          }));
        }
      })
      .catch(() => {
        /* keep whatever we already have */
      });
    return () => {
      cancelled = true;
    };
  }, [show, user?._id, user?.fotoUrl, user?.arquivoUrl]);

  if (!user) return null;

  const fotoSrc = midia.fotoUrl || user.fotoUrl || PLACEHOLDER_PHOTO;
  const arquivoUrl = midia.arquivoUrl || user.arquivoUrl;

  const visibleTabs = TABS.filter(
    (tab) => !tab.onlyTemporario || user.natureza === "TEMPORARIO"
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "financeiro":
        return (
          <div className="info-card financial-info">
            <h3 className="info-card__title">Financeiro</h3>
            <dl className="info-card__list">
              <div>
                <dt>Salário bruto</dt>
                <dd>{formatCurrency(user.salarioBruto)}</dd>
              </div>
            </dl>
          </div>
        );
      case "localidade":
        return (
          <div className="info-card personal-info">
            <h3 className="info-card__title">Localidade</h3>
            <dl className="info-card__list">
              <div>
                <dt>Cidade</dt>
                <dd>{displayValue(user.cidade)}</dd>
              </div>
              <div>
                <dt>Endereço</dt>
                <dd>{displayValue(user.endereco)}</dd>
              </div>
              <div>
                <dt>Bairro</dt>
                <dd>{displayValue(user.bairro)}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{displayValue(user.telefone)}</dd>
              </div>
            </dl>
          </div>
        );
      case "redes-sociais":
        return (
          <div className="info-card social-info">
            <h3 className="info-card__title">Redes sociais</h3>
            {Array.isArray(user.redesSociais) && user.redesSociais.length > 0 ? (
              <ul className="info-card__links">
                {user.redesSociais.map((social, index) => (
                  <li key={`${social.link}-${index}`}>
                    <a
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      {social.nome || social.link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="info-card__empty">Nenhuma rede social disponível.</p>
            )}
          </div>
        );
      case "contrato":
        return (
          <div className="info-card contract-info">
            <h3 className="info-card__title">Contrato temporário</h3>
            <dl className="info-card__list">
              <div>
                <dt>Início</dt>
                <dd>{formatDate(user.inicioContrato)}</dd>
              </div>
              <div>
                <dt>Fim</dt>
                <dd>{formatDate(user.fimContrato)}</dd>
              </div>
            </dl>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title={user.nome}
      subtitle={user.funcao || undefined}
      icon="bi-person-badge"
      size="lg"
      scrollable
      footer={
        <Button variant="outline-secondary" size="sm" onClick={onHide}>
          Fechar
        </Button>
      }
    >
      <div className="func-detail">
        <div className="func-detail__hero">
          <img
            src={fotoSrc}
            alt=""
            className="func-detail__photo"
          />
          <div className="func-detail__hero-meta">
            {user.natureza ? (
              <Badge bg="secondary">{user.natureza}</Badge>
            ) : null}
            <p className="func-detail__line">
              <span className="text-muted">Secretaria</span>
              {displayValue(user.secretaria)}
            </p>
            {user.referencia ? (
              <p className="func-detail__line">
                <span className="text-muted">Referência</span>
                {user.referencia}
              </p>
            ) : null}
          </div>
        </div>

        <div className="func-detail__secondary-actions">
          <ObservationHistoryButton onClick={() => onViewObservations?.(user._id)} />
          {(arquivoUrl || user.arquivo) ? (
            <Button
              variant="outline-success"
              size="sm"
              disabled={!arquivoUrl}
              onClick={() => window.open(arquivoUrl, "_blank")}
            >
              <i className="bi bi-download me-1" aria-hidden="true" />
              Baixar arquivo
            </Button>
          ) : null}
        </div>

        <div
          className="func-detail__tabs"
          role="tablist"
          aria-label="Seções de detalhe"
        >
          {visibleTabs.map((tab) => (
            <Button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              variant={activeTab === tab.id ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`bi ${tab.icon} me-1`} aria-hidden="true" />
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="func-detail__panel" role="tabpanel">
          {renderTabContent()}
        </div>
      </div>
    </AppModal>
  );
}
