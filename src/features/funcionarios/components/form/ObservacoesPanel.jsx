import React, { useState } from "react";
import ObservationHistoryButton from "../ObservationHistoryButton";
import ObservationHistoryModal from "../ObservationHistoryModal";

/**
 * @param {{
 *   observacoes?: Array<any>,
 *   onChange: (next: Array<any>) => void,
 *   userId?: string|null,
 * }} props
 */
export default function ObservacoesPanel({
  observacoes = [],
  onChange,
  userId = null,
}) {
  const [show, setShow] = useState(false);
  const count = observacoes?.length || 0;

  return (
    <>
      <div className="cadastro-obs-panel">
        <div className="cadastro-obs-panel__icon" aria-hidden="true">
          <i className="bi bi-journal-text" />
        </div>
        <div className="cadastro-obs-panel__copy">
          <p className="cadastro-obs-panel__title">Observações</p>
          <p className="cadastro-obs-panel__desc">
            {count === 0
              ? "Nenhuma observação adicionada ainda. Use para anotar vínculos, pendências ou contexto do cadastro."
              : `${count} ${
                  count === 1
                    ? "observação registrada"
                    : "observações registradas"
                }.`}
          </p>
        </div>
        <ObservationHistoryButton
          onClick={() => setShow(true)}
          count={count}
          label={count > 0 ? "Gerenciar" : "Adicionar"}
          variant="outline-primary"
        />
      </div>

      <ObservationHistoryModal
        show={show}
        onHide={() => setShow(false)}
        userId={userId}
        initialObservations={observacoes || []}
        onObservationsChange={onChange}
      />
    </>
  );
}
