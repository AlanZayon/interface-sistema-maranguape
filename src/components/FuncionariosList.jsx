import React, { useState } from 'react';
import { Row, Col, Button, Modal, Form, DropdownButton, Dropdown, Collapse } from 'react-bootstrap';
import { FaEdit, FaTrash, FaFile } from 'react-icons/fa'; // Ícones de edição e remoção


function FuncionairosList({
    sector,
    expandedGroups,
    secretaria
}) {
    const [showModal, setShowModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ natureza: [], funcao: [] });
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showSelectionControls, setShowSelectionControls] = useState(false);
    const [expandedCards, setExpandedCards] = useState([]);

    const userData = [
        {
            id: 'card-1',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-2',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Professora',
            natureza: 'Temporário',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-3',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Professora',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-4',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Analista',
            natureza: 'Temporário',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-5',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-6',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-7',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-8',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-9',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-10',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        }
    ];

    const todasFuncoes = [
        'TEC.EM PROC.DE AUTORIZACAO P/PROCEDIM.DE ALTA COMPLEXIDADE',
        "GUARDA PATRIMONIAL ",
        "PROFESSOR DE EDUCAÇÃO BÁSICA-EDUCAD",
        'Analista',
        'Professora',
        // Adicione mais 30+ funções aqui
    ];

    const naturezas = ['Efetivo', 'Temporário', 'Comissionado',];


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

    // Filtrar funcionários pela secretaria e filtros ativos
    const filteredFuncionarios = userData
        .filter(user => secretaria === "all" || user.secretaria === secretaria) // Filtro por secretaria
        .filter(user => {
            if (activeFilters.natureza.length > 0 && !activeFilters.natureza.includes(user.natureza)) {
                return false;
            }
            if (activeFilters.funcao.length > 0 && !activeFilters.funcao.includes(user.funcao)) {
                return false;
            }
            return true;
        });

    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        setSelectedUsers(!selectAll ? filteredFuncionarios.map(user => user.id) : []);
    };

    const handleUserSelect = (userId) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId)
                : [...prevSelected, userId]
        );
    };

    const handleDeleteSelected = () => {
        const remainingUsers = userData.filter(user => !selectedUsers.includes(user.id));
        console.log('Usuários restantes após exclusão:', remainingUsers);
        setSelectedUsers([]);
        setSelectAll(false);
        setShowSelectionControls(false); // Esconde os controles após exclusão
    };

    const toggleSelectionControls = () => {
        setShowSelectionControls(!showSelectionControls);
        setSelectedUsers([]); // Limpa qualquer seleção existente
        setSelectAll(false);   // Reseta a seleção global
    };


    return (
        <Collapse in={expandedGroups[sector] || secretaria === "all"}>
            <div style={{ maxHeight: '540px', overflowY: 'auto' }}>
                {/* Modal de Filtros */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Filtros</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Seção Natureza */}
                        <h5>Natureza</h5>
                        <Form.Group>
                            {naturezas.map((natureza) => (
                                <Form.Check
                                className='checkbox-container'
                                    key={natureza}
                                    type="checkbox"
                                    label={natureza}
                                    name="natureza"
                                    checked={activeFilters.natureza.includes(natureza)} // Verifica se está selecionado
                                    onChange={() => toggleNatureza(natureza)} // Adiciona ou remove a natureza selecionada
                                />
                            ))}
                        </Form.Group>

                        {/* Seção Função com Dropdown de Pesquisa */}
                        <h5>Função</h5>
                        <DropdownButton
                            id="dropdown-funcoes"
                            title="Selecione Funções"
                            variant="outline-primary"
                            className="mb-3"
                            autoClose="outside"
                        >
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <Form.Control type="text" placeholder="Pesquisar função..." className="mx-3 my-2" />

                                {todasFuncoes.map((funcao) => (
                                    <Dropdown.Item
                                        key={funcao}
                                        onClick={() => toggleFuncao(funcao)}
                                        active={activeFilters.funcao.includes(funcao)}
                                        title={funcao} // Tooltip para mostrar o nome completo
                                    >
                                        {funcao.length > 25 ? `${funcao.substring(0, 25)}...` : funcao}
                                    </Dropdown.Item>
                                ))}
                            </div>
                        </DropdownButton>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Fechar
                        </Button>
                        <Button variant="primary" onClick={() => setShowModal(false)}>
                            Aplicar Filtros
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Botões de Filtros, Editar, Apagar */}
                <div className="d-flex justify-content-between my-3">
                    <div>
                        <Button variant="primary" onClick={() => setShowModal(true)} className="m-2">
                            <i className="fas fa-filter"></i> Abrir Filtros
                        </Button>

                        <Button variant="outline-secondary" className="m-2">
                            <FaEdit /> {/* Ícone de Editar */}
                        </Button>

                        <Button variant={showSelectionControls ? "danger" : "outline-danger"}
                            onClick={toggleSelectionControls}
                            className={showSelectionControls ? "active" : ""}>
                            <FaTrash /> {/* Ícone de Apagar */}
                        </Button>

                        <Button variant="outline-warning" className="m-2">
                            <FaFile /> {/* Ícone de Editar */}
                        </Button>
                    </div>

                    {/* Checkbox Global e Botão "Apagar Selecionados" */}
                    {showSelectionControls && (
                        <div className="d-flex align-items-center">
                            <Form.Check
                                type="checkbox"
                                label="Selecionar Todos"
                                checked={selectAll}
                                onChange={handleSelectAll}
                                className="me-2 checkbox-container"
                            />
                            <Button className='m-2' variant="danger" onClick={handleDeleteSelected} disabled={selectedUsers.length === 0}>
                                Apagar Selecionados
                            </Button>
                        </div>
                    )}
                </div>
                <Row className="m-3">
                    {filteredFuncionarios.map(user => (
                        <Col key={user.id} md={expandedCards.includes(user.id) ? 12 : 3} className="mb-3">
                            <div className={`user-card ${expandedCards.includes(user.id) ? 'expanded' : ''}`}>
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    {showSelectionControls && (
                                        <Form.Check
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleUserSelect(user.id)}
                                            className="user-checkbox"
                                        />
                                    )}
                                    <p><strong>Cód. Servidor:</strong> {user.codigo}</p>
                                    <div className="action-buttons d-flex">
                                        <Button variant="outline-dark" className="action-btn mx-1"><i className="fas fa-edit"></i></Button>
                                        <Button variant="outline-dark" className="action-btn mx-1"><i className="fas fa-trash"></i></Button>
                                        <Button variant="outline-dark" className="action-btn mx-1" onClick={() => toggleExpand(user.id)}>
                                            <i className={`fas fa-angle-${expandedCards.includes(user.id) ? 'left' : 'right'}`}></i>
                                        </Button>
                                    </div>
                                </div>

                                <p><strong>Servidor:</strong> {user.servidor}</p>
                                <p><strong>Secretaria:</strong> {user.secretaria}</p>
                                <p><strong>Função:</strong> {user.funcao}</p>
                                <p><strong>Natureza:</strong> {user.natureza}</p>

                                {expandedCards.includes(user.id) && (
                                    <div className="extra-info ">
                                        <div className="info-card financial-info">
                                            <h3>Informações Financeiras</h3>
                                            <p><strong>Sal. Bruto:</strong> {user.financeiro.bruto}</p>
                                            <p><strong>Sal. Líquido:</strong> {user.financeiro.liquido}</p>
                                            <p><strong>Banco:</strong> {user.financeiro.banco}</p>
                                            <p><strong>Agência:</strong> {user.financeiro.agencia}</p>
                                            <p><strong>Conta:</strong> {user.financeiro.conta}</p>
                                        </div>
                                        <div className="info-card personal-info">
                                            <h3>Informações Pessoais</h3>
                                            <p><strong>Endereço:</strong> {user.pessoal.endereco}</p>
                                            <p><strong>Telefone:</strong> {user.pessoal.telefone}</p>
                                            <p><strong>C.P.F.:</strong> {user.pessoal.cpf}</p>
                                            <p><strong>Dependentes:</strong> {user.pessoal.dependentes}</p>
                                        </div>
                                        <div className="info-card professional-info">
                                            <h3>Informações Profissionais</h3>
                                            <p><strong>Cargo:</strong> {user.profissional.cargo}</p>
                                            <p><strong>Formação:</strong> {user.profissional.formacao}</p>
                                            <p><strong>Setor:</strong> {user.profissional.setor}</p>
                                            <p><strong>Última Promoção:</strong> {user.profissional.promocao}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    ))}
                </Row>

            </div>
        </Collapse>
    );
}

export default FuncionairosList;
