import React, { useEffect, useState } from "react";
import { Form, DropdownButton, Dropdown, Button, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subYears, addYears } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { AppModal, AppModalFooter } from "@shared/ui";

// Funções auxiliares para ordenação
const ordenarAlfabeticamente = (a, b) => a.localeCompare(b, 'pt-BR');
const ordenarNumericamente = (a, b) => a - b;

function FilterModal({
  show,
  onHide,
  activeFilters,
  naturezas,
  todasFuncoes,
  todosBairros,
  todasReferencias,
  todosSalariosBrutos,
  todosSalariosLiquidos,
  toggleNatureza,
  toggleFuncao,
  toggleBairro,
  toggleReferencia,
  handleSalarioBrutoChange,
  handleInicioContratoChange,
  handleFimContratoChange,
  handleIndeterminadoChange,
  onClearAllFilters,
}) {
  const [salariosBrutos, setSalariosBrutos] = useState([]);
  const [funcaoSearch, setFuncaoSearch] = useState("");
  const [referenciaSearch, setReferenciaSearch] = useState("");
  const [bairroSearch, setBairroSearch] = useState("");
  const [salarioSearchMin, setSalarioSearchMin] = useState("");
  const [salarioSearchMax, setSalarioSearchMax] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [contratoIndeterminado, setContratoIndeterminado] = useState(false);

  const handleClearAll = () => {
    setFuncaoSearch("");
    setReferenciaSearch("");
    setBairroSearch("");
    setSalarioSearchMin("");
    setSalarioSearchMax("");
    setDateRange([null, null]);
    setContratoIndeterminado(false);
    onClearAllFilters();
  };

  // Funções filtradas e ordenadas alfabeticamente
  const funcoesFiltradas = todasFuncoes
    .filter(funcao => funcao.toLowerCase().includes(funcaoSearch.toLowerCase()))
    .sort(ordenarAlfabeticamente);

  // Referências filtradas e ordenadas (com tratamento para vazio)
  const referenciasFiltradas = todasReferencias
    .filter(referencia => {
      if (referencia === "") return true;
      return referencia.toLowerCase().includes(referenciaSearch.toLowerCase());
    })
    .sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return ordenarAlfabeticamente(a, b);
    });

  // Bairros filtrados e ordenados alfabeticamente (com tratamento para vazio)
  const bairrosFiltrados = todosBairros
    .filter(bairro => {
      if (bairro === "") return true;
      return bairro.toLowerCase().includes(bairroSearch.toLowerCase());
    })
    .sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return ordenarAlfabeticamente(a, b);
    });

  // Salários filtrados
  const salariosFiltradosMin = salariosBrutos
    .filter(salario =>
      salario.toString().includes(salarioSearchMin) ||
      salario.toLocaleString('pt-BR').includes(salarioSearchMin)
    );

  const salariosFiltradosMax = salariosBrutos
    .filter(salario =>
      salario.toString().includes(salarioSearchMax) ||
      salario.toLocaleString('pt-BR').includes(salarioSearchMax)
    );

  useEffect(() => {
    const salariosBrutosOrdenados = [...todosSalariosBrutos].sort(ordenarNumericamente);
    setSalariosBrutos(salariosBrutosOrdenados);

    if (show) {
      handleSalarioBrutoChange({
        min: Math.min(...salariosBrutosOrdenados),
        max: Math.max(...salariosBrutosOrdenados),
      });

      setDateRange([
        activeFilters.inicioContrato ? new Date(activeFilters.inicioContrato) : null,
        activeFilters.fimContrato ? new Date(activeFilters.fimContrato) : null
      ]);
      setContratoIndeterminado(activeFilters.contratoIndeterminado || false);
    }
  }, [show]);

  const handleDateRangeChange = (update) => {
    setDateRange(update);
    if (update[0]) handleInicioContratoChange(update[0]);
    if (update[1]) handleFimContratoChange(update[1]);
    if (update[0] || update[1]) {
      setContratoIndeterminado(false);
      handleIndeterminadoChange(false);
    }
  };

  const handleClearDates = () => {
    setDateRange([null, null]);
    handleInicioContratoChange(null);
    handleFimContratoChange(null);
  };

  const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <InputGroup>
      <Form.Control
        type="text"
        onClick={onClick}
        ref={ref}
        value={value || ""}
        placeholder={placeholder}
        readOnly
        className={value ? "bg-light" : ""}
        style={{ cursor: "pointer" }}
      />
      <InputGroup.Text onClick={onClick} style={{ cursor: "pointer" }}>
        <i className="bi bi-calendar3" aria-hidden="true" />
      </InputGroup.Text>
    </InputGroup>
  ));

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title="Filtros avançados"
      subtitle="Refine a lista de funcionários"
      icon="bi-funnel"
      size="lg"
      scrollable
      footer={
        <AppModalFooter
          onCancel={onHide}
          onConfirm={onHide}
          cancelLabel="Cancelar"
          confirmLabel="Aplicar filtros"
          extra={
            <Button variant="outline-danger" size="sm" onClick={handleClearAll}>
              Limpar tudo
            </Button>
          }
        />
      }
    >
        <div className="filter-panel">
          <div className="filter-section">
              <h3 className="filter-section__title">Natureza</h3>
              <Form.Group className="ps-1">
                {naturezas.sort(ordenarAlfabeticamente).map((natureza) => (
                  <Form.Check
                    key={natureza}
                    type="checkbox"
                    id={`natureza-${natureza}`}
                    label={natureza}
                    name="natureza"
                    checked={activeFilters.natureza.includes(natureza)}
                    onChange={() => toggleNatureza(natureza)}
                    className="mb-2"
                  />
                ))}
              </Form.Group>
            </div>

            {/* Seção Função */}
            <div className="filter-section">
              <h3 className="filter-section__title">Função</h3>
              <DropdownButton
                id="dropdown-funcoes"
                title={`Funções (${activeFilters.funcao.length})`}
                variant="outline-primary"
                className="w-100"
                autoClose="outside"
              >
                <div style={{ maxHeight: "250px", overflowY: "auto", padding: "0.5rem" }}>
                  <Form.Control
                    type="text"
                    placeholder="Pesquisar função..."
                    className="mx-2 mb-2"
                    value={funcaoSearch}
                    onChange={(e) => setFuncaoSearch(e.target.value)}
                  />
                  {funcoesFiltradas.length > 0 ? (
                    funcoesFiltradas.map((funcao) => (
                      <Dropdown.Item
                        key={funcao}
                        onClick={() => toggleFuncao(funcao)}
                        active={activeFilters.funcao.includes(funcao)}
                        className="d-flex align-items-center"
                      >
                        <Form.Check
                          type="checkbox"
                          checked={activeFilters.funcao.includes(funcao)}
                          readOnly
                          className="me-2"
                        />
                        <span className="text-truncate" style={{ maxWidth: "200px" }}>
                          {funcao}
                        </span>
                      </Dropdown.Item>
                    ))
                  ) : (
                    <div className="text-muted px-3 py-2">Nenhuma função encontrada</div>
                  )}
                </div>
              </DropdownButton>
            </div>

            {/* Seção Referência */}
            <div className="filter-section">
              <h3 className="filter-section__title">Referência</h3>
              <DropdownButton
                id="dropdown-referencias"
                title={`Referências (${activeFilters.referencia.length})`}
                variant="outline-primary"
                className="w-100"
                autoClose="outside"
              >
                <div style={{ maxHeight: "250px", overflowY: "auto", padding: "0.5rem" }}>
                  <Form.Control
                    type="text"
                    placeholder="Pesquisar referência..."
                    className="mx-2 mb-2"
                    value={referenciaSearch}
                    onChange={(e) => setReferenciaSearch(e.target.value)}
                  />
                  {referenciasFiltradas.length > 0 ? (
                    referenciasFiltradas.map((referencia) => (
                      <Dropdown.Item
                        key={referencia || "sem-referencia"}
                        onClick={() => toggleReferencia(referencia)}
                        active={activeFilters.referencia.includes(referencia)}
                        className="d-flex align-items-center"
                      >
                        <Form.Check
                          type="checkbox"
                          checked={activeFilters.referencia.includes(referencia)}
                          readOnly
                          className="me-2"
                        />
                        <span className="text-truncate" style={{ maxWidth: "200px" }}>
                          {referencia === "" ? "(Sem referência)" : referencia}
                        </span>
                      </Dropdown.Item>
                    ))
                  ) : (
                    <div className="text-muted px-3 py-2">Nenhuma referência encontrada</div>
                  )}
                </div>
              </DropdownButton>
            </div>

            {/* Seção Salário Bruto */}
            <div className="filter-section">
              <h3 className="filter-section__title">Salário bruto</h3>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <DropdownButton
                  id="dropdown-salario-bruto-min"
                  title={`Mín: R$ ${activeFilters.salarioBruto.min.toLocaleString('pt-BR')}`}
                  variant="outline-primary"
                  className="flex-grow-1"
                >
                  <div style={{ maxHeight: "200px", overflowY: "auto", padding: "0.5rem" }}>
                    <Form.Control
                      type="text"
                      placeholder="Pesquisar valor mínimo..."
                      className="mx-2 mb-2"
                      value={salarioSearchMin}
                      onChange={(e) => setSalarioSearchMin(e.target.value)}
                    />
                    {salariosFiltradosMin.length > 0 ? (
                      salariosFiltradosMin.map((salario) => (
                        <Dropdown.Item
                          key={`bruto-min-${salario}`}
                          onClick={() => {
                            handleSalarioBrutoChange({
                              ...activeFilters.salarioBruto,
                              min: salario,
                            });
                            setSalarioSearchMin("");
                          }}
                          active={activeFilters.salarioBruto.min === salario}
                        >
                          R$ {salario.toLocaleString('pt-BR')}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <div className="text-muted px-3 py-2">Nenhum valor encontrado</div>
                    )}
                  </div>
                </DropdownButton>

                <DropdownButton
                  id="dropdown-salario-bruto-max"
                  title={`Máx: R$ ${activeFilters.salarioBruto.max.toLocaleString('pt-BR')}`}
                  variant="outline-primary"
                  className="flex-grow-1"
                >
                  <div style={{ maxHeight: "200px", overflowY: "auto", padding: "0.5rem" }}>
                    <Form.Control
                      type="text"
                      placeholder="Pesquisar valor máximo..."
                      className="mx-2 mb-2"
                      value={salarioSearchMax}
                      onChange={(e) => setSalarioSearchMax(e.target.value)}
                    />
                    {salariosFiltradosMax.length > 0 ? (
                      salariosFiltradosMax.map((salario) => (
                        <Dropdown.Item
                          key={`bruto-max-${salario}`}
                          onClick={() => {
                            handleSalarioBrutoChange({
                              ...activeFilters.salarioBruto,
                              max: salario,
                            });
                            setSalarioSearchMax("");
                          }}
                          active={activeFilters.salarioBruto.max === salario}
                        >
                          R$ {salario.toLocaleString('pt-BR')}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <div className="text-muted px-3 py-2">Nenhum valor encontrado</div>
                    )}
                  </div>
                </DropdownButton>
              </div>
            </div>

            {/* Seção Bairro */}
            <div className="filter-section">
              <h3 className="filter-section__title">Bairro</h3>
              <DropdownButton
                id="dropdown-bairros"
                title={`Bairros (${activeFilters.bairro.length})`}
                variant="outline-primary"
                className="w-100"
                autoClose="outside"
              >
                <div style={{ maxHeight: "250px", overflowY: "auto", padding: "0.5rem" }}>
                  <Form.Control
                    type="text"
                    placeholder="Pesquisar bairro..."
                    className="mx-2 mb-2"
                    value={bairroSearch}
                    onChange={(e) => setBairroSearch(e.target.value)}
                  />
                  {bairrosFiltrados.length > 0 ? (
                    bairrosFiltrados.map((bairro) => (
                      <Dropdown.Item
                        key={bairro || "sem-bairro"}
                        onClick={() => toggleBairro(bairro)}
                        active={activeFilters.bairro.includes(bairro)}
                        className="d-flex align-items-center"
                      >
                        <Form.Check
                          type="checkbox"
                          checked={activeFilters.bairro.includes(bairro)}
                          readOnly
                          className="me-2"
                        />
                        <span className="text-truncate" style={{ maxWidth: "200px" }}>
                          {bairro === "" ? "(Sem bairro cadastrado)" : bairro}
                        </span>
                      </Dropdown.Item>
                    ))
                  ) : (
                    <div className="text-muted px-3 py-2">Nenhum bairro encontrado</div>
                  )}
                </div>
              </DropdownButton>
            </div>

            {/* Seção Contrato */}
            <div className="filter-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="filter-section__title mb-0">Período do contrato</h3>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    handleClearDates();
                    setContratoIndeterminado(false);
                    handleIndeterminadoChange(false);
                  }}
                  disabled={!activeFilters.inicioContrato && !activeFilters.fimContrato && !activeFilters.contratoIndeterminado}
                  className="text-decoration-none p-0"
                >
                  Limpar
                </Button>
              </div>

              <div className="mb-3">
                <Form.Label className="fw-medium">Selecione o período</Form.Label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateRangeChange}
                  placeholderText="Selecione o período"
                  className="form-control"
                  locale={ptBR}
                  dateFormat="dd/MM/yyyy"
                  minDate={subYears(new Date(), 5)}
                  maxDate={addYears(new Date(), 1)}
                  disabled={contratoIndeterminado}
                  customInput={
                    <CustomDateInput
                      placeholder="Selecione o período"
                      value={startDate && endDate
                        ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
                        : ""}
                    />
                  }
                  monthsShown={2}
                  withPortal
                />
              </div>

              <div className="d-flex gap-3">
                <div className="flex-grow-1">
                  <Form.Label className="fw-medium">Data de Início</Form.Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => handleDateRangeChange([date, endDate])}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    locale={ptBR}
                    customInput={
                      <CustomDateInput
                        placeholder="Data inicial"
                        value={startDate ? format(startDate, "dd/MM/yyyy") : ""}
                      />
                    }
                  />
                </div>

                <div className="flex-grow-1">
                  <Form.Label className="fw-medium">Data de Término</Form.Label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => handleDateRangeChange([startDate, date])}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    locale={ptBR}
                    disabled={contratoIndeterminado}
                    customInput={
                      <CustomDateInput
                        placeholder="Data final"
                        value={endDate ? format(endDate, "dd/MM/yyyy") : ""}
                      />
                    }
                  />
                </div>
              </div>

              {/* Switch para contrato indeterminado - MOVIDO PARA ABAIXO DO CAMPO DE DATA DE TÉRMINO */}
              <Form.Check
                type="switch"
                id="contrato-indeterminado-filter"
                label="Contrato Indeterminado"
                checked={activeFilters.contratoIndeterminado || false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setContratoIndeterminado(isChecked);
                  handleIndeterminadoChange(isChecked);
                  if (isChecked) {
                    handleFimContratoChange(null); // Limpa apenas a data de fim
                    setDateRange([startDate, null]); // Mantém a data de início
                  }
                }}
                className="mt-3 mb-3 bg-light p-2 rounded"
              />

              {activeFilters.contratoIndeterminado ? (
                <div className="mt-3 p-2 bg-light rounded text-center">
                  <small className="text-muted fw-medium">
                    Contrato selecionado como Indeterminado
                  </small>
                </div>
              ) : startDate && endDate ? (
                <div className="mt-3 p-2 bg-light rounded text-center">
                  <small className="text-muted fw-medium">
                    Período selecionado: {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
                  </small>
                </div>
              ) : null}
            </div>
        </div>
    </AppModal>
  );
}

export default FilterModal;