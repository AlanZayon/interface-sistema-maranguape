import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Button,
  Form,
  Modal,
  Container,
  FormControl,
  InputGroup,
  Overlay,
  Popover,
} from "react-bootstrap";
import {
  FaTrash,
  FaFile,
  FaExchangeAlt,
  FaFilter,
  FaSearch,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom"; // Importe o hook
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAuth } from "./AuthContext"; // Importa o contexto
import FilterModal from "./FilterModal";
import ObservationHistoryButton from "./ObservationHistoryButton";
import ObservationHistoryModal from "./ObservationHistoryModal";
import CoordEdit from "./CoordEdit";
import UserEdit from "./userEdit";
import { API_BASE_URL } from "../utils/apiConfig";
import { set } from "lodash";

function FuncionairosList({ coordenadoriaId, setorPathId, departmentName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTermFromURL, setSearchTermFromURL] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalSingleEdit, setShowModalSingleEdit] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    natureza: [],
    funcao: [],
    referencia: [],
    salarioBruto: {
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
    },
    bairro: [],
    inicioContrato: null,
    fimContrato: null
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSelectionControlsDelete, setShowSelectionControlsDelete] =
    useState(false);
  const [showSelectionControlsReport, setShowSelectionControlsReport] =
    useState(false);
  const [showSelectionControlsEdit, setShowSelectionControlsEdit] =
    useState(false);
  const [expandedCards, setExpandedCards] = useState([]);
  const [observations, setObservations] = useState({});
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [naturezas, setNaturezas] = useState([]);
  const [todasFuncoes, setTodasFuncoes] = useState([]);
  const [todosBairros, setTodosBairros] = useState([]);
  const [todasReferencias, setTodasReferencias] = useState([]);
  const [todosSalariosBrutos, setTodosSalariosBrutos] = useState([]);
  const [filteredFuncionarios, setFilteredFuncionarios] = useState([]);
  const [funcionarioEncontrado, setFuncionarioEncontrado] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    role,
    funcionarios,
    setFuncionarios,
    funcionariosPath,
    setFuncionariosPath,
    activateModified,
    setActivateModified,
  } = useAuth(); // Usar o contexto de autenticação
  const searchRef = useRef(null);

  const fetchSetoresData = async () => {
    setLoading(true);
    let page = 1;
    const limit = 1000;
    let totalPages = 1;
    let allFuncionarios = [];
    try {
      while (page <= totalPages) {
        const res = await axios.get(
          `${API_BASE_URL}/api/funcionarios/setores/${setorPathId}/funcionarios?page=${page}&limit=${limit}`
        );
        allFuncionarios = [...allFuncionarios, ...res.data.funcionarios];
        totalPages = res.data.pages;
        page++;
      }
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      return [];
    } finally {
      setLoading(false);
    }

    return allFuncionarios;
  };

  const fetchFuncionariosData = async () => {
    setLoading(true);
    let page = 1;
    const limit = 1000;
    let totalPages = 1;
    let allFuncionarios = [];
    try {
      while (page <= totalPages) {
        const res = await axios.get(
          `${API_BASE_URL}/api/funcionarios/buscarFuncionarios?page=${page}&limit=${limit}`
        );
        allFuncionarios = [...allFuncionarios, ...res.data.funcionarios];
        totalPages = res.data.pages;
        page++;
      }
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      return [];
    } finally {
      setLoading(false);
    }

    return allFuncionarios;
  };

  const handleCloseModal = () => {
    setShowModalEdit(false);
  };
  const handleCloseModalSingleEdit = () => {
    setShowModalSingleEdit(false);
  };

const handleInicioContratoChange = (date) => {
  setActiveFilters(prev => {
    const newInicio = date ? new Date(date.setHours(0, 0, 0, 0)).toISOString() : null;
    
    // Validação para garantir que a data inicial não seja depois da data final
    const newFim = prev.fimContrato && newInicio > prev.fimContrato ? null : prev.fimContrato;
    
    return { 
      ...prev, 
      inicioContrato: newInicio,
      fimContrato: newFim
    };
  });
};

const handleFimContratoChange = (date) => {
  setActiveFilters(prev => {
    const newFim = date ? new Date(date.setHours(23, 59, 59, 999)).toISOString() : null;
    
    // Validação para garantir que a data final não seja antes da data inicial
    const newInicio = prev.inicioContrato && newFim < prev.inicioContrato ? null : prev.inicioContrato;
    
    return { 
      ...prev, 
      fimContrato: newFim,
      inicioContrato: newInicio
    };
  });
};

