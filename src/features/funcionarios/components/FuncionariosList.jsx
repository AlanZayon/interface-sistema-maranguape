import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Form,
  FormControl,
  InputGroup,
  Overlay,
  Popover,
  ButtonGroup,
  Table,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAuth } from '@features/auth';
import { FilterModal } from '@features/funcionarios';
import { RelatorioTypeModal } from '@features/funcionarios';
import { ObservationHistoryModal } from '@features/funcionarios';
import { CoordEdit } from '@features/funcionarios';
import { UserEdit } from '@features/funcionarios';
import UserCard from "./UserCard";
import FuncionarioDetailModal from "./FuncionarioDetailModal";
import * as funcionariosApi from '@shared/api/funcionarios';
import { useFuncionariosByCoordenadoria } from "../hooks/useFuncionarios";
import { toast } from "react-toastify";
import { set } from "lodash";
import {
  PageHeader,
  AppBreadcrumb,
  EmptyState,
  LoadingState,
  ConfirmDialog,
  AppModal,
} from "@shared/ui";

const VIEW_MODE_KEY = "funcionarios.viewMode";

function FuncionairosList({
  coordenadoriaId,
  setorPathId,
  departmentName,
  idsDivisoes,
  /** "node" = só lotação exata; "subtree" = não filtrar por lotação (lista já vem completa) */
  lotacaoScope = "node",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTermFromURL, setSearchTermFromURL] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalSingleEdit, setShowModalSingleEdit] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) || "card";
    } catch {
      return "card";
    }
  });
  const [pendingDeleteIds, setPendingDeleteIds] = useState(null);
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
    fimContrato: null,
    contratoIndeterminado: false

  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSelectionControlsDelete, setShowSelectionControlsDelete] =
    useState(false);
  const [showSelectionControlsReport, setShowSelectionControlsReport] =
    useState(false);
  const [showSelectionControlsEdit, setShowSelectionControlsEdit] =
    useState(false);
  const [detailUser, setDetailUser] = useState(null);
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
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('geral');
  const {
    role,
    funcionarios,
    setFuncionarios,
    funcionariosPath,
    setFuncionariosPath,
    activateModified,
    setActivateModified,
  } = useAuth();

  const useLocalCoordQuery =
    Boolean(coordenadoriaId) && !setorPathId && lotacaoScope !== "subtree";
  const { data: coordQueryData, isFetching: coordFetching } =
    useFuncionariosByCoordenadoria(coordenadoriaId, {
      enabled: useLocalCoordQuery,
    });

  useEffect(() => {
    if (!useLocalCoordQuery || !coordQueryData) return;
    const list = Array.isArray(coordQueryData)
      ? coordQueryData
      : coordQueryData.funcionarios || [];
    setFuncionarios((prev) => ({
      ...(typeof prev === "object" && !Array.isArray(prev) ? prev : {}),
      [coordenadoriaId]: list,
    }));
  }, [useLocalCoordQuery, coordQueryData, coordenadoriaId, setFuncionarios]);

  useEffect(() => {
    if (useLocalCoordQuery) setLoading(coordFetching);
  }, [useLocalCoordQuery, coordFetching]);
  const searchRef = useRef(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const response = await funcionariosApi.exportCsv();
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `funcionarios_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exportado");
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Falha ao exportar CSV");
    } finally {
      setExportingCsv(false);
    }
  };

  const fetchFuncionariosPorDivisoes = async (idsDivisoes) => {
    setLoading(true);
    let page = 1;
    const limit = 1000; // Mantenha alto para reduzir chamadas (ajuste conforme necessário)
    let totalPages = 1;
    let allFuncionarios = [];

    try {
      while (page <= totalPages) {
        const res = await funcionariosApi.buscarPorDivisoes({
          ids: idsDivisoes,
          page,
          limit,
        });

        allFuncionarios = [...allFuncionarios, ...(res.funcionarios || [])];
        totalPages = res.pages || 1;
        page++;
      }
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
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
        const res = await funcionariosApi.buscarFuncionarios({ page, limit });
        allFuncionarios = [...allFuncionarios, ...(res.funcionarios || [])];
        totalPages = res.pages || 1;
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

  const handleCloseModal = (result) => {
    setShowModalEdit(false);
    if (result?.transferred) {
      setSelectedUsers([]);
      setSelectAll(false);
      setShowSelectionControlsEdit(false);
    }
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

  const handleIndeterminadoChange = (isIndeterminado) => {
    setActiveFilters(prev => ({
      ...prev,
      contratoIndeterminado: isIndeterminado,
      ...(isIndeterminado && {
        fimContrato: null
      })
    }));
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
      contratoIndeterminado: false,

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
        (
          !activeFilters.fimContrato ||
          (
            funcionario.fimContrato &&
            funcionario.fimContrato.toUpperCase() !== "INDETERMINADO" &&
            new Date(funcionario.fimContrato) <= new Date(activeFilters.fimContrato)
          )
        )
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
        (lotacaoScope === "subtree" ||
          !coordenadoriaId ||
          String(funcionario.setorId || funcionario.coordenadoria) ===
            String(coordenadoriaId)) &&
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
      if (!idsDivisoes?.length && setorPathId === "selected") {
        setFuncionariosPath([]);
        setFilteredFuncionarios([]);
        return;
      }
      const fetchData = async () => {
        try {
          const data = await fetchFuncionariosPorDivisoes(idsDivisoes);
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
  }, [setorPathId, idsDivisoes, activateModified]);

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
    let baseFuncionarios = [];

    if (setorPathId === "selected") {
      baseFuncionarios = Array.isArray(funcionariosPath)
        ? funcionariosPath
        : funcionariosPath?.funcionarios || [];
    } else if (setorPathId && funcionariosPath?.funcionarios) {
      baseFuncionarios = funcionariosPath.funcionarios;
    } else if (Array.isArray(funcionariosPath)) {
      baseFuncionarios = funcionariosPath;
    } else if (Array.isArray(funcionarios[coordenadoriaId])) {
      baseFuncionarios = funcionarios[coordenadoriaId];
    }

    const filtered = baseFuncionarios.filter((user) =>
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredFuncionarios(applyFilters(filtered));
  }, [setorPathId, funcionariosPath, funcionarios, activeFilters, searchTerm, coordenadoriaId]);



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
    const idsToDelete = userId ? [userId] : selectedUsers;

    if (idsToDelete.length === 0) {
      toast.warn("Nenhum usuário selecionado para deletar.");
      return;
    }

    setPendingDeleteIds(idsToDelete);
  };

  const confirmDeleteSelected = async () => {
    const idsToDelete = pendingDeleteIds || [];
    if (idsToDelete.length === 0) {
      setPendingDeleteIds(null);
      return;
    }

    setLoading(true);
    try {
      await funcionariosApi.deleteUsers(idsToDelete);

      {
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
        setShowSelectionControlsDelete(false);
        toast.success("Usuários removidos com sucesso");
      }
    } catch (error) {
      console.error("Erro ao deletar usuários:", error);
      toast.error("Erro ao remover usuários. Tente novamente.");
    } finally {
      setLoading(false);
      setPendingDeleteIds(null);
    }
  };

  const handleReportSelected = async () => {
    // Mostra o modal para seleção do tipo de relatório
    setShowReportTypeModal(true);
  };

  const confirmReportGeneration = async () => {
    setShowReportTypeModal(false);

    if (selectedUsers.length === 0) {
      toast.warn("Selecione pelo menos um funcionário para gerar o relatório.");
      return;
    }

    try {
      const response = await funcionariosApi.gerarRelatorio({
        ids: selectedUsers,
        tipo: selectedReportType,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_${selectedReportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Erro ao gerar o relatório:", error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
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

  const selectionActive =
    showSelectionControlsDelete ||
    showSelectionControlsEdit ||
    showSelectionControlsReport;

  const getColumnCount = (width) => {
    if (width < 768) return 1;
    if (width < 992) return 2;
    return 3;
  };

  if (loading && !pendingDeleteIds) {
    return <LoadingState label="Carregando funcionários..." minHeight="16rem" />;
  }

  const listTitle =
    departmentName === "mainscreen"
      ? "Todos os funcionários"
      : !departmentName
        ? decodeURIComponent(searchTermFromURL || "")
        : departmentName;

  const showPageChrome = Boolean(setorPathId);

  const toolbar = (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      {role === "admin" ? (
        <>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowModal(true)}
            aria-label="Filtros"
            title="Filtros"
          >
            <i className="bi bi-funnel me-1" aria-hidden="true" />
            Filtros
          </Button>
          <Button
            variant={showSelectionControlsEdit ? "secondary" : "outline-secondary"}
            size="sm"
            onClick={toggleSelectionControlsEdit}
            className={
              showSelectionControlsDelete || showSelectionControlsReport
                ? "d-none"
                : ""
            }
            aria-label="Selecionar para editar"
            title="Editar em lote"
          >
            <i className="bi bi-arrow-left-right" aria-hidden="true" />
          </Button>
          <Button
            variant={showSelectionControlsDelete ? "danger" : "outline-danger"}
            size="sm"
            onClick={toggleSelectionControlsDelete}
            className={
              showSelectionControlsEdit || showSelectionControlsReport
                ? "d-none"
                : ""
            }
            aria-label="Selecionar para excluir"
            title="Excluir em lote"
          >
            <i className="bi bi-trash" aria-hidden="true" />
          </Button>
          <Button
            onClick={toggleSelectionControlsReport}
            variant={
              showSelectionControlsReport ? "warning" : "outline-warning"
            }
            size="sm"
            className={
              showSelectionControlsDelete || showSelectionControlsEdit
                ? "d-none"
                : ""
            }
            aria-label="Selecionar para relatório"
            title="Relatório"
          >
            <i className="bi bi-file-earmark-text" aria-hidden="true" />
          </Button>
          <Button
            variant="outline-success"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportingCsv}
            title="Exportar CSV"
            aria-label="Exportar CSV"
          >
            <i className="bi bi-filetype-csv" aria-hidden="true" />
          </Button>
          <Overlay target={searchRef.current} show={showSearch} placement="bottom">
            {(props) => (
              <Popover {...props}>
                <Popover.Body>
                  <InputGroup size="sm">
                    <FormControl
                      type="text"
                      placeholder="Nome do servidor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Filtrar por nome"
                    />
                  </InputGroup>
                </Popover.Body>
              </Popover>
            )}
          </Overlay>
          <Button
            ref={searchRef}
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Buscar na lista"
            title="Buscar na lista"
          >
            <i className="bi bi-search" aria-hidden="true" />
          </Button>
        </>
      ) : (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-funnel me-1" aria-hidden="true" />
          Filtros
        </Button>
      )}

      <ButtonGroup size="sm" className="ms-auto" aria-label="Modo de visualização">
        <Button
          variant={viewMode === "card" ? "primary" : "outline-primary"}
          onClick={() => changeViewMode("card")}
          aria-pressed={viewMode === "card"}
          title="Visualização em cards"
        >
          <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
          <span className="visually-hidden">Cards</span>
        </Button>
        <Button
          variant={viewMode === "table" ? "primary" : "outline-primary"}
          onClick={() => changeViewMode("table")}
          aria-pressed={viewMode === "table"}
          title="Visualização em tabela"
        >
          <i className="bi bi-table" aria-hidden="true" />
          <span className="visually-hidden">Tabela</span>
        </Button>
      </ButtonGroup>

      {showSelectionControlsDelete &&
        !showSelectionControlsEdit &&
        !showSelectionControlsReport && (
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="checkbox"
              label="Todos"
              checked={selectAll}
              onChange={handleSelectAll}
              className="checkbox-container"
            />
            <Button
              size="sm"
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
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="checkbox"
              label="Todos"
              checked={selectAll}
              onChange={handleSelectAll}
              className="checkbox-container"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowModalEdit(true)}
              disabled={selectedUsers.length === 0}
            >
              Transferir lotação
            </Button>
          </div>
        )}

      {showSelectionControlsReport &&
        !showSelectionControlsEdit &&
        !showSelectionControlsDelete && (
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="checkbox"
              label="Todos"
              checked={selectAll}
              onChange={handleSelectAll}
              className="checkbox-container"
            />
            <Button
              size="sm"
              variant="warning"
              onClick={handleReportSelected}
              disabled={selectedUsers.length === 0}
            >
              Gerar
            </Button>
          </div>
        )}
    </div>
  );

  const tableView = (
    <div className="table-responsive border rounded bg-white">
      <Table hover className="mb-0 align-middle funcionarios-table">
        <thead className="table-light sticky-top">
          <tr>
            {(showSelectionControlsDelete ||
              showSelectionControlsEdit ||
              showSelectionControlsReport) && <th style={{ width: 40 }} />}
            <th style={{ width: 56 }} />
            <th>Nome</th>
            <th>Função</th>
            <th>Secretaria</th>
            <th>Natureza</th>
            <th>Referência</th>
            {role === "admin" && <th className="text-end">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {filteredFuncionarios.map((user) => (
            <tr key={user._id}>
              {(showSelectionControlsDelete ||
                showSelectionControlsEdit ||
                showSelectionControlsReport) && (
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                    aria-label={`Selecionar ${user.nome}`}
                  />
                </td>
              )}
              <td>
                <img
                  src={
                    user.fotoUrl ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                  }
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-circle object-fit-cover"
                />
              </td>
              <td className="fw-semibold">{user.nome}</td>
              <td>{user.funcao || "—"}</td>
              <td>{user.secretaria || "—"}</td>
              <td>
                {user.natureza ? (
                  <Badge bg="secondary">{user.natureza}</Badge>
                ) : (
                  "—"
                )}
              </td>
              <td>{user.referencia || "—"}</td>
              {role === "admin" && (
                <td className="text-end text-nowrap">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="me-1"
                    onClick={() => handleClick(user._id)}
                    aria-label={`Editar ${user.nome}`}
                  >
                    <i className="bi bi-pencil" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteSelected(user._id)}
                    aria-label={`Excluir ${user.nome}`}
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const cardView = (
    <div className="funcionarios-grid-wrap">
      <AutoSizer>
        {({ height, width }) => {
          const columnCount = getColumnCount(width);
          const rowCount = Math.ceil(filteredFuncionarios.length / columnCount);
          const columnWidth = width / columnCount;
          const rowHeight = 200;

          const renderCell = ({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * columnCount + columnIndex;
            if (index >= filteredFuncionarios.length) return null;
            const user = filteredFuncionarios[index];

            return (
              <UserCard
                key={user._id}
                user={user}
                style={style}
                role={role}
                selectionActive={selectionActive}
                selected={selectedUsers.includes(user._id)}
                onSelect={handleUserSelect}
                onDetails={setDetailUser}
                onEdit={handleClick}
                onDelete={handleDeleteSelected}
              />
            );
          };

          return (
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
          );
        }}
      </AutoSizer>
    </div>
  );

  return (
    <div className="funcionarios-list">
      {showPageChrome && (
        <>
          <AppBreadcrumb
            items={[
              { label: "Estrutura", to: "/estrutura" },
              { label: listTitle || "Funcionários", active: true },
            ]}
          />
          <PageHeader
            title={listTitle || "Funcionários"}
            subtitle={`${filteredFuncionarios.length} registro(s)`}
          />
        </>
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
        handleIndeterminadoChange={handleIndeterminadoChange}
      />

      <RelatorioTypeModal
        show={showReportTypeModal}
        onHide={() => setShowReportTypeModal(false)}
        onConfirm={confirmReportGeneration}
        selectedType={selectedReportType}
        setSelectedType={setSelectedReportType}
      />

      {toolbar}

      {filteredFuncionarios.length === 0 ? (
        <EmptyState
          icon="bi-people"
          title="Nenhum funcionário encontrado"
          description="Ajuste os filtros ou a busca, ou selecione outras divisões."
        />
      ) : viewMode === "table" ? (
        tableView
      ) : (
        cardView
      )}

      <ConfirmDialog
        show={Boolean(pendingDeleteIds)}
        onHide={() => setPendingDeleteIds(null)}
        onConfirm={confirmDeleteSelected}
        title="Excluir funcionários"
        message={`Tem certeza que deseja remover ${
          pendingDeleteIds?.length || 0
        } funcionário(s)? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={loading}
      />

      <CoordEdit
        show={showModalEdit}
        onHide={handleCloseModal}
        usuariosIds={selectedUsers}
        pessoas={filteredFuncionarios.filter((u) =>
          selectedUsers.some((id) => String(id) === String(u._id))
        )}
        setShowSelectionControlsEdit={setShowSelectionControlsEdit}
        setActivateModified={setActivateModified}
      />

      <AppModal
        show={showModalSingleEdit}
        onHide={() => setShowModalSingleEdit(false)}
        title="Editar funcionário"
        subtitle="Atualize os dados cadastrais"
        icon="bi-pencil-square"
        size="lg"
        scrollable
      >
          <UserEdit
            funcionario={funcionarioEncontrado}
            handleCloseModal={handleCloseModalSingleEdit}
          />
      </AppModal>

      <FuncionarioDetailModal
        show={Boolean(detailUser)}
        onHide={() => setDetailUser(null)}
        user={detailUser}
        onViewObservations={handleViewObservations}
      />

      <ObservationHistoryModal
        show={showObservationModal}
        onHide={() => setShowObservationModal(false)}
        userId={currentUserId}
        initialObservations={observations[currentUserId] || []}
        onAddObservation={handleAddObservation}
      />
    </div>
  );
}

export default FuncionairosList;
