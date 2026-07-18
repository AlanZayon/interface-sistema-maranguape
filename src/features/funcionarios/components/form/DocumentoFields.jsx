import React, { useRef } from "react";
import { Form, Button } from "react-bootstrap";
import { validatePdfFile } from "../../utils/validateFuncionarioForm";

/**
 * @param {{
 *   value: File|string|null,
 *   existingName?: string|null,
 *   onChange: (file: File|null) => void,
 *   error?: string|null,
 *   onError?: (msg: string|null) => void,
 * }} props
 */
export default function DocumentoFields({
  value,
  existingName = null,
  onChange,
  error = null,
  onError,
}) {
  const inputRef = useRef(null);

  const fileName =
    (value instanceof File && value.name) ||
    (typeof value === "string" && value) ||
    existingName ||
    null;

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msg = validatePdfFile(file);
    if (msg) {
      onError?.(msg);
      e.target.value = "";
      return;
    }
    onError?.(null);
    onChange(file);
  };

  const handleClear = () => {
    onChange(null);
    onError?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="documento-fields" data-field="arquivo">
      <Form.Label>Arquivo anexo (PDF)</Form.Label>
      <div className="documento-fields__row">
        <Button
          type="button"
          variant="outline-primary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
          {fileName ? "Trocar arquivo" : "Escolher PDF"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="d-none"
          onChange={handleChange}
        />
        <span className="documento-fields__name text-muted small">
          {fileName || "Opcional — apenas PDF"}
        </span>
        {fileName ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-danger p-0"
            onClick={handleClear}
            aria-label="Remover arquivo"
          >
            Remover
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-danger small mt-1 mb-0" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
