import React, { useEffect, useMemo, useState, forwardRef } from "react";
import { Form, Button, InputGroup, Badge } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subYears, addYears } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { AppModal, AppModalFooter } from "@shared/ui";

const ordenarAlfabeticamente = (a, b) =>
  String(a).localeCompare(String(b), "pt-BR");

export function getSalaryBounds(salarios = []) {
  if (!Array.isArray(salarios) || salarios.length === 0) {
    return { min: 0, max: 0 };
  }
  return {
    min: Math.min(...salarios),
    max: Math.max(...salarios),
  };
}

export function createEmptyFilters(salarios = []) {
  const bounds = getSalaryBounds(salarios);
  return {
    natureza: [],
    funcao: [],
    referencia: [],
    bairro: [],
    salarioBruto: { min: bounds.min, max: bounds.max },
    inicioContrato: null,
    fimContrato: null,
    contratoIndeterminado: false,
  };
}

export function isSalaryFilterActive(filters, bounds) {
  if (!filters?.salarioBruto) return false;
  const { min, max } = filters.salarioBruto;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  if (min <= Number.MIN_SAFE_INTEGER / 2 || max >= Number.MAX_SAFE_INTEGER / 2) {
    return false;
  }
  return min > bounds.min || max < bounds.max;
}

function resolveSalaryDraft(filters, bounds) {
  if (isSalaryFilterActive(filters, bounds)) {
    return {
      min: filters.salarioBruto.min,
      max: filters.salarioBruto.max,
    };
  }
  return { min: bounds.min, max: bounds.max };
}

export function countActiveFilters(filters, salarios = []) {
  if (!filters) return 0;
  const bounds = getSalaryBounds(salarios);
  let count = 0;
  count += filters.natureza?.length || 0;
  count += filters.funcao?.length || 0;
  count += filters.referencia?.length || 0;
  count += filters.bairro?.length || 0;
  if (isSalaryFilterActive(filters, bounds)) count += 1;
  if (filters.inicioContrato) count += 1;
  if (filters.fimContrato) count += 1;
  if (filters.contratoIndeterminado) count += 1;
  return count;
}

const DateFieldInput = forwardRef(function DateFieldInput(
  { value, onClick, placeholder, disabled },
  ref
) {
  return (
    <InputGroup>
      <Form.Control
        type="text"
        onClick={onClick}
        ref={ref}
        value={value || ""}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        className={value ? "bg-light" : ""}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      />
      <InputGroup.Text
        onClick={disabled ? undefined : onClick}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <i className="bi bi-calendar3" aria-hidden="true" />
      </InputGroup.Text>
    </InputGroup>
  );
});

