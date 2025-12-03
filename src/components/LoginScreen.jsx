import React, { useState, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import { useAuth } from './AuthContext';
import axios from "axios";
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { FaClipboardCheck, FaUser, FaKey } from 'react-icons/fa';

const loginUser = async ({ id, password }) => {
    const response = await axios.post(`${API_BASE_URL}/api/usuarios/login`,
         { id: id, password: password },  {
            withCredentials: true
          });
    return response.data;
};

function Login() {
    const navigate = useNavigate();
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTestInfo, setShowTestInfo] = useState(false);
    const { login, isAuthenticated } = useAuth();

    // Dados de teste
    const TEST_ID = '00006';
    const TEST_PASSWORD = 'Pref@2024';

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/mainscreen");
        }
    }, [isAuthenticated]);

    const { mutate, isLoading } = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            login(data);
            navigate('/mainscreen');
        },
        onError: (error) => {
            console.error(error.response?.data?.message);
            setError(error.response?.data?.message || 'Erro ao fazer login');
            setIsSubmitting(false);
        }
    });

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!id || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }
        
        setIsSubmitting(true);
        mutate({ id, password });
    };

    const fillTestCredentials = () => {
        setId(TEST_ID);
        setPassword(TEST_PASSWORD);
        setError('');
        
        // Feedback visual
        const idInput = document.getElementById('formId');
        const passwordInput = document.getElementById('formPassword');
        
        if (idInput) {
            idInput.classList.add('test-credentials-filled');
            setTimeout(() => idInput.classList.remove('test-credentials-filled'), 1000);
        }
        
        if (passwordInput) {
            passwordInput.classList.add('test-credentials-filled');
            setTimeout(() => passwordInput.classList.remove('test-credentials-filled'), 1000);
        }
        
        // Foca no campo ID
        setTimeout(() => {
            if (idInput) idInput.focus();
        }, 100);
    };

    const toggleTestInfo = () => {
        setShowTestInfo(!showTestInfo);
    };

    // Estilos CSS inline
    const styles = {
        testButton: {
            backgroundColor: '#ffc107',
            borderColor: '#ffc107',
            color: '#212529',
            fontWeight: 'bold',
            marginBottom: '10px'
        },
        testButtonHover: {
            backgroundColor: '#e0a800',
            borderColor: '#e0a800',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(255, 193, 7, 0.3)'
        },
        testInfoBox: {
            backgroundColor: '#fff8e1',
            border: '1px solid #ffeaa7',
            borderRadius: '5px',
            padding: '10px',
            marginBottom: '15px',
            fontSize: '0.9rem'
        },
        credentialsRow: {
            backgroundColor: '#f9f9f9',
            borderRadius: '3px',
            padding: '8px',
            marginBottom: '5px',
            borderLeft: '3px solid #28a745'
        },
        testWarning: {
            color: '#e74c3c',
            fontSize: '0.8rem',
            fontStyle: 'italic',
            marginTop: '5px'
        }
    };

    const [isHovering, setIsHovering] = useState(false);

    return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
            <style>
                {`
                    .test-credentials-filled {
                        border-color: #28a745 !important;
                        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
                        transition: all 0.5s ease;
                    }
                    
                    .test-credentials-container {
                        animation: fadeIn 0.5s ease;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .credentials-icon {
                        margin-right: 8px;
                        color: #495057;
                    }
                `}
            </style>
            
            <Card style={{ width: '24rem' }}>
                <Card.Body>
                    <h3 className="text-center mb-4">Login</h3>
                    
                    {/* Botão para dados de teste */}
                    <div className="mb-4">
                        <Button
                            variant="warning"
                            onClick={fillTestCredentials}
                            className="w-100 d-flex align-items-center justify-content-center"
                            style={{
                                ...styles.testButton,
                                ...(isHovering ? styles.testButtonHover : {})
                            }}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <FaClipboardCheck style={{ marginRight: '8px' }} />
                            USAR DADOS DE TESTE
                        </Button>
                        
                        <Button
                            variant="link"
                            onClick={toggleTestInfo}
                            className="w-100 text-decoration-none p-0 mt-1"
                            size="sm"
                        >
                            {showTestInfo ? 'Ocultar credenciais' : 'Mostrar credenciais'}
                        </Button>
                        
                        {showTestInfo && (
                            <div className="test-credentials-container" style={styles.testInfoBox}>
                                <h6 className="mb-2" style={{ color: '#e67e22' }}>
                                    <FaClipboardCheck style={{ marginRight: '5px' }} />
                                    Credenciais de Teste
                                </h6>
                                <div style={styles.credentialsRow}>
                                    <Row>
                                        <Col xs={3} className="d-flex align-items-center">
                                            <FaUser className="credentials-icon" />
                                            <strong>ID:</strong>
                                        </Col>
                                        <Col xs={9}>
                                            <code className="bg-light p-1 rounded d-block">{TEST_ID}</code>
                                        </Col>
                                    </Row>
                                </div>
                                <div style={styles.credentialsRow}>
                                    <Row>
                                        <Col xs={3} className="d-flex align-items-center">
                                            <FaKey className="credentials-icon" />
                                            <strong>Senha:</strong>
                                        </Col>
                                        <Col xs={9}>
                                            <code className="bg-light p-1 rounded d-block">{TEST_PASSWORD}</code>
                                        </Col>
                                    </Row>
                                </div>
                                <div style={styles.testWarning}>
                                    ⚠️ Use estas credenciais apenas para testar o sistema
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3" controlId="formId">
                            <Form.Label>
                                <FaUser style={{ marginRight: '8px' }} />
                                ID
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Digite seu ID"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Label>
                                <FaKey style={{ marginRight: '8px' }} />
                                Senha
                            </Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100 mt-3"
                            disabled={isSubmitting}
                            style={{ 
                                padding: '10px',
                                fontSize: '1.1rem'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Carregando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </Form>
                    
                    {/* Informação adicional */}
                    <div className="mt-4 text-center text-muted">
                        <small>
                            Clique no botão "USAR DADOS DE TESTE" para preencher automaticamente os campos
                        </small>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Login;