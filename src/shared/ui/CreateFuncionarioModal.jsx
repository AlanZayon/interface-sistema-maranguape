import React, { useState, useEffect } from "react";
import { Step1Form, Step2Form, Step3Form } from "@features/funcionarios";
import { AppModal } from "@shared/ui";

const emptyUser = () => ({
  nome: "",
  foto: null,
  secretaria: "",
  funcao: "",
  tipo: "",
  natureza: "",
  referencia: "",
  redesSociais: [{ link: "", nome: "" }],
  salarioBruto: "",
  salarioLiquido: "",
  cidade: "",
  endereco: "",
  bairro: "",
  telefone: "",
  observacoes: [],
  arquivo: null,
  inicioContrato: "",
  fimContrato: "",
});

/**
 * @param {{
 *   show: boolean,
 *   onHide: () => void,
 *   coordenadoriaId?: string | null,
 *   setorId?: string | null,
 *   secretaria?: string,
 * }} props
 */
export default function CreateFuncionarioModal({
  show,
  onHide,
  coordenadoriaId = null,
  setorId = null,
  secretaria = "",
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [newUser, setNewUser] = useState(emptyUser);
  const [submitting, setSubmitting] = useState(false);
  const lotacaoId = setorId || coordenadoriaId;
  const hasLotacao = Boolean(lotacaoId);
  const steps = hasLotacao
    ? [
        { id: 1, label: "Dados pessoais" },
        { id: 2, label: "Contato e vínculos" },
      ]
    : [
        { id: 1, label: "Dados pessoais" },
        { id: 2, label: "Contato e vínculos" },
        { id: 3, label: "Lotação" },
      ];

  useEffect(() => {
    if (!show) {
      setNewUser(emptyUser());
      setCurrentStep(1);
      setMaxReachedStep(1);
      setSubmitting(false);
    }
  }, [show]);

  const handleClose = (options = {}) => {
    const force = options === true || options?.force === true;
    if (submitting && !force) return;
    setNewUser(emptyUser());
    setCurrentStep(1);
    setMaxReachedStep(1);
    setSubmitting(false);
    onHide();
  };

  const goToStep = (stepId) => {
    if (submitting) return;
    if (stepId <= maxReachedStep) {
      setCurrentStep(stepId);
    }
  };

  const nextStep = () =>
    setCurrentStep((s) => {
      const next = s + 1;
      setMaxReachedStep((m) => Math.max(m, next));
      return next;
    });
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  return (
    <AppModal
      show={show}
      onHide={handleClose}
      title="Novo funcionário"
      subtitle={`Etapa ${currentStep} de ${steps.length}`}
      icon="bi-person-plus"
      size="lg"
      scrollable
      preventClose={submitting}
    >
      <div className="app-modal__steps" aria-label="Etapas do formulário">
        {steps.map((step) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          const clickable = step.id <= maxReachedStep && !submitting;
          return (
            <div
              key={step.id}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={`app-modal__step${active ? " app-modal__step--active" : ""}${
                done ? " app-modal__step--done" : ""
              }${clickable ? " app-modal__step--clickable" : ""}`}
              onClick={() => clickable && goToStep(step.id)}
              onKeyDown={(e) => {
                if (!clickable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToStep(step.id);
                }
              }}
            >
              <span className="app-modal__step-num" aria-hidden="true">
                {done ? <i className="bi bi-check-lg" /> : step.id}
              </span>
              <span className="text-truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      {currentStep === 1 && (
        <Step1Form
          nextStep={nextStep}
          newUser={newUser}
          setNewUser={setNewUser}
          handleCloseModal={handleClose}
        />
      )}
      {currentStep === 2 && (
        <Step2Form
          newUser={newUser}
          setNewUser={setNewUser}
          nextStep={nextStep}
          previousStep={prevStep}
          handleCloseModal={handleClose}
          coordenadoriaId={lotacaoId}
          secretaria={secretaria}
          onSubmittingChange={setSubmitting}
        />
      )}
      {currentStep === 3 && !hasLotacao && (
        <Step3Form
          newUser={newUser}
          previousStep={prevStep}
          handleCloseModal={handleClose}
          onSubmittingChange={setSubmitting}
        />
      )}
    </AppModal>
  );
}
