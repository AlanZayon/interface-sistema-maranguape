import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Form,
  InputGroup,
  ButtonGroup,
  Table,
  Badge,
  Dropdown,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAuth } from '@features/auth';
import FilterModal, {
  countActiveFilters,
  createEmptyFilters,
} from "./FilterModal";
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

/**
 * Busca local na lista: todos os termos (espaço) precisam aparecer em algum campo.
 */
function matchesListSearch(user, term) {
  const q = String(term || "").trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const hay = [
    user?.nome,
    user?.funcao,
    user?.referencia,
    user?.natureza,
    user?.secretaria,
    user?.bairro,
    user?.cidade,
    user?.telefone,
    user?.tipo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return tokens.every((token) => {
    const t = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return hay.includes(t);
  });
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalSingleEdit, setShowModalSingleEdit] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [pendingDiscardEdit, setPendingDiscardEdit] = useState(false);
  const [pendingTransferConfirm, setPendingTransferConfirm] = useState(false);
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
  const [showSelectionControlsCsv, setShowSelectionControlsCsv] =
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
    if (selectedUsers.length === 0) {
      toast.warn("Selecione pelo menos um funcionário para exportar.");
      return;
    }

    try {
      setExportingCsv(true);
      const response = await funcionariosApi.exportCsv(selectedUsers);
      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `funcionarios_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        `${selectedUsers.length} funcionário(s) exportado(s) em CSV`
      );
      setShowSelectionControlsCsv(false);
      setSelectedUsers([]);
      setSelectAll(false);
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
  const handleCloseModalSingleEdit = (options = {}) => {
    const force = options === true || options?.force === true;
    if (editSubmitting && !force) return;
    if (editDirty && !force) {
      setPendingDiscardEdit(true);
      return;
    }
    setShowModalSingleEdit(false);
    setEditDirty(false);
    setEditSubmitting(false);
    setPendingDiscardEdit(false);
  };

  const confirmDiscardEdit = () => {
    setPendingDiscardEdit(false);
    setShowModalSingleEdit(false);
    setEditDirty(false);
    setEditSubmitting(false);
  };

  const handleRequestTransferFromEdit = () => {
    if (!funcionarioEncontrado?._id) return;
    if (editDirty) {
      setPendingTransferConfirm(true);
      return;
    }
    proceedTransferFromEdit();
  };

  const proceedTransferFromEdit = () => {
    if (!funcionarioEncontrado?._id) return;
    setPendingTransferConfirm(false);
    setSelectedUsers([funcionarioEncontrado._id]);
    setShowModalSingleEdit(false);
    setEditDirty(false);
    setShowSelectionControlsEdit(true);
    setShowModalEdit(true);
  };

  const handleApplyFilters = (filters) => {
    const normalizeInicio = (date) => {
      if (!date) return null;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    };
    const normalizeFim = (date) => {
      if (!date) return null;
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    };

    setActiveFilters({
      ...filters,
      inicioContrato: normalizeInicio(filters.inicioContrato),
      fimContrato: filters.contratoIndeterminado
        ? null
        : normalizeFim(filters.fimContrato),
    });
  };

  const handleClearAllFilters = () => {
    setActiveFilters(createEmptyFilters(todosSalariosBrutos));
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

      const isFimIndeterminado = (fim) =>
        String(fim || "").toUpperCase() === "INDETERMINADO";

      const inicioOk =
        !activeFilters.inicioContrato ||
        (funcionario.inicioContrato &&
          new Date(funcionario.inicioContrato) >=
            new Date(activeFilters.inicioContrato));

      let contratoFilter = true;

      if (activeFilters.contratoIndeterminado) {
        // "Somente" = exclusivo: apenas contratos com fim indeterminado
        contratoFilter =
          isFimIndeterminado(funcionario.fimContrato) && inicioOk;
      } else if (activeFilters.inicioContrato || activeFilters.fimContrato) {
        // Datas restringem só temporários; demais naturezas passam
        if (funcionario.natureza === "TEMPORARIO") {
          const fimOk =
            !activeFilters.fimContrato ||
            (funcionario.fimContrato &&
              !isFimIndeterminado(funcionario.fimContrato) &&
              new Date(funcionario.fimContrato) <=
                new Date(activeFilters.fimContrato));
          contratoFilter = inicioOk && fimOk;
        }
      }


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
      matchesListSearch(user, searchTerm)
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

  const confirmReportGeneration = () => {
    setShowReportTypeModal(false);

    if (selectedUsers.length === 0) {
      toast.warn("Selecione pelo menos um funcionário para gerar o relatório.");
      return;
    }

    navigate("/relatorios/preview", {
      state: {
        ids: selectedUsers,
        tipo: selectedReportType,
        returnTo: `${location.pathname}${location.search}`,
      },
    });
  };

  const toggleSelectionControlsDelete = () => {
    setShowSelectionControlsDelete(!showSelectionControlsDelete);
    setShowSelectionControlsReport(false);
    setShowSelectionControlsEdit(false);
    setShowSelectionControlsCsv(false);
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const toggleSelectionControlsEdit = () => {
    setShowSelectionControlsEdit(!showSelectionControlsEdit);
    setShowSelectionControlsReport(false);
    setShowSelectionControlsDelete(false);
    setShowSelectionControlsCsv(false);
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const toggleSelectionControlsReport = () => {
    setShowSelectionControlsReport(!showSelectionControlsReport);
    setShowSelectionControlsDelete(false);
    setShowSelectionControlsEdit(false);
    setShowSelectionControlsCsv(false);
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const toggleSelectionControlsCsv = () => {
    setShowSelectionControlsCsv(!showSelectionControlsCsv);
    setShowSelectionControlsDelete(false);
    setShowSelectionControlsEdit(false);
    setShowSelectionControlsReport(false);
    setSelectedUsers([]);
    setSelectAll(false);
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
    showSelectionControlsReport ||
    showSelectionControlsCsv;

  const getColumnCount = (width) => {
    if (width < 768) return 1;
    if (width < 992) return 2;
    return 3;
  };

  const activeFilterCount = countActiveFilters(
    activeFilters,
    todosSalariosBrutos
  );

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
  const searchActive = Boolean(String(searchTerm || "").trim());

  const listSearchField = (
    <div className="funcionarios-list-search">
      <InputGroup size="sm">
        <InputGroup.Text className="funcionarios-list-search__icon">
          <i className="bi bi-search" aria-hidden="true" />
        </InputGroup.Text>
        <Form.Control
          type="search"
          placeholder="Buscar por nome, função, referência, natureza…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar na lista de funcionários"
          autoComplete="off"
        />
        {searchActive ? (
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => setSearchTerm("")}
            aria-label="Limpar busca"
            title="Limpar busca"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </Button>
        ) : null}
      </InputGroup>
      {searchActive ? (
        <p className="funcionarios-list-search__hint mb-0">
          {filteredFuncionarios.length === 0
            ? "Nenhum resultado para esta busca"
            : `${filteredFuncionarios.length} resultado${
                filteredFuncionarios.length === 1 ? "" : "s"
              }`}
        </p>
      ) : null}
    </div>
  );

  const toolbar = (
    <div className="funcionarios-list__toolbar mb-3">
      {listSearchField}

      <div className="d-flex flex-wrap align-items-center gap-2">
      {role === "admin" ? (
        <>
          <Button
            variant={activeFilterCount > 0 ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setShowModal(true)}
            aria-label="Filtros"
            title="Filtros"
          >
            <i className="bi bi-funnel me-1" aria-hidden="true" />
            Filtros
            {activeFilterCount > 0 ? (
              <Badge bg="light" text="primary" pill className="ms-1">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
          {activeFilterCount > 0 ? (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleClearAllFilters}
              title="Limpar filtros"
              aria-label="Limpar filtros"
            >
              <i className="bi bi-x-circle me-1" aria-hidden="true" />
              Limpar
            </Button>
          ) : null}
          <Button
            variant={showSelectionControlsEdit ? "secondary" : "outline-secondary"}
            size="sm"
            onClick={toggleSelectionControlsEdit}
            className={
              showSelectionControlsDelete ||
              showSelectionControlsReport ||
              showSelectionControlsCsv
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
              showSelectionControlsEdit ||
              showSelectionControlsReport ||
              showSelectionControlsCsv
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
              showSelectionControlsDelete ||
              showSelectionControlsEdit ||
              showSelectionControlsCsv
                ? "d-none"
                : ""
            }
            aria-label="Selecionar para relatório"
            title="Relatório"
          >
            <i className="bi bi-file-earmark-text" aria-hidden="true" />
          </Button>
          <Button
            variant={showSelectionControlsCsv ? "success" : "outline-success"}
            size="sm"
            onClick={toggleSelectionControlsCsv}
            className={
              showSelectionControlsDelete ||
              showSelectionControlsEdit ||
              showSelectionControlsReport
                ? "d-none"
                : ""
            }
            title="Exportar CSV"
            aria-label="Selecionar para exportar CSV"
          >
            <i className="bi bi-filetype-csv" aria-hidden="true" />
          </Button>
        </>
      ) : (
        <Button
          variant={activeFilterCount > 0 ? "primary" : "outline-primary"}
          size="sm"
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-funnel me-1" aria-hidden="true" />
          Filtros
          {activeFilterCount > 0 ? (
            <Badge bg="light" text="primary" pill className="ms-1">
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>
      )}

      {role !== "admin" && activeFilterCount > 0 ? (
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleClearAllFilters}
          title="Limpar filtros"
        >
          <i className="bi bi-x-circle me-1" aria-hidden="true" />
          Limpar
        </Button>
      ) : null}

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
        !showSelectionControlsReport &&
        !showSelectionControlsCsv && (
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
        !showSelectionControlsReport &&
        !showSelectionControlsCsv && (
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
        !showSelectionControlsDelete &&
        !showSelectionControlsCsv && (
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

      {showSelectionControlsCsv &&
        !showSelectionControlsEdit &&
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
              variant="success"
              onClick={handleExportCsv}
              disabled={selectedUsers.length === 0 || exportingCsv}
            >
              {exportingCsv ? "Exportando…" : "Exportar CSV"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const tableView = (
    <div className="table-responsive border rounded bg-white">
      <Table hover className="mb-0 align-middle funcionarios-table">
        <thead className="table-light sticky-top">
          <tr>
            {(showSelectionControlsDelete ||
              showSelectionControlsEdit ||
              showSelectionControlsReport ||
              showSelectionControlsCsv) && <th style={{ width: 40 }} />}
            <th style={{ width: 56 }} />
            <th>Nome</th>
            <th>Função</th>
            <th>Secretaria</th>
            <th>Natureza</th>
            <th>Referência</th>
            <th className="text-end" style={{ width: 56 }}>
              <span className="visually-hidden">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFuncionarios.map((user) => (
            <tr key={user._id}>
              {(showSelectionControlsDelete ||
                showSelectionControlsEdit ||
                showSelectionControlsReport ||
                showSelectionControlsCsv) && (
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
              <td className="text-end">
                <Dropdown align="end" className="funcionarios-row-actions">
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    size="sm"
                    id={`acoes-${user._id}`}
                    className="funcionarios-row-actions__toggle"
                    aria-label={`Ações de ${user.nome}`}
                  >
                    <i className="bi bi-three-dots-vertical" aria-hidden="true" />
                  </Dropdown.Toggle>
                  {createPortal(
                    <Dropdown.Menu
                      className="shadow-sm funcionarios-row-actions__menu"
                      popperConfig={{ strategy: "fixed" }}
                      renderOnMount
                    >
                      <Dropdown.Item onClick={() => setDetailUser(user)}>
                        <i className="bi bi-info-circle me-2" aria-hidden="true" />
                        Ver detalhes
                      </Dropdown.Item>
                      {role === "admin" && (
                        <>
                          <Dropdown.Item onClick={() => handleClick(user._id)}>
                            <i className="bi bi-pencil me-2" aria-hidden="true" />
                            Editar
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            className="text-danger"
                            onClick={() => handleDeleteSelected(user._id)}
                          >
                            <i className="bi bi-trash me-2" aria-hidden="true" />
                            Excluir
                          </Dropdown.Item>
                        </>
                      )}
                    </Dropdown.Menu>,
                    document.body
                  )}
                </Dropdown>
              </td>
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
            subtitle={
              searchActive
                ? `${filteredFuncionarios.length} resultado${
                    filteredFuncionarios.length === 1 ? "" : "s"
                  } para “${searchTerm.trim()}”`
                : `${filteredFuncionarios.length} registro(s)`
            }
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
        onApply={handleApplyFilters}
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
          icon={searchActive ? "bi-search" : "bi-people"}
          title={
            searchActive
              ? "Nenhum resultado na busca"
              : "Nenhum funcionário encontrado"
          }
          description={
            searchActive
              ? `Não há coincidências para “${searchTerm.trim()}”. Tente outro termo ou limpe a busca.`
              : "Ajuste os filtros ou a busca, ou selecione outras divisões."
          }
          action={
            searchActive ? (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                Limpar busca
              </Button>
            ) : null
          }
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

      <ConfirmDialog
        show={pendingDiscardEdit}
        onHide={() => setPendingDiscardEdit(false)}
        onConfirm={confirmDiscardEdit}
        title="Descartar alterações"
        message="Há alterações não salvas. Deseja descartá-las?"
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        variant="warning"
        icon="bi-exclamation-circle"
      />

      <ConfirmDialog
        show={pendingTransferConfirm}
        onHide={() => setPendingTransferConfirm(false)}
        onConfirm={proceedTransferFromEdit}
        title="Transferir lotação"
        message="Há alterações não salvas na edição. Continuar para transferir lotação? As alterações do formulário serão descartadas."
        confirmLabel="Transferir"
        cancelLabel="Voltar"
        variant="warning"
        icon="bi-arrow-left-right"
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
        onHide={handleCloseModalSingleEdit}
        title="Editar funcionário"
        subtitle={
          funcionarioEncontrado?.nome
            ? funcionarioEncontrado.nome
            : "Atualize os dados cadastrais"
        }
        icon="bi-pencil-square"
        size="lg"
        scrollable
        preventClose={editSubmitting}
      >
        <UserEdit
          funcionario={funcionarioEncontrado}
          handleCloseModal={handleCloseModalSingleEdit}
          onSubmittingChange={setEditSubmitting}
          onDirtyChange={setEditDirty}
          onRequestTransferLotacao={handleRequestTransferFromEdit}
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
