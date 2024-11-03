// components/Header.js
import React from 'react';
import { Button, Col, Form, InputGroup } from 'react-bootstrap';

function Header({ handleShowFilter }) {
  return (
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
          <Button variant="outline-light" className="custom-height mx-1 mb-1">
            <i className="fas fa-plus"></i>
          </Button>
          <Button variant="outline-light" className=" custom-height mx-1 mb-1">
            <i className="fas fa-sync-alt"></i>
          </Button>
          <Button variant="outline-light" className="custom-height mx-1 mb-1">
            <i className="fas fa-sign-out-alt"></i>
          </Button>
        </Col>
      </div>
    </header>
  );
}

export default Header;
