// FilterModal.js
import React, { useEffect, useState, useMemo } from "react";
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
  const [funcaoSearch, setFuncaoSearch] = useState("");
  const [referenciaSearch, setReferenciaSearch] = useState("");
  const [bairroSearch, setBairroSearch] = useState("");
  const [salarioMinSearch, setSalarioMinSearch] = useState("");
  const [salarioMaxSearch, setSalarioMaxSearch] = useState("");

  // Ordena os salários uma vez para melhor experiência do usuário
  const salariosOrdenados = useMemo(() => {
    return [...todosSalariosBrutos].sort((a, b) => a - b);
  }, [todosSalariosBrutos]);

  // Função para filtrar salários baseados no valor de pesquisa
  const filtrarSalarios = (salarios, valorPesquisa, tipo = 'min') => {
    if (!valorPesquisa) return salarios;
    
    // Remove caracteres não numéricos e converte para número
    const valorNumerico = parseFloat(valorPesquisa.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (isNaN(valorNumerico)) return [];
    
    return salarios.filter(salario => 
      tipo === 'min' ? salario >= valorNumerico : salario <= valorNumerico
    );
  };

  // Filtrar funções baseadas no termo de pesquisa
  const funcoesFiltradas = todasFuncoes.filter((funcao) =>
    funcao.toLowerCase().includes(funcaoSearch.toLowerCase())
  );

  // Filtrar referências baseadas no termo de pesquisa
  const referenciasFiltradas = todasReferencias.filter((referencia) =>
    referencia.toLowerCase().includes(referenciaSearch.toLowerCase())
  );

  // Filtrar bairros baseados no termo de pesquisa
  const bairrosFiltrados = todosBairros.filter((bairro) =>
    bairro.toLowerCase().includes(bairroSearch.toLowerCase())
  );

  // Filtra os salários mínimos
  const salariosMinFiltrados = filtrarSalarios(
    salariosOrdenados, 
    salarioMinSearch, 
    'min'
  );

  // Filtra os salários máximos
  const salariosMaxFiltrados = filtrarSalarios(
    salariosOrdenados, 
    salarioMaxSearch, 
    'max'
  );

  // Inicializa os valores mínimo e máximo
  useEffect(() => {
    if (show && salariosOrdenados.length > 0) {
      handleSalarioBrutoChange({
        min: salariosOrdenados[0],
        max: salariosOrdenados[salariosOrdenados.length - 1],
      });
    }
  }, [show, salariosOrdenados]);

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
              value={funcaoSearch}
              onChange={(e) => setFuncaoSearch(e.target.value)}
            />

            {funcoesFiltradas.map((funcao) => (
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
              value={referenciaSearch}
              onChange={(e) => setReferenciaSearch(e.target.value)}
            />

            {referenciasFiltradas.map((referencia) => (
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

        {/* Seção Salário Bruto - Melhorada */}
        <h5>Salário Bruto</h5>
        <div className="d-flex gap-2 mb-3">
          <DropdownButton
            id="dropdown-salario-bruto-min"
            title={`Mínimo: ${activeFilters.salarioBruto.min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            variant="outline-primary"
            autoClose="outside"
          >
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              <Form.Control
                type="text"
                placeholder="Digite valor mínimo..."
                className="mx-3 my-2"
                value={salarioMinSearch}
                onChange={(e) => setSalarioMinSearch(e.target.value)}
              />
              {salariosMinFiltrados.map((salario) => (
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
                  {salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Dropdown.Item>
              ))}
            </div>
          </DropdownButton>

          <DropdownButton
            id="dropdown-salario-bruto-max"
            title={`Máximo: ${activeFilters.salarioBruto.max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            variant="outline-primary"
            autoClose="outside"
          >
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              <Form.Control
                type="text"
                placeholder="Digite valor máximo..."
                className="mx-3 my-2"
                value={salarioMaxSearch}
                onChange={(e) => setSalarioMaxSearch(e.target.value)}
              />
              {salariosMaxFiltrados.map((salario) => (
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
                  {salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Dropdown.Item>
              ))}
            </div>
          </DropdownButton>
        </div>

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
              value={bairroSearch}
              onChange={(e) => setBairroSearch(e.target.value)}
            />

            {bairrosFiltrados.map((bairro) => (
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