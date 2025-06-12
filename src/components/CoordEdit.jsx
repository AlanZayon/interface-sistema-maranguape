import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Modal, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext'; 
import { API_BASE_URL } from '../utils/apiConfig';
import { FaSyncAlt, FaSave, FaTimes } from 'react-icons/fa'; 

function EditUsersForm({
    usuariosIds, 
    handleCloseModal,
    setShowSelectionControlsEdit,
    setActivateModified
}) {
    const fetchSetoresData = async () => {
        const response = await axios.get(`${API_BASE_URL}/api/setores/setoresOrganizados`);
        return response.data;
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['setores'],
        queryFn: fetchSetoresData
    });

    const [setoresOrganizados, setSetoresOrganizados] = useState([]);
    const [setorSelecionado, setSetorSelecionado] = useState(null);
    const [subsetorSelecionado, setSubsetorSelecionado] = useState([]);
    const [coordenadoriaSelecionada, setCoordenadoriaSelecionada] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addFuncionarios, addFuncionariosPath } = useAuth();

    useEffect(() => {
        if (data && data.setores) {
            setSetoresOrganizados(data.setores);
        }
    }, [data]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </Spinner>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="alert alert-danger" role="alert">
                Erro ao carregar os dados: {error.message}
            </div>
        );
    }

    const refreshAll = () => {
        setSetorSelecionado(null);
        setSubsetorSelecionado([]);
        setCoordenadoriaSelecionada(null);
    };

    const handleSetorSelect = (setorId) => {
        const setor = setoresOrganizados.find((s) => s._id === setorId);
        setSetorSelecionado(setor);
        setSubsetorSelecionado([]);
        setCoordenadoriaSelecionada(null);
    };

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

    const handleSubsetorSelect = (subsetorId) => {
        const subsetor = findSubsetorById(setorSelecionado.subsetores, subsetorId);
        if (subsetor) {
            setSubsetorSelecionado([subsetor]);
            setCoordenadoriaSelecionada(null);
        }
    };

    const handleCoordenadoriaSelect = (coordenadoriaId) => {
        let coordenadoria;
        if (subsetorSelecionado.length > 0) {
            const ultimoSubsetor = subsetorSelecionado[subsetorSelecionado.length - 1];
            coordenadoria = ultimoSubsetor.coordenadorias.find((coord) => coord._id === coordenadoriaId);
        } else if (setorSelecionado && setorSelecionado.coordenadorias) {
            coordenadoria = setorSelecionado.coordenadorias.find((coord) => coord._id === coordenadoriaId);
        }

        setCoordenadoriaSelecionada(coordenadoria);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/api/funcionarios/editar-coordenadoria-usuario`, {
                usuariosIds: usuariosIds,
                coordenadoriaId: coordenadoriaSelecionada._id
            });
            addFuncionarios(response.data);
            addFuncionariosPath(response.data);
            handleCloseModal();
            setShowSelectionControlsEdit(false);
            alert("Usuários atualizados com sucesso!");
        } catch (error) {
            console.error('Erro ao atualizar os usuários:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Form>
            <Card className="mb-3">
                <Card.Body>
                    <Button onClick={refreshAll} variant="outline-secondary" className="mb-3">
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
                                            variant={setorSelecionado?._id === setor._id ? "primary" : "outline-primary"}
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
                                                    variant={subsetorSelecionado.some(sel => sel._id === sub._id) ? "primary" : "outline-primary"}
                                                    className="me-2 mb-2"
                                                    onClick={() => handleSubsetorSelect(sub._id)}
                                                >
                                                    {sub.nome}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>
                                ))}
                                {subsetorSelecionado.length === 0 && setorSelecionado.subsetores.map((sub) => (
                                    <Button
                                        key={sub._id}
                                        variant={subsetorSelecionado.some(sel => sel._id === sub._id) ? "primary" : "outline-primary"}
                                        className="me-2 mb-2"
                                        onClick={() => handleSubsetorSelect(sub._id)}
                                    >
                                        {sub.nome}
                                    </Button>
                                ))}
                            </Col>
                        </Row>
                    )}

                    {subsetorSelecionado.map((subsetor, index) => (
                        subsetor.coordenadorias && subsetor.coordenadorias.length > 0 && (
                            <Row key={`coordenadoria-${index}`}>
                                <Col md={12}>
                                    <Form.Group controlId={`formCoordenadoria_${index}`}>
                                        <Form.Label>Divisoões: {subsetor.nome}</Form.Label>
                                        <div className="d-flex flex-wrap">
                                            {subsetor.coordenadorias.map((coordenadoria) => (
                                                <Button
                                                    key={coordenadoria._id}
                                                    variant={coordenadoriaSelecionada?._id === coordenadoria._id ? "warning" : "outline-warning"}
                                                    className="me-2 mb-2"
                                                    onClick={() => handleCoordenadoriaSelect(coordenadoria._id)}
                                                >
                                                    {coordenadoria.nome}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )
                    ))}

                    {(setorSelecionado && subsetorSelecionado.length === 0 && setorSelecionado.coordenadorias && setorSelecionado.coordenadorias.length > 0) && (
                        <Row>
                            <Col md={12}>
                                <Form.Group controlId="formCoordenadoriaInicial">
                                    <Form.Label>Divisões: {setorSelecionado.nome}</Form.Label>
                                    <div className="d-flex flex-wrap">
                                        {setorSelecionado.coordenadorias.map((coordenadoria) => (
                                            <Button
                                                key={coordenadoria._id}
                                                variant={coordenadoriaSelecionada?._id === coordenadoria._id ? "warning" : "outline-warning"}
                                                className="me-2 mb-2"
                                                onClick={() => handleCoordenadoriaSelect(coordenadoria._id)}
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
                <Button variant="secondary" onClick={handleCloseModal}>
                    <FaTimes /> Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!coordenadoriaSelecionada || isSaving}
                >
                    {isSaving ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                            <span className="ms-2">Salvando...</span>
                        </>
                    ) : (
                        <>
                            <FaSave /> Salvar
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Form>
    );
}

export default EditUsersForm;