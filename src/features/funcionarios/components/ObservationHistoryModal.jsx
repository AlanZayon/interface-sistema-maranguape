import React, { useMemo, useState, useEffect } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import * as funcionariosApi from "@shared/api/funcionarios";
import { AppModal, AppModalFooter, EmptyState } from "@shared/ui";

function getObsTexto(obs) {
  if (obs == null) return "";
  if (typeof obs === "string") return obs;
  return obs.texto || obs.text || "";
}

function getObsDate(obs) {
  if (obs == null || typeof obs === "string") return null;
  const raw = obs.createdAt || obs.data || null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatObsDate(date) {
  if (!date) return { absolute: "Data não registrada", relative: null };

  const absolute = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  let relative;
  if (diffMin < 1) relative = "agora";
  else if (diffMin < 60) relative = `há ${diffMin} min`;
  else if (diffH < 24) relative = `há ${diffH} h`;
  else if (diffD === 1) relative = "ontem";
  else if (diffD < 30) relative = `há ${diffD} dias`;
  else relative = null;

  return { absolute, relative };
}

function createObservation(texto) {
  return {
    texto: texto.trim(),
    createdAt: new Date().toISOString(),
  };
}

function ObservationHistoryModal({
  show,
  onHide,
  userId,
  initialObservations,
  observacoesregister,
  onObservationsChange,
}) {
  const [observacoes, setObservacoes] = useState(initialObservations || []);
  const [newObservation, setNewObservation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegisterMode =
    typeof onObservationsChange === "function" ||
    Array.isArray(observacoesregister);

  useEffect(() => {
    if (!show) return;
    const source = Array.isArray(initialObservations)
      ? initialObservations
      : Array.isArray(observacoesregister)
        ? observacoesregister
        : [];
    setObservacoes([...source]);
    setError("");
    setNewObservation("");
  }, [show]); // sync only when opening

  const sortedObservacoes = useMemo(() => {
    return [...(observacoes || [])]
      .map((obs, index) => ({ obs, index }))
      .sort((a, b) => {
        const da = getObsDate(a.obs)?.getTime() ?? 0;
        const db = getObsDate(b.obs)?.getTime() ?? 0;
        return db - da;
      });
  }, [observacoes]);

  const commitLocalObservations = (next) => {
    setObservacoes(next);
    if (typeof onObservationsChange === "function") {
      onObservationsChange(next);
    } else if (Array.isArray(observacoesregister)) {
      observacoesregister.splice(0, observacoesregister.length, ...next);
    }
  };

  const updateObservations = async (newObservations) => {
    try {
      setLoading(true);
      const response = await funcionariosApi.updateObservacoes(
        userId,
        newObservations
      );
      const saved = response?.observacoes ?? newObservations;
      setObservacoes(saved);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao atualizar observações"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddObservation = async () => {
    const trimmed = newObservation.trim();
    if (!trimmed) return;

    const alreadyExists = observacoes.some(
      (obs) => getObsTexto(obs).trim() === trimmed
    );
    if (alreadyExists) return;

    const entry = createObservation(trimmed);
    const next = [...observacoes, entry];

    if (isRegisterMode) {
      commitLocalObservations(next);
    } else {
      await updateObservations(next);
    }

    setNewObservation("");
  };

  const handleDeleteObservation = async (index) => {
    const next = observacoes.filter((_, i) => i !== index);

    if (isRegisterMode) {
      commitLocalObservations(next);
    } else {
      await updateObservations(next);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddObservation();
    }
  };

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title="Histórico de observações"
      subtitle="Acompanhe anotações com data e hora do registro"
      icon="bi-journal-text"
      preventClose={loading}
      footer={
        <AppModalFooter
          onCancel={onHide}
          onConfirm={handleAddObservation}
          cancelLabel="Fechar"
          confirmLabel="Adicionar"
          confirmIcon="bi-plus-lg"
          loading={loading}
          disableConfirm={!newObservation.trim()}
        />
      }
    >
      {error && (
        <Alert variant="danger" className="py-2 mb-3">
          {error}
        </Alert>
      )}

      <Form.Group controlId="novaObservacao" className="obs-composer mb-3">
        <Form.Label>Nova observação</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={newObservation}
          onChange={(e) => setNewObservation(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva a observação..."
          disabled={loading}
        />
        <Form.Text muted>Ctrl+Enter para adicionar.</Form.Text>
      </Form.Group>

      {sortedObservacoes.length > 0 ? (
        <div className="obs-timeline" role="list" aria-label="Lista de observações">
          <div className="obs-timeline__count">
            {sortedObservacoes.length}{" "}
            {sortedObservacoes.length === 1 ? "registro" : "registros"}
          </div>
          {sortedObservacoes.map(({ obs, index }) => {
            const texto = getObsTexto(obs);
            const { absolute, relative } = formatObsDate(getObsDate(obs));

            return (
              <article
                key={obs._id || `${index}-${texto.slice(0, 24)}`}
                className="obs-timeline__item"
                role="listitem"
              >
                <div className="obs-timeline__marker" aria-hidden="true" />
                <div className="obs-timeline__card">
                  <header className="obs-timeline__meta">
                    <time
                      className="obs-timeline__date"
                      dateTime={getObsDate(obs)?.toISOString()}
                      title={absolute}
                    >
                      <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                      {absolute}
                    </time>
                    {relative ? (
                      <span className="obs-timeline__relative">{relative}</span>
                    ) : null}
                  </header>
                  <p className="obs-timeline__text">{texto}</p>
                  <div className="obs-timeline__actions">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteObservation(index)}
                      disabled={loading}
                      aria-label={`Remover observação de ${absolute}`}
                    >
                      {loading ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <>
                          <i className="bi bi-trash me-1" aria-hidden="true" />
                          Remover
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="bi-journal"
          title="Nenhuma observação"
          description="Adicione a primeira observação no campo acima."
        />
      )}
    </AppModal>
  );
}

export default ObservationHistoryModal;
