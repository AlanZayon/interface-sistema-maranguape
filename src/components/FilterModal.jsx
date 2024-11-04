// FilterModal.js
import React from 'react';
import { Modal, Form, DropdownButton, Dropdown, Button } from 'react-bootstrap';

function FilterModal({
    show,
    onHide,
    activeFilters,
    naturezas,
    todasFuncoes,
    toggleNatureza,
    toggleFuncao
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

                {/* Seção Função com Dropdown de Pesquisa */}
                <h5>Função</h5>
                <DropdownButton
                    id="dropdown-funcoes"
                    title="Selecione Funções"
                    variant="outline-primary"
                    className="mb-3"
                    autoClose="outside"
                >
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <Form.Control type="text" placeholder="Pesquisar função..." className="mx-3 my-2" />

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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fechar
                </Button>
                <Button variant="primary" onClick={onHide}>
                    Aplicar Filtros
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default FilterModal;
