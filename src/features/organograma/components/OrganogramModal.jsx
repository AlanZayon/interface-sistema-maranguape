import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppModal, AppModalFooter } from "@shared/ui";

/**
 * Legacy entry: redirects users to the Organograma workspace view.
 */
export default function OrganogramModal({ show, onHide }) {
  const navigate = useNavigate();

  const openOrganograma = () => {
    onHide?.();
    navigate("/estrutura?view=organograma");
  };

  useEffect(() => {
    if (!show) return;
    openOrganograma();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title="Organograma"
      icon="bi-diagram-3"
      footer={
        <AppModalFooter
          onCancel={onHide}
          onConfirm={openOrganograma}
          cancelLabel="Fechar"
          confirmLabel="Abrir organograma"
        />
      }
    >
      <p className="mb-0 text-muted">
        O organograma agora é gerenciado na vista Organograma da Estrutura.
      </p>
    </AppModal>
  );
}
