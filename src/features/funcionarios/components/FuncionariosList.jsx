import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Form,
  InputGroup,
  ButtonGroup,
  Table,
  Badge,
  Dropdown,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { FixedSizeGrid as Grid, FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAuth, isElevatedRole } from "@features/auth";
import FilterModal, {
  countActiveFilters,
  createEmptyFilters,
} from "./FilterModal";
import { RelatorioTypeModal } from "@features/funcionarios";
import { ObservationHistoryModal } from "@features/funcionarios";
import { CoordEdit } from "@features/funcionarios";
import { UserEdit } from "@features/funcionarios";
import UserCard from "./UserCard";
import FuncionarioDetailModal from "./FuncionarioDetailModal";
import * as funcionariosApi from "@shared/api/funcionarios";
import {
  flattenPages,
  useInfiniteFuncionarios,
  useInfiniteFuncionariosBySetores,
  useInfiniteFuncionariosBySetorId,
  useInfiniteFuncionariosBySetorSubtree,
  useFuncionariosFiltros,
  useInvalidateFuncionarios,
} from "../hooks/useFuncionarios";
import { toast } from "react-toastify";
import {
  PageHeader,
  AppBreadcrumb,
  EmptyState,
  LoadingState,
  ConfirmDialog,
  AppModal,
} from "@shared/ui";

const VIEW_MODE_KEY = "funcionarios.viewMode";
const PLACEHOLDER_PHOTO =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
const TABLE_ROW_HEIGHT = 52;
const TABLE_VIEW_MAX_HEIGHT = 560;

function validateBounds(value, fallback) {
  return isFinite(value) ? value : fallback;
}

function sortFuncionariosAlphabetically(funcionarios) {
  return [...funcionarios].sort((a, b) => {
    const nomeA = (a.nome || "").toUpperCase();
    const nomeB = (b.nome || "").toUpperCase();
    if (nomeA < nomeB) return -1;
    if (nomeA > nomeB) return 1;
    return 0;
  });
}

/**
 * Client-side filters: salary / date / contrato.
 * Natureza / função / bairro / referência are sent to the server (first item);
 * extras beyond the first are re-applied here among loaded pages.
 */
function applyFilters(funcionarios, activeFilters) {
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
      contratoFilter =
        isFimIndeterminado(funcionario.fimContrato) && inicioOk;
    } else if (activeFilters.inicioContrato || activeFilters.fimContrato) {
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
      contratoFilter
    );
  });

  return sortFuncionariosAlphabetically(filtered);
}

function safeDecode(value) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return String(value);
  }
}

