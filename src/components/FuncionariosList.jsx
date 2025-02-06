import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Button, Form, Modal, Container, FormControl, InputGroup, Overlay, Popover } from 'react-bootstrap';
import { FaTrash, FaFile, FaExchangeAlt, FaFilter, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Importa o contexto
import FilterModal from './FilterModal';
import ObservationHistoryButton from './ObservationHistoryButton';
import ObservationHistoryModal from './ObservationHistoryModal';
import CoordEdit from './CoordEdit';
import UserEdit from './userEdit';
import { API_BASE_URL } from '../utils/apiConfig';




function FuncionairosList({
    coordenadoriaId,
    setorPathId
}) {
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showModalEdit, setShowModalEdit] = useState(false);
    const [showModalSingleEdit, setShowModalSingleEdit] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        natureza: [],
        funcao: [],
        referencia: [],
        salarioBruto: { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
        salarioLiquido: { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
        bairro: [],
    });
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showSelectionControlsDelete, setShowSelectionControlsDelete] = useState(false);
    const [showSelectionControlsReport, setShowSelectionControlsReport] = useState(false);
    const [showSelectionControlsEdit, setShowSelectionControlsEdit] = useState(false);
    const [expandedCards, setExpandedCards] = useState([]);
    const [observations, setObservations] = useState({});
    const [showObservationModal, setShowObservationModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [naturezas, setNaturezas] = useState([]);
    const [todasFuncoes, setTodasFuncoes] = useState([]);
    const [todosBairros, setTodosBairros] = useState([]);
    const [todasReferencias, setTodasReferencias] = useState([]);
    // const [funcionariosPath, setFuncionariosPath] = useState([]);
    const [filteredFuncionarios, setFilteredFuncionarios] = useState([]);
    const [funcionarioEncontrado, setFuncionarioEncontrado] = useState(null);
    const { role, funcionarios, setFuncionarios, funcionariosPath, setFuncionariosPath } = useAuth(); // Usar o contexto de autenticação
    const searchRef = useRef(null);

    const fetchSetoresData = async () => {
        const response = await axios.get(`${API_BASE_URL}/api/setores/dados/${setorPathId}`);
        return response.data;
    };


    const fetchFuncionariosData = async () => {
        const response = await axios.get(`${API_BASE_URL}/api/funcionarios/buscarFuncionarios`);
        return response.data;
    };


    const handleCloseModal = () => {
        setShowModalEdit(false)
    }
    const handleCloseModalSingleEdit = () => {
        setShowModalSingleEdit(false)
    }

    // Função de filtro para os funcionários com base nos filtros ativos
    const applyFilters = (funcionarios) => {
        return funcionarios.filter((funcionario) => {
            const salarioBrutoMin = validateBounds(activeFilters.salarioBruto.min, Number.MIN_SAFE_INTEGER);
            const salarioBrutoMax = validateBounds(activeFilters.salarioBruto.max, Number.MAX_SAFE_INTEGER);
            const salarioLiquidoMin = validateBounds(activeFilters.salarioLiquido.min, Number.MIN_SAFE_INTEGER);
            const salarioLiquidoMax = validateBounds(activeFilters.salarioLiquido.max, Number.MAX_SAFE_INTEGER);

            return (
                (activeFilters.natureza.length === 0 || activeFilters.natureza.includes(funcionario.natureza)) &&
                (activeFilters.funcao.length === 0 || activeFilters.funcao.includes(funcionario.funcao)) &&
                (activeFilters.referencia.length === 0 || activeFilters.referencia.includes(funcionario.referencia)) &&
                (funcionario.salarioBruto >= salarioBrutoMin && funcionario.salarioBruto <= salarioBrutoMax) &&
                (funcionario.salarioLiquido >= salarioLiquidoMin && funcionario.salarioLiquido <= salarioLiquidoMax) &&
                (activeFilters.bairro.length === 0 || activeFilters.bairro.includes(funcionario.bairro)) &&
                (!coordenadoriaId || funcionario.coordenadoria === coordenadoriaId)
            );
        });
    };

    useEffect(() => {
        if (setorPathId !== 'mainscreen' && setorPathId) {

            const fetchData = async () => {
                try {
                    const data = await fetchSetoresData();
                    const todosFuncionarios = data.coordenadoriasComFuncionarios.flatMap(coordenadoria => coordenadoria.funcionarios);
                    setFuncionariosPath(todosFuncionarios);
                } catch (error) {
                    console.error("Erro ao buscar os dados:");
                }
            };
            fetchData();
        } else if (setorPathId === 'mainscreen') {
            const fetchFunData = async () => {
                try {
                    const data = await fetchFuncionariosData();
                    setFuncionariosPath(data);
                } catch (error) {
                    console.error("Erro ao buscar os dados:");
                }
            };
            fetchFunData();
        }
    }, [setorPathId]);

    const processarFuncionarios = (dados) => {
        const observacoesPorFuncionario = dados.reduce((acc, item) => {
            acc[item._id] = item.observacoes || [];
            return acc;
        }, {});

        const uniqueNaturezas = [...new Set(dados.map((item) => item.natureza))];
        const uniqueFuncoes = [...new Set(dados.map((item) => item.funcao))];
        const uniqueBairros = [...new Set(dados.map((item) => item.bairro))];
        const uniqueReferencias = [...new Set(dados.map((item) => item.referencia))];

        return {
            observacoes: observacoesPorFuncionario,
            naturezas: uniqueNaturezas,
            funcoes: uniqueFuncoes,
            bairros: uniqueBairros,
            referencias: uniqueReferencias,
        };
    };

    useEffect(() => {
        const dados = funcionarios || funcionariosPath;

        if (dados && dados.length > 0) {
            const { observacoes, naturezas, funcoes, bairros, referencias } = processarFuncionarios(dados);

            setNaturezas(naturezas);
            setTodasFuncoes(funcoes);
            setTodosBairros(bairros);
            setTodasReferencias(referencias);
            setObservations(observacoes);
        }
    }, [funcionarios, funcionariosPath]);

    // Monitora mudanças em funcionariosPath e aplica filtros
    useEffect(() => {
        if (setorPathId) {
            setFilteredFuncionarios(applyFilters(funcionariosPath));
        } else {
            setFilteredFuncionarios(applyFilters(funcionarios));
        }
    }, [setorPathId, funcionariosPath, funcionarios, activeFilters]);

    useEffect(() => {
        // Filtra funcionários pelo nome e aplica outros filtros
        const filtered = (setorPathId ? funcionariosPath : funcionarios)
            .filter(user => user.nome.toLowerCase().includes(searchTerm.toLowerCase()));

        setFilteredFuncionarios(applyFilters(filtered));
    }, [setorPathId, funcionariosPath, funcionarios, activeFilters, searchTerm]);

    const buscarFuncionario = (userId) => {
        let funcionario = funcionarios.find(func => func._id === userId);
        if (!funcionario) {
            funcionario = funcionariosPath.find(func => func._id === userId);
        }
        return funcionario;
    };

    // Evento que é chamado quando o botão é clicado
    const handleClick = (id) => {
        const funcionario = buscarFuncionario(id);
        setFuncionarioEncontrado(funcionario);  // Atualiza o estado com os dados encontrados
        setShowModalSingleEdit(true);
    };

    const toggleExpand = (cardId) => {
        if (expandedCards.includes(cardId)) {
            setExpandedCards(expandedCards.filter(id => id !== cardId));
        } else {
            setExpandedCards([...expandedCards, cardId]);
        }
    };
    // Função para alternar os filtros de natureza com checkboxes
    const toggleNatureza = (value) => {
        setActiveFilters((prevFilters) => {
            const updatedNaturezas = prevFilters.natureza.includes(value)
                ? prevFilters.natureza.filter((n) => n !== value) // Remove se já estiver selecionado
                : [...prevFilters.natureza, value]; // Adiciona se não estiver selecionado
            return { ...prevFilters, natureza: updatedNaturezas };
        });
    };

    // Função para alternar múltiplas funções no filtro
    const toggleFuncao = (funcao) => {
        setActiveFilters((prevFilters) => {
            const updatedFuncoes = prevFilters.funcao.includes(funcao)
                ? prevFilters.funcao.filter((f) => f !== funcao)
                : [...prevFilters.funcao, funcao];
            return { ...prevFilters, funcao: updatedFuncoes };
        });
    };

    const toggleBairro = (bairro) => {
        setActiveFilters((prev) => {
            const isSelected = prev.bairro.includes(bairro);
            const newBairros = isSelected
                ? prev.bairro.filter((item) => item !== bairro)
                : [...prev.bairro, bairro];
            return { ...prev, bairro: newBairros };
        });
    };

    const toggleReferencia = (referencia) => {
        setActiveFilters((prev) => {
            const isSelected = prev.referencia.includes(referencia);
            const newReferencias = isSelected
                ? prev.referencia.filter((item) => item !== referencia)
                : [...prev.referencia, referencia];
            return { ...prev, referencia: newReferencias };
        });
    };


    const handleSalarioBrutoChange = (salarioBruto) => {
        setActiveFilters((prev) => ({ ...prev, salarioBruto }));
    };

    const handleSalarioLiquidoChange = (salarioLiquido) => {
        setActiveFilters((prev) => ({ ...prev, salarioLiquido }));
    };

    const validateBounds = (value, fallback) => {
        return isFinite(value) ? value : fallback;
    };


    // const filteredFuncionarios = funcionarios.filter((funcionario) => {
    //     const salarioBrutoMin = validateBounds(activeFilters.salarioBruto.min, Number.MIN_SAFE_INTEGER);
    //     const salarioBrutoMax = validateBounds(activeFilters.salarioBruto.max, Number.MAX_SAFE_INTEGER);
    //     const salarioLiquidoMin = validateBounds(activeFilters.salarioLiquido.min, Number.MIN_SAFE_INTEGER);
    //     const salarioLiquidoMax = validateBounds(activeFilters.salarioLiquido.max, Number.MAX_SAFE_INTEGER);

    //     return (
    //         (activeFilters.natureza.length === 0 || activeFilters.natureza.includes(funcionario.natureza)) &&
    //         (activeFilters.funcao.length === 0 || activeFilters.funcao.includes(funcionario.funcao)) &&
    //         (activeFilters.referencia.length === 0 || activeFilters.referencia.includes(funcionario.referencia)) &&
    //         (funcionario.salarioBruto >= salarioBrutoMin && funcionario.salarioBruto <= salarioBrutoMax) &&
    //         (funcionario.salarioLiquido >= salarioLiquidoMin && funcionario.salarioLiquido <= salarioLiquidoMax) &&
    //         (activeFilters.bairro.length === 0 || activeFilters.bairro.includes(funcionario.bairro)) &&
    //         (funcionario.coordenadoria === coordenadoriaId)

    //     );
    // });

    // const filteredFuncionarios = setorPathId
    //     ? applyFilters(funcionariosPath)
    //     : applyFilters(funcionarios);


    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        setSelectedUsers(!selectAll ? filteredFuncionarios.map(user => user._id) : []);
    };

    const handleUserSelect = (userId) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId)
                : [...prevSelected, userId]
        );
    };

    const handleDeleteSelected = async (userId = null) => {

        const idsToDelete = userId ? [userId] : selectedUsers;


        if (idsToDelete.length === 0) {
            alert('Nenhum usuário selecionado para deletar.');
            return;
        }

        const userConfirmed = window.confirm('Tem certeza de que deseja apagar os usuários selecionados?');
        if (!userConfirmed) {
            return; // Sai da função se o usuário cancelar
        }

        try {
            // Envia os IDs dos usuários selecionados para o backend
            const response = await axios.delete(`${API_BASE_URL}/api/funcionarios/delete-users`, {
                data: { userIds: idsToDelete },
            });

            if (response.status === 200) {
                // Remove os usuários deletados da interface
                const remainingUsers = filteredFuncionarios.filter(user => !idsToDelete.includes(user._id));
                setFilteredFuncionarios(remainingUsers);
                setFuncionarios(remainingUsers);
                setFuncionariosPath(remainingUsers)
                setSelectedUsers([]);
                setSelectAll(false);
                setShowSelectionControlsDelete(false); // Esconde os controles após exclusão
                alert('Usuários deletados com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao deletar usuários:', error);
            alert('Erro ao deletar usuários. Tente novamente.');
        }


    };


    const toggleSelectionControlsDelete = () => {
        setShowSelectionControlsDelete(!showSelectionControlsDelete);
        setShowSelectionControlsReport(false)
        setShowSelectionControlsEdit(false)
        setSelectedUsers([]); // Limpa qualquer seleção existente
        setSelectAll(false);   // Reseta a seleção global
    };

    const toggleSelectionControlsEdit = () => {
        setShowSelectionControlsEdit(!showSelectionControlsEdit);
        setShowSelectionControlsReport(false)
        setShowSelectionControlsDelete(false);
        setSelectedUsers([]); // Limpa qualquer seleção existente
        setSelectAll(false);   // Reseta a seleção global
    };

    const toggleSelectionControlsReport = () => {
        setShowSelectionControlsReport(!showSelectionControlsReport)
        setShowSelectionControlsDelete(false);
        setShowSelectionControlsEdit(false)
        setSelectedUsers([]); // Limpa qualquer seleção existente
        setSelectAll(false);   // Reseta a seleção global
    };

    const handleViewObservations = (userId) => {
        setCurrentUserId(userId);
        setShowObservationModal(true);
    };

    const handleAddObservation = (newObservation) => {
        setObservations((prev) => ({
            ...prev,
            [currentUserId]: [...(prev[currentUserId] || []), newObservation]
        }));
    };

    return (
        <Container style={{ maxHeight: '540px', overflowY: 'auto' }}>
            {/* Modal de Filtros */}
            <FilterModal
                show={showModal}
                onHide={() => setShowModal(false)}
                activeFilters={activeFilters}
                naturezas={naturezas}
                todasFuncoes={todasFuncoes}
                todosBairros={todosBairros}
                todasReferencias={todasReferencias}
                toggleNatureza={toggleNatureza}
                toggleFuncao={toggleFuncao}
                toggleBairro={toggleBairro}
                toggleReferencia={toggleReferencia}
                handleSalarioBrutoChange={handleSalarioBrutoChange}
                handleSalarioLiquidoChange={handleSalarioLiquidoChange}
            />


            {/* Botões de Filtros, Editar, Apagar */}
            <div className="d-flex justify-content-between mx-3">

                {role === "admin" ? (
                    <div className="position-sticky my-2">
                        <Button variant="primary" onClick={() => setShowModal(true)} className="m-2">
                            <FaFilter />
                        </Button>
                        <Button variant={showSelectionControlsEdit ? "secondary" : "outline-secondary"}
                            onClick={toggleSelectionControlsEdit}
                            className={showSelectionControlsEdit
                                ? "active m-1"
                                : showSelectionControlsDelete || showSelectionControlsReport
                                    ? "d-none"
                                    : "m-1"}>
                            <FaExchangeAlt /> {/* Ícone de Editar */}
                        </Button>

                        <Button variant={showSelectionControlsDelete ? "danger" : "outline-danger"}
                            onClick={toggleSelectionControlsDelete}
                            className={showSelectionControlsDelete
                                ? "active m-1"
                                : showSelectionControlsEdit || showSelectionControlsReport
                                    ? "d-none"
                                    : "m-1"}>
                            <FaTrash />
                        </Button>

                        <Button onClick={toggleSelectionControlsReport}
                            variant={showSelectionControlsReport ? "warning" : "outline-warning"}
                            className={showSelectionControlsReport
                                ? "active m-1"
                                : showSelectionControlsDelete || showSelectionControlsEdit
                                    ? "d-none"
                                    : "m-1"
                            }>
                            <FaFile />
                        </Button>

                        {/* Popover com Input de Pesquisa */}
                        <Overlay target={searchRef.current} show={showSearch} placement="top">
                            {(props) => (
                                <Popover {...props}>
                                    <Popover.Body>
                                        <InputGroup>
                                            <FormControl
                                                type="text"
                                                placeholder="Nome do Servidor..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Popover.Body>
                                </Popover>
                            )}
                        </Overlay>

                        <Button ref={searchRef}
                            className="m-1 p-0 border-0 bg-transparent shadow-none text-black"
                            onClick={() => setShowSearch(!showSearch)}>
                            <FaSearch />
                        </Button>

                    </div>
                ) : (
                    <div className="position-sticky m-2">
                        <Button variant="primary" onClick={() => setShowModal(true)} className="m-2">
                            <FaFilter />
                        </Button>
                    </div>
                )}




                {/* Checkbox Global e Botão "Apagar Selecionados" */}
                {(showSelectionControlsDelete && !showSelectionControlsEdit) && (
                    <div className="d-flex align-items-center">
                        <Form.Check
                            type="checkbox"
                            label="Todos"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="me-2 checkbox-container"
                        />
                        <Button className='m-1' variant="danger" onClick={() => handleDeleteSelected(null)} disabled={selectedUsers.length === 0}>
                            Apagar
                        </Button>
                    </div>
                )}

                {/* Checkbox Global e Botão "Apagar Selecionados" */}
                {(showSelectionControlsEdit && !showSelectionControlsDelete) && (
                    <div className="d-flex align-items-center">
                        <Form.Check
                            type="checkbox"
                            label="Todos"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="me-2 checkbox-container"
                        />
                        <Button className='m-1' variant="secondary" onClick={() => setShowModalEdit(true)} disabled={selectedUsers.length === 0}>
                            Editar
                        </Button>
                    </div>
                )}



                <Modal show={showModalEdit} onHide={() => setShowModalEdit(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Editar Usuarios</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                        <CoordEdit
                            usuariosIds={selectedUsers}
                            handleCloseModal={handleCloseModal}
                            setShowSelectionControlsEdit={setShowSelectionControlsEdit}
                        />


                    </Modal.Body>
                </Modal>

                <Modal show={showModalSingleEdit} onHide={() => setShowModalSingleEdit(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Editar Usuarios</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                        <UserEdit
                            funcionario={funcionarioEncontrado}
                            handleCloseModal={handleCloseModalSingleEdit}
                        />


                    </Modal.Body>
                </Modal>



            </div>
            <Row className="m-3">
                {filteredFuncionarios.map(user => (
                    <Col key={user._id} md={expandedCards.includes(user._id) ? 12 : ''} >
                        <div className={`user-card mb-2`}>

                            {/* Header do card */}
                            <div className="card-header d-flex justify-content-between align-items-center">
                                {(showSelectionControlsDelete || showSelectionControlsEdit) && (
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedUsers.includes(user._id)}
                                        onChange={() => handleUserSelect(user._id)}
                                        className="user-checkbox"
                                    />
                                )}
                                <p><strong>{user.nome}</strong></p>
                            </div>

                            {/* Corpo do Card */}
                            <div className=" d-flex">
                                {/* Foto do usuário à esquerda */}
                                <div className="user-photo-container">
                                    <img src={user.fotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="Foto do Funcionário" className="user-photo" />
                                    {/* Botões abaixo da foto */}
                                    <div className="action-buttons d-flex mt-3">
                                        {role === 'admin' ? (
                                            <>
                                                <Button onClick={() => handleClick(user._id)} variant="outline-dark" className="action-btn mx-1">
                                                    <i className="fas fa-edit"></i>
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteSelected(user._id)}
                                                    variant="outline-dark"
                                                    className="action-btn mx-1">
                                                    <i className="fas fa-trash"></i>
                                                </Button>
                                            </>
                                        ) : null}
                                        <Button
                                            variant="outline-dark"
                                            className="action-btn mx-1"
                                            onClick={() => toggleExpand(user._id)}
                                        >
                                            <i
                                                className={`fas fa-angle-${expandedCards.includes(user._id) ? 'left' : 'right'}`}
                                            ></i>
                                        </Button>
                                    </div>

                                </div>

                                {/* Informações do usuário à direita */}
                                <div className="user-info-container">
                                    <p><strong>Secretaria:</strong> {user.secretaria}</p>
                                    <p><strong>Função:</strong> {user.funcao}</p>
                                    <p><strong>Natureza:</strong> {user.natureza}</p>
                                    <p><strong>Referência:</strong> {user.referencia}</p>


                                </div>
                            </div>

                            <ObservationHistoryModal
                                show={showObservationModal}
                                onHide={() => setShowObservationModal(false)}
                                userId={user._id}
                                initialObservations ={observations[currentUserId] || []}
                            />


                            {/* Botões Horizontais Acima das Informações Adicionais */}
                            {expandedCards.includes(user._id) && (
                                <div className="button-group d-flex justify-content-center my-5">
                                    <ObservationHistoryButton onClick={() => handleViewObservations(user._id)} />
                                    {user.arquivo && (

                                        <Button
                                            variant="outline-success"
                                            className="action-btn m-1 w-25"
                                            onClick={() => window.open(user.arquivoUrl, '_blank')} download
                                        >
                                            <i className="fas fa-download"></i> Baixar Arquivo
                                        </Button>

                                    )}
                                </div>

                            )}

                            {/* Se o card estiver expandido, exibe mais informações */}
                            {expandedCards.includes(user._id) && (
                                <Row className="extra-info professional-info">
                                    <Col className='d-flex flex-wrap justify-content-between '>
                                        {/* Redes Sociais */}
                                        <div className="info-card social-info my-2">
                                            <h3>Redes Sociais</h3>
                                            {Array.isArray(user.redesSociais) && user.redesSociais.length > 0 ? (
                                                <div className="social-links d-flex flex-column">
                                                    {user.redesSociais.map((social, index) => (
                                                        <a
                                                            key={index}
                                                            href={social.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="social-link"
                                                        >
                                                            {social.nome}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>Nenhuma rede social disponível.</p>
                                            )}
                                        </div>


                                        {/* Informações Financeiras */}
                                        <div className="info-card financial-info my-2">
                                            <h3>Informações Financeiras</h3>
                                            <p><strong>Sal. Bruto:</strong> {user.salarioBruto}</p>
                                            <p><strong>Sal. Líquido:</strong> {user.salarioLiquido}</p>
                                        </div>

                                        {/* Informações Pessoais */}
                                        <div className="info-card personal-info my-2">
                                            <h3>Informações Pessoais</h3>
                                            <p><strong>Endereço:</strong> {user.endereco}</p>
                                            <p><strong>Bairro:</strong> {user.bairro}</p>
                                            <p><strong>Telefone:</strong> {user.telefone}</p>
                                        </div>

                                    </Col>
                                </Row>
                            )}
                        </div>
                    </Col>
                ))}
            </Row>

        </Container>

    );
}

export default FuncionairosList;
