import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth, getHomePath } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";
import { Form, Button, Card } from "react-bootstrap";
import { AppNotice } from "@shared/ui";
import { useNavigate } from "react-router-dom";
import * as authApi from "@shared/api/auth";

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, role } = useAuth();
  const { branding, loading: tenantLoading, error: tenantError, slug, isPlatform } =
    useTenant();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getHomePath({ isPlatform, role }));
    }
  }, [isAuthenticated, isPlatform, role, navigate]);

  const { mutate } = useMutation({
    mutationFn: ({ id, password }) => authApi.login(id, password),
    onSuccess: (data) => {
      login(data);
      navigate(getHomePath({ isPlatform, role: data.role }));
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

  const displayName = isPlatform
    ? "Console Master"
    : branding?.displayName || branding?.name || "Sistema";
  const logoUrl = isPlatform ? null : branding?.logoUrl;

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
            {tenantError && slug && !isPlatform && (
              <AppNotice variant="warning" className="mt-3 text-start">
                Tenant indisponível — município inativo ou endereço incorreto.
              </AppNotice>
            )}
            {isPlatform && (
              <small className="text-muted d-block mt-2">
                Console master da plataforma
              </small>
            )}
          </div>

          {error && (
            <AppNotice variant="danger" className="py-2">
              {error}
            </AppNotice>
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
