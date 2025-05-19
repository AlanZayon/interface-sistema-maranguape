import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Form, Button, Modal, Card, Spinner } from "react-bootstrap";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext"; // Importa o contexto
import { API_BASE_URL } from "../utils/apiConfig";
import { FaSyncAlt, FaSave, FaTimes } from "react-icons/fa";

function Step2Form({
  newUser = { coordenadoria: [] },
  previousStep,
  handleCloseModal,
}) {
  // Função para fazer a requisição com axios
  const fetchSetoresData = async () => {
    const response = await axios.get(
      `${API_BASE_URL}/api/setores/setoresOrganizados`
    );
    return response.data;
  };

  const { data, isError, error } = useQuery({
    queryKey: ["setores"],
    queryFn: fetchSetoresData,
  });

  const { setorId, "*": subPath } = useParams();
  const [setoresOrganizados, setSetoresOrganizados] = useState([]);
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [subsetorSelecionado, setSubsetorSelecionado] = useState([]);
  const [coordenadoriaSelecionada, setCoordenadoriaSelecionada] =
    useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addFuncionarios, addFuncionariosPath } = useAuth(); // Usar o contexto de autenticação
  const currentSetorId = subPath ? subPath.split("/").pop() : setorId;

  // Carrega os dados quando a resposta da API é recebida
  useEffect(() => {
    if (data && data.setores) {
      setSetoresOrganizados(data.setores);
    }
  }, [data]);

  const refreshAll = () => {
    setSetorSelecionado(null);
    setSubsetorSelecionado([]); // Limpa o subsetor selecionado anterior
    setCoordenadoriaSelecionada(null); // Limpa a coordenadoria selecionada anterior
    newUser.coordenadoria = "";
  };

  // Função para tratar a seleção do setor
  const handleSetorSelect = (setorId) => {
    const setor = setoresOrganizados.find((s) => s._id === setorId);
    setSetorSelecionado(setor);
    setSubsetorSelecionado([]); // Limpa o subsetor selecionado anterior
    setCoordenadoriaSelecionada(null); // Limpa a coordenadoria selecionada anterior
    newUser.coordenadoria = "";
  };

  // Função recursiva para buscar um subsetor em qualquer nível de profundidade
  const findSubsetorById = (subsetores, subsetorId) => {
    for (let subsetor of subsetores) {
      if (subsetor._id === subsetorId) {
        return subsetor;
      } else if (subsetor.subsetores && subsetor.subsetores.length > 0) {
        const found = findSubsetorById(subsetor.subsetores, subsetorId);
        if (found) return found;
      }
    }
    return null;
  };

  // Função para tratar a seleção do subsetor
