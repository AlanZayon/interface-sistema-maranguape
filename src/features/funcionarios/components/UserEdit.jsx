import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";
import { FormSection, AppNotice } from "@shared/ui";
import { toast } from "react-toastify";
import {
  ContatoFields,
  DocumentoFields,
  NaturezaFields,
  NomeField,
  ObservacoesPanel,
  PhotoUploadField,
  RedesSociaisFields,
} from "./form";
import {
  validateFuncionarioForm,
  summarizeFormErrors,
  scrollToFirstError,
} from "../utils/validateFuncionarioForm";
import { formatTelefone } from "../utils/formatTelefone";

/**
 * Formulário de edição de funcionário — mesmos blocos do cadastro.
 *
 * @param {{
 *   funcionario: Record<string, any>,
 *   handleCloseModal: () => void,
 *   onSubmittingChange?: (v: boolean) => void,
 *   onDirtyChange?: (v: boolean) => void,
 *   onRequestTransferLotacao?: () => void,
 * }} props
 */
function UserEdit({
  funcionario,
  handleCloseModal,
  onSubmittingChange,
  onDirtyChange,
  onRequestTransferLotacao,
}) {
  const formRef = useRef(null);
  const [newUser, setNewUser] = useState({
    nome: "",
    foto: null,
    secretaria: "",
    funcao: "",
    natureza: "",
    referencia: "",
    redesSociais: [{ link: "", nome: "" }],
    salarioBruto: "",
    cidade: "",
    endereco: "",
    bairro: "",
    telefone: "",
    observacoes: [],
    arquivo: null,
    tipo: "",
    inicioContrato: "",
    fimContrato: "",
  });
  const [sendImage, setSendImage] = useState(null);
  const [sendFile, setSendFile] = useState(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(true);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [referencias, setReferencias] = useState([]);
  const [contratoIndeterminado, setContratoIndeterminado] = useState(false);
  const [initialNatureza, setInitialNatureza] = useState(null);
  const [dirty, setDirty] = useState(false);
  const prevNaturezaRef = useRef(null);
  const queryClient = useQueryClient();

  const markDirty = useCallback(() => {
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true);
    }
  }, [dirty, onDirtyChange]);

  const setUser = useCallback(
    (updater) => {
      setNewUser((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  useEffect(() => {
    if (!funcionario) return;
    setNewUser({
      ...funcionario,
      redesSociais:
        Array.isArray(funcionario.redesSociais) &&
        funcionario.redesSociais.length > 0
          ? funcionario.redesSociais
          : [{ link: "", nome: "" }],
      telefone: formatTelefone(funcionario.telefone || ""),
      observacoes: funcionario.observacoes || [],
    });
    setContratoIndeterminado(funcionario.fimContrato === "indeterminado");
    setInitialNatureza(funcionario.natureza || null);
    prevNaturezaRef.current = funcionario.natureza || null;
    setSendImage(null);
    setSendFile(null);
    setDirty(false);
    onDirtyChange?.(false);
    setErrors({});
    setSummary(null);
    setApiError(null);

    const existingFotoUrl =
      (typeof funcionario.fotoUrl === "string" &&
      /^https?:\/\//i.test(funcionario.fotoUrl)
        ? funcionario.fotoUrl
        : null) ||
      (typeof funcionario.foto === "string" &&
      /^https?:\/\//i.test(funcionario.foto)
        ? funcionario.foto
        : null);

    if (existingFotoUrl) {
      setFotoPreviewUrl(existingFotoUrl);
      return;
    }

    setFotoPreviewUrl(null);
    if (!funcionario._id || !funcionario.foto) return;

    let cancelled = false;
    funcionariosApi
      .buscarMidia(funcionario._id)
      .then((data) => {
        if (!cancelled) setFotoPreviewUrl(data?.fotoUrl || null);
      })
      .catch(() => {
        if (!cancelled) setFotoPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [funcionario, onDirtyChange]);

  // Restaura campos originais se a natureza voltar à inicial
  useEffect(() => {
    const current = newUser.natureza;
    if (!current || !initialNatureza) return;
    if (prevNaturezaRef.current === current) return;
    const previous = prevNaturezaRef.current;
    prevNaturezaRef.current = current;

    if (!previous) return;

    if (current === initialNatureza) {
      setNewUser((prev) => ({
        ...prev,
        referencia: funcionario?.referencia ?? "",
        funcao: funcionario?.funcao ?? "",
        salarioBruto: funcionario?.salarioBruto ?? "",
        inicioContrato: funcionario?.inicioContrato ?? "",
        fimContrato: funcionario?.fimContrato ?? "",
        tipo: funcionario?.tipo ?? "",
      }));
      setContratoIndeterminado(funcionario?.fimContrato === "indeterminado");
      markDirty();
    }
  }, [newUser.natureza, initialNatureza, funcionario, markDirty]);

  const onAvailabilityChange = useCallback((available, loading) => {
    setNameAvailable(available);
    setNameCheckLoading(loading);
  }, []);

  const onReferenciasLoaded = useCallback((list) => {
    setReferencias(list);
  }, []);

  const setSubmitting = (v) => {
    setIsLoading(v);
    onSubmittingChange?.(v);
  };

  const { mutate: updateUserData } = useMutation({
    mutationFn: async () => {
      const redesValidas = (newUser.redesSociais || []).filter(
        (item) => item.link && item.nome
      );

      const formData = new FormData();
      formData.append("nome", newUser.nome);
      if (sendImage) formData.append("foto", sendImage);
      formData.append("secretaria", newUser.secretaria || "");
      formData.append("funcao", newUser.funcao || "");
      formData.append("natureza", newUser.natureza);
      formData.append("referencia", newUser.referencia || "");
      formData.append("redesSociais", JSON.stringify(redesValidas));
      formData.append("salarioBruto", newUser.salarioBruto);
      formData.append("cidade", newUser.cidade || "");
      formData.append("endereco", newUser.endereco || "");
      formData.append("bairro", newUser.bairro || "");
      formData.append("telefone", newUser.telefone || "");
      formData.append("inicioContrato", newUser.inicioContrato || "");
      formData.append(
        "fimContrato",
        contratoIndeterminado ? "indeterminado" : newUser.fimContrato || ""
      );
      formData.append(
        "observacoes",
        JSON.stringify(newUser.observacoes || [])
      );
      if (sendFile) formData.append("arquivo", sendFile);
      formData.append(
        "coordenadoria",
        funcionario.setorId || funcionario.coordenadoria
      );
      formData.append(
        "setorId",
        funcionario.setorId || funcionario.coordenadoria
      );
      formData.append("tipo", newUser.tipo || "");

      return funcionariosApi.updateFuncionario(funcionario._id, formData);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      setDirty(false);
      onDirtyChange?.(false);
      handleCloseModal({ force: true });
      toast.success("Funcionário atualizado com sucesso");
    },
    onError: (err) => {
      console.error("Erro ao atualizar:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Ocorreu um erro ao atualizar. Tente novamente.";
      setApiError(typeof msg === "string" ? msg : "Erro ao atualizar");
      toast.error(typeof msg === "string" ? msg : "Erro ao atualizar");
    },
    onSettled: () => setSubmitting(false),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setApiError(null);

    const nextErrors = validateFuncionarioForm({
      user: {
        ...newUser,
        foto: sendImage || newUser.foto,
        arquivo: sendFile || newUser.arquivo,
        fimContrato: contratoIndeterminado
          ? "indeterminado"
          : newUser.fimContrato,
      },
      referenciasRegistradas: referencias,
      nameAvailable,
      nameCheckLoading,
      contratoIndeterminado,
      mode: "edit",
      originalNome: funcionario?.nome,
      scope: "full",
    });

    setErrors(nextErrors);
    const msg = summarizeFormErrors(nextErrors);
    setSummary(msg);

    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors, formRef.current);
      return;
    }

    setSubmitting(true);
    updateUserData();
  };

  const lotacaoLabel =
    funcionario?.secretaria ||
    funcionario?.setorNome ||
    funcionario?.coordenadoriaNome ||
    "Lotação atual";

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {summary ? (
        <div className="form-error-summary" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>{summary}</span>
        </div>
      ) : null}

      {apiError ? (
        <AppNotice
          variant="danger"
          className="mb-3"
          dismissible
          onClose={() => setApiError(null)}
        >
          {apiError}
        </AppNotice>
      ) : null}

      <FormSection title="Foto de perfil">
        <PhotoUploadField
          value={sendImage}
          previewUrl={sendImage ? null : fotoPreviewUrl}
          onChange={(file) => {
            setSendImage(file);
            setUser((prev) => ({ ...prev, foto: file }));
            if (!file) setFotoPreviewUrl(null);
          }}
          error={errors.foto}
          onError={(m) => setErrors((prev) => ({ ...prev, foto: m || null }))}
        />
      </FormSection>

      <FormSection title="Identificação">
        <NomeField
          value={newUser?.nome || ""}
          onChange={(nome) => setUser((prev) => ({ ...prev, nome }))}
          error={errors.nome}
          originalNome={funcionario?.nome}
          onAvailabilityChange={onAvailabilityChange}
        />

        <div className="lotacao-readonly mt-3">
          <p className="lotacao-readonly__label">Lotação / Secretaria</p>
          <p className="lotacao-readonly__value">{lotacaoLabel}</p>
          {onRequestTransferLotacao ? (
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={onRequestTransferLotacao}
            >
              <i className="bi bi-arrow-left-right me-1" aria-hidden="true" />
              Transferir lotação
            </Button>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Dados profissionais">
        <NaturezaFields
          user={newUser}
          setUser={setUser}
          errors={errors}
          contratoIndeterminado={contratoIndeterminado}
          setContratoIndeterminado={(v) => {
            setContratoIndeterminado(v);
            markDirty();
          }}
          onReferenciasLoaded={onReferenciasLoaded}
        />
      </FormSection>

      <FormSection title="Informações de contato">
        <ContatoFields user={newUser} setUser={setUser} errors={errors} />
      </FormSection>

      <FormSection title="Redes sociais">
        <RedesSociaisFields
          redesSociais={newUser.redesSociais}
          onChange={(redesSociais) =>
            setUser((prev) => ({ ...prev, redesSociais }))
          }
        />
      </FormSection>

      <FormSection title="Documentos">
        <DocumentoFields
          value={sendFile}
          existingName={
            sendFile?.name ||
            (typeof funcionario?.arquivo === "string"
              ? "Arquivo anexado"
              : funcionario?.arquivo?.name) ||
            null
          }
          onChange={(file) => {
            setSendFile(file);
            setUser((prev) => ({ ...prev, arquivo: file }));
          }}
          error={errors.arquivo}
          onError={(m) =>
            setErrors((prev) => ({ ...prev, arquivo: m || null }))
          }
        />
      </FormSection>

      <FormSection title="Observações">
        <ObservacoesPanel
          observacoes={newUser.observacoes || []}
          userId={funcionario?._id}
          onChange={(next) =>
            setUser((prev) => ({ ...prev, observacoes: next }))
          }
        />
      </FormSection>

      <div className="app-form-actions">
        {isLoading ? (
          <div className="d-flex align-items-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Salvando alterações…
          </div>
        ) : (
          <>
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
              <i className="bi bi-check-lg me-1" aria-hidden="true" />
              Salvar alterações
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

export default React.memo(UserEdit);
