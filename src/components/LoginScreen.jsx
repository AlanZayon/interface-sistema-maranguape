import React, { useState, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import { useAuth } from './AuthContext'; // Importa o contexto
import axios from "axios";
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';

const loginUser = async ({ id, password }) => {
    const response = await axios.post(`${API_BASE_URL}/api/usuarios/login`,
         { id: id, password: password },  {
            withCredentials: true // Permite o envio de cookies
          });
    return response.data; // Supondo que a API retorna { token, role }
};

function Login() {
    const navigate = useNavigate();
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isAuthenticated } = useAuth(); // Usar o contexto de autenticação

    useEffect(() => {
        if (isAuthenticated) {
          // Se o usuário já está autenticado, redireciona para a rota principal
          navigate("/mainscreen")
        }
      }, [isAuthenticated]);


    const { mutate, isLoading, isError } = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            login(data);
            navigate('/mainscreen')
        },
        onError: (error) => {
            console.error(error.response.data.message);
            setError(error.response.data.message);
        }
    });

    const handleLogin = (e) => {
        e.preventDefault();
        setError(''); // Limpa erros anteriores

        if (!id || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }
        mutate({ id, password });
    };

    return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
            <Card style={{ width: '20rem' }}>
                <Card.Body>
                    <h3 className="text-center mb-4">Login</h3>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3" controlId="formId">
                            <Form.Label>ID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Digite seu ID"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Label>Senha</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100">
                            Entrar
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Login;
