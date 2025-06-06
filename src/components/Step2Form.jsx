import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button, Modal, Spinner } from "react-bootstrap";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";
import { useAuth } from "./AuthContext"; // Importa o contexto
import ObservationHistoryButton from "./ObservationHistoryButton";
import ObservationHistoryModal from "./ObservationHistoryModal";
import { use } from "react";

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
  const queryClient = useQueryClient();

  const { mutate: submitUserData } = useMutation({
    mutationFn: async () => {
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
      formData.append("cidade", newUser.cidade);
      formData.append("endereco", newUser.endereco);
      formData.append("bairro", newUser.bairro);
      formData.append("telefone", newUser.telefone);
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
      alert("Cadastrado");
    },
    onError: (error) => {
      console.error("Erro ao enviar os dados:", error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    
    // Verifica se coordenadoriaId está presente
    if (coordenadoriaId) {
      submitUserData();
    } else {
      nextStep(); // Chama a função nextStep caso não tenha coordenadoriaId
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
      <Col md={6}>
          <Form.Group controlId="formEndereco">
            <Form.Label>Cidade</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o endereço"
              value={newUser.cidade || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, cidade: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formEndereco">
            <Form.Label>Endereço</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o endereço"
              value={newUser.endereco || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, endereco: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formBairro">
            <Form.Label>Bairro</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o bairro"
              value={newUser.bairro || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, bairro: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formTelefone">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o telefone"
              value={newUser.telefone || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, telefone: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formArquivo">
            <Form.Label>Upload de Arquivo (PDF)</Form.Label>
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
          </Form.Group>
        </Col>

        <Col md={6}>
            <ObservationHistoryButton onClick={() => setShowModalObs(true)}/>
        </Col>

        <ObservationHistoryModal
                    show={showModalObs}
                    onHide={() => setShowModalObs(false)}
                    observacoesregister={newUser?.observacoes}
                />

        <Col md={6}>
          <Form.Group controlId="formRedesSociais">
            <Form.Label>Redes Sociais</Form.Label>
            {newUser.redesSociais.map((social, index) => (
              <div key={index} className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Nome da Rede Social"
                  value={social.nome || ""}
                  onChange={(e) => {
                    const redesSociais = [...newUser.redesSociais];
                    redesSociais[index].nome = e.target.value;
                    setNewUser({ ...newUser, redesSociais });
                  }}
                />
                <Form.Control
                  type="text"
                  placeholder="Link da Rede Social"
                  value={social.link || ""}
                  onChange={(e) => {
                    const redesSociais = [...newUser.redesSociais];
                    redesSociais[index].link = e.target.value;
                    setNewUser({ ...newUser, redesSociais });
                  }}
                  className="mt-2"
                />
              </div>
            ))}
            <Button
              variant="link"
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
              Adicionar Rede Social
            </Button>
          </Form.Group>
        </Col>
      </Row>

      <Modal.Footer>
        {isLoading ? (
          <div className="loading-screen">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </Spinner>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={previousStep}>
              Voltar
            </Button>
            <Button variant="primary" type="submit">
              Avançar
            </Button>
          </>
        )}
      </Modal.Footer>
    </Form>
  );
}

export default Step2Form;