function FuncionairosList({
  coordenadoriaId,
  setorPathId,
  departmentName,
  idsDivisoes,
  /** "node" = só lotação exata; "subtree" = nó + descendentes */
  lotacaoScope = "node",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const invalidateFuncionarios = useInvalidateFuncionarios();

  const [searchTermFromURL, setSearchTermFromURL] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
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
  const [deleting, setDeleting] = useState(false);
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
    contratoIndeterminado: false,
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectingAllResult, setSelectingAllResult] = useState(false);
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
  const [funcionarioEncontrado, setFuncionarioEncontrado] = useState(null);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("geral");
  const [exportingCsv, setExportingCsv] = useState(false);

  const modeMainscreen = setorPathId === "mainscreen";
  const modeSelected = setorPathId === "selected";
  const modeSearch = setorPathId === "search";
  const modeNode =
    Boolean(coordenadoriaId) &&
    lotacaoScope === "node" &&
    !modeMainscreen &&
    !modeSelected &&
    !modeSearch;
  const modeSubtree =
    Boolean(coordenadoriaId) &&
    lotacaoScope === "subtree" &&
    !modeMainscreen &&
    !modeSelected &&
    !modeSearch;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(String(searchTerm || "").trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (location.pathname.startsWith("/search/")) {
      const term = location.pathname.split("/search/")[1] || "";
      setSearchTermFromURL(term);
      setSearchTerm(safeDecode(term));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (modeSearch && departmentName) {
      setSearchTerm(safeDecode(departmentName));
    }
  }, [modeSearch, departmentName]);

  const searchQ = useMemo(() => {
    if (modeSearch) {
      return (
        debouncedQ ||
        safeDecode(departmentName) ||
        safeDecode(searchTermFromURL)
      );
    }
    return debouncedQ;
  }, [modeSearch, debouncedQ, departmentName, searchTermFromURL]);

  const serverFilters = useMemo(
    () => ({
      q: searchQ,
      natureza: activeFilters.natureza[0] || "",
      funcao: activeFilters.funcao[0] || "",
      bairro: activeFilters.bairro[0] || "",
      referencia: activeFilters.referencia[0] || "",
    }),
    [searchQ, activeFilters.natureza, activeFilters.funcao, activeFilters.bairro, activeFilters.referencia]
  );

  const qAll = useInfiniteFuncionarios(serverFilters, {
    enabled: modeMainscreen || modeSearch,
  });
  const qSetores = useInfiniteFuncionariosBySetores(idsDivisoes, serverFilters, {
    enabled: modeSelected && Boolean(idsDivisoes?.length),
  });
  const qNode = useInfiniteFuncionariosBySetorId(
    coordenadoriaId,
    serverFilters,
    { enabled: modeNode }
  );
  const qSubtree = useInfiniteFuncionariosBySetorSubtree(
    coordenadoriaId,
    serverFilters,
    { enabled: modeSubtree }
  );

  const activeQuery = modeMainscreen || modeSearch
    ? qAll
    : modeSelected
      ? qSetores
      : modeNode
        ? qNode
        : modeSubtree
          ? qSubtree
          : null;

  const loadedFuncionarios = useMemo(
    () => flattenPages(activeQuery?.data),
    [activeQuery?.data]
  );

  const total =
    activeQuery?.data?.pages?.[0]?.total ?? loadedFuncionarios.length;

  const isInitialLoading = Boolean(
    activeQuery &&
      (activeQuery.isLoading || (activeQuery.isFetching && !activeQuery.data))
  );
  const hasNextPage = Boolean(activeQuery?.hasNextPage);
  const isFetchingNextPage = Boolean(activeQuery?.isFetchingNextPage);
  const fetchNextPage = activeQuery?.fetchNextPage;

  const { data: filtrosData } = useFuncionariosFiltros();
  const naturezas = filtrosData?.naturezas || [];
  const todasFuncoes = filtrosData?.funcoes || [];
  const todosBairros = filtrosData?.bairros || [];
  const todasReferencias = filtrosData?.referencias || [];

  const todosSalariosBrutos = useMemo(() => {
    const values = loadedFuncionarios
      .map((f) => f.salarioBruto)
      .filter((v) => v != null && isFinite(v));
    return [...new Set(values)];
  }, [loadedFuncionarios]);

  const filteredFuncionarios = useMemo(
    () => applyFilters(loadedFuncionarios, activeFilters),
    [loadedFuncionarios, activeFilters]
  );

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

  const handleCloseModal = (result) => {
    setShowModalEdit(false);
    if (result?.transferred) {
      setSelectedUsers([]);
      setSelectAll(false);
      setShowSelectionControlsEdit(false);
      invalidateFuncionarios();
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

  const buscarFuncionario = (userId) =>
    filteredFuncionarios.find((func) => func._id === userId) ||
    loadedFuncionarios.find((func) => func._id === userId) ||
    null;

  const handleClick = (id) => {
    const funcionario = buscarFuncionario(id);
    setFuncionarioEncontrado(funcionario);
    setShowModalSingleEdit(true);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedUsers(
      !selectAll ? filteredFuncionarios.map((user) => user._id) : []
    );
  };

  const handleSelectAllResult = async () => {
    try {
      setSelectingAllResult(true);
      const body = { ...serverFilters };
      if (modeSelected) {
        body.ids = idsDivisoes || [];
      } else if (modeNode) {
        body.setorIds = [coordenadoriaId];
      } else if (modeSubtree) {
        body.subtreeRoot = coordenadoriaId;
      }
      const res = await funcionariosApi.buscarIds(body);
      const ids = res?.ids || [];
      setSelectedUsers(ids);
      setSelectAll(ids.length > 0);
      toast.success(`${ids.length} funcionário(s) selecionado(s)`);
    } catch (error) {
      console.error("Erro ao selecionar todos do resultado:", error);
      toast.error("Não foi possível selecionar todos do resultado.");
    } finally {
      setSelectingAllResult(false);
    }
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

    setDeleting(true);
    try {
      await funcionariosApi.deleteUsers(idsToDelete);
      setSelectedUsers([]);
      setSelectAll(false);
      setShowSelectionControlsDelete(false);
      invalidateFuncionarios();
      toast.success("Usuários removidos com sucesso");
    } catch (error) {
      console.error("Erro ao deletar usuários:", error);
      toast.error("Erro ao remover usuários. Tente novamente.");
    } finally {
      setDeleting(false);
      setPendingDeleteIds(null);
    }
  };

  const handleReportSelected = async () => {
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
    const user = buscarFuncionario(userId);
    if (user?.observacoes) {
      setObservations((prev) => ({
        ...prev,
        [userId]: prev[userId] || user.observacoes || [],
      }));
    }
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

  const tableItemData = useMemo(
    () => ({
      users: filteredFuncionarios,
      selectedUsers,
      selectionActive,
      role,
      onSelect: handleUserSelect,
      onDetails: setDetailUser,
      onEdit: handleClick,
      onDelete: handleDeleteSelected,
    }),
    [
      filteredFuncionarios,
      selectedUsers,
      selectionActive,
      role,
    ]
  );

  const renderTableRow = useCallback(({ index, style, data }) => {
    const user = data.users[index];
    if (!user) return null;

    return (
      <div
        style={style}
        className="funcionarios-table-virtual-row d-flex align-items-center border-bottom px-2 bg-white"
      >
        {data.selectionActive ? (
          <div style={{ width: 40, flexShrink: 0 }}>
            <Form.Check
              type="checkbox"
              checked={data.selectedUsers.includes(user._id)}
              onChange={() => data.onSelect(user._id)}
              aria-label={`Selecionar ${user.nome}`}
            />
          </div>
        ) : null}
        <div style={{ width: 56, flexShrink: 0 }}>
          <img
            src={PLACEHOLDER_PHOTO}
            alt=""
            width={36}
            height={36}
            className="rounded-circle object-fit-cover"
          />
        </div>
        <div className="fw-semibold flex-grow-1 text-truncate pe-2" title={user.nome}>
          {user.nome}
        </div>
        <div className="text-truncate pe-2" style={{ width: "14%" }}>
          {user.funcao || "—"}
        </div>
        <div className="text-truncate pe-2" style={{ width: "16%" }}>
          {user.secretaria || "—"}
        </div>
        <div style={{ width: "12%" }}>
          {user.natureza ? (
            <Badge bg="secondary">{user.natureza}</Badge>
          ) : (
            "—"
          )}
        </div>
        <div className="text-truncate pe-2" style={{ width: "12%" }}>
          {user.referencia || "—"}
        </div>
        <div className="text-end" style={{ width: 56, flexShrink: 0 }}>
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
            <Dropdown.Menu
              className="shadow-sm funcionarios-row-actions__menu"
              popperConfig={{ strategy: "fixed" }}
            >
              <Dropdown.Item onClick={() => data.onDetails(user)}>
                <i className="bi bi-info-circle me-2" aria-hidden="true" />
                Ver detalhes
              </Dropdown.Item>
              {isElevatedRole(data.role) && (
                <>
                  <Dropdown.Item onClick={() => data.onEdit(user._id)}>
                    <i className="bi bi-pencil me-2" aria-hidden="true" />
                    Editar
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    className="text-danger"
                    onClick={() => data.onDelete(user._id)}
                  >
                    <i className="bi bi-trash me-2" aria-hidden="true" />
                    Excluir
                  </Dropdown.Item>
                </>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    );
  }, []);

  if (isInitialLoading && !pendingDeleteIds) {
    return (
      <LoadingState label="Carregando funcionários..." minHeight="16rem" />
    );
  }

  const listTitle =
    departmentName === "mainscreen"
      ? "Todos os funcionários"
      : !departmentName
        ? safeDecode(searchTermFromURL)
        : departmentName;

  const showPageChrome = Boolean(setorPathId);
  const searchActive = Boolean(String(searchTerm || "").trim());

  const selectionControls = (actionButton) => (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <Form.Check
        type="checkbox"
        label="Todos (carregados)"
        checked={selectAll}
        onChange={handleSelectAll}
        className="checkbox-container"
      />
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={handleSelectAllResult}
        disabled={selectingAllResult}
        title="Selecionar todos os IDs do resultado no servidor"
      >
        {selectingAllResult ? "Selecionando…" : "Selecionar todos do resultado"}
      </Button>
      {actionButton}
    </div>
  );

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
          {total === 0
            ? "Nenhum resultado para esta busca"
            : `${total} resultado${total === 1 ? "" : "s"}`}
        </p>
      ) : null}
    </div>
  );

  const toolbar = (
    <div className="funcionarios-list__toolbar mb-3">
      {listSearchField}

      <div className="d-flex flex-wrap align-items-center gap-2">
        {isElevatedRole(role) ? (
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
              variant={
                showSelectionControlsEdit ? "secondary" : "outline-secondary"
              }
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
              variant={
                showSelectionControlsDelete ? "danger" : "outline-danger"
              }
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
              variant={
                showSelectionControlsCsv ? "success" : "outline-success"
              }
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

        <ButtonGroup
          size="sm"
          className="ms-auto"
          aria-label="Modo de visualização"
        >
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
          !showSelectionControlsCsv &&
          selectionControls(
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteSelected(null)}
              disabled={selectedUsers.length === 0}
            >
              Apagar
            </Button>
          )}

        {showSelectionControlsEdit &&
          !showSelectionControlsDelete &&
          !showSelectionControlsReport &&
          !showSelectionControlsCsv &&
          selectionControls(
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowModalEdit(true)}
              disabled={selectedUsers.length === 0}
            >
              Transferir lotação
            </Button>
          )}

        {showSelectionControlsReport &&
          !showSelectionControlsEdit &&
          !showSelectionControlsDelete &&
          !showSelectionControlsCsv &&
          selectionControls(
            <Button
              size="sm"
              variant="warning"
              onClick={handleReportSelected}
              disabled={selectedUsers.length === 0}
            >
              Gerar
            </Button>
          )}

        {showSelectionControlsCsv &&
          !showSelectionControlsEdit &&
          !showSelectionControlsDelete &&
          !showSelectionControlsReport &&
          selectionControls(
            <Button
              size="sm"
              variant="success"
              onClick={handleExportCsv}
              disabled={selectedUsers.length === 0 || exportingCsv}
            >
              {exportingCsv ? "Exportando…" : "Exportar CSV"}
            </Button>
          )}
      </div>
    </div>
  );

  const tableView = (
    <div className="funcionarios-table-virtual border rounded bg-white">
      <Table
        hover
        className="mb-0 align-middle funcionarios-table"
        style={{ tableLayout: "fixed" }}
      >
        <thead className="table-light sticky-top">
          <tr>
            {selectionActive && <th style={{ width: 40 }} />}
            <th style={{ width: 56 }} />
            <th>Nome</th>
            <th style={{ width: "14%" }}>Função</th>
            <th style={{ width: "16%" }}>Secretaria</th>
            <th style={{ width: "12%" }}>Natureza</th>
            <th style={{ width: "12%" }}>Referência</th>
            <th className="text-end" style={{ width: 56 }}>
              <span className="visually-hidden">Ações</span>
            </th>
          </tr>
        </thead>
      </Table>
      <div
        style={{
          height: Math.min(
            Math.max(filteredFuncionarios.length, 1) * TABLE_ROW_HEIGHT,
            TABLE_VIEW_MAX_HEIGHT
          ),
        }}
      >
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={filteredFuncionarios.length}
              itemSize={TABLE_ROW_HEIGHT}
              itemData={tableItemData}
            >
              {renderTableRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );

  const cardView = (
    <div className="funcionarios-grid-wrap">
      <AutoSizer>
        {({ height, width }) => {
          const columnCount = getColumnCount(width);
          const rowCount = Math.ceil(
            filteredFuncionarios.length / columnCount
          );
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

  const loadMoreButton =
    hasNextPage && filteredFuncionarios.length > 0 ? (
      <div className="d-flex justify-content-center mt-3 mb-2">
        <Button
          variant="outline-primary"
          onClick={() => fetchNextPage?.()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      </div>
    ) : null;

  return (
    <div className="funcionarios-list">
      {showPageChrome && (
        <>
          <AppBreadcrumb
            items={[
              { label: "Organização", to: "/estrutura" },
              { label: listTitle || "Funcionários", active: true },
            ]}
          />
          <PageHeader
            title={listTitle || "Funcionários"}
            subtitle={
              searchActive
                ? `${total} resultado${total === 1 ? "" : "s"} para “${searchTerm.trim()}”`
                : `${total} registro(s)`
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

      {loadMoreButton}

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
        loading={deleting}
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
        setActivateModified={() => invalidateFuncionarios()}
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
