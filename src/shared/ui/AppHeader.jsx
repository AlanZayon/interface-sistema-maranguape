import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Form,
  InputGroup,
  Dropdown,
  Badge,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";
import * as authApi from "@shared/api/auth";
import * as searchApi from "@shared/api/search";

/**
 * @param {{
 *   onToggleSidebar?: () => void,
 * }} props
 */
export default function AppHeader({ onToggleSidebar }) {
  const { logout, username, setFuncionariosPath, role } = useAuth();
  const { isPlatform } = useTenant();
  const isPlatformConsole = isPlatform && role === "superadmin";
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const timeoutRef = useRef(null);
  const searchRef = useRef(null);
  const userInitial = (username || "U").charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowMobileSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isPlatformConsole || !searchQuery) {
      setAutocompleteResults([]);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setSearchLoading(true);
    timeoutRef.current = setTimeout(() => {
      searchApi
        .autocomplete(searchQuery)
        .then((data) => {
          const results = Array.isArray(data)
            ? data.map((item) =>
                typeof item === "string" ? { nome: item, tipo: "" } : item
              )
            : [];
          setAutocompleteResults(results);
          setShowSuggestions(true);
        })
        .catch(() => setAutocompleteResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery, isPlatformConsole]);

  const runSearch = (term) => {
    if (!term.trim()) return;
    setSearchLoading(true);
    searchApi
      .searchFuncionarios(term)
      .then((data) => {
        const results = data.funcionarios || data;
        const setoresInfo = data.setoresEncontrados || [];
        const setoresFormatados = setoresInfo.map((setor) => ({
          ...setor,
          tipo: setor.tipo === "Coordenadoria" ? "Divisão" : setor.tipo,
        }));
        setFuncionariosPath({
          funcionarios: results,
          setoresEncontrados: setoresFormatados,
        });
        navigate(`/search/${encodeURIComponent(term)}`);
        setShowSuggestions(false);
        setShowMobileSearch(false);
      })
      .catch(() => toast.error("Erro na busca"))
      .finally(() => setSearchLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  const handleSuggestionSelect = (item) => {
    const term = typeof item === "string" ? item : item.nome;
    setSearchQuery(term);
    runSearch(term);
  };

  const logoutUser = async () => {
    try {
      await authApi.logout();
    } catch {
      toast.error("Sessão encerrada localmente");
    } finally {
      logout();
      navigate("/");
    }
  };

  const suggestionsList = showSuggestions && autocompleteResults.length > 0 && (
    <ListGroup
      className="position-absolute w-100 mt-1 shadow-sm"
      style={{ zIndex: 1050, maxHeight: 280, overflowY: "auto" }}
    >
      {autocompleteResults.map((item, idx) => {
        const term = typeof item === "string" ? item : item.nome;
        const type = typeof item === "string" ? "" : item.tipo;
        const displayType = type === "Coordenadoria" ? "Divisão" : type;
        return (
          <ListGroup.Item
            key={`${term}-${idx}`}
            action
            onClick={() => handleSuggestionSelect(item)}
            className="d-flex justify-content-between align-items-center py-2"
          >
            <span>
              {term}
              {displayType ? (
                <Badge bg="secondary" className="ms-2">
                  {displayType}
                </Badge>
              ) : null}
            </span>
            <i className="bi bi-chevron-right text-muted small" aria-hidden="true" />
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );

  return (
    <header className="app-shell__header d-flex align-items-center px-3">
      <Button
        variant="link"
        className="text-light p-1 me-2 d-md-none"
        onClick={onToggleSidebar}
        aria-label="Abrir menu"
      >
        <i className="bi bi-list fs-4" aria-hidden="true" />
      </Button>

      <Button
        variant="link"
        className="text-light p-1 me-2 d-none d-md-inline-flex"
        onClick={onToggleSidebar}
        aria-label="Recolher menu"
        title="Recolher menu"
      >
        <i className="bi bi-layout-sidebar-inset" aria-hidden="true" />
      </Button>

      {!isPlatformConsole && (
        <div
          className="flex-grow-1 position-relative d-none d-md-block"
          style={{ maxWidth: 480 }}
          ref={searchRef}
        >
          <Form onSubmit={handleSearch}>
            <InputGroup size="sm">
              <Form.Control
                type="search"
                placeholder="Pesquisar funcionários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                aria-label="Pesquisar funcionários"
              />
              <Button variant="light" type="submit" disabled={searchLoading} aria-label="Buscar">
                {searchLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-search" aria-hidden="true" />
                )}
              </Button>
            </InputGroup>
          </Form>
          {suggestionsList}
        </div>
      )}

      {isPlatformConsole && <div className="flex-grow-1" />}

      <div className="ms-auto d-flex align-items-center gap-2">
        {!isPlatformConsole && (
          <Button
            variant="outline-light"
            size="sm"
            className="d-md-none"
            onClick={() => setShowMobileSearch((v) => !v)}
            aria-label="Abrir busca"
          >
            <i className="bi bi-search" aria-hidden="true" />
          </Button>
        )}

        <Dropdown align="end">
          <Dropdown.Toggle
            variant="link"
            className="app-header__user-toggle"
            id="user-menu"
            aria-label={`Conta de ${username || "usuário"}`}
          >
            <span className="app-header__user-avatar" aria-hidden="true">
              {userInitial}
            </span>
            <span className="app-header__user-meta">
              <span className="app-header__user-label">Usuário</span>
              <span className="app-header__user-name">{username || "Conta"}</span>
            </span>
            <i className="bi bi-chevron-down app-header__user-caret" aria-hidden="true" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow-sm app-header__user-menu">
            <Dropdown.Item onClick={logoutUser} className="text-danger">
              <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
              Sair
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {!isPlatformConsole && showMobileSearch && (
        <div
          className="position-fixed start-0 end-0 bg-dark p-3 d-md-none"
          style={{ top: "var(--header-height)", zIndex: 1040 }}
          ref={searchRef}
        >
          <Form onSubmit={handleSearch}>
            <InputGroup size="sm">
              <Form.Control
                type="search"
                placeholder="Pesquisar funcionários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                aria-label="Pesquisar funcionários"
              />
              <Button variant="light" type="submit" disabled={searchLoading}>
                {searchLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-search" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="outline-light"
                onClick={() => setShowMobileSearch(false)}
                aria-label="Fechar busca"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </Button>
            </InputGroup>
          </Form>
          {suggestionsList}
        </div>
      )}
    </header>
  );
}
