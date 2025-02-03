import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Form, Button, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext'; // Importa o contexto
import { API_BASE_URL } from '../utils/apiConfig';



function EditUsersForm({
    usuariosIds, // IDs dos usuários a serem editados
    handleCloseModal,
    setShowSelectionControlsEdit
}) {
    // Função para fazer a requisição com axios
    const fetchSetoresData = async () => {
        const response = await axios.get(`${API_BASE_URL}/api/setores/setoresOrganizados`);
        return response.data;
    };
    const { setorId, '*': subPath } = useParams();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['setores'],
        queryFn: fetchSetoresData
    });

    // Estado para armazenar os dados hierárquicos dos setores
    const [setoresOrganizados, setSetoresOrganizados] = useState([]);
    const [setorSelecionado, setSetorSelecionado] = useState(null);
    const [subsetorSelecionado, setSubsetorSelecionado] = useState([]);
    const [coordenadoriaSelecionada, setCoordenadoriaSelecionada] = useState(null);
    const { addFuncionarios, addFuncionariosPath } = useAuth(); // Usar o contexto de autenticação
    const currentSetorId = subPath ? subPath.split('/').pop() : setorId;




    useEffect(() => {
        if (data && data.setores) {
            console.log(data.setores);
            setSetoresOrganizados(data.setores);
        }
    }, [data]);


    if (isLoading) {
        return <div>Carregando...</div>;
    }

    if (isError) {
        return <div>Erro ao carregar os dados: {error.message}</div>;
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
        if (setor.coordenadorias && setor.coordenadorias.length > 0) {
            setCoordenadoriaSelecionada(setor.coordenadorias);
        }
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
        // Aqui enviamos os IDs dos usuários a serem editados para atualização com o novo ID da coordenadoria
        try {
            // Atualiza os usuários com o novo ID de coordenadoria
            const response = await axios.put(`${API_BASE_URL}/api/funcionarios/editar-coordenadoria-usuario`, {
                usuariosIds: usuariosIds, // IDs dos usuários que serão atualizados
                coordenadoriaId: coordenadoriaSelecionada._id // Novo ID da coordenadoria
            });


            // Exibe a resposta da API
            addFuncionarios(response.data)
            addFuncionariosPath(response.data)
            handleCloseModal();
            setShowSelectionControlsEdit(false);
            alert("Usuários atualizados com sucesso!");
        } catch (error) {
            console.error('Erro ao atualizar os usuários:', error);
        }
    };

    return (
        <Form>
            <Button onClick={refreshAll} variant="outline-secondary" className="custom-height mx-1 mb-1">
                <i className="fas fa-sync-alt"></i>
            </Button>

            <Row>
                <Col md={12}>
                    <Form.Group controlId="formSetor">
                        <Form.Label>Setores</Form.Label>
                        <div className="d-flex flex-wrap">
                            {setoresOrganizados.map((setor) => (
                                <div key={setor._id} className="me-3 mb-2">
                                    <input
                                        type="radio"
                                        name="setor"
                                        value={setor._id}
                                        checked={setorSelecionado?._id === setor._id}
                                        onChange={() => handleSetorSelect(setor._id)}
                                    /> {setor.nome}
                                </div>
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
                                        <div key={sub._id} className="me-3 mb-2">
                                            <input
                                                type="radio"
                                                name={`subsetor${index}`}
                                                value={sub._id}
                                                checked={subsetorSelecionado.some(sel => sel._id === sub._id)}
                                                onChange={() => handleSubsetorSelect(sub._id)}
                                            /> {sub.nome}
                                        </div>
                                    ))}
                                </div>
                            </Form.Group>
                        ))}
                        {/* Renderiza os subsetores do setor principal se não houver subsetor selecionado */}
                        {subsetorSelecionado.length === 0 && setorSelecionado.subsetores.map((sub) => (
                            <div key={sub._id} className="me-3 mb-2">
                                <input
                                    type="radio"
                                    name="subsetor"
                                    value={sub._id}
                                    checked={subsetorSelecionado.some(sel => sel._id === sub._id)}
                                    onChange={() => handleSubsetorSelect(sub._id)}
                                /> {sub.nome}
                            </div>
                        ))}
                    </Col>
                </Row>
            )}

            {subsetorSelecionado.map((subsetor, index) => (
                subsetor.coordenadorias && subsetor.coordenadorias.length > 0 && (
                    <Row key={`coordenadoria-${index}`}>
                        <Col md={12}>
                            <Form.Group controlId={`formCoordenadoria_${index}`}>
                                <Form.Label>Cargos: {subsetor.nome}</Form.Label>
                                <div className="d-flex flex-wrap">
                                    {subsetor.coordenadorias.map((coordenadoria) => (
                                        <div key={coordenadoria._id} className="me-3 mb-2">
                                            <input
                                                type="radio"
                                                name={`coordenadoria_${index}`}
                                                value={coordenadoria._id}
                                                checked={coordenadoriaSelecionada?._id === coordenadoria._id}
                                                onChange={() => handleCoordenadoriaSelect(coordenadoria._id)}
                                            /> {coordenadoria.nome}
                                        </div>
                                    ))}
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>
                )
            ))}
            {/* Exibe coordenadorias do setor principal caso nenhum subsetor tenha sido selecionado */}
            {(setorSelecionado && subsetorSelecionado.length === 0 && setorSelecionado.coordenadorias && setorSelecionado.coordenadorias.length > 0) && (
                <Row>
                    <Col md={12}>
                        <Form.Group controlId="formCoordenadoriaInicial">
                            <Form.Label>Cargos: {setorSelecionado.nome}</Form.Label>
                            <div className="d-flex flex-wrap">
                                {setorSelecionado.coordenadorias.map((coordenadoria) => (
                                    <div key={coordenadoria._id} className="me-3 mb-2">
                                        <input
                                            type="radio"
                                            name="coordenadoriaInicial"
                                            value={coordenadoria._id}
                                            checked={coordenadoriaSelecionada?._id === coordenadoria._id}
                                            onChange={() => handleCoordenadoriaSelect(coordenadoria._id)}
                                        /> {coordenadoria.nome}
                                    </div>
                                ))}
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
            )}
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!coordenadoriaSelecionada}
                >
                    Salvar
                </Button>
            </Modal.Footer>
        </Form>
    );
}

export default EditUsersForm;
