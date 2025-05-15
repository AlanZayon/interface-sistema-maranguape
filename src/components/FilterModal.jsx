// FilterModal.js
import React, { useEffect, useState } from "react";
import { Modal, Form, DropdownButton, Dropdown, Button } from "react-bootstrap";

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
}) {
  const [salariosBrutos, setSalariosBrutos] = useState([]);
  const [salariosLiquidos, setSalariosLiquidos] = useState([]);

  // Simulação de dados de salários (substitua pelos seus dados reais)
  useEffect(() => {
    // Exemplo de dados de salários brutos e líquidos
    const salariosBrutosExemplo = todosSalariosBrutos;
    const salariosLiquidosExemplo = todosSalariosLiquidos;

    setSalariosBrutos(salariosBrutosExemplo);
    setSalariosLiquidos(salariosLiquidosExemplo);

    // Definir valores mínimos e máximos ao abrir o modal
    if (show) {
      handleSalarioBrutoChange({
        min: Math.min(...salariosBrutosExemplo),
        max: Math.max(...salariosBrutosExemplo),
      });
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Filtros</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Seção Natureza */}
        <h5>Natureza</h5>
        <Form.Group>
          {naturezas.map((natureza) => (
            <Form.Check
              key={natureza}
              type="checkbox"
              label={natureza}
              name="natureza"
              checked={activeFilters.natureza.includes(natureza)}
              onChange={() => toggleNatureza(natureza)}
            />
          ))}
        </Form.Group>

        {/* Seção Função */}
        <h5>Função</h5>
        <DropdownButton
          id="dropdown-funcoes"
          title="Selecione Funções"
          variant="outline-primary"
          className="mb-3"
          autoClose="outside"
        >
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <Form.Control
              type="text"
              placeholder="Pesquisar função..."
              className="mx-3 my-2"
            />

            {todasFuncoes.map((funcao) => (
              <Dropdown.Item
                key={funcao}
                onClick={() => toggleFuncao(funcao)}
                active={activeFilters.funcao.includes(funcao)}
                title={funcao}
              >
                {funcao.length > 25 ? `${funcao.substring(0, 25)}...` : funcao}
              </Dropdown.Item>
            ))}
          </div>
        </DropdownButton>

        {/* Seção Referência */}
        <h5>Referência</h5>
        <DropdownButton
          id="dropdown-referencias"
          title="Selecione Referências"
          variant="outline-primary"
          className="mb-3"
          autoClose="outside"
        >
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <Form.Control
              type="text"
              placeholder="Pesquisar referência..."
              className="mx-3 my-2"
            />

            {todasReferencias.map((referencia) => (
              <Dropdown.Item
                key={referencia}
                onClick={() => toggleReferencia(referencia)}
                active={activeFilters.referencia.includes(referencia)}
                title={referencia}
              >
                {referencia.length > 25
                  ? `${referencia.substring(0, 25)}...`
                  : referencia}
              </Dropdown.Item>
            ))}
          </div>
        </DropdownButton>

        {/* Seção Salário Bruto */}
        <h5>Salário Bruto</h5>
        <div className="d-flex gap-2 mb-3">
          <DropdownButton
            id="dropdown-salario-bruto-min"
            title={`Mínimo: ${activeFilters.salarioBruto.min}`}
            variant="outline-primary"
          >
            {salariosBrutos.map((salario) => (
              <Dropdown.Item
                key={`bruto-min-${salario}`}
                onClick={() =>
                  handleSalarioBrutoChange({
                    ...activeFilters.salarioBruto,
                    min: salario,
                  })
                }
                active={activeFilters.salarioBruto.min === salario}
              >
                {salario}
              </Dropdown.Item>
            ))}
          </DropdownButton>

          <DropdownButton
            id="dropdown-salario-bruto-max"
            title={`Máximo: ${activeFilters.salarioBruto.max}`}
            variant="outline-primary"
          >
            {salariosBrutos.map((salario) => (
              <Dropdown.Item
                key={`bruto-max-${salario}`}
                onClick={() =>
                  handleSalarioBrutoChange({
                    ...activeFilters.salarioBruto,
                    max: salario,
                  })
                }
                active={activeFilters.salarioBruto.max === salario}
              >
                {salario}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </div>

        {/* Seção Salário Líquido */}

        {/* Seção Bairro */}
        <h5>Bairro</h5>
        <DropdownButton
          id="dropdown-bairros"
          title="Selecione Bairros"
          variant="outline-primary"
          className="mb-3"
          autoClose="outside"
        >
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <Form.Control
              type="text"
              placeholder="Pesquisar bairro..."
              className="mx-3 my-2"
            />

            {todosBairros.map((bairro) => (
              <Dropdown.Item
                key={bairro}
                onClick={() => toggleBairro(bairro)}
                active={activeFilters.bairro.includes(bairro)}
                title={bairro}
              >
                {bairro.length > 25 ? `${bairro.substring(0, 25)}...` : bairro}
              </Dropdown.Item>
            ))}
          </div>
        </DropdownButton>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FilterModal;