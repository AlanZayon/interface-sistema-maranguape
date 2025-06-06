// components/Header.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Button,
  Col,
  Form,
  InputGroup,
  Modal,
  Dropdown,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Form from "./Step3Form";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../utils/apiConfig";

function Header() {
  const [newUser, setNewUser] = useState({
    nome: "",
    foto: null,
    secretaria: "",
    funcao: "",
    tipo: "",
    natureza: "",
    referencia: "",
    redesSociais: [{ link: "", nome: "" }],
    salarioBruto: 0,
    cidade: "",
    endereco: "",
    bairro: "",
    telefone: "",
    observacoes: [],
    arquivo: null,
  });

  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { logout, username, role, setFuncionariosPath } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const searchRef = useRef(null);

  // Efeito para detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Se a tela for maior que mobile e a busca estiver visível, esconder
      if (window.innerWidth >= 768) {
        setShowSearch(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Efeito para fechar a busca quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setAutocompleteResults([]);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      axios
        .get(`${API_BASE_URL}/api/search/autocomplete?q=${searchQuery}`)
        .then((res) => {
          setAutocompleteResults(res.data);
          setShowSuggestions(true);
        })
        .catch((err) => {
          console.error("Erro ao buscar autocomplete:", err);
          setAutocompleteResults([]);
        });
    }, 300);
  }, [searchQuery]);

  // Update the handleSearch function to send the request
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    axios
      .get(`${API_BASE_URL}/api/search/search-funcionarios?q=${searchQuery}`)
      .then((response) => {
        setFuncionariosPath(response.data);
        navigate(`/search/${searchQuery}`);
      })
      .catch((error) => {
        console.error("Search error:", error);
      });
  };

  // Add a function to handle suggestion selection
  const handleSuggestionSelect = (term) => {
    setSearchQuery(term);
    setShowSuggestions(false);


    // Immediately search with the selected term
    axios
      .get(`${API_BASE_URL}/api/search/search-funcionarios?q=${term}`)
      .then((response) => {
      })
      .catch((error) => {
        console.error("Search error:", error);
      });
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleShowModal = () => {
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setNewUser({
      nome: "",
      foto: null,
      secretaria: "",
      funcao: "",
      natureza: "",
      referencia: "",
      redesSociais: [{ link: "", nome: "" }],
      salarioBruto: 0,
      salarioLiquido: 0,
      endereco: "",
      bairro: "",
      telefone: "",
      observacoes: [],
      arquivo: null,
    });
    setShowModal(false);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const logoutUser = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/usuarios/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao tentar fazer logout:", error);
    }
  };

  return (
    <>
      <header className="w-100 d-flex justify-content-between align-items-center bg-dark text-white p-2 header">
        <div>
          {role === "admin" ? (
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="outline-light"
                className="px-2"
                style={{ minWidth: "auto" }}
                title={username}
              >
                <i className="fas fa-user-cog"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => {
                    navigate("/indicadores");
                  }}
                >
                  Painel de Referências
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Button variant="outline-light" className="p-1" title={username}>
              <i className="fas fa-user"></i>
            </Button>
          )}
        </div>

        <div className="d-flex align-items-center">
          {/* Barra de pesquisa - Versão melhorada para mobile */}
          <div ref={searchRef} className="d-flex align-items-center">
            {!isMobile ? (
              // Barra de pesquisa para desktop
              <Form onSubmit={handleSearch} className="me-2">
                <InputGroup>
                  <Form.Control
                    type="search"
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    style={{ width: "200px" }}
                  />
                  <Button variant="outline-light" type="submit">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
                {showSuggestions && autocompleteResults.length > 0 && (
                  <ul className="list-group position-absolute mt-1 z-3 w-40 shadow-sm">
                    {autocompleteResults.map((term, idx) => (
                      <li
                        key={idx}
                        className="list-group-item list-group-item-action"
                        onClick={() => {
                          handleSuggestionSelect(term);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {term}
                      </li>
                    ))}
                  </ul>
                )}
              </Form>
            ) : showSearch ? (
              // Barra de pesquisa expandida para mobile
              <div
                className="position-absolute top-0 start-0 w-100 bg-dark p-2"
                style={{
                  zIndex: 1050,
                  marginTop: "56px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Form onSubmit={handleSearch} className="d-flex flex-grow-1">
                  <InputGroup>
                    <Form.Control
                      type="search"
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="flex-grow-1"
                    />
                    <Button variant="outline-light" type="submit">
                      <i className="fas fa-search"></i>
                    </Button>
                    <Button
                      variant="outline-light"
                      onClick={() => setShowSearch(false)}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </InputGroup>
                </Form>
              </div>
            ) : (
              // Ícone de pesquisa para mobile
              <Button
                variant="outline-light"
                className="mx-1"
                onClick={toggleSearch}
              >
                <i className="fas fa-search"></i>
              </Button>
            )}
          </div>

          {/* Botões de ação */}
          <div className="d-flex">
            <Button
              variant="outline-light"
              className="mx-1"
              onClick={handleShowModal}
            >
              <i className="fas fa-plus"></i>
            </Button>
            <Button
              onClick={() => {
                navigate("/mainscreen");
              }}
              variant="outline-light"
              className="mx-1"
            >
              <i className="fas fa-home-alt"></i>
            </Button>
            <Button
              onClick={logoutUser}
              variant="outline-light"
              className="mx-1"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </header>

      {/* Modal para registrar novo funcionário */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Novo Funcionário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentStep === 1 && (
            <Step1Form
              nextStep={nextStep}
              newUser={newUser}
              setNewUser={setNewUser}
              handleCloseModal={handleCloseModal}
            />
          )}
          {currentStep === 2 && (
            <Step2Form
              newUser={newUser}
              setNewUser={setNewUser}
              nextStep={nextStep}
              previousStep={prevStep}
              handleCloseModal={handleCloseModal}
            />
          )}
          {currentStep === 3 && (
            <Step3Form
              newUser={newUser}
              previousStep={prevStep}
              handleCloseModal={handleCloseModal}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Header;
