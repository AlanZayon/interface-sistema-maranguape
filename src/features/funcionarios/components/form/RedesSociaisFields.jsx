import React from "react";
import { Row, Col, Form, Button } from "react-bootstrap";

/**
 * @param {{
 *   redesSociais: Array<{ nome: string, link: string }>,
 *   onChange: (next: Array<{ nome: string, link: string }>) => void,
 * }} props
 */
export default function RedesSociaisFields({
  redesSociais = [{ nome: "", link: "" }],
  onChange,
}) {
  const list =
    Array.isArray(redesSociais) && redesSociais.length > 0
      ? redesSociais
      : [{ nome: "", link: "" }];

  const updateAt = (index, fields) => {
    const next = list.map((item, i) =>
      i === index ? { ...item, ...fields } : item
    );
    onChange(next);
  };

  const removeAt = (index) => {
    if (list.length <= 1) {
      onChange([{ nome: "", link: "" }]);
      return;
    }
    onChange(list.filter((_, i) => i !== index));
  };

  const add = () => onChange([...list, { nome: "", link: "" }]);

  return (
    <div className="redes-sociais-fields">
      {list.map((rede, index) => (
        <div key={index} className="redes-sociais-fields__item">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small">Rede #{index + 1}</span>
            {list.length > 1 ? (
              <Button
                type="button"
                variant="outline-danger"
                size="sm"
                onClick={() => removeAt(index)}
                aria-label={`Remover rede ${index + 1}`}
              >
                <i className="bi bi-trash" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <Row className="g-2">
            <Col md={5}>
              <Form.Control
                type="text"
                placeholder="Nome (ex: LinkedIn)"
                value={rede.nome || ""}
                onChange={(e) => updateAt(index, { nome: e.target.value })}
              />
            </Col>
            <Col md={7}>
              <Form.Control
                type="url"
                placeholder="https://..."
                value={rede.link || ""}
                onChange={(e) => updateAt(index, { link: e.target.value })}
              />
            </Col>
          </Row>
        </div>
      ))}
      <Button type="button" variant="outline-primary" size="sm" onClick={add}>
        <i className="bi bi-plus-lg me-1" aria-hidden="true" />
        Adicionar rede social
      </Button>
    </div>
  );
}
