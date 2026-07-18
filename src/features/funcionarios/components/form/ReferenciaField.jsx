import React, { useEffect, useMemo, useRef, useState } from "react";
import { Form, InputGroup, Spinner, Badge } from "react-bootstrap";

function origemLabel(ref) {
  if (ref?.origem === "funcionario" || ref?.funcionarioId) return "Funcionário";
  return "Externa";
}

function isOrigemFuncionario(ref) {
  return ref?.origem === "funcionario" || Boolean(ref?.funcionarioId);
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Seletor de referência com busca e cartão de amostra (nome, origem, cargo, telefone).
 */
export default function ReferenciaField({
  value = "",
  onChange,
  referencias = [],
  loading = false,
  required = false,
  optional = false,
  error = null,
  id = "form-referencia",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const pickingRef = useRef(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        const trimmed = query.trim();
        if (trimmed !== (value || "").trim()) onChange(trimmed);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery(value || "");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, query, value, onChange]);

  const selected = useMemo(() => {
    const v = (value || "").trim().toLowerCase();
    if (!v) return null;
    return referencias.find((r) => r.name?.toLowerCase() === v) || null;
  }, [value, referencias]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const list = [...referencias].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
    );
    if (!q) return list.slice(0, 40);
    return list
      .filter((r) => {
        const hay = [r.name, r.cargo, r.telefone, origemLabel(r)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [query, referencias]);

  const selectRef = (ref) => {
    pickingRef.current = true;
    onChange(ref.name);
    setQuery(ref.name);
    setOpen(false);
    window.setTimeout(() => {
      pickingRef.current = false;
    }, 0);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const commitQuery = () => {
    if (pickingRef.current) return;
    const trimmed = query.trim();
    if (trimmed !== (value || "").trim()) onChange(trimmed);
  };

  return (
    <div ref={rootRef} data-field="referencia">
      <Form.Group controlId={id}>
        <Form.Label>
          Referência
          {required ? <span className="text-danger"> *</span> : null}
          {optional ? (
            <span className="text-muted fw-normal"> (opcional)</span>
          ) : null}
        </Form.Label>

        <div className={`referencia-picker${open ? " is-open" : ""}`}>
          <InputGroup hasValidation>
            <InputGroup.Text className="referencia-picker__prefix">
              <i className="bi bi-person-vcard" aria-hidden="true" />
            </InputGroup.Text>
            <Form.Control
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
              placeholder="Buscar por nome, cargo ou telefone…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={commitQuery}
              isInvalid={!!error}
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="btn btn-outline-secondary referencia-picker__clear"
                onClick={clear}
                aria-label="Limpar referência"
                tabIndex={-1}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            ) : (
              <InputGroup.Text>
                <i className="bi bi-search" aria-hidden="true" />
              </InputGroup.Text>
            )}
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          </InputGroup>

          {open ? (
            <div
              id={`${id}-listbox`}
              className="referencia-picker__menu"
              role="listbox"
              aria-label="Referências disponíveis"
            >
              {loading ? (
                <div className="referencia-picker__empty text-muted">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Carregando referências…
                </div>
              ) : filtered.length === 0 ? (
                <div className="referencia-picker__empty text-muted">
                  {referencias.length === 0
                    ? "Nenhuma referência cadastrada"
                    : `Nenhum resultado para “${query.trim()}”`}
                </div>
              ) : (
                filtered.map((ref) => {
                  const active =
                    (value || "").trim().toLowerCase() ===
                    String(ref.name || "").toLowerCase();
                  const func = isOrigemFuncionario(ref);
                  return (
                    <button
                      key={ref._id || ref.name}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`referencia-picker__item${active ? " is-active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickingRef.current = true;
                      }}
                      onClick={() => selectRef(ref)}
                    >
                      <span
                        className={`referencia-picker__avatar${func ? " is-func" : " is-ext"}`}
                        aria-hidden="true"
                      >
                        {initials(ref.name)}
                      </span>
                      <span className="referencia-picker__meta">
                        <span className="referencia-picker__name">{ref.name}</span>
                        <span className="referencia-picker__sub">
                          {ref.cargo ? (
                            <span>{ref.cargo}</span>
                          ) : (
                            <span className="text-muted">Sem cargo</span>
                          )}
                          {ref.telefone ? (
                            <>
                              <span
                                className="referencia-picker__dot"
                                aria-hidden="true"
                              >
                                ·
                              </span>
                              <span>{ref.telefone}</span>
                            </>
                          ) : null}
                        </span>
                      </span>
                      <Badge
                        bg={func ? "primary" : "secondary"}
                        className="referencia-picker__badge"
                      >
                        {origemLabel(ref)}
                      </Badge>
                    </button>
                  );
                })
              )}
              {!loading &&
              filtered.length > 0 &&
              referencias.length > 40 &&
              !query.trim() ? (
                <div className="referencia-picker__hint text-muted">
                  Digite para filtrar entre {referencias.length} referências
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {selected && !open ? (
          <div className="referencia-sample" aria-live="polite">
            <span
              className={`referencia-picker__avatar${
                isOrigemFuncionario(selected) ? " is-func" : " is-ext"
              }`}
              aria-hidden="true"
            >
              {initials(selected.name)}
            </span>
            <div className="referencia-sample__body">
              <div className="referencia-sample__title">
                {selected.name}
                <Badge
                  bg={isOrigemFuncionario(selected) ? "primary" : "secondary"}
                  className="ms-2"
                >
                  {origemLabel(selected)}
                </Badge>
              </div>
              <div className="referencia-sample__sub text-muted">
                {selected.cargo || "Sem cargo"}
                {selected.telefone ? ` · ${selected.telefone}` : ""}
              </div>
            </div>
          </div>
        ) : !error ? (
          <Form.Text className="text-muted">
            Selecione uma referência cadastrada na lista
          </Form.Text>
        ) : null}
      </Form.Group>
    </div>
  );
}
