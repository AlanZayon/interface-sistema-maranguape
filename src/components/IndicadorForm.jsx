import { useState } from "react";
import axios from "axios";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import { API_BASE_URL } from '../utils/apiConfig';

const IndicadorForm = ({ onIndicadorCriado }) => {
  const [formData, setFormData] = useState({ name: "", sobrenome: "", cargo: "", telefone: "" });
  const [erro, setErro] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");  // Limpa qualquer erro anterior

    try {
      // Envia os dados do formulário para o servidor
      await axios.post(`${API_BASE_URL}/api/referencias/register-reference`, formData);

      // Limpa o formulário após o sucesso
      setFormData({ name: "", sobrenome: "", cargo: "", telefone: "" });
      
      // Chama a função para atualizar a lista de indicadores
      onIndicadorCriado();
    } catch (error) {
      // Verifica se o erro é relacionado à validação do servidor
      if (error.response) {
        // Caso o erro seja do tipo de validação (e.g., nome ou sobrenome ausentes)
        if (error.response.status === 400) {
          if (error.response.data.message.includes("Todos os campos são obrigatórios")) {
            setErro("Nome é obrigatório.");
          } else if (error.response.data.message.includes("Já existe uma referência com este nome e sobrenome")) {
            setErro("Já existe uma referência com este nome e sobrenome.");
          } else {
            setErro("Erro ao cadastrar referência. Tente novamente.");
          }
        }
      } else {
        setErro("Erro ao cadastrar referência. Tente novamente.");
      }

      console.error("Erro ao cadastrar indicador:", error);
    }
  };

  return (
    <div>
      <h4>Cadastrar Nova Referência</h4>
      {erro && <Alert variant="danger">{erro}</Alert>}
      <Form onSubmit={handleSubmit} className="p-3 border rounded">
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite o nome"
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label>Cargo</Form.Label>
          <Form.Control
            type="text"
            name="cargo"
            value={formData.cargo}
            onChange={handleChange}
            placeholder="Digite o cargo do indicador"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            placeholder="Digite o telefone do indicador"
          />
        </Form.Group>
        <Button variant="primary" type="submit">Cadastrar</Button>
      </Form>
    </div>
  );
};

export default IndicadorForm;
