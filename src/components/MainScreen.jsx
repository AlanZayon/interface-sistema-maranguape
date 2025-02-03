// components/MainScreen.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

function MainScreen() {
  const [setores, setSetores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSetorName, setNewSetorName] = useState('');
  const [editingSetorId, setEditingSetorId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const queryClient = useQueryClient();

  const fetchSetoresData = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/setores/setoresMain`);
    return response.data;
  };

  // Carrega os dados quando a resposta da API é recebida
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSetoresData();
        const setoresFiltrados = data.setores
        console.log(data)
        setSetores(setoresFiltrados); // Armazena apenas `id` e `nome`
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      }
    };

    fetchData(); // Chama a função assíncrona

  }, []);

  // Função para criar o setor
  const createSetor = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/setores`, data);
    return response.data;
  };

  const updateSetor = async ({ id, nome }) => {
    const response = await axios.put(`${API_BASE_URL}/api/setores/rename/${id}`, { nome });
    return response.data;
  };

  const handleCardClick = (setor) => {
    datasSetorUpdate(setor); // Atualiza o contexto com o setor selecionado
  };

  // Mutation para lidar com a criação do setor
  const mutation = useMutation({
    mutationFn: createSetor,
    onSuccess: (data) => {
      // Atualiza a lista de setores com o novo setor
      setSetores((prevSetores) => [...prevSetores, { id: data._id, nome: data.nome }]);
      queryClient.invalidateQueries('setores');
    },
    onError: (error) => {
      console.error('Erro ao criar setor:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateSetor,
    onSuccess: () => {
      setEditingSetorId(null);
      queryClient.invalidateQueries('setores');
    },
    onError: (error) => {
      console.error('Erro ao renomear setor:', error);
    },
  });

  const handleCreateSetor = async () => {
    try {
      await mutation.mutateAsync({ nome: newSetorName, tipo: 'Setor' }); // Envia dados para a API
      setNewSetorName('');
      setShowModal(false);
    } catch (error) {

    }

  };

  const handleRenameSetor = (id, nome) => {
    setEditingSetorId(id);
    setEditedName(nome);
  };

  const handleSaveRename = async (id) => {

    // Validação para garantir que o nome não esteja vazio
    if (!editedName.trim()) {
      alert('O nome do setor não pode estar vazio!');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, nome: editedName });
      setSetores((prev) =>
        prev.map((setor) => (setor._id === id ? { ...setor, nome: editedName } : setor))
      );
    } catch (error) {
      console.error('Erro ao salvar renomeação:', error);
    }
  };

  return (
    <Row className="mt-4">
      {/* Card para criar um novo setor */}
      <Row xs={4} sm={4} md={6} className='m-2'>
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

      {setores.map((setor, index) => (
        <Col md={4} key={index}>
          {editingSetorId !== setor._id ? (
            <Card className="custom-card text-center my-2">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Setor</span>
                <Dropdown onClick={(e) => e.stopPropagation()}>
                  <Dropdown.Toggle
                    variant="link"
                    className="text-dark p-0 border-0 dropdown-toggle-split"
                    id={`dropdown-${setor._id}`}
                  >
                    <i className="fas fa-ellipsis-v w-100"></i> {/* Ícone de três pontos */}

                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => handleRenameSetor(setor._id, setor.nome)}
                    >
                      Renomear
                    </Dropdown.Item>
                    <Dropdown.Item>Outra Ação</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Header>
              <Link to={`/${setor.nome}/${setor._id}`} style={{ textDecoration: 'none' }}>
                <Card.Body>
                  <Card.Title>{setor.nome}</Card.Title>
                </Card.Body>
              </Link>
            </Card>

          ) : (
            <Card className="custom-card text-center my-2">
              <Card.Header>
                <span>Setor</span>
              </Card.Header>
              <Card.Body>
                <Form.Control
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={() => handleSaveRename(setor._id)}
                  autoFocus
                />
              </Card.Body>
            </Card>
          )}
        </Col>
      ))
      }


      {/* Modal para criar um novo setor */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Novo Setor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formSetorName">
              <Form.Label>Nome do Setor</Form.Label>
              <Form.Control
                type="text"
                value={newSetorName}
                onChange={(e) => setNewSetorName(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateSetor}>
            Criar
          </Button>
        </Modal.Footer>
      </Modal>
    </Row >
  );
}

export default MainScreen;