const handleSubsetorSelect = (subsetorId) => {
  const subsetor = findSubsetorById(setorSelecionado.subsetores, subsetorId);
  if (subsetor) {
    setSubsetorSelecionado([subsetor]);
    setCoordenadoriaSelecionada(null);  // **limpa aqui também**
    newUser.coordenadoria = "";
  }
};

  // Função para atualizar o newUser com o ID da coordenadoria selecionada
  const handleCoordenadoriaSelect = (coordenadoriaId) => {
    let coordenadoria;

    if (subsetorSelecionado.length > 0) {
      // Pega a última coordenadoria do último subsetor selecionado
      const ultimoSubsetor =
        subsetorSelecionado[subsetorSelecionado.length - 1];
      coordenadoria = ultimoSubsetor.coordenadorias.find(
        (coord) => coord._id === coordenadoriaId
      );
    } else if (setorSelecionado && setorSelecionado.coordenadorias) {
      // Se não há subsetor selecionado, busca a coordenadoria diretamente no setor
      coordenadoria = setorSelecionado.coordenadorias.find(
        (coord) => coord._id === coordenadoriaId
      );
    }

    // Define a coordenadoria selecionada e atualiza o usuário
    setCoordenadoriaSelecionada(coordenadoria);
    newUser.coordenadoria = coordenadoriaId;
  };

  const handleSubmit2 = async () => {
    setIsLoading(true);
    // Filtra as redes sociais
    newUser.redesSociais = newUser.redesSociais.filter(
      (item) => item.link && item.nome
    );

    const formData = new FormData();
    formData.append("nome", newUser.nome);
    if (newUser.foto) {
      formData.append("foto", newUser.foto);
    }
    formData.append("secretaria", setorSelecionado.nome);
    formData.append("natureza", newUser.natureza);
    formData.append("referencia", newUser.referencia);
    formData.append("salarioBruto", newUser.salarioBruto || 0);
    formData.append("salarioLiquido", Number(newUser.salarioLiquido || 0));
    formData.append("funcao", newUser.cargo);
    formData.append("tipo", newUser.tipo);
    formData.append("observacoes", JSON.stringify(newUser.observacoes) || []);
    formData.append("coordenadoria", newUser.coordenadoria);
    formData.append("endereco", newUser.endereco);
    formData.append("bairro", newUser.bairro);
    formData.append("telefone", newUser.telefone);
    if (newUser.arquivo) {
      formData.append("arquivo", newUser.arquivo);
    }
    formData.append("redesSociais", JSON.stringify(newUser.redesSociais));

    try {
      // Realiza a requisição para a API
      const response = await axios.post(
        `${API_BASE_URL}/api/funcionarios/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Exibe a resposta da API
      addFuncionarios(response.data);
      addFuncionariosPath(response.data);
      handleCloseModal();
      alert("cadastrado");
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza o formulário
  return (
    <Form>
      <Card className="mb-3">
        <Card.Body>
          <Button
            onClick={refreshAll}
            variant="outline-secondary"
            className="mb-3"
          >
            <FaSyncAlt /> Recarregar
          </Button>

          <Row>
            <Col md={12}>
              <Form.Group controlId="formSetor">
                <Form.Label>Setores:</Form.Label>
                <div className="d-flex flex-wrap">
                  {setoresOrganizados.map((setor) => (
                    <Button
                      key={setor._id}
                      variant={
                        setorSelecionado?._id === setor._id
                          ? "primary"
                          : "outline-primary"
                      }
                      className="me-2 mb-2"
                      onClick={() => handleSetorSelect(setor._id)}
                    >
                      {setor.nome}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {setorSelecionado && setorSelecionado.subsetores && (
            <Row>
              <Col md={12}>
                {subsetorSelecionado.map((subsetor, index) => (
                  <Form.Group key={index} controlId={`formSubsetor${index}`}>
                    <Form.Label>Subsetores - {subsetor.nome}</Form.Label>
                    <div className="d-flex flex-wrap">
                      {subsetor.subsetores.map((sub) => (
                        <Button
                          key={sub._id}
                          variant={
                            subsetorSelecionado.some(
                              (sel) => sel._id === sub._id
                            )
                              ? "primary"
                              : "outline-primary"
                          }
                          className="me-2 mb-2"
                          onClick={() => handleSubsetorSelect(sub._id)}
                        >
                          {sub.nome}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                ))}
                {subsetorSelecionado.length === 0 &&
                  setorSelecionado.subsetores.map((sub) => (
                    <Button
                      key={sub._id}
                      variant={
                        subsetorSelecionado.some((sel) => sel._id === sub._id)
                          ? "primary"
                          : "outline-primary"
                      }
                      className="me-2 mb-2"
                      onClick={() => handleSubsetorSelect(sub._id)}
                    >
                      {sub.nome}
                    </Button>
                  ))}
              </Col>
            </Row>
          )}

          {subsetorSelecionado.map(
            (subsetor, index) =>
              subsetor.coordenadorias &&
              subsetor.coordenadorias.length > 0 && (
                <Row key={`coordenadoria-${index}`}>
                  <Col md={12}>
                    <Form.Group controlId={`formCoordenadoria_${index}`}>
                      <Form.Label>Divisoões: {subsetor.nome}</Form.Label>
                      <div className="d-flex flex-wrap">
                        {subsetor.coordenadorias.map((coordenadoria) => (
                          <Button
                            key={coordenadoria._id}
                            variant={
                              coordenadoriaSelecionada?._id ===
                              coordenadoria._id
                                ? "warning"
                                : "outline-warning"
                            }
                            className="me-2 mb-2"
                            onClick={() =>
                              handleCoordenadoriaSelect(coordenadoria._id)
                            }
                          >
                            {coordenadoria.nome}
                          </Button>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              )
          )}

          {setorSelecionado &&
            subsetorSelecionado.length === 0 &&
            setorSelecionado.coordenadorias &&
            setorSelecionado.coordenadorias.length > 0 && (
              <Row>
                <Col md={12}>
                  <Form.Group controlId="formCoordenadoriaInicial">
                    <Form.Label>Divisoões: {setorSelecionado.nome}</Form.Label>
                    <div className="d-flex flex-wrap">
                      {setorSelecionado.coordenadorias.map((coordenadoria) => (
                        <Button
                          key={coordenadoria._id}
                          variant={
                            coordenadoriaSelecionada?._id === coordenadoria._id
                              ? "warning"
                              : "outline-warning"
                          }
                          className="me-2 mb-2"
                          onClick={() =>
                            handleCoordenadoriaSelect(coordenadoria._id)
                          }
                        >
                          {coordenadoria.nome}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            )}
        </Card.Body>
      </Card>

      <Modal.Footer>
        {isLoading ? (
          <div className="loading-screen">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </Spinner>
          </div>
        ) : (
          <div>
            <Button className="mx-1" variant="secondary" onClick={previousStep}>
              <FaTimes /> Voltar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit2}
              disabled={!coordenadoriaSelecionada}
            >
              <FaSave /> Salvar
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Form>
  );
}

export default Step2Form;
