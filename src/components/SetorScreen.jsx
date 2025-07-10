import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Collapse,
  Container,
  Dropdown,
  Spinner,
  Alert,
  Badge,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaAngleDown,
  FaAngleUp,
  FaChevronLeft,
  FaPencilAlt,
  FaEdit,
  FaTrash,
  FaFolderPlus,
  FaFolder,
  FaIdCard,
  FaEllipsisV,
  FaSearch,
} from "react-icons/fa";
import axios from "axios";
import { useAuth } from "./AuthContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import FuncionariosList from "./FuncionariosList";
import ObservationHistoryButton from "./ObservationHistoryButton";
import ObservationHistoryModal from "./ObservationHistoryModal";
import { API_BASE_URL } from "../utils/apiConfig";

function SetorScreen() {
  const { setorId, "*": subPath } = useParams();
  const [newUser, setNewUser] = useState({
    nome: "",
    foto: null,
    secretaria: "",
    funcao: "",
    natureza: "",
    referencia: "",
    redesSociais: [{ link: "", nome: "" }],
    salarioBruto: 0,
    tipo: "",
    cidade: "",
    endereco: "",
    bairro: "",
    telefone: "",
    observacoes: [],
    arquivo: null,
  });
  const [coordenadoriaId, setCoordenadoriaId] = useState(null);
  const [subSetores, setSubSetores] = useState([]);
  const [editingSetorId, setEditingSetorId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editingCoordenadoriaId, setEditingCoordenadoriaId] = useState(null);
  const [editedNameCoordenadoria, setEditedNameCoordenadoria] = useState("");
  const [showSelectionControlsEdit, setShowSelectionControlsEdit] =
    useState(false);
  const [coordenadorias, setCoordenadorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalCoordenadoria, setShowModalCoordenadoria] = useState(false);
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [newSubSetorName, setNewSubSetorName] = useState("");
  const [newCoordName, setNewCoordName] = useState("");
  const [openCoord, setOpenCoord] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setorToDelete, setSetorToDelete] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingSubSetor, setIsCreatingSubSetor] = useState(false);
  const [isCreatingCoord, setIsCreatingCoord] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { funcionarios, setFuncionarios } = useAuth();

  // Decode path names
  let setorNomeDecodificado;
  let setorNomeDecodificadoLink;
  let setorSegment;
  const fullPath = location.pathname;

  const subSetorSegment = `${fullPath.split("/")[2]}`;
  if (fullPath.split("/").length === 3) {
    setorSegment = `${fullPath.split("/")[1]}`;
    setorNomeDecodificado = decodeURIComponent(setorSegment);
  } else {
    setorSegment = `${fullPath.split("/")[1]}`;
    setorNomeDecodificadoLink = decodeURIComponent(setorSegment);
  }

  const subSetorNomeDecodificado = decodeURIComponent(subSetorSegment);
  const currentSetorId = subPath ? subPath.split("/").pop() : setorId;

  // Arrays ordenados e filtrados
  const sortedSubSetores = useMemo(() => {
    return [...subSetores].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [subSetores]);

  const sortedCoordenadorias = useMemo(() => {
    return [...coordenadorias].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [coordenadorias]);

  const filteredSubSetores = useMemo(() => {
    return sortedSubSetores.filter(subSetor =>
      subSetor.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedSubSetores, searchTerm]);

  const filteredCoordenadorias = useMemo(() => {
    return sortedCoordenadorias.filter(coord =>
      coord.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedCoordenadorias, searchTerm]);

  const fetchSetoresData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/setores/dados/${currentSetorId}`
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const fetchFuncionarios = async (coordId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/funcionarios/buscarFuncionariosPorCoordenadoria/${coordId}`
      );
      setFuncionarios((prevFuncionarios) => ({
        ...prevFuncionarios,
        [coordId]: response.data,
      }));
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
    }
  };

  const handleCloseModal = () => {
    setNewUser({
      nome: "",
      foto: null,
      secretaria: "",
      funcao: "",
      natureza: "",
      referencia: "",
      redesSociais: [{ link: "", nome: "" }],
      salarioBruto: 0,
      salarioLiquido: 0,
      cidade: "",
      endereco: "",
      bairro: "",
      telefone: "",
      observacoes: [],
      arquivo: null,
    });
    setShowModalCoordenadoria(false);
    setStep(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchSetoresData();
        const coordenadorias = data.subsetores
          .filter((subsetor) => subsetor.tipo === "Coordenadoria")
          .sort((a, b) => a.nome.localeCompare(b.nome));

        const subsetores = data.subsetores
          .filter((subsetor) => subsetor.tipo === "Subsetor")
          .sort((a, b) => a.nome.localeCompare(b.nome));

        setCoordenadorias(coordenadorias);
        setSubSetores(subsetores);
        setError(null);
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
        setError(
          "Falha ao carregar dados do setor. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentSetorId]);

  useEffect(() => {
    Object.keys(openCoord).forEach((coordNome) => {
      const coordId = coordenadorias.find((c) => c.nome === coordNome)?._id;
      if (openCoord[coordNome] && coordId) {
        fetchFuncionarios(coordId);
      }
    });
  }, [openCoord, coordenadorias]);

  const createSetor = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/setores`, data);
    return response.data;
  };

  const updateSetor = async ({ id, nome }) => {
    const response = await axios.put(
      `${API_BASE_URL}/api/setores/rename/${id}`,
      { nome }
    );
    return response.data;
  };

  const deleteSetor = async (id) => {
    const response = await axios.delete(
      `${API_BASE_URL}/api/setores/del/${id}`
    );
    return response.data;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSetor,
    onSuccess: () => {
      setSubSetores((prevSubSetores) =>
        prevSubSetores.filter((subsetor) => subsetor._id !== setorToDelete)
      );
      setCoordenadorias((prevCoordenadorias) =>
        prevCoordenadorias.filter(
          (coordenadoria) => coordenadoria._id !== setorToDelete
        )
      );
      queryClient.invalidateQueries("setores");
    },
    onError: (error) => {
      console.error("Erro ao excluir setor:", error);
    },
  });

  const handleDeleteSetor = (setorId) => {
    setSetorToDelete(setorId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (setorToDelete) {
      try {
        await deleteMutation.mutateAsync(setorToDelete);
      } catch (error) {
        console.error("Erro ao excluir setor:", error);
      }
    }
    setShowDeleteModal(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSetorToDelete(null);
  };

  const mutation = useMutation({
    mutationFn: createSetor,
    onSuccess: (data) => {
      if (data.tipo === "Subsetor") {
        setSubSetores((prev) =>
          [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome))
        );
      } else if (data.tipo === "Coordenadoria") {
        setCoordenadorias((prev) =>
          [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }
      queryClient.invalidateQueries("setores");
      if (data.tipo === "Subsetor") {
        setIsCreatingSubSetor(false);
        setShowModal(false);
        setNewSubSetorName("");
      } else {
        setIsCreatingCoord(false);
        setShowCoordModal(false);
        setNewCoordName("");
      }
    },
    onError: (error) => {
      console.error("Erro ao criar setor:", error);
      setIsCreatingSubSetor(false);
      setIsCreatingCoord(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSetor,
    onSuccess: (data, variables) => {
      const formatNome = (valor) => {
        if (typeof valor !== "string" || !valor.trim()) return valor;
        return valor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ç/g, "c")
          .replace(/Ç/g, "C")
          .toUpperCase();
      };

      const nomeFormatado = formatNome(variables.nome);

      if (subSetores.some((s) => s._id === variables.id)) {
        setSubSetores((prev) =>
          prev
            .map((s) =>
              s._id === variables.id ? { ...s, nome: nomeFormatado } : s
            )
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      } else {
        setCoordenadorias((prev) =>
          prev
            .map((c) =>
              c._id === variables.id ? { ...c, nome: nomeFormatado } : c
            )
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }

      setEditingSetorId(null);
      setEditingCoordenadoriaId(null);
      queryClient.invalidateQueries("setores");
    },
    onError: (error) => {
      console.error("Erro ao renomear setor:", error);
    },
  });

  const handleCreateSubSetor = async () => {
    if (!newSubSetorName.trim()) {
      alert("O nome do subsetor não pode estar vazio!");
      return;
    }

    setIsCreatingSubSetor(true);
    try {
      await mutation.mutateAsync({
        nome: newSubSetorName,
        tipo: "Subsetor",
        parent: currentSetorId,
      });
    } catch (error) {
      console.error("Erro ao criar subsetor:", error);
    }
  };

  const handleRenameSetor = (id, nome) => {
    setEditingSetorId(id);
    setEditedName(nome);
  };

  const handleRenameCoord = (id, nome) => {
    setEditingCoordenadoriaId(id);
    setEditedNameCoordenadoria(nome);
  };

  const handleSaveRename = async (id) => {
    if (!editedName.trim()) {
      alert("O nome do setor não pode estar vazio!");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, nome: editedName });
    } catch (error) {
      console.error("Erro ao salvar renomeação:", error);
    }
  };

  const handleSaveRenameCoord = async (id) => {
    if (!editedNameCoordenadoria.trim()) {
      alert("O nome do setor não pode estar vazio!");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, nome: editedNameCoordenadoria });
    } catch (error) {
      console.error("Erro ao salvar renomeação:", error);
    }
  };

  const handleCreateCoordenadoria = async () => {
    if (!newCoordName.trim()) {
      alert("O nome da divisão não pode estar vazio!");
      return;
    }

    setIsCreatingCoord(true);
    try {
      await mutation.mutateAsync({
        nome: newCoordName,
        tipo: "Coordenadoria",
        parent: currentSetorId,
      });
      setOpenCoord({ ...openCoord, [newCoordName]: false });
    } catch (error) {
      console.error("Erro ao criar coordenadoria:", error);
    }
  };

  const toggleCoordCollapse = (name) => {
    setOpenCoord((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleSelectionControlsEdit = () => {
    setShowSelectionControlsEdit(!showSelectionControlsEdit);
  };

  const getEntityType = (id) => {
    if (subSetores.some(s => s._id === id)) return 'Subsetor';
    if (coordenadorias.some(c => c._id === id)) return 'Coordenadoria';
    return 'Setor';
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header Section */}
      <div className="d-flex align-items-center mb-4">
        <Button
          variant="light"
          onClick={() => navigate(-1)}
          className="me-3 d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px", borderRadius: "50%" }}
        >
          <FaChevronLeft />
        </Button>
        <h2 className="mb-0 text-capitalize">
          {setorNomeDecodificado || subSetorNomeDecodificado}
        </h2>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <FormControl
            placeholder="Pesquisar subsetores e divisões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>

      {/* Subsetores Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Subsetores</h4>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <FaFolderPlus /> Novo Subsetor
          </Button>
        </div>

        {filteredSubSetores.length === 0 ? (
          <Card className="text-center py-4">
            <FaFolder size={48} className="text-muted mb-3 mx-auto" />
            <h5>
              {searchTerm
                ? "Nenhum subsetor encontrado para a pesquisa"
                : "Nenhum subsetor encontrado"}
            </h5>
            <p className="text-muted">
              {searchTerm
                ? "Tente alterar os termos da pesquisa"
                : "Crie um novo subsetor para começar"}
            </p>
          </Card>
        ) : (
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {filteredSubSetores.map((subSetor) => (
              <Col key={subSetor._id}>
                {editingSetorId !== subSetor._id ? (
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                      <Badge bg="secondary">Subsetor</Badge>
                      <Dropdown onClick={(e) => e.stopPropagation()}>
                        <Dropdown.Toggle
                          variant="light"
                          size="sm"
                          className="p-1 border-0"
                          id={`dropdown-${subSetor._id}`}
                        >
                          <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() =>
                              handleRenameSetor(subSetor._id, subSetor.nome)
                            }
                            className="d-flex align-items-center gap-2"
                          >
                            <FaEdit /> Renomear
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="d-flex align-items-center gap-2 text-danger"
                            onClick={() => handleDeleteSetor(subSetor._id)}
                          >
                            <FaTrash /> Deletar
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Card.Header>
                    <Link
                      to={`/${
                        setorNomeDecodificado || setorNomeDecodificadoLink
                      }/${subSetor.nome}/${currentSetorId}/${
                        subPath ? `${subPath}/${subSetor._id}` : subSetor._id
                      }`}
                      className="text-decoration-none text-reset"
                    >
                      <Card.Body className="d-flex flex-column align-items-center">
                        <FaFolder size={48} className="text-primary mb-3" />
                        <Card.Title className="text-center">
                          {subSetor.nome}
                        </Card.Title>
                      </Card.Body>
                    </Link>
                  </Card>
                ) : (
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <Badge bg="secondary">Subsetor</Badge>
                    </Card.Header>
                    <Card.Body>
                      <Form.Control
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={() => handleSaveRename(subSetor._id)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveRename(subSetor._id)
                        }
                        autoFocus
                        className="mb-2"
                      />
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleSaveRename(subSetor._id)}
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setEditingSetorId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Coordenadorias Section */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Divisões</h4>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowCoordModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaFolderPlus /> Nova Divisão
            </Button>
            <Button
              onClick={toggleSelectionControlsEdit}
              variant={
                showSelectionControlsEdit ? "primary" : "outline-primary"
              }
              className="d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              <FaPencilAlt />
            </Button>
          </div>
        </div>

        {filteredCoordenadorias.length === 0 ? (
          <Card className="text-center py-4">
            <FaFolder size={48} className="text-muted mb-3 mx-auto" />
            <h5>
              {searchTerm
                ? "Nenhuma divisão encontrada para a pesquisa"
                : "Nenhuma divisão encontrada"}
            </h5>
            <p className="text-muted">
              {searchTerm
                ? "Tente alterar os termos da pesquisa"
                : "Crie uma nova divisão para começar"}
            </p>
          </Card>
        ) : (
          <div className="accordion" id="coordenadoriasAccordion">
            {filteredCoordenadorias.map((coord) => (
              <Card key={coord._id} className="mb-3 shadow-sm">
                <Card.Header className="bg-light position-relative">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      {editingCoordenadoriaId !== coord._id ? (
                        <Button
                          variant="link"
                          onClick={() => toggleCoordCollapse(coord.nome)}
                          className="text-dark text-decoration-none flex-grow-1 text-start ps-0"
                        >
                          <h5 className="mb-0">{coord.nome}</h5>
                        </Button>
                      ) : (
                        <Form.Control
                          type="text"
                          value={editedNameCoordenadoria}
                          onChange={(e) =>
                            setEditedNameCoordenadoria(e.target.value)
                          }
                          onBlur={() => handleSaveRenameCoord(coord._id)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            handleSaveRenameCoord(coord._id)
                          }
                          autoFocus
                          className="flex-grow-1"
                        />
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                      {showSelectionControlsEdit && (
                        <>
                          <Button
                            onClick={() =>
                              handleRenameCoord(coord._id, coord.nome)
                            }
                            variant="outline-dark"
                            size="sm"
                            className="rounded-circle p-1 d-flex align-items-center justify-content-center"
                            style={{ width: "30px", height: "30px" }}
                          >
                            <FaEdit size={12} />
                          </Button>
                          <Button
                            onClick={() => handleDeleteSetor(coord._id)}
                            variant="outline-danger"
                            size="sm"
                            className="rounded-circle p-1 d-flex align-items-center justify-content-center"
                            style={{ width: "30px", height: "30px" }}
                          >
                            <FaTrash size={12} />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="link"
                        onClick={() => toggleCoordCollapse(coord.nome)}
                        className="text-dark p-0"
                        style={{ width: "24px", height: "24px" }}
                      >
                        {openCoord[coord.nome] ? <FaAngleUp /> : <FaAngleDown />}
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Collapse in={openCoord[coord.nome]}>
                  <div>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Funcionários</h6>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCoordenadoriaId(coord._id);
                            setShowModalCoordenadoria(true);
                          }}
                          className="d-flex align-items-center gap-2"
                        >
                          <FaIdCard /> Novo Funcionário
                        </Button>
                      </div>
                      <FuncionariosList coordenadoriaId={coord._id} />
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDeleteModal
        showModal={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleConfirmDelete={handleConfirmDelete}
        entityId={setorToDelete}
        entityType={getEntityType(setorToDelete)}
      />

      {/* Create Subsetor Modal */}
      <Modal
        show={showModal}
        onHide={() => !isCreatingSubSetor && setShowModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaFolderPlus /> Criar Novo Subsetor
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formSubSetorName" className="mb-3">
              <Form.Label>Nome do Subsetor</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome do subsetor"
                value={newSubSetorName}
                onChange={(e) => setNewSubSetorName(e.target.value)}
                disabled={isCreatingSubSetor}
                onKeyPress={(e) => e.key === "Enter" && handleCreateSubSetor()}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            disabled={isCreatingSubSetor}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateSubSetor}
            disabled={isCreatingSubSetor || !newSubSetorName.trim()}
          >
            {isCreatingSubSetor ? (
              <>
                <Spinner
                  as="span"
                  size="sm"
                  animation="border"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Criando...</span>
              </>
            ) : (
              "Criar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Coordenadoria Modal */}
      <Modal
        show={showCoordModal}
        onHide={() => !isCreatingCoord && setShowCoordModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaFolderPlus /> Criar Nova Divisão
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formCoordName" className="mb-3">
              <Form.Label>Nome da Divisão</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome da divisão"
                value={newCoordName}
                onChange={(e) => setNewCoordName(e.target.value)}
                disabled={isCreatingCoord}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleCreateCoordenadoria()
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowCoordModal(false)}
            disabled={isCreatingCoord}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateCoordenadoria}
            disabled={isCreatingCoord || !newCoordName.trim()}
          >
            {isCreatingCoord ? (
              <>
                <Spinner
                  as="span"
                  size="sm"
                  animation="border"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Criando...</span>
              </>
            ) : (
              "Criar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Funcionário Registration Modal */}
      <Modal show={showModalCoordenadoria} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Registrar Novo Funcionário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {step === 1 && (
            <Step1Form
              newUser={newUser}
              setNewUser={setNewUser}
              ObservationHistoryButton={ObservationHistoryButton}
              ObservationHistoryModal={ObservationHistoryModal}
              handleCloseModal={handleCloseModal}
              setStep={setStep}
            />
          )}
          {step === 2 && (
            <Step2Form
              newUser={newUser}
              setNewUser={setNewUser}
              previousStep={() => setStep(1)}
              coordenadoriaId={coordenadoriaId}
              secretaria={setorNomeDecodificado || setorNomeDecodificadoLink}
              handleCloseModal={handleCloseModal}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default SetorScreen;