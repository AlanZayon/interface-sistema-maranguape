// components/MainScreen.js
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function MainScreen() {
  return (
    <Row className="mt-4">
      <Col md={4}>
        <Link to="/secretarias" style={{ textDecoration: 'none' }}>
          <Card className="text-center" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title >Secretarias</Card.Title>
            </Card.Body>
          </Card>
        </Link>
      </Col>
      <Col md={4}>
        <Link to="/localidade" style={{ textDecoration: 'none' }}>
          <Card className="text-center" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>Localidade</Card.Title>
            </Card.Body>
          </Card>
        </Link>
      </Col>
      <Col md={4}>
        <Link to="/indicação" style={{ textDecoration: 'none' }}>
          <Card className="text-center" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>Referências</Card.Title>
            </Card.Body>
          </Card>
        </Link>
      </Col>
      {/* Outras seções de navegação */}
    </Row>
  );
}

export default MainScreen;
