import React from "react";
import AppModal, { AppModalFooter } from "./AppModal";

/**
 * @param {{
 *   show: boolean,
 *   onHide: () => void,
 *   onConfirm: () => void,
 *   title?: string,
 *   message?: React.ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   variant?: string,
 *   loading?: boolean,
 *   icon?: string,
 * }} props
 */
export default function ConfirmDialog({
  show,
  onHide,
  onConfirm,
  title = "Confirmar",
  message = "Tem certeza que deseja continuar?",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  icon,
}) {
  const resolvedIcon =
    icon ||
    (variant === "danger"
      ? "bi-exclamation-triangle"
      : variant === "warning"
        ? "bi-exclamation-circle"
        : "bi-question-circle");

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title={title}
      icon={resolvedIcon}
      size="sm"
      preventClose={loading}
      closeButton={!loading}
      footer={
        <AppModalFooter
          onCancel={onHide}
          onConfirm={onConfirm}
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          confirmVariant={variant}
          loading={loading}
        />
      }
    >
      <div className="app-modal__confirm-message">{message}</div>
    </AppModal>
  );
}
