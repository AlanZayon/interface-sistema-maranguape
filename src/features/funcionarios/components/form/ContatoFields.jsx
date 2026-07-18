import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { formatTelefone } from "../../utils/formatTelefone";

/**
 * @param {{
 *   user: Record<string, any>,
 *   setUser: (updater: any) => void,
 *   errors?: Record<string, string>,
 * }} props
 */
export default function ContatoFields({ user, setUser, errors = {} }) {
  const apply = (fields) => {
    setUser((prev) => ({ ...prev, ...fields }));
  };

  return (
    <Row className="g-3">
      <Col md={6}>
        <Form.Group controlId="form-cidade" data-field="cidade">
          <Form.Label>Cidade</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ex: Maranguape"
            value={user?.cidade || ""}
            onChange={(e) => apply({ cidade: e.target.value })}
            isInvalid={!!errors.cidade}
          />
          <Form.Control.Feedback type="invalid">
            {errors.cidade}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group controlId="form-endereco" data-field="endereco">
          <Form.Label>Endereço</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ex: Rua das Flores, 123"
            value={user?.endereco || ""}
            onChange={(e) => apply({ endereco: e.target.value })}
            isInvalid={!!errors.endereco}
          />
          <Form.Control.Feedback type="invalid">
            {errors.endereco}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group controlId="form-bairro" data-field="bairro">
          <Form.Label>Bairro</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ex: Centro"
            value={user?.bairro || ""}
            onChange={(e) => apply({ bairro: e.target.value })}
            isInvalid={!!errors.bairro}
          />
          <Form.Control.Feedback type="invalid">
            {errors.bairro}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group controlId="form-telefone" data-field="telefone">
          <Form.Label>Telefone</Form.Label>
          <Form.Control
            type="tel"
            inputMode="tel"
            placeholder="(85) 99999-9999"
            value={formatTelefone(user?.telefone || "")}
            onChange={(e) =>
              apply({ telefone: formatTelefone(e.target.value) })
            }
            isInvalid={!!errors.telefone}
          />
          <Form.Control.Feedback type="invalid">
            {errors.telefone}
          </Form.Control.Feedback>
        </Form.Group>
      </Col>
    </Row>
  );
}
