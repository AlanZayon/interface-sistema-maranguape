import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "./AuthContext";
import {
  Row,
  Col,
  Form,
  Button,
  Modal,
  Spinner,
  Dropdown,
  Badge
} from "react-bootstrap";
import {
  FaUserCircle,
  FaUser,
  FaBuilding,
  FaDollarSign,
  FaPhone,
  FaMapMarkerAlt,
  FaLink,
  FaFileUpload,
  FaIdCard,
  FaCalendarAlt
} from "react-icons/fa";
import { API_BASE_URL } from "../utils/apiConfig";

// Estilos personalizados
const sectionHeaderStyle = {
  backgroundColor: "#f8f9fa",
  padding: "10px 15px",
  borderRadius: "5px",
  marginBottom: "20px",
  borderLeft: "4px solid #0d6efd"
};

const iconStyle = {
  marginRight: "8px",
  color: "#0d6efd"
};

const errorStyle = {
  color: "#dc3545",
  fontSize: "0.875rem",
  marginTop: "0.25rem"
};

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

function UserEdit({ funcionario, handleCloseModal }) {
  const { setorId, "*": subPath } = useParams();
  const [newUser, setNewUser] = useState({
    nome: "",
    foto: "",
    secretaria: "",
    funcao: "",
    natureza: "",
    referencia: "",
    redesSociais: [{ link: "", nome: "" }],
    salarioBruto: "",
    cidade: "",
    endereco: "",
    bairro: "",
    telefone: "",
    observacoes: [],
    arquivo: "",
  });
  const [referenciasRegistradas, setReferenciasRegistradas] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [sendImage, setSendImage] = useState(null);
  const [sendFile, setSendFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [cargosComissionados, setCargosComissionados] = useState([]);
  const [salarios, setSalarios] = useState([]);
  const [searchSalario, setSearchSalario] = useState("");
  const [searchCargo, setSearchCargo] = useState("");
  const [showSalarioDropdown, setShowSalarioDropdown] = useState(false);
  const [showCargoDropdown, setShowCargoDropdown] = useState(false);
  const [showNaturezaDropdown, setShowNaturezaDropdown] = useState(false);
  const { addFuncionarios, addFuncionariosPath } = useAuth();
  const prevNatureza = useRef(funcionario?.natureza || null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [nameAvailable, setNameAvailable] = useState(true);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [nameCheckTimer, setNameCheckTimer] = useState(null);
  const [initialNatureza, setInitialNatureza] = useState(funcionario?.natureza || null);
  const [contratoIndeterminado, setContratoIndeterminado] = useState(
    funcionario?.fimContrato === 'indeterminado'
  );
  const [dataAnteriorFimContrato, setDataAnteriorFimContrato] = useState(null);


  const checkNameAvailability = useCallback(async (name) => {
    const normalizedNewName = name.trim().toUpperCase();
    const normalizedOriginalName = funcionario?.nome?.trim().toUpperCase();

    // Se vazio ou igual ao nome original, pula a verificação
    if (!normalizedNewName || normalizedNewName === normalizedOriginalName) {
      setNameAvailable(true);
      return;
    }

    setNameCheckLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/funcionarios/check-name`,
        { params: { name } }
      );
      setNameAvailable(response.data.available);
    } catch (error) {
      console.error("Erro ao verificar nome:", error);
      setNameAvailable(true); // Assume disponível em caso de erro
    } finally {
      setNameCheckLoading(false);
    }
  }, [funcionario?.nome]);

  // Debounce para verificação do nome
  useEffect(() => {
    if (nameCheckTimer) {
      clearTimeout(nameCheckTimer);
    }

    const timer = setTimeout(() => {
      checkNameAvailability(newUser.nome);
    }, 500);

    setNameCheckTimer(timer);

    return () => {
      if (nameCheckTimer) {
        clearTimeout(nameCheckTimer);
      }
    };
  }, [newUser.nome]);

  // Atualizar validação quando o nome muda
  useEffect(() => {
    if (newUser.nome && newUser.nome !== funcionario?.nome) {
      setErrors(prev => ({
        ...prev,
        nome: !nameAvailable ? "Este nome já está em uso" : null
      }));
    } else {
      // Limpa o erro se o nome for igual ao original
      setErrors(prev => ({
        ...prev,
        nome: null
      }));
    }
  }, [nameAvailable, newUser.nome, funcionario?.nome]);


  // Inicializa os dados do funcionário
  useEffect(() => {
    if (funcionario) {
      setNewUser(funcionario);
      setContratoIndeterminado(funcionario.fimContrato === 'indeterminado');
      if (funcionario.fimContrato && funcionario.fimContrato !== 'indeterminado') {
        setDataAnteriorFimContrato(funcionario.fimContrato);
      }
    }
  }, [funcionario]);

  // Configura a pré-visualização da imagem
  useEffect(() => {
    if (newUser?.foto instanceof File) {
      const objectUrl = URL.createObjectURL(newUser.foto);
      setPreviewImage(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (funcionario?.fotoUrl) {
      setPreviewImage(funcionario.fotoUrl);
    } else {
      setPreviewImage(null);
    }
  }, [newUser?.foto, funcionario]);

  // Carrega as referências
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

  // Filtra as referências de forma memoizada
  const filteredReferencias = useMemo(() => {
    const searchValue = newUser.referencia?.toLowerCase() || '';
    return referenciasRegistradas.filter((referencia) =>
      referencia.name.toLowerCase().includes(searchValue)
    );
  }, [newUser.referencia, referenciasRegistradas]);

  // Carrega os cargos comissionados quando a natureza é alterada
  useEffect(() => {
    if (newUser.natureza === "COMISSIONADO") {
      fetchCargosComissionados().then((data) => {
        setCargosComissionados(data);
        const uniqueSalarios = [...new Set(data.map((cargo) => cargo.aDefinir))];
        setSalarios(uniqueSalarios);
      });
    }
  }, [newUser.natureza]);

  // Filtra os cargos quando o salário é alterado
  const cargos = useMemo(() => {
    if (newUser.salarioBruto) {
      return cargosComissionados.filter(
        (cargo) => cargo.aDefinir === Number(newUser.salarioBruto)
      );
    }
    return [];
  }, [newUser.salarioBruto, cargosComissionados]);

  // Atualiza o tipo quando o cargo é alterado
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

  const validateFields = useCallback(() => {
    const newErrors = {};

    if (!newUser.nome?.trim()) {
      newErrors.nome = "O campo Nome é obrigatório";
    } else if (!nameAvailable && newUser.nome !== funcionario?.nome) {
      newErrors.nome = "Este nome já está em uso";
    }

    if (!newUser.natureza) {
      newErrors.natureza = "O campo Natureza é obrigatório";
    }

    // Regras específicas por natureza
    if (newUser.natureza === "EFETIVO") {
      // Efetivo não tem referência
      setNewUser(prev => ({ ...prev, referencia: null }));

      if (!newUser.funcao?.trim()) {
        newErrors.funcao = "O campo Função é obrigatório para efetivos";
      }

      if (!newUser.salarioBruto) {
        newErrors.salarioBruto = "O campo Salário Bruto é obrigatório";
      }
    }
    else if (newUser.natureza === "TEMPORARIO") {
      // Temporário: referência é opcional
      if (newUser.referencia?.trim()) {
        const isReferenciaValid = referenciasRegistradas.some(
          (referencia) =>
            referencia.name.toLowerCase() === newUser.referencia.toLowerCase()
        );
        if (!isReferenciaValid) {
          newErrors.referencia = "A referência informada não é válida";
        }
      }

      if (!newUser.salarioBruto) {
        newErrors.salarioBruto = "O campo Salário Bruto é obrigatório";
      }

      if (!newUser.inicioContrato) {
        newErrors.inicioContrato = "Data de início do contrato é obrigatória";
      }

      // Validação modificada para aceitar "indeterminado"
      if (!contratoIndeterminado && !newUser.fimContrato) {
        newErrors.fimContrato = "Data de término do contrato é obrigatória";
      } else if (!contratoIndeterminado &&
        newUser.inicioContrato &&
        newUser.fimContrato &&
        new Date(newUser.fimContrato) <= new Date(newUser.inicioContrato)) {
        newErrors.fimContrato = "Data de término deve ser posterior à data de início";
      }

      // Se for indeterminado, define explicitamente o valor
      if (contratoIndeterminado) {
        setNewUser(prev => ({ ...prev, fimContrato: 'indeterminado' }));
      }
    }
    else if (newUser.natureza === "COMISSIONADO") {
      // Validações existentes para comissionado
      if (!newUser.referencia?.trim()) {
        newErrors.referencia = "O campo Referência é obrigatório";
      } else {
        const isReferenciaValid = referenciasRegistradas.some(
          (referencia) =>
            referencia.name.toLowerCase() === newUser.referencia.toLowerCase()
        );
        if (!isReferenciaValid) {
          newErrors.referencia = "A referência informada não é válida";
        }
      }

      if (!newUser.salarioBruto) {
        newErrors.salarioBruto = "O campo Salário Bruto é obrigatório";
      }

      if (!newUser.funcao) {
        newErrors.funcao = "O campo Cargo é obrigatório";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newUser, referenciasRegistradas, nameAvailable, contratoIndeterminado]);

  useEffect(() => {
    if (!newUser.natureza) return;

    // Se for a primeira vez, guarda a natureza inicial
    if (!initialNatureza) {
      setInitialNatureza(newUser.natureza);
      return;
    }

    const changes = {
      EFETIVO: {
        referencia: null,
        inicioContrato: null,
        fimContrato: null,
        funcao: "",
        salarioBruto: ""
      },
      TEMPORARIO: {
        referencia: newUser.referencia || "",
        funcao: "",
        salarioBruto: ""
      },
      COMISSIONADO: {
        referencia: newUser.referencia || "",
        funcao: "",
        salarioBruto: ""
      }
    };

    // Função para lidar com a atualização do estado
    const updateUser = () => {
      if (newUser.natureza === initialNatureza) {
        return {
          referencia: funcionario?.referencia,
          funcao: funcionario?.funcao,
          salarioBruto: funcionario?.salarioBruto,
          inicioContrato: funcionario?.inicioContrato,
          fimContrato: funcionario?.fimContrato
        };
      } else {
        return changes[newUser.natureza];
      }
    };

    setNewUser(prev => {
      const updatedUser = {
        ...prev,
        ...updateUser()
      };

      return updatedUser;
    });

  }, [newUser.natureza, initialNatureza, funcionario]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSendImage(file);
      setNewUser((prevState) => ({ ...prevState, foto: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const { mutate: updateUserData } = useMutation({
    mutationFn: async () => {
      // Filtra redes sociais inválidas
      const redesValidas = newUser.redesSociais.filter(
        (item) => item.link && item.nome
      );

      const formData = new FormData();
      formData.append("nome", newUser.nome);
      if (sendImage) {
        formData.append("foto", sendImage);
      }
      formData.append("secretaria", newUser.secretaria);
      formData.append("funcao", newUser.funcao);
      formData.append("natureza", newUser.natureza);
      formData.append("referencia", newUser.referencia || "");
      formData.append("redesSociais", JSON.stringify(redesValidas) || "");
      formData.append("salarioBruto", newUser.salarioBruto);
      formData.append("cidade", newUser.cidade);
      formData.append("endereco", newUser.endereco);
      formData.append("bairro", newUser.bairro);
      formData.append("telefone", newUser.telefone);
      formData.append("inicioContrato", newUser.inicioContrato || '');
      formData.append("fimContrato",
        contratoIndeterminado ? 'indeterminado' : (newUser.fimContrato || '')
      );
      if (sendFile) {
        formData.append("arquivo", sendFile);
      }
      formData.append("coordenadoria", funcionario.coordenadoria);
      formData.append("tipo", newUser.tipo || "");

      const response = await axios.put(
        `${API_BASE_URL}/api/funcionarios/edit-funcionario/${funcionario._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries("funcionarios");
      addFuncionarios(updatedUser);
      addFuncionariosPath(updatedUser);
      handleCloseModal();
      alert("Atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar os dados:", error);
      setIsLoading(false);
      alert("Ocorreu um erro ao atualizar. Por favor, tente novamente.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateFields()) {
      setIsLoading(true);
      updateUserData();
    }
  };

  const filteredSalarios = useMemo(() =>
    salarios.filter((salario) =>
      salario.toString().toLowerCase().includes(searchSalario.toLowerCase())
    ),
    [salarios, searchSalario]
  );

  const filteredCargos = useMemo(() =>
    cargos.filter((cargo) =>
      cargo.cargo.toLowerCase().includes(searchCargo.toLowerCase())
    ),
    [cargos, searchCargo]
  );

  const fileMessage = newUser?.arquivo
    ? `Arquivo Selecionado: ${newUser.arquivo.name || ""}`
    : "Nenhum arquivo selecionado";

  const groupCargosBySimbologia = useCallback((cargos) => {
    const grouped = {};

    cargos.forEach(cargo => {
      if (!grouped[cargo.simbologia]) {
        grouped[cargo.simbologia] = {
          simbologia: cargo.simbologia,
          limite: cargo.simbologiaInfo?.limite || 0,
          cargos: []
        };
      }
      grouped[cargo.simbologia].cargos.push(cargo);
    });

    return Object.values(grouped);
  }, []);

  const groupedCargos = useMemo(() =>
    groupCargosBySimbologia(filteredCargos),
    [filteredCargos, groupCargosBySimbologia]
  );

  const handleAddSocialMedia = () => {
    setNewUser({
      ...newUser,
      redesSociais: [...newUser.redesSociais, { link: "", nome: "" }],
    });
  };

  const handleRemoveSocialMedia = (index) => {
    const updatedRedes = [...newUser.redesSociais];
    updatedRedes.splice(index, 1);
    setNewUser({ ...newUser, redesSociais: updatedRedes });
  };

  // Adicionar campos de data para temporários
const renderTemporaryFields = () => {
  if (newUser.natureza !== "TEMPORARIO") return null;

  return (
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3" controlId="formInicioContrato">
          <Form.Label>
            <FaCalendarAlt style={iconStyle} />
            Início do Contrato
          </Form.Label>
          <Form.Control
            type="date"
            value={newUser.inicioContrato ? new Date(newUser.inicioContrato).toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setNewUser({ ...newUser, inicioContrato: e.target.value })
            }
            isInvalid={!!errors.inicioContrato}
          />
          <Form.Control.Feedback type="invalid" style={errorStyle}>
            {errors.inicioContrato}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3" controlId="formFimContrato">
          <Form.Label>
            <FaCalendarAlt style={iconStyle} />
            Término do Contrato
          </Form.Label>
          
          {/* Layout modificado para melhor organização */}
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <Form.Control
                type="date"
                value={
                  contratoIndeterminado || 
                  !newUser.fimContrato || 
                  newUser.fimContrato === 'indeterminado' 
                    ? '' 
                    : new Date(newUser.fimContrato).toISOString().split('T')[0]
                }
                onChange={(e) =>
                  setNewUser({ ...newUser, fimContrato: e.target.value })
                }
                isInvalid={!!errors.fimContrato}
                disabled={contratoIndeterminado}
                className="flex-grow-1"
              />
            </div>
            
            <div className="d-flex align-items-center">
              <Form.Check
                type="switch"
                id="contrato-indeterminado"
                label="Contrato Indeterminado"
                checked={contratoIndeterminado}
                onChange={(e) => {
                  const isIndeterminado = e.target.checked;
                  setContratoIndeterminado(isIndeterminado);

                  if (isIndeterminado) {
                    if (newUser.fimContrato && newUser.fimContrato !== 'indeterminado') {
                      setDataAnteriorFimContrato(newUser.fimContrato);
                    }
                    setNewUser(prev => ({ ...prev, fimContrato: 'indeterminado' }));
                    setErrors(prev => ({ ...prev, fimContrato: null }));
                  } else {
                    setNewUser(prev => ({
                      ...prev,
                      fimContrato: dataAnteriorFimContrato || ''
                    }));
                  }
                }}
              />
            </div>
          </div>

          <Form.Control.Feedback type="invalid" style={errorStyle}>
            {errors.fimContrato}
          </Form.Control.Feedback>
          
          {newUser.inicioContrato && !contratoIndeterminado && newUser.fimContrato && newUser.fimContrato !== 'indeterminado' && (
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
  );
};

  // Renderização do campo de referência condicional
  const renderReferenceField = () => {
    if (newUser.natureza === "EFETIVO") return null;

    return (
      <Col md={6}>
        <Form.Group className="mb-3" controlId="formReferência">
          <Form.Label>Referência</Form.Label>
          <Form.Control
            type="text"
            placeholder={newUser.natureza === "TEMPORARIO" ? "Referência (opcional)" : "Digite a referência"}
            value={newUser.referencia || ""}
            onChange={(e) =>
              setNewUser({ ...newUser, referencia: e.target.value })
            }
            list="referencias-list"
            isInvalid={!!errors.referencia}
            autoComplete="off"
            required={newUser.natureza === "COMISSIONADO"}
          />
          <datalist id="referencias-list">
            {filteredReferencias.map((referencia, index) => (
              <option key={index} value={referencia.name} />
            ))}
          </datalist>
          <Form.Control.Feedback type="invalid" style={errorStyle}>
            {errors.referencia}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
    );
  };

  // Renderização do campo de função condicional
  const renderFunctionField = () => {
    if (newUser.natureza === "COMISSIONADO") return null;

    return (
      <Col md={6}>
        <Form.Group className="mb-3" controlId="formFuncao">
          <Form.Label>Função</Form.Label>
          <Form.Control
            type="text"
            placeholder="Digite a função"
            value={newUser.funcao || ""}
            onChange={(e) =>
              setNewUser({ ...newUser, funcao: e.target.value })
            }
            isInvalid={!!errors.funcao}
            required={newUser.natureza === "EFETIVO"}
          />
          <Form.Control.Feedback type="invalid" style={errorStyle}>
            {errors.funcao}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
    );
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Seção: Foto e Informações Básicas */}
      <div style={sectionHeaderStyle}>
        <h5>
          <FaUserCircle style={iconStyle} />
          Informações Básicas
        </h5>
      </div>

      <Row className="mb-4">
        <Col md={12} className="d-flex flex-column align-items-center">
          <div className="profile-photo-upload mb-3">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Foto do Funcionário"
                className="profile-image"
                onClick={handlePhotoClick}
              />
            ) : (
              <div className="default-avatar" onClick={handlePhotoClick}>
                <FaUserCircle className="default-avatar-icon" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleFileChange}
            />
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handlePhotoClick}
            className="mb-3"
          >
            Alterar Foto
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="formServidor">
            <Form.Label>
              <FaUser style={iconStyle} />
              Nome do Servidor
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o nome completo"
              value={newUser?.nome || ""}
              onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
              isInvalid={!!errors.nome}
              required
            />
            <Form.Control.Feedback type="invalid" style={errorStyle}>
              {errors.nome}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3" controlId="formSecretaria">
            <Form.Label>
              <FaBuilding style={iconStyle} />
              Secretaria
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite a secretaria"
              value={newUser?.secretaria || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, secretaria: e.target.value })
              }
              isInvalid={!!errors.secretaria}
            />
            <Form.Control.Feedback type="invalid" style={errorStyle}>
              {errors.secretaria}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {/* Seção: Dados Profissionais */}
      <div style={sectionHeaderStyle}>
        <h5>
          <FaIdCard style={iconStyle} />
          Dados Profissionais
        </h5>
      </div>

      <Row>
        {renderReferenceField()}

        <Col md={6}>
          <Form.Group className="mb-3" controlId="formNatureza">
            <Form.Label>Natureza</Form.Label>
            <Dropdown
              show={showNaturezaDropdown}
              onToggle={(isOpen) => setShowNaturezaDropdown(isOpen)}
            >
              <Dropdown.Toggle
                variant="light"
                id="dropdown-natureza"
                className="w-100 d-flex justify-content-between align-items-center"
              >
                {newUser.natureza
                  ? newUser.natureza.charAt(0).toUpperCase() +
                  newUser.natureza.slice(1).toLowerCase()
                  : "Selecione a natureza"}
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
                      {natureza.charAt(0) + natureza.slice(1).toLowerCase()}
                    </Dropdown.Item>
                  )
                )}
              </Dropdown.Menu>
            </Dropdown>
            {errors.natureza && (
              <div style={errorStyle}>{errors.natureza}</div>
            )}
          </Form.Group>
        </Col>
      </Row>

      {newUser.natureza === "COMISSIONADO" && (
        <>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formSalario">
                <Form.Label>
                  <FaDollarSign style={iconStyle} />
                  Salário Bruto
                </Form.Label>
                <Dropdown
                  show={showSalarioDropdown}
                  onToggle={(isOpen) => setShowSalarioDropdown(isOpen)}
                >
                  <Dropdown.Toggle
                    variant="light"
                    id="dropdown-salario"
                    className="w-100 d-flex justify-content-between align-items-center"
                  >
                    {newUser.salarioBruto
                      ? `R$ ${Number(newUser.salarioBruto).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}`
                      : "Selecione o salário"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <div className="p-2">
                      <Form.Control
                        type="text"
                        placeholder="Pesquisar salário"
                        value={searchSalario}
                        onChange={(e) => setSearchSalario(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {filteredSalarios.map((salarioBruto, index) => (
                      <Dropdown.Item
                        key={index}
                        onClick={() => {
                          setNewUser({
                            ...newUser,
                            salarioBruto: Number(salarioBruto),
                          });
                          setShowSalarioDropdown(false);
                        }}
                      >
                        R$ {Number(salarioBruto).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
                {errors.salarioBruto && (
                  <div style={errorStyle}>{errors.salarioBruto}</div>
                )}
              </Form.Group>
            </Col>

            {newUser.salarioBruto && (
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formCargo">
                  <Form.Label>Cargo</Form.Label>
                  <Dropdown
                    show={showCargoDropdown}
                    onToggle={(isOpen) => setShowCargoDropdown(isOpen)}
                  >
                    <Dropdown.Toggle
                      variant="light"
                      id="dropdown-cargo"
                      className="w-100 text-truncate d-flex justify-content-between align-items-center"
                    >
                      <span className="text-truncate">
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
                          autoFocus
                        />
                      </div>

                      {groupedCargos.length > 0 ? (
                        groupedCargos.map((grupo, index) => (
                          <React.Fragment key={index}>
                            <Dropdown.Header
                              className={`d-flex justify-content-between ${grupo.limite === 0 ? 'bg-danger-light' : 'bg-success-light'}`}
                            >
                              <span>Simbologia: {grupo.simbologia}</span>
                              <Badge bg={grupo.limite === 0 ? 'danger' : 'success'}>
                                Limite: {grupo.limite}
                              </Badge>
                            </Dropdown.Header>

                            {grupo.cargos.map((cargo, cargoIndex) => (
                              <Dropdown.Item
                                key={`${index}-${cargoIndex}`}
                                title={cargo.cargo}
                                className="d-flex justify-content-between align-items-center"
                                onClick={() => {
                                  setNewUser({ ...newUser, funcao: cargo.cargo });
                                  setShowCargoDropdown(false);
                                }}
                              >
                                <span className="text-truncate flex-grow-1">
                                  {cargo.cargo}
                                </span>
                              </Dropdown.Item>
                            ))}
                          </React.Fragment>
                        ))
                      ) : (
                        <Dropdown.Item disabled>
                          Nenhum cargo encontrado
                        </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                  {errors.funcao && (
                    <div style={errorStyle}>{errors.funcao}</div>
                  )}
                </Form.Group>
              </Col>
            )}
          </Row>
        </>
      )}

      {renderFunctionField()}

      {renderTemporaryFields()}

      {/* Renderização condicional do Salário Bruto para TEMPORARIO e EFETIVO */}
      {(newUser.natureza === "TEMPORARIO" || newUser.natureza === "EFETIVO") && (
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="formSalario">
              <Form.Label>
                <FaDollarSign style={iconStyle} />
                Salário Bruto
              </Form.Label>
              <Form.Control
                type="number"
                placeholder="Digite o salário bruto"
                value={newUser.salarioBruto || ""}
                onChange={(e) =>
                  setNewUser({ ...newUser, salarioBruto: e.target.value })
                }
                isInvalid={!!errors.salarioBruto}
                required
              />
              <Form.Control.Feedback type="invalid" style={errorStyle}>
                {errors.salarioBruto}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      )}

      {/* Seção: Redes Sociais */}
      <div style={sectionHeaderStyle}>
        <h5>
          <FaLink style={iconStyle} />
          Redes Sociais
        </h5>
      </div>

      <Row className="mb-4">
        <Col md={12}>
          {newUser.redesSociais.map((social, index) => (
            <div key={index} className="mb-3">
              <Row>
                <Col md={5}>
                  <Form.Control
                    type="text"
                    placeholder={`Nome da Rede Social (ex: LinkedIn)`}
                    value={social.nome}
                    onChange={(e) => {
                      const updatedRedes = [...newUser.redesSociais];
                      updatedRedes[index].nome = e.target.value;
                      setNewUser({ ...newUser, redesSociais: updatedRedes });
                    }}
                  />
                </Col>
                <Col md={5}>
                  <Form.Control
                    type="url"
                    placeholder={`URL (ex: https://linkedin.com/in/usuario)`}
                    value={social.link}
                    onChange={(e) => {
                      const updatedRedes = [...newUser.redesSociais];
                      updatedRedes[index].link = e.target.value;
                      setNewUser({ ...newUser, redesSociais: updatedRedes });
                    }}
                  />
                </Col>
                <Col md={2} className="d-flex align-items-center">
                  {index > 0 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveSocialMedia(index)}
                      className="ms-2"
                    >
                      Remover
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          ))}
          <Button
            variant="outline-primary"
            onClick={handleAddSocialMedia}
            className="mt-2"
          >
            Adicionar Rede Social
          </Button>
        </Col>
      </Row>

      {/* Seção: Informações Pessoais */}
      <div style={sectionHeaderStyle}>
        <h5>
          <FaMapMarkerAlt style={iconStyle} />
          Informações Pessoais
        </h5>
      </div>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="formCidade">
            <Form.Label>Cidade</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite a cidade"
              value={newUser?.cidade || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, cidade: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3" controlId="formEndereco">
            <Form.Label>Endereço</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o endereço"
              value={newUser?.endereco || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, endereco: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3" controlId="formBairro">
            <Form.Label>Bairro</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o bairro"
              value={newUser?.bairro || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, bairro: e.target.value })
              }
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3" controlId="formTelefone">
            <Form.Label>
              <FaPhone style={iconStyle} />
              Telefone
            </Form.Label>
            <Form.Control
              type="tel"
              placeholder="Digite o telefone"
              value={newUser?.telefone || ""}
              onChange={(e) =>
                setNewUser({ ...newUser, telefone: e.target.value })
              }
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Seção: Documentos */}
      <div style={sectionHeaderStyle}>
        <h5>
          <FaFileUpload style={iconStyle} />
          Documentos
        </h5>
      </div>

      <Row className="mb-4">
        <Col md={12}>
          <Form.Group>
            <Form.Label>Upload de Arquivo</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="file"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setSendFile(file);
                  setNewUser({ ...newUser, arquivo: file });
                }}
                className="d-none"
              />
              <Button
                as="label"
                htmlFor="file-upload"
                variant="outline-primary"
                className="me-3"
              >
                Escolher Arquivo
              </Button>
              <span>{fileMessage}</span>
            </div>
          </Form.Group>
        </Col>
      </Row>

      <Modal.Footer className="mt-4">
        {isLoading ? (
          <div className="d-flex align-items-center">
            <Spinner animation="border" role="status" className="me-2" />
            <span>Salvando alterações...</span>
          </div>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Salvar Alterações
            </Button>
          </>
        )}
      </Modal.Footer>
    </Form>
  );
}

// Estilos CSS-in-JS
const styles = `
  .profile-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid #0d6efd;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .profile-image:hover {
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }
  
  .default-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #e9ecef;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid #adb5bd;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .default-avatar:hover {
    background-color: #dee2e6;
    border-color: #6c757d;
  }
  
  .default-avatar-icon {
    font-size: 60px;
    color: #6c757d;
  }
  
  .bg-danger-light {
    background-color: #ffebee;
  }
  
  .bg-success-light {
    background-color: #e8f5e9;
  }
  
  .dropdown-item {
    white-space: normal;
  }
  
  .dropdown-menu {
    max-height: 300px;
    overflow-y: auto;
  }
`;

// Adiciona os estilos ao documento
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default React.memo(UserEdit);