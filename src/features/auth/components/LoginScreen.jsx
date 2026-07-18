import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";
import { Form, Button, Card, Alert, Collapse } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as authApi from "@shared/api/auth";

const isDev = import.meta.env.DEV;
const TEST_ID = "admin";
const TEST_PASSWORD = "senha123";

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestInfo, setShowTestInfo] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { branding, loading: tenantLoading } = useTenant();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/estrutura");
    }
  }, [isAuthenticated, navigate]);

  const { mutate } = useMutation({
    mutationFn: ({ id, password }) => authApi.login(id, password),
    onSuccess: (data) => {
      login(data);
      navigate("/estrutura");
    },
    onError: (err) => {
      const apiMessage = err.response?.data?.message;
      const details = err.response?.data?.details;
      setError(
        apiMessage ||
          details ||
          (err.code === "ECONNABORTED"
            ? "Tempo esgotado ao conectar na API."
            : "Erro ao fazer login. Verifique se a API está no ar.")
      );
      setIsSubmitting(false);
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!id || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    mutate({ id, password });
  };

  const fillTestCredentials = () => {
    setId(TEST_ID);
    setPassword(TEST_PASSWORD);
    setError("");
  };

  const displayName = branding?.displayName || branding?.name || "Sistema";
  const logoUrl = branding?.logoUrl;

  return (
    <div className="login-page">
      <Card className="login-card">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="login-brand-logo"
              />
            ) : (
              <div
                className="d-inline-flex align-items-center justify-content-center rounded mb-3 text-white fw-bold"
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--brand-primary)",
                  fontSize: "1.25rem",
                }}
                aria-hidden="true"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="h4 mb-1">{displayName}</h1>
            <p className="text-muted small mb-0">Acesse sua conta para continuar</p>
            {tenantLoading && (
              <small className="text-muted d-block mt-2">Carregando marca...</small>
            )}
          </div>

          {isDev && (
            <div className="mb-3">
              <Button
                variant="outline-warning"
                size="sm"
                onClick={fillTestCredentials}
                className="w-100"
              >
                <i className="bi bi-clipboard-check me-2" aria-hidden="true" />
                Usar dados de teste
              </Button>
              <Button
                variant="link"
                size="sm"
                className="w-100 text-decoration-none mt-1"
                onClick={() => setShowTestInfo((v) => !v)}
                aria-expanded={showTestInfo}
              >
                {showTestInfo ? "Ocultar credenciais" : "Mostrar credenciais"}
              </Button>
              <Collapse in={showTestInfo}>
                <div>
                  <Alert variant="warning" className="py-2 small mb-0 mt-2">
                    <div className="mb-1">
                      <strong>ID:</strong> <code>{TEST_ID}</code>
                    </div>
                    <div className="mb-1">
                      <strong>Senha:</strong> <code>{TEST_PASSWORD}</code>
                    </div>
                    <div className="text-danger mb-0">
                      Apenas para desenvolvimento
                    </div>
                  </Alert>
                </div>
              </Collapse>
            </div>
          )}

          {error && (
            <Alert variant="danger" role="alert" className="py-2">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="loginId">
              <Form.Label>ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite seu ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                required
                disabled={isSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;
