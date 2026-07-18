export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Valida arquivo de foto (File). Retorna mensagem de erro ou null.
 * @param {File|null|undefined} file
 * @returns {string|null}
 */
export function validatePhotoFile(file) {
  if (!file || !(file instanceof File)) return null;
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Selecione uma imagem JPG, PNG, GIF ou WEBP";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "A imagem deve ter no máximo 5MB";
  }
  return null;
}

/**
 * Valida arquivo PDF anexo. Retorna mensagem de erro ou null.
 * @param {File|null|undefined} file
 * @returns {string|null}
 */
export function validatePdfFile(file) {
  if (!file || !(file instanceof File)) return null;
  if (file.type !== "application/pdf") {
    return "O anexo deve ser um arquivo PDF";
  }
  return null;
}

/**
 * @param {{
 *   user: Record<string, any>,
 *   referenciasRegistradas?: Array<{ name: string }>,
 *   nameAvailable?: boolean,
 *   nameCheckLoading?: boolean,
 *   contratoIndeterminado?: boolean,
 *   mode?: 'create' | 'edit',
 *   originalNome?: string | null,
 *   scope?: 'step1' | 'full',
 * }} options
 * @returns {Record<string, string>}
 */
export function validateFuncionarioForm({
  user,
  referenciasRegistradas = [],
  nameAvailable = true,
  nameCheckLoading = false,
  contratoIndeterminado = false,
  mode = "create",
  originalNome = null,
  scope = "full",
}) {
  const errors = {};
  const nome = user?.nome?.trim() || "";
  const natureza = user?.natureza || "";

  const hasSalario =
    user?.salarioBruto !== "" &&
    user?.salarioBruto !== null &&
    user?.salarioBruto !== undefined &&
    !Number.isNaN(Number(user.salarioBruto));

  if (!nome) {
    errors.nome = "O campo Nome é obrigatório";
  } else if (nameCheckLoading) {
    errors.nome = "Aguarde a verificação do nome";
  } else if (!nameAvailable) {
    const sameAsOriginal =
      mode === "edit" &&
      originalNome &&
      nome.toUpperCase() === originalNome.trim().toUpperCase();
    if (!sameAsOriginal) {
      errors.nome = "Este nome já está em uso";
    }
  }

  if (!natureza) {
    errors.natureza = "O campo Natureza é obrigatório";
  }

  const photoError = validatePhotoFile(user?.foto);
  if (photoError) errors.foto = photoError;

  if (scope === "full") {
    const pdfError = validatePdfFile(user?.arquivo);
    if (pdfError) errors.arquivo = pdfError;
  }

  if (natureza === "EFETIVO") {
    if (!user?.funcao?.trim()) {
      errors.funcao = "O campo Função é obrigatório para efetivos";
    }
    if (!hasSalario) {
      errors.salarioBruto = "O campo Salário Bruto é obrigatório";
    }
  } else if (natureza === "TEMPORARIO") {
    if (!user?.funcao?.trim()) {
      errors.funcao = "O campo Função é obrigatório";
    }
    if (!hasSalario) {
      errors.salarioBruto = "O campo Salário Bruto é obrigatório";
    }
    if (!user?.inicioContrato) {
      errors.inicioContrato = "Data de início do contrato é obrigatória";
    }

    const fimIndeterminado =
      contratoIndeterminado || user?.fimContrato === "indeterminado";

    if (!fimIndeterminado && !user?.fimContrato) {
      errors.fimContrato = "Data de término do contrato é obrigatória";
    } else if (
      !fimIndeterminado &&
      user?.inicioContrato &&
      user?.fimContrato &&
      new Date(user.fimContrato) <= new Date(user.inicioContrato)
    ) {
      errors.fimContrato = "Data de término deve ser posterior à data de início";
    }

    if (user?.referencia?.trim()) {
      const isValid = referenciasRegistradas.some(
        (ref) => ref.name.toLowerCase() === user.referencia.toLowerCase()
      );
      if (!isValid) {
        errors.referencia = "A referência informada não é válida";
      }
    }
  } else if (natureza === "COMISSIONADO") {
    if (!user?.referencia?.trim()) {
      errors.referencia = "O campo Referência é obrigatório";
    } else {
      const isValid = referenciasRegistradas.some(
        (ref) => ref.name.toLowerCase() === user.referencia.toLowerCase()
      );
      if (!isValid) {
        errors.referencia = "A referência informada não é válida";
      }
    }
    if (!hasSalario) {
      errors.salarioBruto = "O campo Salário Bruto é obrigatório";
    }
    if (!user?.funcao?.trim()) {
      errors.funcao = "O campo Cargo é obrigatório";
    }
  }

  return errors;
}

/**
 * Conta erros e retorna mensagem resumida.
 * @param {Record<string, string>} errors
 * @returns {string|null}
 */
export function summarizeFormErrors(errors) {
  const count = Object.keys(errors || {}).filter((k) => errors[k]).length;
  if (count === 0) return null;
  if (count === 1) return "1 campo precisa de atenção";
  return `${count} campos precisam de atenção`;
}

/**
 * Rola até o primeiro campo inválido no formulário.
 * @param {Record<string, string>} errors
 * @param {HTMLElement|null} root
 */
export function scrollToFirstError(errors, root = null) {
  const firstKey = Object.keys(errors || {}).find((k) => errors[k]);
  if (!firstKey) return;
  const scope = root || document;
  const el =
    scope.querySelector(`[data-field="${firstKey}"]`) ||
    scope.querySelector(`#form-${firstKey}`) ||
    scope.querySelector(`[name="${firstKey}"]`);
  el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
}