function toggleInList(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterChecklist({
  id,
  label,
  options,
  selected,
  onToggle,
  onClear,
  emptyLabel = "(Vazio)",
  searchPlaceholder = "Pesquisar...",
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...options]
      .filter((opt) => {
        if (!q) return true;
        if (opt === "" || opt == null) {
          return emptyLabel.toLowerCase().includes(q);
        }
        return String(opt).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a === "" || a == null) return 1;
        if (b === "" || b == null) return -1;
        return ordenarAlfabeticamente(a, b);
      });
  }, [options, search, emptyLabel]);

  return (
    <div className="filter-checklist">
      <div className="filter-checklist__toolbar">
        <InputGroup size="sm">
          <InputGroup.Text>
            <i className="bi bi-search" aria-hidden="true" />
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={searchPlaceholder}
          />
          {search ? (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setSearch("")}
              aria-label="Limpar pesquisa"
            >
              <i className="bi bi-x" aria-hidden="true" />
            </Button>
          ) : null}
        </InputGroup>
        {selected.length > 0 ? (
          <Button
            variant="link"
            size="sm"
            className="filter-checklist__clear"
            onClick={onClear}
          >
            Limpar ({selected.length})
          </Button>
        ) : null}
      </div>

      <div
        className="filter-checklist__list"
        role="group"
        aria-label={label}
      >
        {filtered.length === 0 ? (
          <div className="filter-checklist__empty">Nenhum item encontrado</div>
        ) : (
          filtered.map((opt) => {
            const key = opt === "" || opt == null ? `__empty-${id}` : String(opt);
            const checked = selected.includes(opt);
            const display =
              opt === "" || opt == null ? emptyLabel : String(opt);
            return (
              <button
                key={key}
                type="button"
                className={`filter-checklist__item${checked ? " is-checked" : ""}`}
                onClick={() => onToggle(opt)}
                aria-pressed={checked}
              >
                <Form.Check
                  type="checkbox"
                  id={`${id}-${key}`}
                  checked={checked}
                  readOnly
                  tabIndex={-1}
                  className="me-2 mb-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="filter-checklist__item-label" title={display}>
                  {display}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterModal({
  show,
  onHide,
  activeFilters,
  naturezas = [],
  todasFuncoes = [],
  todosBairros = [],
  todasReferencias = [],
  todosSalariosBrutos = [],
  onApply,
}) {
  const bounds = useMemo(
    () => getSalaryBounds(todosSalariosBrutos),
    [todosSalariosBrutos]
  );

  const [draft, setDraft] = useState(() =>
    createEmptyFilters(todosSalariosBrutos)
  );
  const wasOpenRef = React.useRef(false);

  useEffect(() => {
    const justOpened = show && !wasOpenRef.current;
    wasOpenRef.current = show;
    if (!justOpened) return;

    setDraft({
      ...createEmptyFilters(todosSalariosBrutos),
      ...activeFilters,
      natureza: [...(activeFilters.natureza || [])],
      funcao: [...(activeFilters.funcao || [])],
      referencia: [...(activeFilters.referencia || [])],
      bairro: [...(activeFilters.bairro || [])],
      salarioBruto: resolveSalaryDraft(activeFilters, bounds),
      inicioContrato: activeFilters.inicioContrato || null,
      fimContrato: activeFilters.fimContrato || null,
      contratoIndeterminado: Boolean(activeFilters.contratoIndeterminado),
    });
  }, [show, activeFilters, todosSalariosBrutos, bounds.min, bounds.max]);

  const naturezasOrdenadas = useMemo(
    () => [...naturezas].sort(ordenarAlfabeticamente),
    [naturezas]
  );

  const draftCount = countActiveFilters(draft, todosSalariosBrutos);

  const chips = useMemo(() => {
    const list = [];
    draft.natureza.forEach((n) =>
      list.push({
        key: `nat-${n}`,
        label: n,
        onRemove: () =>
          setDraft((prev) => ({
            ...prev,
            natureza: prev.natureza.filter((x) => x !== n),
          })),
      })
    );
    draft.funcao.forEach((f) =>
      list.push({
        key: `fun-${f}`,
        label: f,
        onRemove: () =>
          setDraft((prev) => ({
            ...prev,
            funcao: prev.funcao.filter((x) => x !== f),
          })),
      })
    );
    draft.referencia.forEach((r) =>
      list.push({
        key: `ref-${r || "empty"}`,
        label: r === "" ? "Sem referência" : r,
        onRemove: () =>
          setDraft((prev) => ({
            ...prev,
            referencia: prev.referencia.filter((x) => x !== r),
          })),
      })
    );
    draft.bairro.forEach((b) =>
      list.push({
        key: `bai-${b || "empty"}`,
        label: b === "" ? "Sem bairro" : b,
        onRemove: () =>
          setDraft((prev) => ({
            ...prev,
            bairro: prev.bairro.filter((x) => x !== b),
          })),
      })
    );
    if (isSalaryFilterActive(draft, bounds)) {
      list.push({
        key: "salario",
        label: `R$ ${draft.salarioBruto.min.toLocaleString("pt-BR")} – R$ ${draft.salarioBruto.max.toLocaleString("pt-BR")}`,
        onRemove: () =>
          setDraft((prev) => ({
            ...prev,
            salarioBruto: { min: bounds.min, max: bounds.max },
          })),
      });
    }
    if (draft.inicioContrato) {
      list.push({
        key: "inicio",
        label: `Início ≥ ${format(new Date(draft.inicioContrato), "dd/MM/yyyy")}`,
        onRemove: () =>
          setDraft((prev) => ({ ...prev, inicioContrato: null })),
      });
    }
    if (draft.fimContrato) {
      list.push({
        key: "fim",
        label: `Fim ≤ ${format(new Date(draft.fimContrato), "dd/MM/yyyy")}`,
        onRemove: () => setDraft((prev) => ({ ...prev, fimContrato: null })),
      });
    }
    if (draft.contratoIndeterminado) {
      list.push({
        key: "indet",
        label: "Indeterminado",
        onRemove: () =>
          setDraft((prev) => ({ ...prev, contratoIndeterminado: false })),
      });
    }
    return list;
  }, [draft, bounds]);

  const handleClearAll = () => {
    setDraft(createEmptyFilters(todosSalariosBrutos));
  };

  const handleApply = () => {
    let salarioBruto = {
      min: Number(draft.salarioBruto.min),
      max: Number(draft.salarioBruto.max),
    };
    if (!Number.isFinite(salarioBruto.min)) salarioBruto.min = bounds.min;
    if (!Number.isFinite(salarioBruto.max)) salarioBruto.max = bounds.max;
    if (salarioBruto.min > salarioBruto.max) {
      salarioBruto = { min: salarioBruto.max, max: salarioBruto.min };
    }

    onApply?.({
      ...draft,
      salarioBruto,
      inicioContrato: draft.inicioContrato || null,
      fimContrato: draft.contratoIndeterminado
        ? null
        : draft.fimContrato || null,
    });
    onHide?.();
  };

  const handleCancel = () => {
    onHide?.();
  };

  const setInicio = (date) => {
    setDraft((prev) => {
      const next = { ...prev, inicioContrato: date };
      if (date && prev.fimContrato && new Date(prev.fimContrato) < date) {
        next.fimContrato = null;
      }
      return next;
    });
  };

  const setFim = (date) => {
    setDraft((prev) => {
      // Ignora eventos do DatePicker ao habilitar indeterminado (ele dispara
      // onChange ao limpar/desabilitar o campo e desligava o switch).
      if (prev.contratoIndeterminado) return prev;
      return {
        ...prev,
        fimContrato: date,
        contratoIndeterminado: false,
      };
    });
  };

  const setIndeterminado = (checked) => {
    setDraft((prev) => ({
      ...prev,
      contratoIndeterminado: checked,
      ...(checked ? { fimContrato: null } : null),
    }));
  };

  return (
    <AppModal
      show={show}
      onHide={handleCancel}
      title="Filtros avançados"
      subtitle="Ajuste e aplique para refinar a lista de funcionários"
      icon="bi-funnel"
      size="lg"
      scrollable
      dialogClassName="filter-modal-dialog"
      footer={
        <AppModalFooter
          onCancel={handleCancel}
          onConfirm={handleApply}
          cancelLabel="Cancelar"
          confirmLabel="Aplicar filtros"
          confirmIcon="bi-check-lg"
          extra={
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleClearAll}
              disabled={draftCount === 0}
            >
              Limpar tudo
            </Button>
          }
        />
      }
    >
      <div className="filter-modal">
        <div className="filter-modal__summary">
          <div className="filter-modal__summary-head">
            <span className="filter-modal__summary-label">
              {draftCount === 0
                ? "Nenhum filtro selecionado"
                : `${draftCount} filtro${draftCount === 1 ? "" : "s"} selecionado${draftCount === 1 ? "" : "s"}`}
            </span>
            {draftCount > 0 ? (
              <Badge bg="primary" pill>
                {draftCount}
              </Badge>
            ) : null}
          </div>
          {chips.length > 0 ? (
            <div className="filter-chips" role="list">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="filter-chip filter-chip--removable"
                  onClick={chip.onRemove}
                  role="listitem"
                  title={`Remover ${chip.label}`}
                >
                  <span className="text-truncate">{chip.label}</span>
                  <i className="bi bi-x" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <p className="filter-modal__summary-hint mb-0">
              Selecione natureza, função, referência, bairro, faixa salarial ou
              período de contrato.
            </p>
          )}
        </div>

        <div className="filter-panel">
          <section className="filter-section">
            <h3 className="filter-section__title">Natureza</h3>
            <div className="filter-natureza" role="group" aria-label="Natureza">
              {naturezasOrdenadas.map((natureza) => {
                const checked = draft.natureza.includes(natureza);
                return (
                  <button
                    key={natureza}
                    type="button"
                    className={`filter-natureza__item${checked ? " is-checked" : ""}`}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        natureza: toggleInList(prev.natureza, natureza),
                      }))
                    }
                    aria-pressed={checked}
                  >
                    <Form.Check
                      type="checkbox"
                      id={`natureza-${natureza}`}
                      checked={checked}
                      readOnly
                      tabIndex={-1}
                      className="me-2 mb-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{natureza}</span>
                  </button>
                );
              })}
              {naturezasOrdenadas.length === 0 ? (
                <div className="text-muted small">Nenhuma natureza disponível</div>
              ) : null}
            </div>
          </section>

          <section className="filter-section">
            <h3 className="filter-section__title">
              Função
              {draft.funcao.length > 0 ? (
                <Badge bg="primary" pill className="ms-2">
                  {draft.funcao.length}
                </Badge>
              ) : null}
            </h3>
            <FilterChecklist
              id="funcao"
              label="Função"
              options={todasFuncoes}
              selected={draft.funcao}
              searchPlaceholder="Pesquisar função..."
              onToggle={(funcao) =>
                setDraft((prev) => ({
                  ...prev,
                  funcao: toggleInList(prev.funcao, funcao),
                }))
              }
              onClear={() => setDraft((prev) => ({ ...prev, funcao: [] }))}
            />
          </section>

          <section className="filter-section">
            <h3 className="filter-section__title">
              Referência
              {draft.referencia.length > 0 ? (
                <Badge bg="primary" pill className="ms-2">
                  {draft.referencia.length}
                </Badge>
              ) : null}
            </h3>
            <FilterChecklist
              id="referencia"
              label="Referência"
              options={todasReferencias}
              selected={draft.referencia}
              emptyLabel="(Sem referência)"
              searchPlaceholder="Pesquisar referência..."
              onToggle={(referencia) =>
                setDraft((prev) => ({
                  ...prev,
                  referencia: toggleInList(prev.referencia, referencia),
                }))
              }
              onClear={() =>
                setDraft((prev) => ({ ...prev, referencia: [] }))
              }
            />
          </section>

          <section className="filter-section">
            <h3 className="filter-section__title">
              Bairro
              {draft.bairro.length > 0 ? (
                <Badge bg="primary" pill className="ms-2">
                  {draft.bairro.length}
                </Badge>
              ) : null}
            </h3>
            <FilterChecklist
              id="bairro"
              label="Bairro"
              options={todosBairros}
              selected={draft.bairro}
              emptyLabel="(Sem bairro cadastrado)"
              searchPlaceholder="Pesquisar bairro..."
              onToggle={(bairro) =>
                setDraft((prev) => ({
                  ...prev,
                  bairro: toggleInList(prev.bairro, bairro),
                }))
              }
              onClear={() => setDraft((prev) => ({ ...prev, bairro: [] }))}
            />
          </section>

          <section className="filter-section filter-section--span">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="filter-section__title mb-0 border-0 pb-0">
                Salário bruto
              </h3>
              {isSalaryFilterActive(draft, bounds) ? (
                <Button
                  variant="link"
                  size="sm"
                  className="text-decoration-none p-0"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      salarioBruto: { min: bounds.min, max: bounds.max },
                    }))
                  }
                >
                  Restaurar faixa
                </Button>
              ) : null}
            </div>
            <div className="filter-salary">
              <Form.Group className="flex-grow-1">
                <Form.Label className="filter-field-label">Mínimo</Form.Label>
                <InputGroup>
                  <InputGroup.Text>R$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min={bounds.min}
                    max={draft.salarioBruto.max}
                    step="1"
                    value={draft.salarioBruto.min}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        salarioBruto: {
                          ...prev.salarioBruto,
                          min: e.target.value === "" ? "" : Number(e.target.value),
                        },
                      }))
                    }
                  />
                </InputGroup>
              </Form.Group>
              <span className="filter-salary__sep" aria-hidden="true">
                —
              </span>
              <Form.Group className="flex-grow-1">
                <Form.Label className="filter-field-label">Máximo</Form.Label>
                <InputGroup>
                  <InputGroup.Text>R$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min={draft.salarioBruto.min}
                    max={bounds.max}
                    step="1"
                    value={draft.salarioBruto.max}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        salarioBruto: {
                          ...prev.salarioBruto,
                          max: e.target.value === "" ? "" : Number(e.target.value),
                        },
                      }))
                    }
                  />
                </InputGroup>
              </Form.Group>
            </div>
            <div className="filter-salary__hint">
              Faixa dos dados: R$ {bounds.min.toLocaleString("pt-BR")} – R${" "}
              {bounds.max.toLocaleString("pt-BR")}
            </div>
          </section>

          <section className="filter-section filter-section--span">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="filter-section__title mb-0 border-0 pb-0">
                Período do contrato
              </h3>
              <Button
                variant="link"
                size="sm"
                className="text-decoration-none p-0"
                disabled={
                  !draft.inicioContrato &&
                  !draft.fimContrato &&
                  !draft.contratoIndeterminado
                }
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    inicioContrato: null,
                    fimContrato: null,
                    contratoIndeterminado: false,
                  }))
                }
              >
                Limpar
              </Button>
            </div>
            <p className="filter-modal__summary-hint mb-3">
              Aplica-se a contratos temporários. Demais naturezas permanecem na
              lista.
            </p>
            <div className="filter-dates">
              <Form.Group className="flex-grow-1">
                <Form.Label className="filter-field-label">
                  Data de início
                </Form.Label>
                <DatePicker
                  selected={
                    draft.inicioContrato
                      ? new Date(draft.inicioContrato)
                      : null
                  }
                  onChange={setInicio}
                  selectsStart
                  startDate={
                    draft.inicioContrato
                      ? new Date(draft.inicioContrato)
                      : null
                  }
                  endDate={
                    draft.fimContrato ? new Date(draft.fimContrato) : null
                  }
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  minDate={subYears(new Date(), 10)}
                  maxDate={addYears(new Date(), 2)}
                  isClearable
                  placeholderText="A partir de..."
                  customInput={
                    <DateFieldInput
                      placeholder="A partir de..."
                      value={
                        draft.inicioContrato
                          ? format(new Date(draft.inicioContrato), "dd/MM/yyyy")
                          : ""
                      }
                    />
                  }
                />
              </Form.Group>
              <Form.Group className="flex-grow-1">
                <Form.Label className="filter-field-label">
                  Data de término
                </Form.Label>
                <DatePicker
                  selected={
                    draft.fimContrato ? new Date(draft.fimContrato) : null
                  }
                  onChange={setFim}
                  selectsEnd
                  startDate={
                    draft.inicioContrato
                      ? new Date(draft.inicioContrato)
                      : null
                  }
                  endDate={
                    draft.fimContrato ? new Date(draft.fimContrato) : null
                  }
                  minDate={
                    draft.inicioContrato
                      ? new Date(draft.inicioContrato)
                      : subYears(new Date(), 10)
                  }
                  maxDate={addYears(new Date(), 2)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  disabled={draft.contratoIndeterminado}
                  isClearable={!draft.contratoIndeterminado}
                  placeholderText="Até..."
                  customInput={
                    <DateFieldInput
                      placeholder="Até..."
                      disabled={draft.contratoIndeterminado}
                      value={
                        draft.fimContrato
                          ? format(new Date(draft.fimContrato), "dd/MM/yyyy")
                          : ""
                      }
                    />
                  }
                />
              </Form.Group>
            </div>

            <div className="filter-indet-switch">
              <Form.Check
                type="switch"
                id="contrato-indeterminado-filter"
                label="Somente contrato indeterminado"
                checked={Boolean(draft.contratoIndeterminado)}
                onChange={(e) => setIndeterminado(e.target.checked)}
              />
            </div>
          </section>
        </div>
      </div>
    </AppModal>
  );
}

export default FilterModal;
