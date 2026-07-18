import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import * as funcionariosApi from "@shared/api/funcionarios";
import { AppModal, AppModalFooter, AppNotice } from "@shared/ui";

function ConfirmDeleteModal({
  showModal,
  handleClose,
  handleConfirmDelete,
  entityId,
  entityType,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasEmployees, setHasEmployees] = useState(false);
  const [checkingEmployees, setCheckingEmployees] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showModal) {
      setHasEmployees(false);
      setError(null);
      setIsDeleting(false);
    }
  }, [showModal]);

  const checkForEmployees = async () => {
    setCheckingEmployees(true);
    setError(null);
    try {
      const data = await funcionariosApi.hasFuncionarios(entityId);
      const exists = Boolean(data?.hasEmployees);
      setHasEmployees(exists);
      return exists;
    } catch (err) {
      setError("Erro ao verificar funcionários. Tente novamente.");
      console.error("Error checking employees:", err);
      return true;
    } finally {
      setCheckingEmployees(false);
    }
  };

  const handleConfirmClick = async () => {
    const employeesExist = await checkForEmployees();
    if (employeesExist) return;

    setIsDeleting(true);
    try {
      await handleConfirmDelete();
      handleClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Erro ao excluir. Por favor, tente novamente."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const typeLabel = (entityType || "item").toLowerCase();

  return (
    <AppModal
      show={showModal}
      onHide={isDeleting ? () => {} : handleClose}
      title="Excluir nó"
      subtitle={`Tipo: ${entityType || "Item"}`}
      icon="bi-exclamation-triangle"
      preventClose={isDeleting || checkingEmployees}
      closeButton={!isDeleting && !checkingEmployees}
      footer={
        <AppModalFooter
          onCancel={handleClose}
          onConfirm={handleConfirmClick}
          cancelLabel="Cancelar"
          confirmLabel={
            checkingEmployees
              ? "Verificando..."
              : isDeleting
                ? "Excluindo..."
                : "Excluir permanentemente"
          }
          confirmVariant="danger"
          loading={isDeleting || checkingEmployees}
          disableConfirm={hasEmployees}
          disableCancel={isDeleting || checkingEmployees}
        />
      }
    >
      <p className="mb-3">
        Ao excluir este <strong>{typeLabel}</strong>, toda a subárvore
        (subsetores filhos) será removida permanentemente.
      </p>
      <AppNotice variant="warning" className="small mb-0" icon="bi-info-circle">
        Esta ação não pode ser desfeita.
      </AppNotice>

      {checkingEmployees && (
        <div className="text-center my-3 text-muted small">
          <Spinner animation="border" size="sm" className="me-2" />
          Verificando funcionários lotados...
        </div>
      )}

      {hasEmployees && (
        <AppNotice
          variant="danger"
          className="mt-3 mb-0"
          icon="bi-people-fill"
        >
          Não é possível excluir: há funcionários lotados neste nó ou na
          subárvore. Realoque-os em outra unidade antes de continuar.
        </AppNotice>
      )}

      {error && (
        <AppNotice variant="danger" className="mt-3 mb-0">
          {error}
        </AppNotice>
      )}
    </AppModal>
  );
}

export default ConfirmDeleteModal;
