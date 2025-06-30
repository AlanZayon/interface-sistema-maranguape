import React, { useState } from "react";
import { Row, Col, Form, Button, Modal, Spinner, Card, Alert } from "react-bootstrap";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";
import { useAuth } from "./AuthContext";
import ObservationHistoryButton from "./ObservationHistoryButton";
import ObservationHistoryModal from "./ObservationHistoryModal";
import { FaPlus, FaTrash, FaLink, FaPhone, FaHome, FaCity, FaMapMarkerAlt, FaFilePdf } from "react-icons/fa";

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
      formData.append("secretaria", secretaria);
      formData.append("natureza", newUser.natureza);
      formData.append("referencia", newUser.referencia);
      formData.append("salarioBruto", newUser.salarioBruto || 0);
      formData.append("funcao", newUser.funcao);
      formData.append("tipo", newUser.tipo);
      formData.append('observacoes', JSON.stringify(newUser.observacoes) || []);
      formData.append("coordenadoria", coordenadoriaId);
      formData.append("cidade", newUser.cidade || '');
      formData.append("endereco", newUser.endereco || '');
      formData.append("bairro", newUser.bairro || '');
      formData.append("telefone", newUser.telefone || '');
      if (newUser.arquivo) {
        formData.append("arquivo", newUser.arquivo);
      }
      formData.append("redesSociais", JSON.stringify(newUser.redesSociais));

      const response = await axios.post(
        `${API_BASE_URL}/api/funcionarios/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries("funcionarios");
      addFuncionarios(data);
      addFuncionariosPath(data);
      handleCloseModal();
      alert("Cadastro realizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao enviar os dados:", error);
      setError("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
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

      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Informações de Contato</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group controlId="formCidade" className="mb-3">
                <Form.Label><FaCity className="me-2" />Cidade</Form.Label>
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
                <Form.Label><FaHome className="me-2" />Endereço</Form.Label>
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
                <Form.Label><FaMapMarkerAlt className="me-2" />Bairro</Form.Label>
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
                <Form.Label><FaPhone className="me-2" />Telefone</Form.Label>
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
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Documentos e Observações</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group controlId="formArquivo" className="mb-3">
                <Form.Label><FaFilePdf className="me-2" />Upload de Arquivo</Form.Label>
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
                  Apenas arquivos PDF (opcional)
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6} className="d-flex align-items-end">
              <ObservationHistoryButton 
                onClick={() => setShowModalObs(true)}
                className="w-100"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <ObservationHistoryModal
        show={showModalObs}
        onHide={() => setShowModalObs(false)}
        observacoesregister={newUser?.observacoes}
      />

      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Redes Sociais</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group controlId="formRedesSociais">
            {newUser.redesSociais.map((social, index) => (
              <div key={index} className="mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Rede Social #{index + 1}</span>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => removeSocialMedia(index)}
                  >
                    <FaTrash />
                  </Button>
                </div>
                
                <Form.Control
                  type="text"
                  placeholder="Ex: LinkedIn, Instagram, etc."
                  value={social.nome || ""}
                  onChange={(e) => {
                    const redesSociais = [...newUser.redesSociais];
                    redesSociais[index].nome = e.target.value;
                    setNewUser({ ...newUser, redesSociais });
                  }}
                  className="mb-2"
                />
                <div className="input-group">
                  <span className="input-group-text">
                    <FaLink />
                  </span>
                  <Form.Control
                    type="url"
                    placeholder="https://..."
                    value={social.link || ""}
                    onChange={(e) => {
                      const redesSociais = [...newUser.redesSociais];
                      redesSociais[index].link = e.target.value;
                      setNewUser({ ...newUser, redesSociais });
                    }}
                  />
                </div>
              </div>
            ))}
            
            <Button
              variant="outline-primary"
              onClick={() =>
                setNewUser({
                  ...newUser,
                  redesSociais: [
                    ...newUser.redesSociais,
                    { nome: "", link: "" },
                  ],
                })
              }
              className="d-flex align-items-center gap-2"
            >
              <FaPlus /> Adicionar Rede Social
            </Button>
          </Form.Group>
        </Card.Body>
      </Card>

      <Modal.Footer className="mt-4">
        {isLoading ? (
          <div className="d-flex justify-content-center w-100">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </Spinner>
          </div>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={previousStep}>
              Voltar
            </Button>
            <Button variant="primary" type="submit">
              {coordenadoriaId ? "Finalizar Cadastro" : "Avançar"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Form>
  );
}

export default Step2Form;