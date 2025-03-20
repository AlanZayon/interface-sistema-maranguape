// FilterModal.js
import React from "react";
import { Modal, Form, DropdownButton, Dropdown, Button } from "react-bootstrap";

function FilterModal({
  show,
  onHide,
  activeFilters,
  naturezas,
  todasFuncoes,
  todosBairros,
  todasReferencias,
  toggleNatureza,
  toggleFuncao,
  toggleBairro,
  toggleReferencia,
  handleSalarioBrutoChange,
  handleSalarioLiquidoChange,
}) {
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
        <Form.Group className="d-flex">
          <Form.Control
            value={activeFilters.salarioBruto.min}
            type="number"
            placeholder="Mínimo"
            onChange={(e) =>
              handleSalarioBrutoChange({
                ...activeFilters.salarioBruto,
                min: e.target.value,
              })
            }
            className="me-2"
          />
          <Form.Control
            value={activeFilters.salarioBruto.max}
            type="number"
            placeholder="Máximo"
            onChange={(e) =>
              handleSalarioBrutoChange({
                ...activeFilters.salarioBruto,
                max: e.target.value,
              })
            }
          />
        </Form.Group>

        {/* Seção Salário Líquido */}
        <h5>Salário Líquido</h5>
        <Form.Group className="d-flex">
          <Form.Control
            value={activeFilters.salarioLiquido.min}
            type="number"
            placeholder="Mínimo"
            onChange={(e) =>
              handleSalarioLiquidoChange({
                ...activeFilters.salarioLiquido,
                min: e.target.value,
              })
            }
            className="me-2"
          />
          <Form.Control
            value={activeFilters.salarioLiquido.max}
            type="number"
            placeholder="Máximo"
            onChange={(e) =>
              handleSalarioLiquidoChange({
                ...activeFilters.salarioLiquido,
                max: e.target.value,
              })
            }
          />
        </Form.Group>

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
        {/* <Button variant="primary" onClick={onHide}>
                    Aplicar Filtros
                </Button> */}
      </Modal.Footer>
    </Modal>
  );
}

export default FilterModal;
