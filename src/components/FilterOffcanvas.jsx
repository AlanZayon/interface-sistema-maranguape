// components/FilterOffcanvas.js
import React from 'react';
import { Offcanvas, Button, Form } from 'react-bootstrap';

function FilterOffcanvas({ showFilter, handleCloseFilter }) {
  return (
    <Offcanvas show={showFilter} onHide={handleCloseFilter} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Filtros</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <Form.Group controlId="filterCodigo">
            <Form.Label>Código</Form.Label>
            <Form.Control type="text" placeholder="Digite o código" />
          </Form.Group>

          <Form.Group controlId="filterServidor">
            <Form.Label>Servidor</Form.Label>
            <Form.Control type="text" placeholder="Digite o nome do servidor" />
          </Form.Group>

          <Form.Group controlId="filterSecretaria">
            <Form.Label>Secretaria</Form.Label>
            <Form.Control type="text" placeholder="Digite a secretaria" />
          </Form.Group>

          <Form.Group controlId="filterFuncao">
            <Form.Label>Função</Form.Label>
            <Form.Control type="text" placeholder="Digite a função" />
          </Form.Group>

          <Button variant="primary" type="submit" className="mt-3">Aplicar Filtro</Button>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default FilterOffcanvas;
