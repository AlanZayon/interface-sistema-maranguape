import React, { useRef, useState, useEffect } from "react";
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
} from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { API_BASE_URL } from "../utils/apiConfig";

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
  const [filteredReferencias, setFilteredReferencias] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [sendImage, setSendImage] = useState(null);
  const [sendFile, setSendFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [cargosComissionados, setCargosComissionados] = useState([]);
  const [salarios, setSalarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [searchSalario, setSearchSalario] = useState("");
  const [searchCargo, setSearchCargo] = useState("");
  const [showSalarioDropdown, setShowSalarioDropdown] = useState(false);
  const [showCargoDropdown, setShowCargoDropdown] = useState(false);
  const [showNaturezaDropdown, setShowNaturezaDropdown] = useState(false);
  const { addFuncionarios, addFuncionariosPath } = useAuth();
  const currentSetorId = subPath ? subPath.split("/").pop() : setorId;
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Inicializa os dados do funcionário
  useEffect(() => {
    if (funcionario) {
      setNewUser(funcionario);
    }
  }, [funcionario]);


  // Configura a pré-visualização da imagem
  useEffect(() => {
    if (newUser?.foto) {
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

  // Filtra as referências conforme o valor digitado
  useEffect(() => {
    const searchValue = newUser.referencia.toLowerCase();
    const filtered = referenciasRegistradas.filter((referencia) =>
      referencia.name.toLowerCase().includes(searchValue)
    );
    setFilteredReferencias(filtered);
  }, [newUser.referencia, referenciasRegistradas]);

  // Carrega os cargos comissionados quando a natureza é alterada
  useEffect(() => {
    if (newUser.natureza === "comissionado") {
      fetchCargosComissionados().then((data) => {
        setCargosComissionados(data);
        const uniqueSalarios = [
          ...new Set(data.map((cargo) => cargo.aDefinir)),
        ];
        setSalarios(uniqueSalarios);
      });
    }
  }, [newUser.natureza]);

  // Filtra os cargos quando o salário é alterado
  useEffect(() => {
    if (newUser.salarioBruto) {
      const filteredCargos = cargosComissionados.filter(
        (cargo) => cargo.aDefinir === Number(newUser.salarioBruto)
      );
      setCargos(filteredCargos);
    }
  }, [newUser.salarioBruto, cargosComissionados]);

  // Atualiza o tipo quando o cargo é alterado
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

  // Reseta o cargo quando o salário é alterado
  useEffect(() => {
    setNewUser((prev) => ({ ...prev, funcao: "" }));
  }, [newUser.salarioBruto]);

  // Reseta salário e cargo quando a natureza é alterada
  useEffect(() => {
    setNewUser((prev) => ({
      ...prev,
      salarioBruto: funcionario?.salarioBruto || "",
      funcao: funcionario?.funcao || "",
    }));
  }, [newUser.natureza]);

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
    }

    if (newUser.natureza === "comissionado") {
      if (!newUser.salarioBruto)
        newErrors.salarioBruto = "O campo Salário é obrigatório";
      if (!newUser.funcao) newErrors.cargo = "O campo Cargo é obrigatório";
    } else {
        if (!newUser.salarioBruto)
          newErrors.salarioBruto = "O campo Salário Bruto é obrigatório";
      }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      newUser.redesSociais = newUser.redesSociais.filter(
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
      formData.append("referencia", newUser.referencia);
      formData.append(
        "redesSociais",
        JSON.stringify(newUser.redesSociais) || ""
      );
      formData.append("salarioBruto", newUser.salarioBruto);
      formData.append("cidade", newUser.cidade);
      formData.append("endereco", newUser.endereco);
      formData.append("bairro", newUser.bairro);
      formData.append("telefone", newUser.telefone);
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
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateFields()) {
      setIsLoading(true);
      updateUserData();
    }
  };

  const filteredSalarios = salarios.filter((salario) =>
    salario.toString().toLowerCase().includes(searchSalario.toLowerCase())
  );

  const filteredCargos = cargos.filter((cargo) =>
    cargo.cargo.toLowerCase().includes(searchCargo.toLowerCase())
  );

  const fileMessage = newUser?.arquivo
    ? `Arquivo Selecionado: ${newUser.arquivo.name || ""}`
    : "Nenhum arquivo selecionado";

  return (
    <Form>
      {/* Campo de Upload de Foto de Perfil */}
      <Row>
        <Col md={12}>
          <Form.Group controlId="formFoto">
            <Form.Label>Foto de Perfil</Form.Label>
            <div className="profile-photo-upload d-flex justify-content-center">
              {previewImage ? (
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
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group controlId="formServidor">
            <Form.Label>Servidor</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o servidor"
              value={newUser?.nome}
              onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
              isInvalid={!!errors.nome}
            />
            <Form.Control.Feedback type="invalid">
              {errors.nome}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formSecretaria">
            <Form.Label>Secretaria</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite a secretaria"
              value={newUser?.secretaria}
              onChange={(e) =>
                setNewUser({ ...newUser, secretaria: e.target.value })
              }
              isInvalid={!!errors.secretaria}
            />
            <Form.Control.Feedback type="invalid">
              {errors.secretaria}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
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
                {newUser.natureza
                  ? newUser.natureza.charAt(0).toUpperCase() +
                    newUser.natureza.slice(1)
                  : "Selecione a natureza"}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {["Comissionado", "Temporário", "Efetivo"].map(
                  (natureza, index) => (
                    <Dropdown.Item
                      key={index}
                      onClick={() => {
                        setNewUser({
                          ...newUser,
                          natureza: natureza.toLowerCase(),
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
            <Form.Control.Feedback type="invalid">
              {errors.natureza}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {newUser.natureza === "comissionado" && (
        <>
          <Row>
            <Col md={6}>
              <Form.Group controlId="formSalario">
                <Form.Label>Salário Bruto</Form.Label>
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
                          setNewUser({
                            ...newUser,
                            salarioBruto: Number(salarioBruto),
                          });
                          setShowSalarioDropdown(false);
                        }}
                      >
                        {salarioBruto}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
                <Form.Control.Feedback type="invalid">
                  {errors.salarioBruto}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {newUser.salarioBruto && (
            <Row>
              <Col md={12}>
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
                      {filteredCargos.map((cargo, index) => (
                        <Dropdown.Item
                          key={index}
                          title={cargo.cargo}
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: cargo.limite === 0 ? 0.5 : 1,
                            pointerEvents: cargo.limite === 0 ? "none" : "auto",
                          }}
                          onClick={() => {
                            if (cargo.limite > 0) {
                              setNewUser({ ...newUser, funcao: cargo.cargo });
                              setShowCargoDropdown(false);
                            }
                          }}
                        >
                          <span
                            style={{
                              color: cargo.limite === 0 ? "red" : "green",
                              marginLeft: "10px",
                            }}
                          >
                            {cargo.limite === 0
                              ? "Sem vagas - "
                              : ` ${cargo.limite} - `}
                          </span>
                          <span style={{ flex: 1, textAlign: "left" }}>
                            {cargo.cargo}
                          </span>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Form.Control.Feedback type="invalid">
                    {errors.cargo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* Redes Sociais */}
      <Row>
        <Col md={12}>
          <Form.Group controlId="formRedesSociais">
            <Form.Label>Redes Sociais</Form.Label>
            <div>
              {newUser?.redesSociais &&
                newUser?.redesSociais.map((social, index) => (
                  <div key={index}>
                    <Form.Control
                      className="w-50"
                      type="text"
                      placeholder={`Nome da Rede Social ${index + 1}`}
                      value={social.nome}
                      onChange={(e) => {
                        const updatedRedes = [...newUser?.redesSociais];
                        updatedRedes[index].nome = e.target.value;
                        setNewUser({ ...newUser, redesSociais: updatedRedes });
                      }}
                    />
                    <Form.Control
                      type="text"
                      placeholder={`Rede Social ${index + 1}`}
                      value={social.link}
                      onChange={(e) => {
                        const updatedRedes = [...newUser?.redesSociais];
                        updatedRedes[index].link = e.target.value;
                        setNewUser({ ...newUser, redesSociais: updatedRedes });
                      }}
                    />
                  </div>
                ))}
              <Button
                variant="link"
                onClick={() =>
                  setNewUser({
                    ...newUser,
                    redesSociais: [
                      ...newUser?.redesSociais,
                      { link: "", nome: "" },
                    ],
                  })
                }
              >
                Adicionar Rede Social
              </Button>
            </div>
          </Form.Group>
        </Col>
      </Row>

      {/* Informações Pessoais */}
      <Row>
      <Col md={6}>
          <Form.Group controlId="formEndereco">
            <Form.Label>Cidade</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o endereço"
              value={newUser?.cidade}
              onChange={(e) =>
                setNewUser({ ...newUser, cidade: e.target.value })
              }
              isInvalid={!!errors.cidade}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="formEndereco">
            <Form.Label>Endereço</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o endereço"
              value={newUser?.endereco}
              onChange={(e) =>
                setNewUser({ ...newUser, endereco: e.target.value })
              }
              isInvalid={!!errors.endereco}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formBairro">
            <Form.Label>Bairro</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o bairro"
              value={newUser?.bairro}
              onChange={(e) =>
                setNewUser({ ...newUser, bairro: e.target.value })
              }
              isInvalid={!!errors.bairro}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="formTelefone">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o telefone"
              value={newUser?.telefone}
              onChange={(e) =>
                setNewUser({ ...newUser, telefone: e.target.value })
              }
              isInvalid={!!errors.telefone}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Row>
              <Form.Label>Upload de Arquivo</Form.Label>
            </Row>
            <Form.Control
              type="file"
              id="file-upload"
              onChange={(e) => {
                const file = e.target.files[0];
                setSendFile(file);
              }}
              style={{ display: "none" }}
            />
            <Form.Label
              htmlFor="file-upload"
              className="btn btn-primary"
              style={{
                cursor: "pointer",
                padding: "6px 16px",
                marginRight: "10px",
              }}
            >
              Escolher Arquivo
            </Form.Label>
            <div>{fileMessage}</div>
          </Form.Group>
        </Col>
      </Row>

      <Modal.Footer>
        {isLoading ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
        ) : (
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Salvar Alterações
            </Button>
          </>
        )}
      </Modal.Footer>
    </Form>
  );
}

export default UserEdit;
