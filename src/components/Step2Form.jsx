import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext'; // Importa o contexto
import { API_BASE_URL } from '../utils/apiConfig';

// Função para fazer a requisição com axios
const fetchSetoresData = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/setores/dados`);
    return response.data;
};

function Step2Form({
    newUser = { coordenadoria: [] },
    previousStep,
    handleCloseModal
}) {

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['setores'],
        queryFn: fetchSetoresData
    });

    // Estado para armazenar os dados hierárquicos dos setores
    const [setoresOrganizados, setSetoresOrganizados] = useState([]);
    // Estados para controlar seleções
    const [setorSelecionado, setSetorSelecionado] = useState(null);
    const [subsetorSelecionado, setSubsetorSelecionado] = useState([]);
    const [coordenadoriaSelecionada, setCoordenadoriaSelecionada] = useState(null);
    const { addFuncionarios, addFuncionariosPath} = useAuth(); // Usar o contexto de autenticação


    // Carrega os dados quando a resposta da API é recebida
    useEffect(() => {
        if (data && data.setores) {
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
        setSubsetorSelecionado([]);  // Limpa o subsetor selecionado anterior
        setCoordenadoriaSelecionada(null);  // Limpa a coordenadoria selecionada anterior
        newUser.coordenadoria = "";
    }

    // Função para tratar a seleção do setor
    const handleSetorSelect = (setorId) => {
        const setor = setoresOrganizados.find((s) => s._id === setorId);
        setSetorSelecionado(setor);
        setSubsetorSelecionado([]);  // Limpa o subsetor selecionado anterior
        setCoordenadoriaSelecionada(null);  // Limpa a coordenadoria selecionada anterior
        newUser.coordenadoria = "";

        // Se o setor contiver coordenadorias, já exibe as coordenadorias dele
        if (setor.coordenadorias && setor.coordenadorias.length > 0) {
            setCoordenadoriaSelecionada(setor.coordenadorias);
        }
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
            // Atualiza o subsetor selecionado e limpa a coordenadoria do setor principal
            setSubsetorSelecionado([subsetor]); // mantém apenas o subsetor selecionado atual
            newUser.coordenadoria = "";
        }


    };

    // Função para atualizar o newUser com o ID da coordenadoria selecionada
    const handleCoordenadoriaSelect = (coordenadoriaId) => {
        let coordenadoria;

        if (subsetorSelecionado.length > 0) {
            // Pega a última coordenadoria do último subsetor selecionado
            const ultimoSubsetor = subsetorSelecionado[subsetorSelecionado.length - 1];
            coordenadoria = ultimoSubsetor.coordenadorias.find((coord) => coord._id === coordenadoriaId);
        } else if (setorSelecionado && setorSelecionado.coordenadorias) {
            // Se não há subsetor selecionado, busca a coordenadoria diretamente no setor
            coordenadoria = setorSelecionado.coordenadorias.find((coord) => coord._id === coordenadoriaId);
        }

        // Define a coordenadoria selecionada e atualiza o usuário
        setCoordenadoriaSelecionada(coordenadoria);
        newUser.coordenadoria = coordenadoriaId;

    };



    const handleSubmit2 = async () => {
        // Filtra as redes sociais
        newUser.redesSociais = newUser.redesSociais.filter(item => item.link && item.nome);

        const formData = new FormData();
        formData.append('nome', newUser.nome);
        formData.append('foto', newUser.foto || null);
        formData.append('secretaria', newUser.secretaria);
        formData.append('funcao', newUser.funcao);
        formData.append('natureza', newUser.natureza);
        formData.append('referencia', newUser.referencia);
        formData.append('redesSociais', JSON.stringify(newUser.redesSociais) || '');
        formData.append('salarioBruto', newUser.salarioBruto);
        formData.append('salarioLiquido', newUser.salarioLiquido);
        formData.append('endereco', newUser.endereco);
        formData.append('bairro', newUser.bairro);
        formData.append('telefone', newUser.telefone);
        formData.append('arquivo', newUser.arquivo || null);
        formData.append('observacoes', JSON.stringify(newUser.observacoes));
        formData.append('coordenadoria', newUser.coordenadoria);

        try {
            // Realiza a requisição para a API
            const response = await axios.post(`${API_BASE_URL}/api/funcionarios`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Exibe a resposta da API
            addFuncionarios(response.data)
            addFuncionariosPath(response.data)
            handleCloseModal()
            alert("cadastrado")
        } catch (error) {
            console.error('Erro ao cadastrar funcionário:', error);
        }
    };

    // Renderiza o formulário
    return (
        <Form>
            <Button onClick={refreshAll} variant="outline-secondary" className="custom-height mx-1 mb-1">
                <i className="fas fa-sync-alt"></i>
            </Button>
            {/* Setores */}
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

            {/* Subsetores */}
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


            {/* Renderiza coordenadorias para cada subsetor selecionado */}
            {subsetorSelecionado.map((subsetor, index) => (
                subsetor.coordenadorias && subsetor.coordenadorias.length > 0 && (
                    <Row key={`coordenadoria-${index}`}>
                        <Col md={12}>
                            <Form.Group controlId={`formCoordenadoria_${index}`}>
                                <Form.Label>Cargos - {subsetor.nome}</Form.Label>
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
                            <Form.Label>Cargos: - {setorSelecionado.nome}</Form.Label>
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
                <Button variant="secondary" onClick={previousStep}>Voltar</Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit2}
                    disabled={!newUser.coordenadoria}
                >
                    Salvar
                </Button>
            </Modal.Footer>
        </Form>
    );
}

export default Step2Form;
