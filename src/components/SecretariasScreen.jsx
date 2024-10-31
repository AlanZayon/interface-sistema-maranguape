// components/SecretariasScreen.js
import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function SecretariasScreen() {

    const navigate = useNavigate();

    return (
        <Row className="mt-4">
            <Col md={4}>
                <Link to="/secretarias/Saúde">
                    <Card className="text-center" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Saúde</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Educação">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Educação</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Infraestrutura</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Agricultura</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Meio Ambiente e Urbanização</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Finanças</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Gabinete do Prefeito</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>IPMM</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Hospital</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Esporte e Juventude</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>FITEC</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            <Col md={4}>
                <Link to="/secretarias/Transporte">
                    <Card className="text-center m-2" style={{ cursor: 'pointer' }}>
                        <Card.Body>
                            <Card.Title>Secretaria de Habitação</Card.Title>
                        </Card.Body>
                    </Card>
                </Link>
            </Col>
            {/* Outras secretarias */}
            {/* Botão de Voltar */}
            <div className="text-center mt-3">
                <Button variant="primary" onClick={() => navigate('/mainscreen')}>
                    Voltar
                </Button>
            </div>

        </Row>

    );
}

export default SecretariasScreen;
