import React, { useCallback, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { FormSection } from "@shared/ui";
import {
  NomeField,
  NaturezaFields,
  PhotoUploadField,
} from "./form";
import {
  validateFuncionarioForm,
  summarizeFormErrors,
  scrollToFirstError,
} from "../utils/validateFuncionarioForm";

/**
 * Etapa 1 do cadastro: foto, nome e dados profissionais por natureza.
 */
function Step1Form({
  nextStep,
  newUser,
  setNewUser,
  handleCloseModal,
  setStep,
}) {
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [nameAvailable, setNameAvailable] = useState(true);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [contratoIndeterminado, setContratoIndeterminado] = useState(
    newUser?.fimContrato === "indeterminado"
  );
  const [referencias, setReferencias] = useState([]);

  const onAvailabilityChange = useCallback((available, loading) => {
    setNameAvailable(available);
    setNameCheckLoading(loading);
  }, []);

  const onReferenciasLoaded = useCallback((list) => {
    setReferencias(list);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateFuncionarioForm({
      user: {
        ...newUser,
        fimContrato: contratoIndeterminado
          ? "indeterminado"
          : newUser.fimContrato,
      },
      referenciasRegistradas: referencias,
      nameAvailable,
      nameCheckLoading,
      contratoIndeterminado,
      mode: "create",
      scope: "step1",
    });

    setErrors(nextErrors);
    const msg = summarizeFormErrors(nextErrors);
    setSummary(msg);

    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors, formRef.current);
      return;
    }

    if (contratoIndeterminado) {
      setNewUser((prev) => ({ ...prev, fimContrato: "indeterminado" }));
    }

    if (nextStep) nextStep();
    else if (setStep) setStep(2);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {summary ? (
        <div className="form-error-summary" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>{summary}</span>
        </div>
      ) : null}

      <FormSection title="Foto de perfil">
        <PhotoUploadField
          value={newUser?.foto instanceof File ? newUser.foto : null}
          onChange={(file) =>
            setNewUser((prev) => ({ ...prev, foto: file }))
          }
          error={errors.foto}
          onError={(msg) =>
            setErrors((prev) => ({ ...prev, foto: msg || null }))
          }
        />
      </FormSection>

      <FormSection title="Identificação">
        <NomeField
          value={newUser?.nome || ""}
          onChange={(nome) => setNewUser((prev) => ({ ...prev, nome }))}
          error={errors.nome}
          onAvailabilityChange={onAvailabilityChange}
        />
      </FormSection>

      <FormSection title="Dados profissionais">
        <NaturezaFields
          user={newUser}
          setUser={setNewUser}
          errors={errors}
          contratoIndeterminado={contratoIndeterminado}
          setContratoIndeterminado={setContratoIndeterminado}
          onReferenciasLoaded={onReferenciasLoaded}
        />
      </FormSection>

      <div className="app-form-actions">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={handleCloseModal}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={nameCheckLoading}
        >
          Avançar
          <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}

export default Step1Form;
