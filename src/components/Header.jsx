// components/Header.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMutation } from "@tanstack/react-query";
import { Button, Col, Form, InputGroup, Modal, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ObservationHistoryButton from './ObservationHistoryButton';
import ObservationHistoryModal from './ObservationHistoryModal';
import Step1Form from './Step1Form';
import Step2Form from './Step2Form';
import { useAuth } from './AuthContext'; // Importa o contexto
import { API_BASE_URL } from '../utils/apiConfig';



function Header() {
  const [newUser, setNewUser] = useState({
    nome: '',
    foto: null,
    secretaria: '',
    funcao: '',
    natureza: '',
    referencia: '',
    redesSociais: [{ link: '', nome: '' }],
    salarioBruto: 0,
    salarioLiquido: 0,
    endereco: '',
    bairro: '',
    telefone: '',
    observacoes: [],
    arquivo: null,
  });

  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [setores, setSetores] = useState([]); // Listar todos os setores disponíveis
  const [showModalReferencia, setShowModalReferencia] = useState(false); // Controle do modal
  const [name, setName] = useState(""); // Estado para o nome
  const { logout, username, role } = useAuth(); // Usar o contexto de autenticação
  const navigate = useNavigate();


  const handleShowModal = () =>{
    setCurrentStep(1);
    setShowModal(true);
  } 
  const handleCloseModal = () => {
    setNewUser({
      nome: '',
      foto: null,
      secretaria: '',
      funcao: '',
      natureza: '',
      referencia: '',
      redesSociais: [{ link: '', nome: '' }],
      salarioBruto: 0,
      salarioLiquido: 0,
      endereco: '',
      bairro: '',
      telefone: '',
      observacoes: [],
      arquivo: null,
    });
    setShowModal(false);
  }

  const handleOpenModalReferencia = () => setShowModalReferencia(true);
  const handleCloseModalReferencia = () => {
    setShowModalReferencia(false);
    setName(""); // Limpa o nome ao fechar
  };


  // Função para passar para o próximo passo
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Função para voltar ao passo anterior
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Exemplo de dados hierárquicos de setores e coordenadorias
  const allSetores = [
    {
      id: 1,
      nome: 'Setor 1',
      subsetores: [
        {
          id: '1.1',
          nome: 'Subsetor 1.1',
          coordenadorias: ['Coordenadoria 1.1.1', 'Coordenadoria 1.1.2']
        },
        {
          id: '1.2',
          nome: 'Subsetor 1.2',
          coordenadorias: ['Coordenadoria 1.2.1']
        }
      ]
    },
    {
      id: 2,
      nome: 'Setor 2',
      subsetores: [
        {
          id: '2.1',
          nome: 'Subsetor 2.1',
          coordenadorias: ['Coordenadoria 2.1.1']
        }
      ]
    }
  ];


  useEffect(() => {
    setSetores(allSetores);  // Definindo os setores iniciais
  }, []);


  // Função para fazer o logout
  const logoutUser = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/usuarios/logout`, {}, {
        withCredentials: true, // Necessário para enviar e limpar o cookie no navegador
      });
      console.log(response.data.message); // Exibe a resposta do servidor
      logout()
      navigate("/")
    } catch (error) {
      console.error("Erro ao tentar fazer logout:", error);
    }
  };

  // Mutação para registrar referência
  const mutation = useMutation({
    mutationFn: (newReference) =>
      axios.post(`${API_BASE_URL}/api/referencias/register-reference`, newReference),
    onSuccess: () => {
      alert("Referência registrada com sucesso!");
      handleCloseModalReferencia(); // Fecha o modal
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Erro ao registrar a referência!");
    },
  });

  // Envia o nome ao backend usando a mutação
  const handleRegister = () => {
    if (!name.trim()) {
      alert("O nome não pode estar vazio!");
      return;
    }
    mutation.mutate({ name });
  };

  return (
    <>
      <header className="d-flex justify-content-between align-items-center bg-dark text-white p-3 header">
        <h1 style={{ fontSize: '1.2rem' }}>
          {role === "admin" ? (
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" className="h-100 w-100 mx-1 mb-1">
                {username}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleOpenModalReferencia}>
                  Registrar Referência
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

          ) : (
            <span>{username || "Usuário"}</span>
          )}
        </h1>
        <Modal show={showModalReferencia} onHide={handleCloseModalReferencia}>
            <Modal.Header closeButton>
              <Modal.Title>Registrar Referência</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group controlId="referenceName">
                  <Form.Label>Nome da Pessoa</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Digite o nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModalReferencia}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleRegister}
                disabled={mutation.isLoading} // Desativa enquanto carrega
              >
                {mutation.isLoading ? "Registrando..." : "Registrar"}
              </Button>
            </Modal.Footer>
          </Modal>
        <div className="d-flex">
          <InputGroup className="search-bar">
            {/* <Form.Control placeholder="Search..." className="search-input" /> */}
            {/* <Button variant="success" onClick={handleShowFilter}>
              <i className="fas fa-filter"></i> Filtro
            </Button> */}
          </InputGroup>
          <Col className="ml-3 d-flex">
            {/* <Button variant="outline-light" className="custom-height mx-1 mb-1">
              <i className="fas fa-file-alt"></i>
            </Button> */}
            <Button
              variant="outline-light"
              className="custom-height mx-1 mb-1"
              onClick={handleShowModal} // Abre o modal ao clicar
            >
              <i className="fas fa-plus"></i>
            </Button>
            <Button onClick={() => { navigate("/mainscreen") }} variant="outline-light" className="custom-height mx-1 mb-1">
              <i className="fas fa-sync-alt"></i>
            </Button>
            <Button onClick={logoutUser} variant="outline-light" className="custom-height mx-1 mb-1">
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </Col>
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
              ObservationHistoryButton={ObservationHistoryButton}
              ObservationHistoryModal={ObservationHistoryModal}
              handleCloseModal={handleCloseModal}
            />

          )}
          {/* Passo 2: Seleção de Setores, Subsetores e Coordenadorias */}
          {currentStep === 2 && (
            <Step2Form
              newUser={newUser}
              previousStep={prevStep}
              handleCloseModal={handleCloseModal}
            // Outros props necessários para o Step2Form
            />


          )}
        </Modal.Body>
      </Modal>

    </>
  );
}

export default Header;
