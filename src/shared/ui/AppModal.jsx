import React from "react";
import { Modal, Button } from "react-bootstrap";

/**
 * Shell de modal enterprise — header com ícone, corpo e footer sticky.
 */
export default function AppModal({
  show,
  onHide,
  title,
  subtitle,
  icon = "bi-window",
  children,
  footer,
  size,
  centered = true,
  backdrop = "static",
  scrollable = true,
  bodyClassName = "",
  dialogClassName = "",
  contentClassName = "",
  closeButton = true,
  preventClose = false,
}) {
  const handleHide = () => {
    if (preventClose) return;
    onHide?.();
  };

  return (
    <Modal
      show={show}
      onHide={handleHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      scrollable={scrollable}
      dialogClassName={`app-modal-dialog ${dialogClassName}`.trim()}
      contentClassName={`app-modal ${contentClassName}`.trim()}
      enforceFocus={false}
    >
      <Modal.Header
        closeButton={closeButton && !preventClose}
        className="app-modal__header"
      >
        <div className="app-modal__brand">
          <span className="app-modal__icon-wrap" aria-hidden="true">
            <i className={`bi ${icon}`} />
          </span>
          <div className="app-modal__title-block min-w-0">
            <Modal.Title as="h2" className="app-modal__title">
              {title}
            </Modal.Title>
            {subtitle ? (
              <p className="app-modal__subtitle">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className={`app-modal__body ${bodyClassName}`.trim()}>
        {children}
      </Modal.Body>

      {footer != null ? (
        <Modal.Footer className="app-modal__footer">{footer}</Modal.Footer>
      ) : null}
    </Modal>
  );
}

export function AppModalFooter({
  onCancel,
  onConfirm,
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  confirmVariant = "primary",
  loading = false,
  disableConfirm = false,
  disableCancel = false,
  extra,
  confirmIcon,
}) {
  return (
    <div className="app-modal__footer-inner">
      {extra ? <div className="app-modal__footer-extra">{extra}</div> : null}
      <div className="app-modal__footer-actions">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onCancel}
          disabled={disableCancel || loading}
        >
          {cancelLabel}
        </Button>
        {onConfirm ? (
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            disabled={disableConfirm || loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Aguarde...
              </>
            ) : (
              <>
                {confirmIcon ? (
                  <i className={`bi ${confirmIcon} me-1`} aria-hidden="true" />
                ) : null}
                {confirmLabel}
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Barra de ações para formulários dentro do body (quando o footer do AppModal não é usado). */
export function ModalActions({ children, className = "" }) {
  return (
    <div className={`app-form-actions ${className}`.trim()}>{children}</div>
  );
}

/** Seção de formulário com título. */
export function FormSection({ title, children, className = "" }) {
  return (
    <section className={`app-form-section ${className}`.trim()}>
      {title ? <h3 className="app-form-section__title">{title}</h3> : null}
      <div className="app-form-section__body">{children}</div>
    </section>
  );
}
