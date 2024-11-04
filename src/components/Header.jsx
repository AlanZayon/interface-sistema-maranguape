// components/Header.js
import React, { useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';

function Header({ handleShowFilter }) {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <header className="d-flex justify-content-between align-items-center bg-dark text-white p-3 header">
        <h1 style={{ fontSize: '1.2rem' }}>System Design</h1>
        <div className="d-flex">
          <InputGroup className="search-bar">
            <Form.Control placeholder="Search..." className="search-input" />
            <Button variant="success" onClick={handleShowFilter}>
              <i className="fas fa-filter"></i> Filtro
            </Button>
          </InputGroup>
          <Col className="ml-3 d-flex">
            <Button variant="outline-light" className="custom-height mx-1 mb-1">
              <i className="fas fa-file-alt"></i>
            </Button>
            <Button
              variant="outline-light"
              className="custom-height mx-1 mb-1"
              onClick={handleShowModal} // Abre o modal ao clicar
            >
              <i className="fas fa-plus"></i>
            </Button>
            <Button variant="outline-light" className="custom-height mx-1 mb-1">
              <i className="fas fa-sync-alt"></i>
            </Button>
            <Button variant="outline-light" className="custom-height mx-1 mb-1">
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </Col>
        </div>
      </header>

      {/* Modal para registrar novo funcionário */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Novo Funcionário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group controlId="formNome">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control type="text" placeholder="Digite o nome" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="formSecretaria">
                  <Form.Label>Secretaria</Form.Label>
                  <Form.Control type="text" placeholder="Digite a secretaria" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="formCoordenadoria">
                  <Form.Label>Coordenadoria</Form.Label>
                  <Form.Control type="text" placeholder="Digite a coordenadoria" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="formLocal">
                  <Form.Label>Local</Form.Label>
                  <Form.Control type="text" placeholder="Digite o local" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="formNatureza">
                  <Form.Label>Natureza</Form.Label>
                  <Form.Control type="text" placeholder="Digite a natureza" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="formIndicacao">
                  <Form.Label>Indicação</Form.Label>
                  <Form.Control type="text" placeholder="Digite a indicação" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="formFuncaoContrato">
                  <Form.Label>Função de Contrato</Form.Label>
                  <Form.Control type="text" placeholder="Digite a função de contrato" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="formFuncaoTrabalho">
                  <Form.Label>Função de Trabalho</Form.Label>
                  <Form.Control type="text" placeholder="Digite a função de trabalho" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formFuncaoTrabalho">
                  <Form.Label>Simbologia</Form.Label>
                  <Form.Control type="text" placeholder="Digite a função de trabalho" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formFuncaoTrabalho">
                  <Form.Label>GAS</Form.Label>
                  <Form.Control type="text" placeholder="Digite a função de trabalho" />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => { /* Aqui você pode adicionar a lógica de salvar */ }}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Header;
