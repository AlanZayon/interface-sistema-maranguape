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
  salarioBruto: 0,
  salarioLiquido: 0,
  cidade: "",
  endereco: "",
  bairro: "",
  telefone: "",
  observacoes: [],
  arquivo: null,
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
  const [newUser, setNewUser] = useState(emptyUser);
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
    }
  }, [show]);

  const handleClose = () => {
    setNewUser(emptyUser());
    setCurrentStep(1);
    onHide();
  };

  const nextStep = () => setCurrentStep((s) => s + 1);
  const prevStep = () => setCurrentStep((s) => s - 1);

  return (
    <AppModal
      show={show}
      onHide={handleClose}
      title="Novo funcionário"
      subtitle={`Etapa ${currentStep} de ${steps.length}`}
      icon="bi-person-plus"
      size="lg"
      scrollable
    >
      <div className="app-modal__steps" aria-label="Etapas do formulário">
        {steps.map((step) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={`app-modal__step${active ? " app-modal__step--active" : ""}${
                done ? " app-modal__step--done" : ""
              }`}
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
        />
      )}
      {currentStep === 3 && !hasLotacao && (
        <Step3Form
          newUser={newUser}
          previousStep={prevStep}
          handleCloseModal={handleClose}
        />
      )}
    </AppModal>
  );
}
