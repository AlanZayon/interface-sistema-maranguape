import { useState } from "react";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import * as referenciasApi from "@shared/api/referencias";

const IndicadorForm = ({ onIndicadorCriado }) => {
  const [formData, setFormData] = useState({ name: "", sobrenome: "", cargo: "", telefone: "" });
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      await referenciasApi.createReferencia(formData);

      setFormData({ name: "", sobrenome: "", cargo: "", telefone: "" });
      onIndicadorCriado();
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          const msg = error.response.data?.message || "";
          if (msg.includes("Todos os campos são obrigatórios")) {
            setErro("Nome é obrigatório.");
          } else if (msg.includes("Já existe uma referência com este nome e sobrenome")) {
            setErro("Já existe uma referência com este nome e sobrenome.");
          } else {
            setErro(msg || "Erro ao cadastrar referência. Tente novamente.");
          }
        } else {
          setErro(error.response.data?.message || "Erro ao cadastrar referência. Tente novamente.");
        }
      } else {
        setErro("Erro ao cadastrar referência. Tente novamente.");
      }

      console.error("Erro ao cadastrar indicador:", error);
    } finally {
      setIsLoading(false);
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
        <Button 
          variant="primary" 
          type="submit"
          disabled={isLoading} // Desabilita o botão durante o carregamento
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'} {/* Altera o texto durante o carregamento */}
        </Button>
      </Form>
    </div>
  );
};

export default IndicadorForm;