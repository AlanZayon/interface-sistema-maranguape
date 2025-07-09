import React, { useRef, useState, useEffect, useCallback } from "react";
import debounce from 'lodash/debounce';
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Row,
  Col,
  Form,
  Button,
  Modal,
  Spinner,
  Dropdown,
  Alert,
  InputGroup,
  Badge
} from "react-bootstrap";
import { FaUserCircle, FaSearch, FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";
import { API_BASE_URL } from "../utils/apiConfig";
import { useAuth } from "./AuthContext";

// Estilos customizados
const customStyles = {
  dropdownToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left'
  },
  dropdownItem: {
    whiteSpace: 'normal',
    padding: '8px 16px'
  },
  validationMessage: {
    fontSize: '0.875rem',
    marginTop: '0.25rem'
  },
  loadingIndicator: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  sectionHeader: {
    marginTop: '1.5rem',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #dee2e6'
  }
};

const fetchSetoresData = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/referencias/referencias-dados`);
  return response.data.referencias;
};

const fetchCargosComissionados = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/funcionarios/buscarCargos`);
  return response.data;
};

function Step1Form({
  coordenadoriaId,
  nextStep,
  newUser,
  setNewUser,
  ObservationHistoryButton,
  ObservationHistoryModal,
  handleCloseModal,
  setStep,
}) {
  const { setorId, "*": subPath } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [referenciasRegistradas, setReferenciasRegistradas] = useState([]);
  const [filteredReferencias, setFilteredReferencias] = useState([]);
  const [showModalObs, setShowModalObs] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { addFuncionarios } = useAuth();
  const currentSetorId = subPath ? subPath.split("/").pop() : setorId;
  const [cargosComissionados, setCargosComissionados] = useState([]);
  const [salarios, setSalarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [searchSalario, setSearchSalario] = useState("");
  const [searchCargo, setSearchCargo] = useState("");
  const [showSalarioDropdown, setShowSalarioDropdown] = useState(false);
  const [showCargoDropdown, setShowCargoDropdown] = useState(false);
  const [showNaturezaDropdown, setShowNaturezaDropdown] = useState(false);
  const [nameValidation, setNameValidation] = useState({
    isValid: null,
    message: "",
    loading: false
  });
  const [contratoIndeterminado, setContratoIndeterminado] = useState(false);

  const fileInputRef = useRef(null);

  const groupCargosBySimbologia = (cargos) => {
    const grouped = {};

    cargos.forEach(cargo => {
      if (!grouped[cargo.simbologia]) {
        grouped[cargo.simbologia] = {
          simbologia: cargo.simbologia,
          limite: cargo.simbologiaInfo.limite,
          cargos: []
        };
      }
      grouped[cargo.simbologia].cargos.push(cargo);
    });

    return Object.values(grouped);
  };

  useEffect(() => {
    if (newUser?.foto) {
      const objectUrl = URL.createObjectURL(newUser.foto);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewImage(null);
    }
  }, [newUser?.foto]);

  useEffect(() => {
    if (newUser?.arquivo) {
      setFileName(newUser.arquivo.name);
    } else {
      setFileName("");
    }
  }, [newUser?.arquivo]);

  useEffect(() => {
    const fetchReferencias = async () => {
      try {
        setIsLoading(true);
        const referencias = await fetchSetoresData();
        setReferenciasRegistradas(referencias);
      } catch (error) {
        console.error("Erro ao obter referências:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferencias();
  }, []);

  useEffect(() => {
    const searchValue = newUser.referencia?.toLowerCase() || '';
    const filtered = referenciasRegistradas.filter((referencia) =>
      referencia.name.toLowerCase().includes(searchValue)
    );
    setFilteredReferencias(filtered);
  }, [newUser.referencia, referenciasRegistradas]);

  useEffect(() => {
    if (newUser.natureza === "COMISSIONADO") {
      fetchCargosComissionados().then((data) => {
        setCargosComissionados(data);
        const uniqueSalarios = [...new Set(data.map((cargo) => cargo.aDefinir))];
        setSalarios(uniqueSalarios);
      });
    }
  }, [newUser.natureza]);

  useEffect(() => {
    if (newUser.salarioBruto && cargosComissionados.length > 0) {
      const filteredCargos = cargosComissionados.filter(
        (cargo) => cargo.aDefinir === Number(newUser.salarioBruto)
      );
      setCargos(filteredCargos);
    }
  }, [newUser.salarioBruto, cargosComissionados]);

  useEffect(() => {
    if (newUser.funcao && cargos.length > 0) {
      const selectedCargo = cargos.find(
        (cargo) => cargo.cargo === newUser.funcao
      );
      if (selectedCargo) {
        setNewUser((prevState) => ({ ...prevState, tipo: selectedCargo.tipo }));
      }
    }
  }, [newUser.funcao, cargos]);

  const handleRemovePhoto = () => {
    setNewUser((prevState) => ({ ...prevState, foto: null }));
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const checkNameAvailability = useCallback(
    debounce(async (name) => {
      if (!name || name.length < 3) {
        setNameValidation({
          isValid: null,
          message: "",
          loading: false
        });
        return;
      }

      setNameValidation({ isValid: null, message: "", loading: true });

      try {
        const response = await axios.get(`${API_BASE_URL}/api/funcionarios/check-name`, {
          params: { name }
        });

        setNameValidation({
          isValid: response.data.available,
          message: response.data.message,
          loading: false
        });
      } catch (error) {
        setNameValidation({
          isValid: false,
          message: "Erro ao verificar disponibilidade do nome",
          loading: false
        });
      }
    }, 500),
    []
  );

  const validateFields = () => {
    const newErrors = {};

    if (!newUser.nome) {
      newErrors.nome = "O campo Nome é obrigatório";
    } else if (nameValidation.isValid === false) {
      newErrors.nome = nameValidation.message;
    }

    if (!newUser.natureza) {
      newErrors.natureza = "O campo Natureza é obrigatório";
    }

    // Modified reference validation based on nature
    if (newUser.natureza === "COMISSIONADO" && !newUser.referencia) {
      newErrors.referencia = "O campo Referência é obrigatório para comissionados";
    } else if (newUser.referencia) {
      const isReferenciaValid = referenciasRegistradas.some(
        (referencia) => referencia.name.toLowerCase() === newUser.referencia.toLowerCase()
      );
      if (!isReferenciaValid) {
        newErrors.referencia = "A referência informada não é válida";
      }
    }

    // Validações específicas por natureza
    if (["EFETIVO", "TEMPORARIO", "COMISSIONADO"].includes(newUser.natureza)) {
      if (!newUser.salarioBruto) {
        newErrors.salarioBruto = "O campo Salário é obrigatório";
      }
      if (!newUser.funcao) {
        newErrors.funcao = "O campo Função é obrigatório";
      }
    }

    if (newUser.natureza === "TEMPORARIO") {
      if (!newUser.inicioContrato) {
        newErrors.inicioContrato = "O campo Início do Contrato é obrigatório";
      }
      if (!newUser.fimContrato) {
        newErrors.fimContrato = "O campo Fim do Contrato é obrigatório";
      }

      if (newUser.inicioContrato && newUser.fimContrato &&
        new Date(newUser.fimContrato) <= new Date(newUser.inicioContrato)) {
        newErrors.fimContrato = "A data de fim deve ser posterior à data de início";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, foto: "A imagem deve ter no máximo 2MB" });
        return;
      }
      if (!file.type.match('image.*')) {
        setErrors({ ...errors, foto: "Por favor, selecione um arquivo de imagem" });
        return;
      }
      setNewUser((prevState) => ({ ...prevState, foto: file }));
      setPreviewImage(URL.createObjectURL(file));
      setErrors({ ...errors, foto: null });
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateFields()) {
      setIsLoading(true);
      if (nextStep) {
        nextStep();
      } else {
        setStep(2);
      }
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setNewUser({ ...newUser, nome: name });
    checkNameAvailability(name);
  };

  const renderValidationFeedback = (field) => {
    if (!errors[field]) return null;

    return (
      <Form.Text className="text-danger d-flex align-items-center mt-1">
        <FaTimes className="me-1" />
        {errors[field]}
      </Form.Text>
    );
  };

  const renderNameValidationStatus = () => {
    if (nameValidation.loading) {
      return (
        <Form.Text className="text-muted d-flex align-items-center mt-1">
          <Spinner animation="border" size="sm" className="me-1" />
          Verificando disponibilidade...
        </Form.Text>
      );
    }

    if (nameValidation.isValid === true) {
      return (
        <Form.Text className="text-success d-flex align-items-center mt-1">
          <FaCheck className="me-1" />
          Nome disponível
        </Form.Text>
      );
    }

    if (nameValidation.isValid === false) {
      return (
        <Form.Text className="text-danger d-flex align-items-center mt-1">
          <FaTimes className="me-1" />
          {nameValidation.message}
        </Form.Text>
      );
    }

    return (
      <Form.Text className="text-muted d-flex align-items-center mt-1">
        <FaInfoCircle className="me-1" />
        Digite pelo menos 3 caracteres
      </Form.Text>
    );
  };

  const filteredSalarios = salarios.filter((salario) =>
    salario.toString().toLowerCase().includes(searchSalario.toLowerCase())
  );

  const filteredCargos = cargos.filter((cargo) =>
    cargo.cargo.toLowerCase().includes(searchCargo.toLowerCase())
  );

  return (
    <Form>
      <Row className="g-3">
        {/* Seção de Foto */}
        <Col md={12} className="text-center">
          <div className="mb-4">
            <Form.Label className="d-block fw-bold mb-3">Foto de Perfil</Form.Label>
            <div
              className="profile-photo-upload mx-auto"
              style={{ width: '120px', height: '120px', position: 'relative' }}
            >
              {previewImage ? (
                <>
                  <img
                    src={previewImage}
                    alt="Foto do Funcionário"
                    className="rounded-circle border border-3 border-primary"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onClick={handlePhotoClick}
                  />
                  <Badge
                    bg="danger"
                    className="position-absolute top-0 end-0 rounded-circle p-1"
                    style={{ cursor: 'pointer', zIndex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    title="Remover foto"
                  >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                  </Badge>
                </>
              ) : (
                <div
                  className="default-avatar rounded-circle border border-3 border-secondary d-flex justify-content-center align-items-center bg-light"
                  style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  onClick={handlePhotoClick}
                >
                  <FaUserCircle style={{ fontSize: "60px", color: "#6c757d" }} />
                </div>
              )}
              <Badge
                bg="primary"
                className="position-absolute bottom-0 end-0 rounded-circle p-2"
                style={{ cursor: 'pointer' }}
                onClick={handlePhotoClick}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                </svg>
              </Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
            {errors.foto && (
              <div className="text-danger mt-2">
                <FaTimes className="me-1" />
                {errors.foto}
              </div>
            )}
            <div className="text-muted small mt-2">
              Tamanho máximo: 5MB. Formatos: JPG, PNG
            </div>
          </div>
        </Col>

        {/* Dados Básicos */}
        <Col md={6}>
          <Form.Group controlId="formServidor" className="position-relative">
            <Form.Label>Nome do Servidor <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o nome completo"
              value={newUser?.nome || ''}
              onChange={handleNameChange}
              isInvalid={!!errors.nome || nameValidation.isValid === false}
            />
            {renderNameValidationStatus()}
          </Form.Group>
        </Col>

        {/* Reference field - conditionally rendered based on nature */}
        {newUser.natureza !== "EFETIVO" && (
          <Col md={6}>
            <Form.Group controlId="formReferência">
              <Form.Label>
                Referência
                {newUser.natureza === "COMISSIONADO" && <span className="text-danger">*</span>}
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Digite a referência"
                  value={newUser?.referencia || ''}
                  onChange={(e) => setNewUser({ ...newUser, referencia: e.target.value })}
                  list="referencias-list"
                  isInvalid={!!errors.referencia}
                  autoComplete="off"
                  required={newUser.natureza === "COMISSIONADO"}
                />
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
              </InputGroup>
              <datalist id="referencias-list">
                {filteredReferencias.map((referencia, index) => (
                  <option key={index} value={referencia.name} />
                ))}
              </datalist>
              {renderValidationFeedback('referencia')}
              <Form.Text className="text-muted">
                Comece a digitar para ver sugestões
                {newUser.natureza === "TEMPORARIO" && " (Opcional)"}
              </Form.Text>
            </Form.Group>
          </Col>
        )}

        <Col md={6}>
          <Form.Group controlId="formNatureza">
            <Form.Label>Natureza do Cargo <span className="text-danger">*</span></Form.Label>
            <Dropdown
              show={showNaturezaDropdown}
              onToggle={(isOpen) => setShowNaturezaDropdown(isOpen)}
            >
              <Dropdown.Toggle
                variant="light"
                id="dropdown-natureza"
                className="w-100 d-flex justify-content-between align-items-center"
                style={customStyles.dropdownToggle}
              >
                {newUser.natureza ? (
                  <>
                    <span>{newUser.natureza.charAt(0).toUpperCase() + newUser.natureza.slice(1).toLowerCase()}</span>
                    <Badge bg="primary" className="ms-2">
                      {newUser.natureza === 'COMISSIONADO' ? 'C' :
                        newUser.natureza === 'EFETIVO' ? 'E' : 'T'}
                    </Badge>
                  </>
                ) : (
                  <span className="text-muted">Selecione a natureza</span>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {["COMISSIONADO", "TEMPORARIO", "EFETIVO"].map((natureza, index) => (
                  <Dropdown.Item
                    key={index}
                    onClick={() => {
                      setNewUser({
                        ...newUser,
                        natureza: natureza.toUpperCase(),
                        salarioBruto: "",
                        funcao: "",
                        inicioContrato: "",
                        fimContrato: "",
                        tipo: "",
                      });
                      setShowNaturezaDropdown(false);
                    }}
                    style={customStyles.dropdownItem}
                  >
                    <div className="d-flex justify-content-between w-100">
                      <span>{natureza}</span>
                      <Badge bg="primary">
                        {natureza === 'COMISSIONADO' ? 'C' :
                          natureza === 'EFETIVO' ? 'E' : 'T'}
                      </Badge>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            {renderValidationFeedback('natureza')}
          </Form.Group>
        </Col>

        {/* Campos específicos por natureza */}
        {newUser.natureza && (
          <Col md={12}>
            <div className="mt-4 pt-3 border-top">
              <h5 className="mb-4" style={customStyles.sectionHeader}>
                {newUser.natureza === 'COMISSIONADO' && 'Dados do Cargo Comissionado'}
                {newUser.natureza === 'EFETIVO' && 'Dados do Cargo Efetivo'}
                {newUser.natureza === 'TEMPORARIO' && 'Dados do Contrato Temporário'}
              </h5>

              {/* Campos para COMISSIONADO */}
              {newUser.natureza === "COMISSIONADO" && (
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="formSalario">
                      <Form.Label>Salário <span className="text-danger">*</span></Form.Label>
                      <Dropdown
                        show={showSalarioDropdown}
                        onToggle={(isOpen) => setShowSalarioDropdown(isOpen)}
                      >
                        <Dropdown.Toggle
                          variant="light"
                          id="dropdown-salario"
                          className="w-100 d-flex justify-content-between align-items-center"
                          style={customStyles.dropdownToggle}
                        >
                          {newUser.salarioBruto ? (
                            <span>R$ {Number(newUser.salarioBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-muted">Selecione o salário</span>
                          )}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 p-2">
                          <div className="mb-2">
                            <InputGroup>
                              <Form.Control
                                type="text"
                                placeholder="Pesquisar salário"
                                value={searchSalario}
                                onChange={(e) => setSearchSalario(e.target.value)}
                                autoFocus
                              />
                              <InputGroup.Text>
                                <FaSearch />
                              </InputGroup.Text>
                            </InputGroup>
                          </div>
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {filteredSalarios.map((salarioBruto, index) => (
                              <Dropdown.Item
                                key={index}
                                onClick={() => {
                                  setNewUser({ ...newUser, salarioBruto });
                                  setShowSalarioDropdown(false);
                                }}
                                active={newUser.salarioBruto === salarioBruto}
                                style={customStyles.dropdownItem}
                              >
                                R$ {Number(salarioBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </Dropdown.Item>
                            ))}
                          </div>
                        </Dropdown.Menu>
                      </Dropdown>
                      {renderValidationFeedback('salarioBruto')}
                    </Form.Group>
                  </Col>

                  {newUser.salarioBruto && (
                    <Col md={6}>
                      <Form.Group controlId="formCargo">
                        <Form.Label>Cargo <span className="text-danger">*</span></Form.Label>
                        <Dropdown
                          show={showCargoDropdown}
                          onToggle={(isOpen) => setShowCargoDropdown(isOpen)}
                        >
                          <Dropdown.Toggle
                            variant="light"
                            id="dropdown-cargo"
                            className="w-100 d-flex justify-content-between align-items-center"
                            style={{
                              ...customStyles.dropdownToggle,
                              overflow: 'hidden'
                            }}
                          >
                            {newUser.funcao ? (
                              <span className="text-truncate">{newUser.funcao}</span>
                            ) : (
                              <span className="text-muted">Selecione o cargo</span>
                            )}
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100 p-2" style={{ minWidth: '400px' }}>
                            <div className="mb-2">
                              <InputGroup>
                                <Form.Control
                                  type="text"
                                  placeholder="Pesquisar cargo"
                                  value={searchCargo}
                                  onChange={(e) => setSearchCargo(e.target.value)}
                                  autoFocus
                                />
                                <InputGroup.Text>
                                  <FaSearch />
                                </InputGroup.Text>
                              </InputGroup>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                              {groupCargosBySimbologia(filteredCargos).map((grupo, index) => (
                                <React.Fragment key={index}>
                                  <Dropdown.Header
                                    className="d-flex justify-content-between align-items-center"
                                    style={{
                                      backgroundColor: grupo.limite === 0 ? '#fff0f0' : '#f0fff0',
                                      fontWeight: '600'
                                    }}
                                  >
                                    <span>Simbologia: {grupo.simbologia}</span>
                                    <Badge bg={grupo.limite === 0 ? 'danger' : 'success'}>
                                      Limite: {grupo.limite}
                                    </Badge>
                                  </Dropdown.Header>

                                  {grupo.cargos.map((cargo, cargoIndex) => (
                                    <Dropdown.Item
                                      key={`${index}-${cargoIndex}`}
                                      onClick={() => {
                                        setNewUser({ ...newUser, funcao: cargo.cargo });
                                        setShowCargoDropdown(false);
                                      }}
                                      active={newUser.funcao === cargo.cargo}
                                      style={{
                                        ...customStyles.dropdownItem,
                                        whiteSpace: 'normal'
                                      }}
                                    >
                                      <div className="d-flex flex-column">
                                        <span>{cargo.cargo}</span>
                                        <small className="text-muted">Tipo: {cargo.tipo}</small>
                                      </div>
                                    </Dropdown.Item>
                                  ))}
                                </React.Fragment>
                              ))}
                            </div>
                          </Dropdown.Menu>
                        </Dropdown>
                        {renderValidationFeedback('funcao')}
                        {newUser.funcao && (
                          <Form.Text className="text-muted">
                            Selecione o cargo correspondente
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              )}

              {/* Campos para EFETIVO */}
              {newUser.natureza === "EFETIVO" && (
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="formSalarioEfetivo">
                      <Form.Label>Salário Bruto <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <InputGroup.Text>R$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          placeholder="0,00"
                          value={newUser.salarioBruto || ''}
                          onChange={(e) =>
                            setNewUser({ ...newUser, salarioBruto: e.target.value })
                          }
                          isInvalid={!!errors.salarioBruto}
                          step="0.01"
                          min="0"
                        />
                      </InputGroup>
                      {renderValidationFeedback('salarioBruto')}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="formFuncaoEfetivo">
                      <Form.Label>Função <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Digite a função"
                        value={newUser.funcao || ''}
                        onChange={(e) =>
                          setNewUser({ ...newUser, funcao: e.target.value })
                        }
                        isInvalid={!!errors.funcao}
                      />
                      {renderValidationFeedback('funcao')}
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {/* Campos para TEMPORARIO */}
              {newUser.natureza === "TEMPORARIO" && (
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="formSalarioTemporario">
                      <Form.Label>Salário Bruto <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <InputGroup.Text>R$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          placeholder="0,00"
                          value={newUser.salarioBruto || ''}
                          onChange={(e) =>
                            setNewUser({ ...newUser, salarioBruto: e.target.value })
                          }
                          isInvalid={!!errors.salarioBruto}
                          step="0.01"
                          min="0"
                        />
                      </InputGroup>
                      {renderValidationFeedback('salarioBruto')}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="formFuncaoTemporario">
                      <Form.Label>Função <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Digite a função"
                        value={newUser.funcao || ''}
                        onChange={(e) =>
                          setNewUser({ ...newUser, funcao: e.target.value })
                        }
                        isInvalid={!!errors.funcao}
                      />
                      {renderValidationFeedback('funcao')}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="formInicioContrato">
                      <Form.Label>Início do Contrato <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        value={newUser.inicioContrato || ''}
                        onChange={(e) =>
                          setNewUser({ ...newUser, inicioContrato: e.target.value })
                        }
                        isInvalid={!!errors.inicioContrato}
                      />
                      {renderValidationFeedback('inicioContrato')}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="formFimContrato">
                      <Form.Label>
                        Fim do Contrato
                        {!contratoIndeterminado && <span className="text-danger">*</span>}
                      </Form.Label>

                      {/* Container principal - layout em coluna */}
                      <div className="d-flex flex-column gap-2">
                        {/* Linha para o campo de data */}
                        <div className="d-flex align-items-center">
                          <Form.Control
                            type="date"
                            value={contratoIndeterminado ? '' : (newUser.fimContrato || '')}
                            onChange={(e) => setNewUser({ ...newUser, fimContrato: e.target.value })}
                            isInvalid={!!errors.fimContrato}
                            min={newUser.inicioContrato || ''}
                            disabled={contratoIndeterminado}
                            className="me-2"  // Adiciona margem à direita
                          />
                        </div>

                        {/* Linha para o switch - agora em uma linha separada */}
                        <div className="d-flex align-items-center">
                          <Form.Check
                            type="switch"
                            id="contrato-indeterminado"
                            label="Contrato Indeterminado"
                            checked={contratoIndeterminado}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setContratoIndeterminado(isChecked);
                              if (isChecked) {
                                setNewUser({ ...newUser, fimContrato: 'indeterminado' });
                                setErrors(prev => ({ ...prev, fimContrato: null }));
                              } else {
                                setNewUser({ ...newUser, fimContrato: '' });
                              }
                            }}
                            
                          />
                        </div>
                      </div>

                      {renderValidationFeedback('fimContrato')}

                      {newUser.inicioContrato && newUser.fimContrato && !contratoIndeterminado && (
                        <Form.Text className="text-muted">
                          Duração: {Math.floor((new Date(newUser.fimContrato) - new Date(newUser.inicioContrato)) / (1000 * 60 * 60 * 24))} dias
                        </Form.Text>
                      )}

                      {contratoIndeterminado && (
                        <Form.Text className="text-muted">
                          Contrato sem data de término definida
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </div>
          </Col>
        )}

        {/* Rodapé com botões */}
        <Col md={12} className="mt-4 pt-3 border-top">
          <div className="d-flex justify-content-between">
            <Button
              variant="outline-secondary"
              onClick={handleCloseModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isLoading || nameValidation.loading}
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Carregando...
                </>
              ) : (
                'Avançar'
              )}
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
}

export default Step1Form;