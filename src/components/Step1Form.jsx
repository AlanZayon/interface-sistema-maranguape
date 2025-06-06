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
} from "react-bootstrap";
import { FaUserCircle, FaSearch } from "react-icons/fa";
import { API_BASE_URL } from "../utils/apiConfig";
import { useAuth } from "./AuthContext";

const fetchSetoresData = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/referencias/referencias-dados`
  );
  return response.data.referencias;
};

const fetchCargosComissionados = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/funcionarios/buscarCargos`
  );
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
  });

  // Função para agrupar cargos por simbologia
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
        const referencias = await fetchSetoresData();
        setReferenciasRegistradas(referencias);
      } catch (error) {
        console.error("Erro ao obter referências:", error);
      }
    };

    fetchReferencias();
  }, []);

  useEffect(() => {
    const searchValue = newUser.referencia.toLowerCase();
    const filtered = referenciasRegistradas.filter((referencia) =>
      referencia.name.toLowerCase().includes(searchValue)
    );
    setFilteredReferencias(filtered);
  }, [newUser.referencia, referenciasRegistradas]);

  useEffect(() => {
    if (newUser.natureza === "COMISSIONADO") {
      fetchCargosComissionados().then((data) => {
        setCargosComissionados(data);
        const uniqueSalarios = [
          ...new Set(data.map((cargo) => cargo.aDefinir)),
        ];
        setSalarios(uniqueSalarios);
      });
    }
  }, [newUser.natureza]);

  useEffect(() => {
    if (newUser.salarioBruto) {
      const filteredCargos = cargosComissionados.filter(
        (cargo) => cargo.aDefinir === Number(newUser.salarioBruto)
      );
      setCargos(filteredCargos);
    }
  }, [newUser.salarioBruto, cargosComissionados]);

  useEffect(() => {
    if (newUser.funcao) {
      const selectedCargo = cargos.find(
        (cargo) => cargo.cargo === newUser.funcao
      );
      if (selectedCargo) {
        setNewUser((prevState) => ({ ...prevState, tipo: selectedCargo.tipo }));
      }
    }
  }, [newUser.funcao, cargos]);

  useEffect(() => {
    // Resetar o cargo quando o salário for alterado
    setNewUser((prev) => ({ ...prev, funcao: "" }));
  }, [newUser.salarioBruto]);

  useEffect(() => {
    // Resetar salário e cargo ao mudar a natureza do cargo
    setNewUser((prev) => ({
      ...prev,
      salarioBruto: "",
      funcao: "",
    }));
  }, [newUser.natureza]);

  useEffect(() => {
    return () => {
      setNameValidation({
        isValid: null,
        message: "",
      });
    };
  }, []);

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

      setNameValidation({
        isValid: null,
        message: "",
        loading: true
      });

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

    if (!newUser.nome) newErrors.nome = "O campo Nome é obrigatório";
    if (!newUser.natureza)
      newErrors.natureza = "O campo Natureza é obrigatório";
    if (!newUser.referencia)
      newErrors.referencia = "O campo Referência é obrigatório";
    else {
      const isReferenciaValid = referenciasRegistradas.some(
        (referencia) =>
          referencia.name.toLowerCase() === newUser.referencia.toLowerCase()
      );
      if (!isReferenciaValid) {
        newErrors.referencia = "A referência informada não é válida";
      }
      if (!newUser.salarioBruto)
        newErrors.salarioBruto = "O campo Salário é obrigatório";
      if (!newUser.funcao) newErrors.cargo = "O campo Cargo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewUser((prevState) => ({ ...prevState, foto: file }));
      setPreviewImage(URL.createObjectURL(file));
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

  const handleAddObservation = (observation) => {
    setNewUser((prevState) => ({
      ...prevState,
      observacoes: [...prevState.observacoes, observation],
    }));
  };

  const fileMessage = newUser?.arquivo
    ? `Arquivo Selecionado: ${newUser.arquivo.name}`
    : "Nenhum arquivo selecionado";

  const filteredSalarios = salarios.filter((salario) =>
    salario.toString().toLowerCase().includes(searchSalario.toLowerCase())
  );

  const filteredCargos = cargos.filter((cargo) =>
    cargo.cargo.toLowerCase().includes(searchCargo.toLowerCase())
  );

  const handleNameChange = (e) => {
    const name = e.target.value;
    setNewUser({ ...newUser, nome: name });
    checkNameAvailability(name);
  };

  return (
    <Form>
      <Row>
        <Col md={12}>
          <Form.Group controlId="formFoto">
            <Form.Label>Foto de Perfil</Form.Label>
            <div className="profile-photo-upload d-flex justify-content-center">
              {newUser?.foto ? (
                <img
                  src={previewImage}
                  alt="Foto do Funcionário"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "2px solid #ccc",
                    cursor: "pointer",
                  }}
                  onClick={handlePhotoClick}
                />
              ) : (
                <div
                  className="default-avatar"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "2px solid #ccc",
                    cursor: "pointer",
                  }}
                  onClick={handlePhotoClick}
                >
                  <FaUserCircle style={{ fontSize: "50px", color: "#555" }} />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formServidor">
            <Form.Label>Servidor</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o servidor"
              value={newUser?.nome}
              onChange={handleNameChange}
              isInvalid={!!errors.nome || nameValidation.isValid === false}
            />
            {nameValidation.isValid === false && (
              <Form.Text className="text-danger">
                {nameValidation.message}
              </Form.Text>
            )}
            <Form.Control.Feedback type="invalid">
              {errors.nome}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formReferência">
            <Form.Label>Referência</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite a referência"
              value={newUser?.referencia}
              onChange={(e) =>
                setNewUser({ ...newUser, referencia: e.target.value })
              }
              list="referencias-list"
              isInvalid={!!errors.referencia}
              autoComplete="off"
            />
            <datalist id="referencias-list">
              {filteredReferencias.map((referencia, index) => (
                <option key={index} value={referencia.name} />
              ))}
            </datalist>
            <Form.Control.Feedback type="invalid">
              {errors.referencia}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formNatureza">
            <Form.Label>Natureza</Form.Label>
            <Dropdown
              show={showNaturezaDropdown}
              onToggle={(isOpen) => setShowNaturezaDropdown(isOpen)}
            >
              <Dropdown.Toggle
                variant="light"
                id="dropdown-natureza"
                className="w-100"
              >
                {newUser.natureza.charAt(0).toUpperCase() +
                  newUser.natureza.slice(1) || "Selecione a natureza"}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {["COMISSIONADO", "TEMPORARIO", "EFETIVO"].map(
                  (natureza, index) => (
                    <Dropdown.Item
                      key={index}
                      onClick={() => {
                        setNewUser({
                          ...newUser,
                          natureza: natureza.toUpperCase(),
                        });
                        setShowNaturezaDropdown(false);
                      }}
                    >
                      {natureza}
                    </Dropdown.Item>
                  )
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Form.Group>
        </Col>

        {newUser.natureza === "COMISSIONADO" && (
          <>
            <Col md={6}>
              <Form.Group controlId="formSalario">
                <Form.Label>Salário</Form.Label>
                <Dropdown
                  show={showSalarioDropdown}
                  onToggle={(isOpen) => setShowSalarioDropdown(isOpen)}
                >
                  <Dropdown.Toggle
                    variant="light"
                    id="dropdown-salario"
                    className="w-100"
                  >
                    {newUser.salarioBruto || "Selecione o salário"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <div className="p-2">
                      <Form.Control
                        type="text"
                        placeholder="Pesquisar salário"
                        value={searchSalario}
                        onChange={(e) => setSearchSalario(e.target.value)}
                      />
                    </div>
                    {filteredSalarios.map((salarioBruto, index) => (
                      <Dropdown.Item
                        key={index}
                        onClick={() => {
                          setNewUser({ ...newUser, salarioBruto });
                          setShowSalarioDropdown(false);
                        }}
                      >
                        {salarioBruto}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </Col>

            {newUser.salarioBruto && (
              <Col md={6}>
                <Form.Group controlId="formCargo">
                  <Form.Label>Cargo</Form.Label>
                  <Dropdown
                    show={showCargoDropdown}
                    onToggle={(isOpen) => setShowCargoDropdown(isOpen)}
                  >
                    <Dropdown.Toggle
                      variant="light"
                      id="dropdown-cargo"
                      className="w-100"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {newUser.funcao || "Selecione o cargo"}
                      </span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="w-100">
                      <div className="p-2">
                        <Form.Control
                          type="text"
                          placeholder="Pesquisar cargo"
                          value={searchCargo}
                          onChange={(e) => setSearchCargo(e.target.value)}
                        />
                      </div>
                      
                      {groupCargosBySimbologia(filteredCargos).map((grupo, index) => (
                        <React.Fragment key={index}>
                          <Dropdown.Header 
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              backgroundColor: grupo.limite === 0 ? "#ffe6e6" : "#e6ffe6",
                            }}
                          >
                            <span>Simbologia: {grupo.simbologia}</span>
                            <span style={{ color: grupo.limite === 0 ? "red" : "green" }}>
                              Limite: {grupo.limite}
                            </span>
                          </Dropdown.Header>
                          
                          {grupo.cargos
                            .filter(cargo => 
                              cargo.cargo.toLowerCase().includes(searchCargo.toLowerCase())
                            )
                            .map((cargo, cargoIndex) => (
                              <Dropdown.Item
                                key={`${index}-${cargoIndex}`}
                                title={cargo.cargo}
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                                onClick={() => {
                                  setNewUser({ ...newUser, funcao: cargo.cargo });
                                  setShowCargoDropdown(false);
                                }}
                              >
                                <span style={{ flex: 1, textAlign: "left" }}>
                                  {cargo.cargo}
                                </span>
                              </Dropdown.Item>
                            ))}
                        </React.Fragment>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </Form.Group>
              </Col>
            )}
          </>
        )}

        <Modal.Footer>
          {isLoading ? (
            <div className="loading-screen">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </Spinner>
            </div>
          ) : (
            <div>
              <Button
                className="mx-1"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                Avançar
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Row>
    </Form>
  );
}

export default Step1Form;