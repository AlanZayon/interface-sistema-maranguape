// components/MainScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Modal, Form, Dropdown, Container, Spinner, Alert, InputGroup, FormControl } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import { FaFolderPlus, FaEllipsisV, FaEdit, FaTrash, FaFolder, FaSearch } from 'react-icons/fa';

function MainScreen() {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newSetorName, setNewSetorName] = useState('');
  const [editingSetorId, setEditingSetorId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [setorToDelete, setSetorToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Função para filtrar e ordenar os setores
  const filteredAndSortedSetores = useMemo(() => {
    return [...setores]
      .filter(setor => 
        setor.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [setores, searchTerm]);

  const fetchSetoresData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/setores/setoresMain`);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchSetoresData();
        setSetores(data.setores);
        setError(null);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
        setError('Falha ao carregar setores. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      setSetores((prevSetores) => prevSetores.filter((setor) => setor._id !== setorToDelete));
      queryClient.invalidateQueries('setores');
    },
    onError: (error) => {
      console.error('Erro ao excluir setor:', error);
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
        console.error('Erro ao excluir setor:', error);
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
      setSetores((prevSetores) => [...prevSetores, { ...data }]);
      queryClient.invalidateQueries('setores');
      setIsCreating(false);
      setShowModal(false);
      setNewSetorName('');
    },
    onError: (error) => {
      console.error('Erro ao criar setor:', error);
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateSetor,
    onSuccess: (data) => {
      setEditingSetorId(null);
      queryClient.invalidateQueries('setores');
      return data;
    },
    onError: (error) => {
      console.error('Erro ao renomear setor:', error);
    },
  });

  const handleCreateSetor = async () => {
    if (!newSetorName.trim()) {
      alert('O nome do setor não pode estar vazio!');
      return;
    }

    setIsCreating(true);
    try {
      await mutation.mutateAsync({ nome: newSetorName, tipo: 'Setor' });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
    }
  };

  const handleRenameSetor = (id, nome) => {
    setEditingSetorId(id);
    setEditedName(nome);
  };

  const handleSaveRename = async (id) => {
    if (!editedName.trim()) {
      alert('O nome do setor não pode estar vazio!');
      return;
    }
    try {
      const dataEditedName = await updateMutation.mutateAsync({ id, nome: editedName });
      setSetores((prev) =>
        prev.map((setor) => (setor._id === id ? { ...setor, nome: dataEditedName.nome } : setor))
      );
    } catch (error) {
      console.error('Erro ao salvar renomeação:', error);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
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
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Setores</h2>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="d-flex align-items-center gap-2"
        >
          <FaFolderPlus /> Novo Setor
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <FormControl
            placeholder="Pesquisar setores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>

      {filteredAndSortedSetores.length === 0 && !loading && (
        <div className="text-center py-5">
          <FaFolder size={48} className="text-muted mb-3" />
          <h4>Nenhum setor encontrado</h4>
          <p className="text-muted">
            {searchTerm ? 
              "Nenhum setor corresponde à sua pesquisa" : 
              "Clique no botão acima para criar seu primeiro setor"}
          </p>
        </div>
      )}

      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {filteredAndSortedSetores.map((setor) => (
          <Col key={setor._id}>
            {editingSetorId !== setor._id ? (
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                  <span className="badge bg-secondary">Setor</span>
                  <Dropdown onClick={(e) => e.stopPropagation()}>
                    <Dropdown.Toggle
                      variant="light"
                      size="sm"
                      className="p-1 border-0"
                      id={`dropdown-${setor._id}`}
                    >
                      <FaEllipsisV />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={() => handleRenameSetor(setor._id, setor.nome)}
                        className="d-flex align-items-center gap-2"
                      >
                        <FaEdit /> Renomear
                      </Dropdown.Item>
                      <Dropdown.Item
                        className="d-flex align-items-center gap-2 text-danger"
                        onClick={() => handleDeleteSetor(setor._id)}
                      >
                        <FaTrash /> Deletar
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Card.Header>
                <Link to={`/${setor.nome}/${setor._id}`} className="text-decoration-none text-reset">
                  <Card.Body className="d-flex flex-column align-items-center">
                    <FaFolder size={48} className="text-primary mb-3" />
                    <Card.Title className="text-center">{setor.nome}</Card.Title>
                  </Card.Body>
                </Link>
              </Card>
            ) : (
              <Card className="h-100">
                <Card.Header className="bg-light">
                  <span className="badge bg-secondary">Setor</span>
                </Card.Header>
                <Card.Body>
                  <Form.Control
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={() => handleSaveRename(setor._id)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveRename(setor._id)}
                    autoFocus
                    className="mb-2"
                  />
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleSaveRename(setor._id)}
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

      <ConfirmDeleteModal
        showModal={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleConfirmDelete={handleConfirmDelete}
        entityId={setorToDelete}
        entityType="Setor"
      />

      <Modal show={showModal} onHide={() => !isCreating && setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaFolderPlus /> Criar Novo Setor
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formSetorName" className="mb-3">
              <Form.Label>Nome do Setor</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome do setor"
                value={newSetorName}
                onChange={(e) => setNewSetorName(e.target.value)}
                disabled={isCreating}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSetor()}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateSetor}
            disabled={isCreating || !newSetorName.trim()}
          >
            {isCreating ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" />
                <span className="ms-2">Criando...</span>
              </>
            ) : 'Criar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MainScreen;