const handleClearAllFilters = () => {
  setActiveFilters({
    natureza: [],
    funcao: [],
    bairro: [],
    referencia: [],
    salarioBruto: {
      min: Math.min(...todosSalariosBrutos),
      max: Math.max(...todosSalariosBrutos),
    },
    inicioContrato: null,
    fimContrato: null,
  });
};

  const sortFuncionariosAlphabetically = (funcionarios) => {
    return [...funcionarios].sort((a, b) => {
      const nomeA = a.nome.toUpperCase();
      const nomeB = b.nome.toUpperCase();
      if (nomeA < nomeB) {
        return -1;
      }
      if (nomeA > nomeB) {
        return 1;
      }
      return 0;
    });
  };

const applyFilters = (funcionarios) => {
  const allFuncionarios = Array.isArray(funcionarios)
    ? funcionarios
    : Object.values(funcionarios || {}).flat();

  const filtered = allFuncionarios.filter((funcionario) => {
    const salarioBrutoMin = validateBounds(
      activeFilters.salarioBruto.min,
      Number.MIN_SAFE_INTEGER
    );
    const salarioBrutoMax = validateBounds(
      activeFilters.salarioBruto.max,
      Number.MAX_SAFE_INTEGER
    );

    // Verifica filtros de contrato (apenas para temporários)
    const contratoFilter = funcionario.natureza !== "TEMPORARIO" || (
      (!activeFilters.inicioContrato || new Date(funcionario.inicioContrato) >= new Date(activeFilters.inicioContrato)) &&
      (!activeFilters.fimContrato || new Date(funcionario.fimContrato) <= new Date(activeFilters.fimContrato))
    );

    return (
      (activeFilters.natureza.length === 0 ||
        activeFilters.natureza.includes(funcionario.natureza)) &&
      (activeFilters.funcao.length === 0 ||
        activeFilters.funcao.includes(funcionario.funcao)) &&
      (activeFilters.referencia.length === 0 ||
        activeFilters.referencia.includes(funcionario.referencia)) &&
      funcionario.salarioBruto >= salarioBrutoMin &&
      funcionario.salarioBruto <= salarioBrutoMax &&
      (activeFilters.bairro.length === 0 ||
        activeFilters.bairro.includes(funcionario.bairro)) &&
      (!coordenadoriaId || funcionario.coordenadoria === coordenadoriaId) &&
      contratoFilter
    );
  });

  return sortFuncionariosAlphabetically(filtered);
};

  useEffect(() => {
    // Detecta se veio de uma pesquisa pela URL
    if (location.pathname.startsWith("/search/")) {
      const term = location.pathname.split("/search/")[1];
      setSearchTermFromURL(term);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      setorPathId !== "mainscreen" &&
      setorPathId !== "search" &&
      setorPathId
    ) {
      const fetchData = async () => {
        try {
          const data = await fetchSetoresData();
          setFuncionariosPath(data);
        } catch (error) {
          console.error("Erro ao buscar os dados:");
        }
      };
      fetchData();
    } else if (setorPathId === "mainscreen") {
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
    setActivateModified(false);
  }, [setorPathId, activateModified]);

  const processarFuncionarios = (dados) => {
    const observacoesPorFuncionario = dados.reduce((acc, item) => {
      acc[item._id] = item.observacoes || [];
      return acc;
    }, {});

    const uniqueNaturezas = [...new Set(dados.map((item) => item.natureza))];
    const uniqueFuncoes = [...new Set(dados.map((item) => item.funcao))];
    const uniqueBairros = [...new Set(dados.map((item) => item.bairro))];
    const uniqueReferencias = [
      ...new Set(dados.map((item) => item.referencia)),
    ];
    const uniqueSalariosBrutos = [
      ...new Set(dados.map((item) => item.salarioBruto)),
    ];

    return {
      observacoes: observacoesPorFuncionario,
      naturezas: uniqueNaturezas,
      funcoes: uniqueFuncoes,
      bairros: uniqueBairros,
      referencias: uniqueReferencias,
      salarioBruto: uniqueSalariosBrutos,
    };
  };

  useEffect(() => {
    const dados = funcionarios[coordenadoriaId] || funcionariosPath;

    if (dados && dados.length > 0) {
      const {
        observacoes,
        naturezas,
        funcoes,
        bairros,
        referencias,
        salarioBruto,
      } = processarFuncionarios(dados);

      setNaturezas(naturezas);
      setTodasFuncoes(funcoes);
      setTodosBairros(bairros);
      setTodasReferencias(referencias);
      setObservations(observacoes);
      setTodosSalariosBrutos(salarioBruto);
    }
  }, [funcionarios, funcionariosPath]);

  // Monitora mudanças em funcionariosPath e aplica filtros
  useEffect(() => {
    if (setorPathId) {
      setFilteredFuncionarios(applyFilters(funcionariosPath));
    } else {
      setFilteredFuncionarios(applyFilters(funcionarios[coordenadoriaId]));
    }
  }, [setorPathId, funcionariosPath, funcionarios, activeFilters]);

  useEffect(() => {
    // Filtra funcionários pelo nome e aplica outros filtros
    const filtered = (
      (setorPathId ? funcionariosPath : funcionarios[coordenadoriaId]) || []
    ).filter((user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredFuncionarios(applyFilters(filtered));
  }, [setorPathId, funcionariosPath, funcionarios, activeFilters, searchTerm]);

  const buscarFuncionario = (userId) => {
    const funcionario =
      funcionarios[coordenadoriaId]?.find((func) => func._id === userId) ||
      funcionariosPath.find((func) => func._id === userId) ||
      null;

    return funcionario;
  };

  // Evento que é chamado quando o botão é clicado
  const handleClick = (id) => {
    const funcionario = buscarFuncionario(id);
    setFuncionarioEncontrado(funcionario);
    setShowModalSingleEdit(true);
  };

  const toggleExpand = (cardId) => {
    if (expandedCards.includes(cardId)) {
      setExpandedCards(expandedCards.filter((id) => id !== cardId));
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

  const validateBounds = (value, fallback) => {
    return isFinite(value) ? value : fallback;
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedUsers(
      !selectAll ? filteredFuncionarios.map((user) => user._id) : []
    );
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleDeleteSelected = async (userId = null) => {
    setLoading(true);
    const idsToDelete = userId ? [userId] : selectedUsers;

    if (idsToDelete.length === 0) {
      alert("Nenhum usuário selecionado para deletar.");
      return;
    }

    const userConfirmed = window.confirm(
      "Tem certeza de que deseja apagar os usuários selecionados?"
    );
    if (!userConfirmed) {
      setLoading(false);
      return;
    }

    try {
      // Envia os IDs dos usuários selecionados para o backend
      const response = await axios.delete(
        `${API_BASE_URL}/api/funcionarios/delete-users`,
        {
          data: { userIds: idsToDelete },
        }
      );

      if (response.status === 200) {
        const remainingUsers = filteredFuncionarios.filter(
          (user) => !idsToDelete.includes(user._id)
        );

        setFilteredFuncionarios(remainingUsers);
        setFuncionarios((prev) => {
          const deletedUsers = filteredFuncionarios.filter((user) =>
            idsToDelete.includes(user._id)
          );

          const deletedUsersCoordenadoria = deletedUsers.map(
            (user) => user.coordenadoria
          );

          const updatedState = { ...prev };
          deletedUsersCoordenadoria.forEach((coordenadoria) => {
            updatedState[coordenadoria] =
              updatedState[coordenadoria]?.filter(
                (user) => !idsToDelete.includes(user._id)
              ) || [];
          });

          return updatedState;
        });
        setFuncionariosPath(remainingUsers);
        setSelectedUsers([]);
        setSelectAll(false);
        setShowSelectionControlsDelete(false); // Esconde os controles após exclusão
        alert("Usuários deletados com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao deletar usuários:", error);
      alert("Erro ao deletar usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReportSelected = async () => {
    try {
      // Envia os IDs dos usuários selecionados para o backend
      const response = await axios.post(
        `${API_BASE_URL}/api/funcionarios/relatorio-funcionarios/gerar`,
        { ids: selectedUsers },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Erro ao gerar o relatório:", error);
    }
  };

  const toggleSelectionControlsDelete = () => {
    setShowSelectionControlsDelete(!showSelectionControlsDelete);
    setShowSelectionControlsReport(false);
    setShowSelectionControlsEdit(false);
    setSelectedUsers([]); // Limpa qualquer seleção existente
    setSelectAll(false); // Reseta a seleção global
  };

  const toggleSelectionControlsEdit = () => {
    setShowSelectionControlsEdit(!showSelectionControlsEdit);
    setShowSelectionControlsReport(false);
    setShowSelectionControlsDelete(false);
    setSelectedUsers([]); // Limpa qualquer seleção existente
    setSelectAll(false); // Reseta a seleção global
  };

  const toggleSelectionControlsReport = () => {
    setShowSelectionControlsReport(!showSelectionControlsReport);
    setShowSelectionControlsDelete(false);
    setShowSelectionControlsEdit(false);
    setSelectedUsers([]); // Limpa qualquer seleção existente
    setSelectAll(false); // Reseta a seleção global
  };

  const handleViewObservations = (userId) => {
    setCurrentUserId(userId);
    setShowObservationModal(true);
  };

  const handleAddObservation = (newObservation) => {
    setObservations((prev) => ({
      ...prev,
      [currentUserId]: [...(prev[currentUserId] || []), newObservation],
    }));
  };

  const UserCard = ({ columnIndex, rowIndex, style, columnCount }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= filteredFuncionarios.length) return null;

    const user = filteredFuncionarios[index];
    const [activeTab, setActiveTab] = useState("financeiro");

    const renderTabContent = () => {
      switch (activeTab) {
        case "financeiro":
          return (
            <div className="info-card financial-info my-2">
              <h3>Financeiro</h3>
              <p>
                <strong>Sal. Bruto:</strong> {user.salarioBruto}
              </p>
            </div>
          );
        case "localidade":
          return (
            <div className="info-card personal-info my-2">
              <h3>Localidade</h3>
              <p>
                <strong>Cidade:</strong> {user.cidade}
              </p>
              <p>
                <strong>Endereço:</strong> {user.endereco}
              </p>
              <p>
                <strong>Bairro:</strong> {user.bairro}
              </p>
              <p>
                <strong>Telefone:</strong> {user.telefone}
              </p>
            </div>
          );
        case "redes-sociais":
          return (
            <div className="info-card social-info my-2">
              <h3>Redes Sociais</h3>
              {Array.isArray(user.redesSociais) &&
                user.redesSociais.length > 0 ? (
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
          );
        case "contrato":
          return (
            <div className="info-card contract-info my-2">
              <h3>Contrato Temporário</h3>
              <p>
                <strong>Início do Contrato:</strong> {new Date(user.inicioContrato).toLocaleDateString()}
              </p>
              <p>
                <strong>Fim do Contrato:</strong> {new Date(user.fimContrato).toLocaleDateString()}
              </p>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div style={style}>
        <Col
          key={user._id}
          style={{
            zIndex: expandedCards.includes(user._id) ? 10 : 1,
            position: "relative",
          }}
        >
          <div className={`user-card mb-2 mx-2`}>
            <div className="card-header d-flex justify-content-between align-items-center">
              {(showSelectionControlsDelete ||
                showSelectionControlsEdit ||
                showSelectionControlsReport) && (
                  <Form.Check
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                    className="user-checkbox"
                  />
                )}
              <p>
                <strong>{user.nome}</strong>
              </p>
            </div>

            <div className="d-flex">
              <div className="user-photo-container">
                <img
                  src={
                    user.fotoUrl ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                  }
                  alt="Foto do Funcionário"
                  className="user-photo"
                />
                <div className="action-buttons d-flex mt-3">
                  {role === "admin" && (
                    <>
                      <Button
                        onClick={() => handleClick(user._id)}
                        variant="outline-dark"
                        className="action-btn mx-1"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        onClick={() => handleDeleteSelected(user._id)}
                        variant="outline-dark"
                        className="action-btn mx-1"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline-dark"
                    className="action-btn mx-1"
                    onClick={() => toggleExpand(user._id)}
                  >
                    <i
                      className={`fas fa-angle-${expandedCards.includes(user._id) ? "left" : "right"
                        }`}
                    ></i>
                  </Button>
                </div>
              </div>

              <div className="user-info-container">
                <p>
                  <strong>Secretaria:</strong> {user.secretaria}
                </p>
                <p>
                  <strong>Função:</strong> {user.funcao}
                </p>
                <p>
                  <strong>Natureza:</strong> {user.natureza}
                </p>
                {user.referencia && (
                  <p>
                    <strong>Referência:</strong> {user.referencia}
                  </p>
                )}
              </div>
            </div>

            {expandedCards.includes(user._id) && (
              <>
                <div className="button-group d-flex justify-content-center my-5">
                  <ObservationHistoryButton
                    onClick={() => handleViewObservations(user._id)}
                  />
                  {user.arquivo && (
                    <Button
                      variant="outline-success"
                      className="action-btn m-1 w-25"
                      onClick={() => window.open(user.arquivoUrl, "_blank")}
                      download
                    >
                      <i className="fas fa-download"></i> Baixar Arquivo
                    </Button>
                  )}
                </div>

                <Row className="extra-info professional-info">
                  <Col>
                    {/* Navegação entre abas */}
                    <div className="d-flex justify-content-around mb-3">
                      <Button
                        variant={activeTab === "financeiro" ? "primary" : "outline-primary"}
                        onClick={() => setActiveTab("financeiro")}
                        title="Financeiro"
                      >
                        <i className="fas fa-money-bill-wave"></i>
                      </Button>
                      <Button
                        variant={activeTab === "localidade" ? "primary" : "outline-primary"}
                        onClick={() => setActiveTab("localidade")}
                        title="Localidade"
                      >
                        <i className="fas fa-map-marker-alt"></i>
                      </Button>
                      <Button
                        variant={activeTab === "redes-sociais" ? "primary" : "outline-primary"}
                        onClick={() => setActiveTab("redes-sociais")}
                        title="Redes Sociais"
                      >
                        <i className="fas fa-share-alt"></i>
                      </Button>
                      {user.natureza === "TEMPORARIO" && (
                        <Button
                          variant={activeTab === "contrato" ? "primary" : "outline-primary"}
                          onClick={() => setActiveTab("contrato")}
                          title="Contrato"
                        >
                          <i className="fas fa-file-contract"></i>
                        </Button>
                      )}
                    </div>

                    {/* Conteúdo da aba ativa */}
                    {renderTabContent()}
                  </Col>
                </Row>
              </>
            )}
          </div>
        </Col>
      </div>
    );
  };

  // Calcula o número de colunas baseado na largura
  const getColumnCount = (width) => {
    if (width < 768) return 1; // Mobile
    if (width < 992) return 2; // Tablet
    return 3; // Desktop
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="position-relative mb-4">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Carregando...</span>
          </div>
          <div className="position-absolute top-0 start-0 w-100 h-100">
            <div
              className="spinner-grow text-info opacity-25"
              style={{ width: "3.5rem", height: "3.5rem" }}
              role="status"
            ></div>
          </div>
        </div>

        <h5 className="text-muted mb-2">Carregando dados</h5>
      </div>
    );
  }

  return (
    <Container
      style={{
        height: setorPathId ? "calc(100vh - 92px)" : "calc(100vh - 200px)",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "0",
      }}
    >
      {setorPathId && (
        <h2 className="mt-4 d-flex">
          <Col xs="auto"></Col>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginLeft: "15px",
              color: "#333",
              textTransform: "capitalize",
            }}
          >
            {departmentName === "mainscreen"
              ? "TODOS OS FUNCIONÁRIOS"
              : !departmentName
                ? decodeURIComponent(searchTermFromURL)
                : departmentName}
          </span>
        </h2>
      )}

      <FilterModal
        show={showModal}
        onHide={() => setShowModal(false)}
        activeFilters={activeFilters}
        naturezas={naturezas}
        todasFuncoes={todasFuncoes}
        todosBairros={todosBairros}
        todasReferencias={todasReferencias}
        todosSalariosBrutos={todosSalariosBrutos}
        toggleNatureza={toggleNatureza}
        toggleFuncao={toggleFuncao}
        toggleBairro={toggleBairro}
        toggleReferencia={toggleReferencia}
        handleSalarioBrutoChange={handleSalarioBrutoChange}
        handleInicioContratoChange={handleInicioContratoChange}
        handleFimContratoChange={handleFimContratoChange}
        onClearAllFilters={handleClearAllFilters}
      />

      <div className="d-flex justify-content-between mx-3">
        {role === "admin" ? (
          <div className="position-sticky my-2">
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="m-2"
            >
              <FaFilter />
            </Button>
            <Button
              variant={
                showSelectionControlsEdit ? "secondary" : "outline-secondary"
              }
              onClick={toggleSelectionControlsEdit}
              className={
                showSelectionControlsEdit
                  ? "active m-1"
                  : showSelectionControlsDelete || showSelectionControlsReport
                    ? "d-none"
                    : "m-1"
              }
            >
              <FaExchangeAlt />
            </Button>

            <Button
              variant={
                showSelectionControlsDelete ? "danger" : "outline-danger"
              }
              onClick={toggleSelectionControlsDelete}
              className={
                showSelectionControlsDelete
                  ? "active m-1"
                  : showSelectionControlsEdit || showSelectionControlsReport
                    ? "d-none"
                    : "m-1"
              }
            >
              <FaTrash />
            </Button>

            <Button
              onClick={toggleSelectionControlsReport}
              variant={
                showSelectionControlsReport ? "warning" : "outline-warning"
              }
              className={
                showSelectionControlsReport
                  ? "active m-1"
                  : showSelectionControlsDelete || showSelectionControlsEdit
                    ? "d-none"
                    : "m-1"
              }
            >
              <FaFile />
            </Button>

            <Overlay
              target={searchRef.current}
              show={showSearch}
              placement="top"
            >
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

            <Button
              ref={searchRef}
              className="m-1 p-0 border-0 bg-transparent shadow-none text-black"
              onClick={() => setShowSearch(!showSearch)}
            >
              <FaSearch />
            </Button>
          </div>
        ) : (
          <div className="position-sticky m-2">
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="m-2"
            >
              <FaFilter />
            </Button>
          </div>
        )}

        {showSelectionControlsDelete &&
          !showSelectionControlsEdit &&
          !showSelectionControlsReport && (
            <div className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                label="Todos"
                checked={selectAll}
                onChange={handleSelectAll}
                className="me-2 checkbox-container"
              />
              <Button
                className="m-1"
                variant="danger"
                onClick={() => handleDeleteSelected(null)}
                disabled={selectedUsers.length === 0}
              >
                Apagar
              </Button>
            </div>
          )}

        {showSelectionControlsEdit &&
          !showSelectionControlsDelete &&
          !showSelectionControlsReport && (
            <div className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                label="Todos"
                checked={selectAll}
                onChange={handleSelectAll}
                className="me-2 checkbox-container"
              />
              <Button
                className="m-1"
                variant="secondary"
                onClick={() => setShowModalEdit(true)}
                disabled={selectedUsers.length === 0}
              >
                Editar
              </Button>
            </div>
          )}

        {showSelectionControlsReport &&
          !showSelectionControlsEdit &&
          !showSelectionControlsDelete && (
            <div className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                label="Todos"
                checked={selectAll}
                onChange={handleSelectAll}
                className="me-2 checkbox-container"
              />
              <Button
                className="m-1"
                variant="warning"
                onClick={handleReportSelected}
                disabled={selectedUsers.length === 0}
              >
                Gerar
              </Button>
            </div>
          )}
      </div>

      <div
        style={{
          flex: 1,
          width: "100%",
          overflow: "auto",
        }}
      >
        <AutoSizer>
          {({ height, width }) => {
            const columnCount = getColumnCount(width);
            const rowCount = Math.ceil(
              filteredFuncionarios.length / columnCount
            );
            const columnWidth = width / columnCount;
            const rowHeight = 220; // Altura base, ajuste conforme necessário

            // Função de renderização das células
            const renderCell = ({ columnIndex, rowIndex, style }) => {
              return (
                <UserCard
                  columnIndex={columnIndex}
                  rowIndex={rowIndex}
                  style={style}
                  columnCount={columnCount}
                />
              );
            };

            return filteredFuncionarios.length > 0 ? (
              <Grid
                height={height}
                width={width}
                columnCount={columnCount}
                columnWidth={columnWidth}
                rowCount={rowCount}
                rowHeight={rowHeight}
              >
                {renderCell}
              </Grid>
            ) : (
              <div
                style={{ width, height }}
                className="d-flex justify-content-center align-items-center"
              >
                <p>Nenhum funcionário encontrado</p>
              </div>
            );
          }}
        </AutoSizer>
      </div>

      <Modal show={showModalEdit} onHide={() => setShowModalEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuarios</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CoordEdit
            usuariosIds={selectedUsers}
            handleCloseModal={handleCloseModal}
            setShowSelectionControlsEdit={setShowSelectionControlsEdit}
            setActivateModified={setActivateModified}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={showModalSingleEdit}
        onHide={() => setShowModalSingleEdit(false)}
      >
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

      <ObservationHistoryModal
        show={showObservationModal}
        onHide={() => setShowObservationModal(false)}
        userId={currentUserId}
        initialObservations={observations[currentUserId] || []}
        onAddObservation={handleAddObservation}
      />
    </Container>
  );
}

export default FuncionairosList;
