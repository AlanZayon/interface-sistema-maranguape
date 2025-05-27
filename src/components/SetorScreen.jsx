// components/SetorScreen.js
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
  FaMinus,
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
  const [showSelectionControlsEdit, setShowSelectionControlsEdit] = useState(false);
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
  const [setoresLookupMap, setSetoresLookupMap] = useState(new Map());
  const [isCreatingSubSetor, setIsCreatingSubSetor] = useState(false);
  const [isCreatingCoord, setIsCreatingCoord] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { funcionarios, setFuncionarios } = useAuth();

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

  // Arrays ordenados
  const sortedSubSetores = useMemo(() => {
    return [...subSetores].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [subSetores]);

  const sortedCoordenadorias = useMemo(() => {
    return [...coordenadorias].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [coordenadorias]);

  const fetchSetoresData = async () => {
    const response = await axios.get(
      `${API_BASE_URL}/api/setores/dados/${currentSetorId}`
    );
    return response.data;
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
        const data = await fetchSetoresData();
        const coordenadorias = data.subsetores
          .filter((subsetor) => subsetor.tipo === "Coordenadoria")
          .sort((a, b) => a.nome.localeCompare(b.nome));
        
        const subsetores = data.subsetores
          .filter((subsetor) => subsetor.tipo === "Subsetor")
          .sort((a, b) => a.nome.localeCompare(b.nome));
        
        setCoordenadorias(coordenadorias);
        setSubSetores(subsetores);
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      }
    };

    fetchData();
  }, [currentSetorId]);

  useEffect(() => {
    Object.keys(openCoord).forEach((coordNome) => {
      const coordId = coordenadorias.find(c => c.nome === coordNome)?._id;
      if (openCoord[coordNome] && coordId && !funcionarios[coordId]) {
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
        setSubSetores(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      } else if (data.tipo === "Coordenadoria") {
        setCoordenadorias(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
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
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateSetor,
    onSuccess: (data, variables) => {
      if (subSetores.some(s => s._id === variables.id)) {
        setSubSetores(prev => 
          prev.map(s => s._id === variables.id ? {...s, nome: variables.nome} : s)
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      } else {
        setCoordenadorias(prev => 
          prev.map(c => c._id === variables.id ? {...c, nome: variables.nome} : c)
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

  return (
    <div className="mx-1">
      <h2 className="mt-4 d-flex">
        <Col xs="auto">
          <Button
            variant="link"
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)", 
              color: "white",
              borderRadius: "50%",
              padding: "10px", 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
            }}
          >
            <FaChevronLeft size={20} />
          </Button>
        </Col>
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginLeft: "15px",
            color: "#333",
            textTransform: "capitalize",
          }}
        >
          {setorNomeDecodificado || subSetorNomeDecodificado}
        </span>
      </h2>
      <Row className="mt-4">
        {/* Botão para criar novo subsetor */}
        <Row className="m-2" xs={3} sm={3} md={6}>
          <Card
            className="create-sector-card text-center"
            style={{ cursor: "pointer" }}
            onClick={() => setShowModal(true)}
          >
            <Card.Body>
              <div className="icon-container">
                <i className="fas fa-folder-plus"></i>
              </div>
            </Card.Body>
          </Card>
        </Row>

        {/* Exibição de subsetores ORDENADOS */}
        {sortedSubSetores.map((subSetor) => (
          <Col md={3} key={subSetor._id}>
            {editingSetorId !== subSetor._id ? (
              <Card className="custom-card text-center my-2">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Subsetor</span>
                  <Dropdown onClick={(e) => e.stopPropagation()}>
                    <Dropdown.Toggle
                      variant="link"
                      className="text-dark p-0 border-0 dropdown-toggle-split"
                      id={`dropdown-${subSetor._id}`}
                    >
                      <i className="fas fa-ellipsis-v w-100"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ zIndex: 5 }}>
                      <Dropdown.Item
                        onClick={() =>
                          handleRenameSetor(subSetor._id, subSetor.nome)
                        }
                      >
                        Renomear
                      </Dropdown.Item>
                      <Dropdown.Item
                        style={{ color: "red" }}
                        onClick={() => handleDeleteSetor(subSetor._id)}
                      >
                        Deletar
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Card.Header>
                <Link
                  to={`/${setorNomeDecodificado || setorNomeDecodificadoLink}/${
                    subSetor.nome
                  }/${currentSetorId}/${
                    subPath ? `${subPath}/${subSetor._id}` : subSetor._id
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  <Card.Body>
                    <Card.Title>{subSetor.nome}</Card.Title>
                  </Card.Body>
                </Link>
              </Card>
            ) : (
              <Card className="custom-card text-center my-2">
                <Card.Header>
                  <span>Subsetor</span>
                </Card.Header>
                <Card.Body>
                  <Form.Control
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={() => handleSaveRename(subSetor._id)}
                    autoFocus
                  />
                </Card.Body>
              </Card>
            )}
          </Col>
        ))}
      </Row>

      <ConfirmDeleteModal
        showModal={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleConfirmDelete={handleConfirmDelete}
      />

      <Modal show={showModal} onHide={() => !isCreatingSubSetor && setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Novo Subsetor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formSubSetorName">
              <Form.Label>Nome do Subsetor</Form.Label>
              <Form.Control
                type="text"
                value={newSubSetorName}
                onChange={(e) => setNewSubSetorName(e.target.value)}
                disabled={isCreatingSubSetor}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            disabled={isCreatingSubSetor}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateSubSetor}
            disabled={isCreatingSubSetor}
          >
            {isCreatingSubSetor ? 'Criando...' : 'Criar'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModalCoordenadoria} onHide={handleCloseModal}>
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

      <div className="mt-4">
        <h4 className="mx-2">
          Criar Divisão:
          <Button
            variant="outline-primary"
            className="m-2 custom-outline-button"
            onClick={() => setShowCoordModal(true)}
          >
            Criar Divisão
          </Button>
          <Button
            onClick={toggleSelectionControlsEdit}
            variant="outline-primary"
            className="m-2 custom-outline-button"
          >
            <FaPencilAlt />
          </Button>
        </h4>

        {sortedCoordenadorias.map((coord) => (
          <Card key={coord._id} className="m-3">
            {showSelectionControlsEdit && (
              <>
                <div className="d-flex gap-2">
                  <Button
                    onClick={() => handleRenameCoord(coord._id, coord.nome)}
                    variant="outline-dark"
                    className="user-checkbox btn-sm rounded-circle"
                  >
                    <FaEdit />
                  </Button>

                  <Button
                    onClick={() => handleDeleteSetor(coord._id)}
                    variant="outline-danger"
                    className="user-checkbox-2 btn-sm rounded-circle"
                  >
                    <FaMinus />
                  </Button>
                </div>
              </>
            )}

            <Card.Header
              variant="link"
              onClick={() => toggleCoordCollapse(coord.nome)}
              aria-expanded={openCoord[coord.nome]}
              style={{ cursor: "pointer" }}
            >
              {editingCoordenadoriaId !== coord._id ? (
                <span>{coord.nome}</span>
              ) : (
                <Form.Control
                  type="text"
                  value={editedNameCoordenadoria}
                  onChange={(e) => setEditedNameCoordenadoria(e.target.value)}
                  onBlur={() => handleSaveRenameCoord(coord._id)}
                  autoFocus
                />
              )}

              {openCoord[coord.nome] ? <FaAngleUp /> : <FaAngleDown />}
            </Card.Header>
            <Collapse in={openCoord[coord.nome]}>
              <div className="mt-2">
                <Button
                  className="m-2 coord-register-btn"
                  variant="primary"
                  onClick={() => {
                    setCoordenadoriaId(coord._id);
                    setShowModalCoordenadoria(true);
                  }}
                >
                  <i className="fas fa-id-card"></i>
                </Button>
                {openCoord[coord.nome] && (
                  <FuncionariosList
                    coordenadoriaId={coord._id}
                  />
                )}
              </div>
            </Collapse>
          </Card>
        ))}
      </div>

      <Modal show={showCoordModal} onHide={() => !isCreatingCoord && setShowCoordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Novo Cargo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formCoordName">
              <Form.Label>Nome do Cargo</Form.Label>
              <Form.Control
                type="text"
                value={newCoordName}
                onChange={(e) => setNewCoordName(e.target.value)}
                disabled={isCreatingCoord}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowCoordModal(false)}
            disabled={isCreatingCoord}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateCoordenadoria}
            disabled={isCreatingCoord}
          >
            {isCreatingCoord ? 'Criando...' : 'Criar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SetorScreen;