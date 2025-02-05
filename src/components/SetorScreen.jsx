// components/SetorScreen.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Collapse, Container, Dropdown } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaAngleDown, FaAngleUp, FaChevronLeft, FaPencilAlt, FaEdit, FaMinus } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from './AuthContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Step1Form from './Step1Form';
import FuncionariosList from './FuncionariosList';
import ObservationHistoryButton from './ObservationHistoryButton';
import ObservationHistoryModal from './ObservationHistoryModal';
import { API_BASE_URL } from '../utils/apiConfig';



function SetorScreen() {
  // Captura todos os segmentos da rota a partir do setor principal
  const { setorId, '*': subPath } = useParams();
  const [newUser, setNewUser] = useState({
    nome: '',
    foto: null,
    secretaria: '',
    funcao: '',
    natureza: '',
    referencia: '',
    redesSociais: [{ link: '', nome: '' }],
    salarioBruto: 0,
    salarioLiquido: 0,
    endereco: '',
    bairro: '',
    telefone: '',
    observacoes: [],
    arquivo: null,
  });
  const [coordenadoriaId, setCoordenadoriaId] = useState(null);
  const [subSetores, setSubSetores] = useState([]);
  const [editingSetorId, setEditingSetorId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editingCoordenadoriaId, setEditingCoordenadoriaId] = useState(null);
  const [editedNameCoordenadoria, setEditedNameCoordenadoria] = useState('');
  const [showSelectionControlsEdit, setShowSelectionControlsEdit] = useState(false);
  const [coordenadorias, setCoordenadorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalCoordenadoria, setShowModalCoordenadoria] = useState(false);
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [newSubSetorName, setNewSubSetorName] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [openCoord, setOpenCoord] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setorToDelete, setSetorToDelete] = useState(null);
  const [setoresLookupMap, setSetoresLookupMap] = useState(new Map());
  const location = useLocation(); // Captura o caminho completo da URL
  // const [funcionarios, setFuncionarios] = useState([])
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { funcionarios, setFuncionarios } = useAuth(); // Usar o contexto de autenticação

  const fullPath = location.pathname; // Exemplo: "/financeiro/extra/path"
  const setorSegment = `${fullPath.split('/')[1]}`; // Exemplo: "/financeiro/"
  const setorNomeDecodificado = decodeURIComponent(setorSegment);



  // Obtém o nome do último segmento da URL
  const currentSetorId = subPath ? subPath.split('/').pop() : setorId;

  const fetchSetoresData = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/setores/dados/${currentSetorId}`);
    return response.data;
  };

  const handleCloseModal = () => {
    setNewUser({
      nome: '',
      foto: null,
      secretaria: '',
      funcao: '',
      natureza: '',
      referencia: '',
      redesSociais: [{ link: '', nome: '' }],
      salarioBruto: 0,
      salarioLiquido: 0,
      endereco: '',
      bairro: '',
      telefone: '',
      observacoes: [],
      arquivo: null,
    });
    setShowModalCoordenadoria(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSetoresData();
        setSubSetores(data.subsetores)
        setCoordenadorias(data.coordenadoriasComFuncionarios)
        const todosFuncionarios = data.coordenadoriasComFuncionarios.flatMap(coordenadoria => coordenadoria.funcionarios);
        setFuncionarios(todosFuncionarios);
      } catch (error) {
        console.error("Erro ao buscar os dados:");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (setoresLookupMap.has(currentSetorId)) {
      const currentSetor = setoresLookupMap.get(currentSetorId);
      setSubSetores(currentSetor.subsetores || []);
      setCoordenadorias(currentSetor.coordenadorias || []);


      // Extrai os funcionários das coordenadorias
      const funcionariosDasCoordenadorias = (currentSetor.coordenadorias || [])
        .flatMap(coordenadoria => coordenadoria.funcionarios || []);

      // Atualiza o estado dos funcionários
      setFuncionarios(funcionariosDasCoordenadorias);
    }
  }, [currentSetorId, setoresLookupMap]);


  // Função para criar o setor
  const createSetor = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/setores`, data);
    return response.data;
  };

  const updateSetor = async ({ id, nome }) => {
    const response = await axios.put(`${API_BASE_URL}/api/setores/rename/${id}`, { nome });
    return response.data;
  };

  const deleteSetor = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/api/setores/del/${id}`);
    return response.data;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSetor,
    onSuccess: () => {
      setSubSetores((prevSubSetores) => prevSubSetores.filter((subsetor) => subsetor._id !== setorToDelete));
      setCoordenadorias((prevCoordenadorias) => prevCoordenadorias.filter((coordenadoria) => coordenadoria._id !== setorToDelete));

      queryClient.invalidateQueries('setores');
    },
    onError: (error) => {
      console.error('Erro ao excluir setor:', error);
    },
  });

  const handleDeleteSetor = (setorId) => {
    setSetorToDelete(setorId);
    setShowDeleteModal(true); // Exibe o modal de confirmação de exclusão
  };

  const handleConfirmDelete = async () => {
    if (setorToDelete) {
      try {
        await deleteMutation.mutateAsync(setorToDelete);
      } catch (error) {
        console.error('Erro ao excluir setor:', error);
      }
    }
    setShowDeleteModal(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSetorToDelete(null); // Limpa o setor selecionado
  };
  // Mutation para lidar com a criação do setor
  const mutation = useMutation({
    mutationFn: createSetor,
    onSuccess: (data) => {
      // Atualiza a lista de setores com o novo setor
      if (data.tipo === "Subsetor") {
        setSubSetores((prevSubsetores) => [...prevSubsetores, { _id: data._id, nome: data.nome }]);
      } else if (data.tipo === "Coordenadoria") {
        setCoordenadorias((prevCoordenadorias) => [...prevCoordenadorias, { _id: data._id, nome: data.nome }]);
      }
      queryClient.invalidateQueries('setores');
    },
    onError: (error) => {
      console.error('Erro ao criar setor:', error);
    }
  });

  // Função para criar um novo subsetor
  const handleCreateSubSetor = async () => {
    try {
      await mutation.mutateAsync({ nome: newSubSetorName, tipo: 'Subsetor', parent: currentSetorId }); // Envia dados para a API
      setNewSubSetorName('');
      setShowModal(false);
    } catch (error) {

    }
  };

  const updateMutation = useMutation({
    mutationFn: updateSetor,
    onSuccess: () => {
      setEditingSetorId(null);
      setEditingCoordenadoriaId(null);
      queryClient.invalidateQueries('setores');
    },
    onError: (error) => {
      console.error('Erro ao renomear setor:', error);
    },
  });

  const handleRenameSetor = (id, nome) => {
    setEditingSetorId(id);
    setEditedName(nome);
  };

  const handleRenameCoord = (id, nome) => {
    setEditingCoordenadoriaId(id);
    setEditedNameCoordenadoria(nome);
  };

  const handleSaveRename = async (id) => {

    // Validação para garantir que o nome não esteja vazio
    if (!editedName.trim()) {
      alert('O nome do setor não pode estar vazio!');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, nome: editedName });
      setSubSetores((prev) =>
        prev.map((subSetor) => (subSetor._id === id ? { ...subSetor, nome: editedName } : subSetor))
      );
    } catch (error) {
      console.error('Erro ao salvar renomeação:', error);
    }
  };

  const handleSaveRenameCoord = async (id) => {

    // Validação para garantir que o nome não esteja vazio
    if (!editedNameCoordenadoria.trim()) {
      alert('O nome do setor não pode estar vazio!');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, nome: editedNameCoordenadoria });
      setCoordenadorias((prev) =>
        prev.map((coordenadorias) => (coordenadorias._id === id ? { ...coordenadorias, nome: editedNameCoordenadoria } : coordenadorias))
      );
    } catch (error) {
      console.error('Erro ao salvar renomeação:', error);
    }
  };

  // Função para criar uma nova coordenadoria
  const handleCreateCoordenadoria = async () => {

    try {
      await mutation.mutateAsync({ nome: newCoordName, tipo: 'Coordenadoria', parent: currentSetorId }); // Envia dados para a API
      setOpenCoord({ ...openCoord, [newCoordName]: false }); // Inicializa o estado de colapso
      setNewCoordName('');
      setShowCoordModal(false);
    } catch (error) {

    }

  };

  // Função para alternar o estado de um colapso de coordenadoria
  const toggleCoordCollapse = (name) => {
    setOpenCoord({ ...openCoord, [name]: !openCoord[name] });
  };

  const toggleSelectionControlsEdit = () => {
    setShowSelectionControlsEdit(!showSelectionControlsEdit);
  };

  return (
    <div className='mx-1'>

      <h2 className="mt-4 d-flex">

        <Col xs="auto">
          <Button
            variant="link"
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)', // Preto com transparência
              color: 'white', // Ícone branco
              borderRadius: '50%', // Tornar o botão redondo
              padding: '10px', // Ajustando o padding para um tamanho agradável
              display: 'flex', // Usando flexbox para centralizar o ícone
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px', // Ajustando o tamanho do botão
              height: '40px', // Ajustando o tamanho do botão
            }}
          >
            <FaChevronLeft size={20} />
          </Button>
        </Col>
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginLeft: '15px',
            color: '#333',
            textTransform: 'capitalize',
          }}
        >
          {setorNomeDecodificado}
        </span>
      </h2>
      <Row className='mt-4'>
        {/* Botão para criar novo subsetor */}
        <Row className='m-2' xs={3} sm={3} md={6} >
          <Card
            className="create-sector-card text-center"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowModal(true)}
          >
            <Card.Body>
              <div className="icon-container">
                <i className="fas fa-folder-plus"></i>
              </div>
            </Card.Body>
          </Card>
        </Row>


        {/* Exibição de subsetores */}
        {Array.isArray(subSetores) && subSetores.map((subSetor, index) => (
          <Col md={3} key={index}>
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
                      <i className="fas fa-ellipsis-v w-100"></i> {/* Ícone de três pontos */}

                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ zIndex: 5 }}>
                      <Dropdown.Item
                        onClick={() => handleRenameSetor(subSetor._id, subSetor.nome)}
                      >
                        Renomear
                      </Dropdown.Item>
                      <Dropdown.Item style={{ color: 'red' }} onClick={() => handleDeleteSetor(subSetor._id)}>Deletar</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Card.Header>
                <Link to={`/${subSetor.nome}/${currentSetorId}/${subPath ? `${subPath}/${subSetor._id}` : subSetor._id}`} style={{ textDecoration: 'none' }}>
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

      {/* Modal para criar novo subsetor */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
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
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateSubSetor}>
            Criar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para registrar novo funcionário */}
      <Modal show={showModalCoordenadoria} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Novo Funcionário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Step1Form
            coordenadoriaId={coordenadoriaId}
            newUser={newUser}
            setNewUser={setNewUser}
            ObservationHistoryButton={ObservationHistoryButton}
            ObservationHistoryModal={ObservationHistoryModal}
            handleCloseModal={handleCloseModal}
          // Outros props necessários para o Step1Form
          />
        </Modal.Body>
      </Modal>


      {/* Exibição de coordenadorias com collapses */}
      <div className="mt-4">
        <h4 className='mx-2'>Cargo:
          <Button
            variant="outline-primary"
            className="m-2 custom-outline-button"
            onClick={() => setShowCoordModal(true)}
          >
            Criar Cargo
          </Button>

          <Button
            onClick={toggleSelectionControlsEdit}
            variant="outline-primary"
            className="m-2 custom-outline-button"
          >
            <FaPencilAlt />
          </Button>
        </h4>


        {Array.isArray(coordenadorias) && coordenadorias.map((coord, index) => (
          <Card key={index} className="m-3">
            {showSelectionControlsEdit && (
              <>
                <div className="d-flex gap-2">
                  {/* Botão para editar */}
                  <Button
                    onClick={() => handleRenameCoord(coord._id, coord.nome)}
                    variant='outline-dark'
                    className="user-checkbox btn-sm rounded-circle"
                  >
                    <FaEdit />
                  </Button>

                  {/* Botão para deletar */}
                  <Button
                    onClick={() => handleDeleteSetor(coord._id)}
                    variant="outline-danger"
                    className="user-checkbox-2 btn-sm rounded-circle"
                  >
                    <FaMinus /> {/* Ícone de menos */}
                  </Button>
                </div>
              </>
            )}



            <Card.Header
              variant="link"
              onClick={() => toggleCoordCollapse(coord.nome)}
              aria-expanded={openCoord[coord.nome]}
              style={{ cursor: 'pointer' }}
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
                <Button className='m-2 coord-register-btn' variant="primary" onClick={() => {
                  setCoordenadoriaId(coord._id);
                  setShowModalCoordenadoria(true)
                }}>
                  <i className="fas fa-id-card"></i>
                </Button>
                <FuncionariosList
                  funcionarios={funcionarios}
                  coordenadoriaId={coord._id}
                />

              </div>
            </Collapse>
          </Card>
        ))}

      </div>

      {/* Modal para criar nova coordenadoria */}
      <Modal show={showCoordModal} onHide={() => setShowCoordModal(false)}>
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
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCoordModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateCoordenadoria}>
            Criar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SetorScreen;
