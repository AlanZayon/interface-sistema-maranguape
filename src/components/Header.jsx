import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Button,
  Form,
  InputGroup,
  Modal,
  Dropdown,
  Container,
  Navbar,
  Badge,
  ListGroup,
  Spinner
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Form from "./Step3Form";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../utils/apiConfig";
import {
  FaSearch,
  FaPlus,
  FaHome,
  FaSignOutAlt,
  FaUser,
  FaUserCog,
  FaTimes,
  FaChevronRight,
  FaSitemap // Ícone para organograma
} from "react-icons/fa";
import OrganogramModal from "./OrganogramModal"; // Importe o modal do organograma

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
  const [showOrganogramModal, setShowOrganogramModal] = useState(false); // Estado para o modal do organograma
  const [currentStep, setCurrentStep] = useState(1);
  const { logout, username, role, setFuncionariosPath } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const timeoutRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSearch(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
        setShowSuggestions(false);
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

    setSearchLoading(true);
    timeoutRef.current = setTimeout(() => {
      axios
        .get(`${API_BASE_URL}/api/search/autocomplete?q=${searchQuery}`)
        .then((res) => {
          const results = Array.isArray(res.data) 
            ? res.data.map(item => {
                if (typeof item === 'string') {
                  return { nome: item, tipo: '' };
                }
                return item;
              })
            : [];
          
          setAutocompleteResults(results);
          setShowSuggestions(true);
        })
        .catch((err) => {
          console.error("Erro ao buscar autocomplete:", err);
          setAutocompleteResults([]);
        })
        .finally(() => setSearchLoading(false));
    }, 300);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    axios
      .get(`${API_BASE_URL}/api/search/search-funcionarios?q=${searchQuery}`)
      .then((response) => {
        const results = response.data.funcionarios || response.data;
        const setoresInfo = response.data.setoresEncontrados || [];
        
        const setoresFormatados = setoresInfo.map(setor => ({
          ...setor,
          tipo: setor.tipo === 'Coordenadoria' ? 'Divisão' : setor.tipo
        }));
        
        setFuncionariosPath({
          funcionarios: results,
          setoresEncontrados: setoresFormatados
        });
        navigate(`/search/${searchQuery}`);
      })
      .catch((error) => {
        console.error("Search error:", error);
      })
      .finally(() => setSearchLoading(false));
  };

  const handleSuggestionSelect = (item) => {
    const term = typeof item === 'string' ? item : item.nome;
    
    setSearchQuery(term);
    setShowSuggestions(false);
    setSearchLoading(true);
    
    axios
      .get(`${API_BASE_URL}/api/search/search-funcionarios?q=${term}`)
      .then((response) => {
        const results = response.data.funcionarios || response.data;
        const setoresInfo = response.data.setoresEncontrados || [];
        
        const setoresFormatados = setoresInfo.map(setor => ({
          ...setor,
          tipo: setor.tipo === 'Coordenadoria' ? 'Divisão' : setor.tipo
        }));
        
        setFuncionariosPath({
          funcionarios: results,
          setoresEncontrados: setoresFormatados
        });
        navigate(`/search/${term}`);
      })
      .catch((error) => {
        console.error("Search error:", error);
      })
      .finally(() => setSearchLoading(false));
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        const input = document.querySelector('.mobile-search-input');
        if (input) input.focus();
      }, 100);
    }
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

  // Função para abrir o modal do organograma
  const handleShowOrganogramModal = () => {
    setShowOrganogramModal(true);
  };

  // Função para fechar o modal do organograma
  const handleCloseOrganogramModal = () => {
    setShowOrganogramModal(false);
  };

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const logoutUser = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/usuarios/logout`,
        {},
        { withCredentials: true }
      );
      logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao tentar fazer logout:", error);
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="md" sticky="top" className="px-3 shadow-sm">
        <Container fluid>
          {/* Left side - User dropdown */}
          <div className="d-flex align-items-center">
            {role === "admin" ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-light"
                  className="d-flex align-items-center gap-2"
                  title={username}
                >
                  <FaUserCog size={18} />
                  <span className="d-none d-md-inline">{username}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow">
                  <Dropdown.Item 
                    onClick={() => navigate("/indicadores")}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaUserCog className="text-primary" />
                    Painel de Referências
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button variant="outline-light" title={username}>
                <FaUser size={18} />
                <span className="d-none d-md-inline ms-2">{username}</span>
              </Button>
            )}
          </div>

          {/* Center - Search (desktop) */}
          {!isMobile && (
            <div className="mx-4 flex-grow-1 position-relative" style={{ maxWidth: "500px" }} ref={searchRef}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="search"
                    placeholder="Pesquisar funcionários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    className="border-end-0"
                  />
                  <Button 
                    variant="light" 
                    type="submit"
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FaSearch />
                    )}
                  </Button>
                </InputGroup>
                
                {showSuggestions && autocompleteResults.length > 0 && (
                  <ListGroup className="position-absolute w-100 mt-1 shadow" style={{ 
                    zIndex: 1000,
                    left: 0,
                    right: 0
                  }}>
                    {autocompleteResults.map((item, idx) => {
                      const term = typeof item === 'string' ? item : item.nome;
                      const type = typeof item === 'string' ? '' : item.tipo;
                      const displayType = type === 'Coordenadoria' ? 'Divisão' : type;
                      
                      return (
                        <ListGroup.Item
                          key={idx}
                          action
                          onClick={() => handleSuggestionSelect(item)}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            {term}
                            {displayType && (
                              <Badge bg="secondary" className="ms-2">
                                {displayType}
                              </Badge>
                            )}
                          </div>
                          <FaChevronRight size={12} className="text-muted" />
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                )}
              </Form>
            </div>
          )}

          {/* Right side - Action buttons */}
          <div className="d-flex align-items-center gap-2">
            {/* Mobile search toggle */}
            {isMobile && (
              <Button
                variant="outline-light"
                onClick={toggleSearch}
                className="d-md-none"
              >
                <FaSearch />
              </Button>
            )}

            {/* Botão do Organograma */}
            <Button
              variant="outline-light"
              onClick={handleShowOrganogramModal}
              title="Visualizar organograma"
              className="d-flex align-items-center"
            >
              <FaSitemap />
              <span className="d-none d-md-inline ms-2">Orgonograma</span>
            </Button>

            <Button
              variant="outline-light"
              onClick={handleShowModal}
              title="Adicionar funcionário"
            >
              <FaPlus />
              <span className="d-none d-md-inline ms-2">Novo</span>
            </Button>

            <Button
              onClick={() => navigate("/mainscreen")}
              variant="outline-light"
              title="Página inicial"
            >
              <FaHome />
              <span className="d-none d-md-inline ms-2">Início</span>
            </Button>

            <Button
              onClick={logoutUser}
              variant="outline-light"
              title="Sair"
            >
              <FaSignOutAlt />
              <span className="d-none d-md-inline ms-2">Sair</span>
            </Button>
          </div>

          {/* Mobile search overlay */}
          {isMobile && showSearch && (
            <div 
              className="position-fixed top-0 start-0 w-100 bg-dark p-3 d-md-none"
              style={{
                zIndex: 1050,
                marginTop: "56px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
              }}
              ref={searchRef}
            >
              <Form onSubmit={handleSearch} className="d-flex">
                <InputGroup>
                  <Form.Control
                    type="search"
                    placeholder="Pesquisar funcionários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="mobile-search-input"
                  />
                  <Button 
                    variant="light" 
                    type="submit"
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FaSearch />
                    )}
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={() => setShowSearch(false)}
                  >
                    <FaTimes />
                  </Button>
                </InputGroup>
              </Form>

              {showSuggestions && autocompleteResults.length > 0 && (
                <ListGroup className="mt-2 shadow">
                  {autocompleteResults.map((item, idx) => {
                    const term = typeof item === 'string' ? item : item.nome;
                    const type = typeof item === 'string' ? '' : item.tipo;
                    const displayType = type === 'Coordenadoria' ? 'Divisão' : type;
                    
                    return (
                      <ListGroup.Item
                        key={idx}
                        action
                        onClick={() => handleSuggestionSelect(item)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          {term}
                          {displayType && (
                            <Badge bg="secondary" className="ms-2">
                              {displayType}
                            </Badge>
                          )}
                        </div>
                        <FaChevronRight size={12} className="text-muted" />
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </div>
          )}
        </Container>

        {/* New Employee Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>Registrar Novo Funcionário</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0">
            <div className="d-flex mb-3">
              <Badge bg={currentStep >= 1 ? "primary" : "secondary"} className="d-flex align-items-center me-2">
                {currentStep > 1 ? "✓" : "1"}
              </Badge>
              <Badge bg={currentStep >= 2 ? "primary" : "secondary"} className="d-flex align-items-center me-2">
                {currentStep > 2 ? "✓" : "2"}
              </Badge>
              <Badge bg={currentStep >= 3 ? "primary" : "secondary"} className="d-flex align-items-center">
                3
              </Badge>
            </div>

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
      </Navbar>

      {/* Modal do Organograma */}
      <OrganogramModal 
        show={showOrganogramModal}
        onHide={handleCloseOrganogramModal}
      />
    </>
  );
}

export default Header;