import React, { useState } from "react";
import { Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";
import { useAuth } from "@features/auth";
import { ObservationHistoryButton } from "@features/funcionarios";
import { ObservationHistoryModal } from "@features/funcionarios";
import { toast } from "react-toastify";

function Step2Form({
  newUser,
  setNewUser,
  previousStep,
  nextStep,
  coordenadoriaId,
  secretaria,
  handleCloseModal,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { addFuncionarios, addFuncionariosPath } = useAuth();
  const [showModalObs, setShowModalObs] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();
  const setorId = coordenadoriaId; // prop legado = lotação atual

  const { mutate: submitUserData } = useMutation({
    mutationFn: async () => {
      // Filtrar redes sociais vazias
      newUser.redesSociais = newUser.redesSociais.filter(
        (item) => item.link && item.nome
      );

      const formData = new FormData();
      formData.append("nome", newUser.nome);
      if (newUser.foto) {
        formData.append("foto", newUser.foto);
      }
      formData.append("secretaria", secretaria || newUser.secretaria || "");
      formData.append("natureza", newUser.natureza);
      formData.append("referencia", newUser.referencia || '');
      formData.append("salarioBruto", newUser.salarioBruto || 0);
      formData.append("funcao", newUser.funcao);
      formData.append("tipo", newUser.tipo || '');
      formData.append('observacoes', JSON.stringify(newUser.observacoes) || []);
      formData.append("setorId", setorId);
      formData.append("coordenadoria", setorId); // alias compat
      formData.append("cidade", newUser.cidade || '');
      formData.append("endereco", newUser.endereco || '');
      formData.append("bairro", newUser.bairro || '');
      formData.append("telefone", newUser.telefone || '');
      formData.append("inicioContrato", newUser.inicioContrato || '');
      formData.append("fimContrato", newUser.fimContrato || '');

      if (newUser.arquivo) {
        formData.append("arquivo", newUser.arquivo);
      }
      formData.append("redesSociais", JSON.stringify(newUser.redesSociais));

      return funcionariosApi.createFuncionario(formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      addFuncionarios(data);
      addFuncionariosPath(data);
      handleCloseModal();
      toast.success("Cadastro realizado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao enviar os dados:", error);
      setError(
        error.response?.data?.message ||
          "Ocorreu um erro ao enviar os dados. Por favor, tente novamente."
      );
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (coordenadoriaId) {
      submitUserData();
    } else {
      nextStep();
    }
  };

  const removeSocialMedia = (index) => {
    const redesSociais = [...newUser.redesSociais];
    redesSociais.splice(index, 1);
    setNewUser({ ...newUser, redesSociais });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <section className="app-form-section">
        <h3 className="app-form-section__title">Informações de contato</h3>
        <div className="app-form-section__body">
          <Row>
            <Col md={6}>
              <Form.Group controlId="formCidade" className="mb-3">
                <Form.Label>Cidade</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={newUser.cidade || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, cidade: e.target.value })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="formEndereco" className="mb-3">
                <Form.Label>Endereço</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: Rua das Flores, 123"
                  value={newUser.endereco || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, endereco: e.target.value })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="formBairro" className="mb-3">
                <Form.Label>Bairro</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: Centro"
                  value={newUser.bairro || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, bairro: e.target.value })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="formTelefone" className="mb-3">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: (11) 99999-9999"
                  value={newUser.telefone || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, telefone: e.target.value })
                  }
                />
                <Form.Text className="text-muted">
                  Formato: (DDD) número com ou sem hífen
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </section>

      <section className="app-form-section">
        <h3 className="app-form-section__title">Documentos e observações</h3>
        <div className="app-form-section__body">
          <Form.Group controlId="formArquivo" className="mb-3">
            <Form.Label>Arquivo anexo (PDF)</Form.Label>
            <Form.Control
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewUser({ ...newUser, arquivo: file });
                }
              }}
            />
            <Form.Text className="text-muted">
              {newUser.arquivo
                ? `Selecionado: ${newUser.arquivo.name || "arquivo.pdf"}`
                : "Opcional — apenas PDF"}
            </Form.Text>
          </Form.Group>

          <div className="cadastro-obs-panel">
            <div className="cadastro-obs-panel__icon" aria-hidden="true">
              <i className="bi bi-journal-text" />
            </div>
            <div className="cadastro-obs-panel__copy">
              <p className="cadastro-obs-panel__title">Observações</p>
              <p className="cadastro-obs-panel__desc">
                {(newUser.observacoes?.length || 0) === 0
                  ? "Nenhuma observação adicionada ainda. Use para anotar vínculos, pendências ou contexto do cadastro."
                  : `${newUser.observacoes.length} ${
                      newUser.observacoes.length === 1
                        ? "observação registrada"
                        : "observações registradas"
                    } neste cadastro.`}
              </p>
            </div>
            <ObservationHistoryButton
              onClick={() => setShowModalObs(true)}
              count={newUser.observacoes?.length || 0}
              label={
                (newUser.observacoes?.length || 0) > 0
                  ? "Gerenciar"
                  : "Adicionar"
              }
              variant="outline-primary"
            />
          </div>
        </div>
      </section>

      <section className="app-form-section">
        <h3 className="app-form-section__title">Redes sociais</h3>
        <div className="app-form-section__body">
          <Form.Group controlId="formRedesSociais">
            {newUser.redesSociais.map((rede, index) => (
              <div key={index} className="border rounded p-2 mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small">Rede #{index + 1}</span>
                  {newUser.redesSociais.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeSocialMedia(index)}
                      aria-label="Remover rede"
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </Button>
                  )}
                  </div>
                <Row>
                  <Col md={5} className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Nome (ex: LinkedIn)"
                      value={rede.nome}
                      onChange={(e) => {
                        const redesSociais = [...newUser.redesSociais];
                        redesSociais[index].nome = e.target.value;
                        setNewUser({ ...newUser, redesSociais });
                      }}
                    />
                  </Col>
                  <Col md={7} className="mb-2">
                    <Form.Control
                      type="url"
                      placeholder="https://..."
                      value={rede.link}
                      onChange={(e) => {
                        const redesSociais = [...newUser.redesSociais];
                        redesSociais[index].link = e.target.value;
                        setNewUser({ ...newUser, redesSociais });
                      }}
                    />
                  </Col>
                </Row>
              </div>
            ))}

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() =>
                setNewUser({
                  ...newUser,
                  redesSociais: [
                    ...newUser.redesSociais,
                    { nome: "", link: "" },
                  ],
                })
              }
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Adicionar rede social
            </Button>
          </Form.Group>
        </div>
      </section>

      <ObservationHistoryModal
        show={showModalObs}
        onHide={() => setShowModalObs(false)}
        initialObservations={newUser.observacoes || []}
        onObservationsChange={(next) =>
          setNewUser((prev) => ({ ...prev, observacoes: next }))
        }
      />

      <div className="app-form-actions">
        {isLoading ? (
          <div className="d-flex align-items-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Processando...
          </div>
        ) : (
          <>
            <Button variant="outline-secondary" size="sm" onClick={previousStep}>
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              Voltar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {coordenadoriaId ? "Finalizar cadastro" : "Avançar"}
              {!coordenadoriaId ? (
                <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
              ) : null}
            </Button>
          </>
        )}
      </div>
    </Form>
  );
}

export default Step2Form;