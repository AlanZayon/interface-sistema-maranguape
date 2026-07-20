import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";
import { FormSection, AppNotice } from "@shared/ui";
import { toast } from "react-toastify";
import {
  ContatoFields,
  DocumentoFields,
  ObservacoesPanel,
  RedesSociaisFields,
} from "./form";
import {
  validatePdfFile,
  summarizeFormErrors,
} from "../utils/validateFuncionarioForm";

function Step2Form({
  newUser,
  setNewUser,
  previousStep,
  nextStep,
  coordenadoriaId,
  secretaria,
  handleCloseModal,
  onSubmittingChange,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const queryClient = useQueryClient();
  const setorId = coordenadoriaId;

  const setSubmitting = (v) => {
    setIsLoading(v);
    onSubmittingChange?.(v);
  };

  const { mutate: submitUserData } = useMutation({
    mutationFn: async () => {
      const redesValidas = (newUser.redesSociais || []).filter(
        (item) => item.link && item.nome
      );

      const formData = new FormData();
      formData.append("nome", newUser.nome);
      if (newUser.foto instanceof File) {
        formData.append("foto", newUser.foto);
      }
      formData.append("secretaria", secretaria || newUser.secretaria || "");
      formData.append("natureza", newUser.natureza);
      formData.append("referencia", newUser.referencia || "");
      formData.append("salarioBruto", newUser.salarioBruto || 0);
      formData.append("funcao", newUser.funcao);
      formData.append("tipo", newUser.tipo || "");
      formData.append(
        "observacoes",
        JSON.stringify(newUser.observacoes || [])
      );
      formData.append("setorId", setorId);
      formData.append("coordenadoria", setorId);
      formData.append("cidade", newUser.cidade || "");
      formData.append("endereco", newUser.endereco || "");
      formData.append("bairro", newUser.bairro || "");
      formData.append("telefone", newUser.telefone || "");
      formData.append("inicioContrato", newUser.inicioContrato || "");
      formData.append("fimContrato", newUser.fimContrato || "");

      if (newUser.arquivo instanceof File) {
        formData.append("arquivo", newUser.arquivo);
      }
      formData.append("redesSociais", JSON.stringify(redesValidas));

      return funcionariosApi.createFuncionario(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      queryClient.invalidateQueries({ queryKey: ["setores"] });
      handleCloseModal({ force: true });
      toast.success("Funcionário cadastrado com sucesso");
    },
    onError: (err) => {
      console.error("Erro ao enviar os dados:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Ocorreu um erro ao enviar os dados. Por favor, tente novamente.";
      setError(typeof msg === "string" ? msg : "Erro ao cadastrar funcionário");
      toast.error(
        typeof msg === "string" ? msg : "Erro ao cadastrar funcionário"
      );
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    const pdfError = validatePdfFile(
      newUser.arquivo instanceof File ? newUser.arquivo : null
    );
    if (pdfError) {
      setFieldErrors({ arquivo: pdfError });
      return;
    }
    setFieldErrors({});

    if (coordenadoriaId) {
      setSubmitting(true);
      submitUserData();
    } else {
      nextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error ? (
        <AppNotice
          variant="danger"
          className="mb-3"
          dismissible
          onClose={() => setError(null)}
        >
          {error}
        </AppNotice>
      ) : null}

      {Object.keys(fieldErrors).length > 0 ? (
        <div className="form-error-summary" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>{summarizeFormErrors(fieldErrors)}</span>
        </div>
      ) : null}

      <FormSection title="Informações de contato">
        <ContatoFields user={newUser} setUser={setNewUser} />
      </FormSection>

      <FormSection title="Documentos e observações">
        <div className="mb-3">
          <DocumentoFields
            value={newUser.arquivo instanceof File ? newUser.arquivo : null}
            onChange={(file) =>
              setNewUser((prev) => ({ ...prev, arquivo: file }))
            }
            error={fieldErrors.arquivo}
            onError={(msg) =>
              setFieldErrors((prev) => ({ ...prev, arquivo: msg || null }))
            }
          />
        </div>
        <ObservacoesPanel
          observacoes={newUser.observacoes || []}
          onChange={(next) =>
            setNewUser((prev) => ({ ...prev, observacoes: next }))
          }
        />
      </FormSection>

      <FormSection title="Redes sociais">
        <RedesSociaisFields
          redesSociais={newUser.redesSociais}
          onChange={(redesSociais) =>
            setNewUser((prev) => ({ ...prev, redesSociais }))
          }
        />
      </FormSection>

      <div className="app-form-actions">
        {isLoading ? (
          <div className="d-flex align-items-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Salvando cadastro…
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={previousStep}
            >
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              Voltar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {coordenadoriaId ? (
                <>
                  <i className="bi bi-check-lg me-1" aria-hidden="true" />
                  Finalizar cadastro
                </>
              ) : (
                <>
                  Avançar
                  <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

export default Step2Form;
