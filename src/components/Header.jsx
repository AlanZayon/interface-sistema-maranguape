// components/Header.js
import React, { useState } from 'react';
import axios from 'axios';
import { Button, Col, Form, InputGroup, Modal, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Step1Form from './Step1Form';
import Step2Form from './Step2Form';
import Step3Form from './Step3Form';
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
  const { logout, username, role } = useAuth(); 
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


  // Função para passar para o próximo passo
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Função para voltar ao passo anterior
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };


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

  return (
    <>
      <header className="w-100 d-flex justify-content-between align-items-center bg-dark text-white p-3 header">
        <h1 style={{ fontSize: '1.2rem' }}>
          {role === "admin" ? (
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" className="h-100 w-100 mx-1 mb-1">
                {username}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { navigate("/indicadores") }}>
                  Painel de Referências
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

          ) : (
            <span>{username || "Usuário"}</span>
          )}
        </h1>

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
              <i className="fas fa-home-alt"></i>
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
              handleCloseModal={handleCloseModal}
            />

          )}
          {/* Passo 2: Seleção de Setores, Subsetores e Coordenadorias */}
          {currentStep === 2 && (
            <Step2Form
              newUser={newUser}
              setNewUser={setNewUser}
              nextStep={nextStep}
              previousStep={prevStep}
              handleCloseModal={handleCloseModal}
            />


          ) }
          {/* Passo 3: Informações adicionais */}
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
