import React, { useEffect, useRef, useState, useCallback } from "react";
import { Form, Spinner } from "react-bootstrap";
import * as funcionariosApi from "@shared/api/funcionarios";

/**
 * Campo de nome com verificação assíncrona de disponibilidade.
 *
 * @param {{
 *   value: string,
 *   onChange: (name: string) => void,
 *   error?: string|null,
 *   originalNome?: string|null,
 *   onAvailabilityChange?: (available: boolean, loading: boolean) => void,
 * }} props
 */
export default function NomeField({
  value,
  onChange,
  error = null,
  originalNome = null,
  onAvailabilityChange,
}) {
  const [status, setStatus] = useState({
    available: true,
    loading: false,
    message: "",
  });
  const timerRef = useRef(null);

  const check = useCallback(
    async (name) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length < 3) {
        setStatus({ available: true, loading: false, message: "" });
        onAvailabilityChange?.(true, false);
        return;
      }
      if (
        originalNome &&
        trimmed.toUpperCase() === originalNome.trim().toUpperCase()
      ) {
        setStatus({ available: true, loading: false, message: "" });
        onAvailabilityChange?.(true, false);
        return;
      }

      setStatus((s) => ({ ...s, loading: true }));
      onAvailabilityChange?.(true, true);
      try {
        const data = await funcionariosApi.checkName({ name: trimmed });
        setStatus({
          available: data.available,
          loading: false,
          message: data.message || "",
        });
        onAvailabilityChange?.(data.available, false);
      } catch {
        setStatus({ available: true, loading: false, message: "" });
        onAvailabilityChange?.(true, false);
      }
    },
    [originalNome, onAvailabilityChange]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => check(value || ""), 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, check]);

  const showInvalid = !!error || status.available === false;

  return (
    <Form.Group controlId="form-nome" data-field="nome">
      <Form.Label>
        Nome do servidor <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        type="text"
        placeholder="Digite o nome completo"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        isInvalid={showInvalid}
        autoComplete="name"
      />
      {status.loading ? (
        <Form.Text className="text-muted d-flex align-items-center mt-1">
          <Spinner animation="border" size="sm" className="me-1" />
          Verificando disponibilidade…
        </Form.Text>
      ) : showInvalid ? (
        <Form.Text className="text-danger mt-1 d-block" role="alert">
          {error || status.message || "Este nome já está em uso"}
        </Form.Text>
      ) : value?.trim()?.length >= 3 && status.available ? (
        <Form.Text className="text-success mt-1 d-block">
          <i className="bi bi-check-lg me-1" aria-hidden="true" />
          Nome disponível
        </Form.Text>
      ) : (
        <Form.Text className="text-muted mt-1 d-block">
          Digite pelo menos 3 caracteres
        </Form.Text>
      )}
    </Form.Group>
  );
}
