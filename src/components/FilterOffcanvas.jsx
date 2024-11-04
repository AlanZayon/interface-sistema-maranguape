// components/FilterOffcanvas.js
import React, { useState } from 'react';
import { Offcanvas, Button, Form } from 'react-bootstrap';

// Estrutura recursiva de organogramas com subtópicos aninhados
const organogramaOptions = {
  "Gabinete de Comunicação": {
    subtópicos: {
      "Chefe da divisão de comunicação": {
        subtópicos: {
          "Planejamento da comunicação": {},
          "Projetos especiais de comunicação": {},
          "Captação de produto": {}
        }
      },
      "Comunicação institucional": {
        subtópicos: {
          "Gerente de controle da comunicação": {},
          "Gestor da unidade de direção de arte": {}
        }
      }
    }
  },
  "Relações Institucionais": {
    subtópicos: {
      "Gerente de controle da comunicação": {
        subtópicos: {
          "Chefe do setor de atendimento": {}
        }
      },
      "Gestor da unidade de direção de arte": {}
    }
  }
  // Adicione mais conforme necessário
};

// Componente recursivo para criar seletores de filtro aninhados
function RecursiveFilter({ options, level = 0, selectedValues, handleSelection }) {
  return (
    <>
      <Form.Group controlId={`filterLevel${level}`}>
        <Form.Label>{`Nível ${level + 1}`}</Form.Label>
        <Form.Control
          as="select"
          value={selectedValues[level] || ""}
          onChange={(e) => handleSelection(level, e.target.value)}
        >
          <option value="">Selecione</option>
          {Object.keys(options).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </Form.Control>
      </Form.Group>

      {/* Renderiza o próximo nível recursivamente, se houver subtópicos */}
      {selectedValues[level] && options[selectedValues[level]].subtópicos && (
        <RecursiveFilter
          options={options[selectedValues[level]].subtópicos}
          level={level + 1}
          selectedValues={selectedValues}
          handleSelection={handleSelection}
        />
      )}
    </>
  );
}

function FilterOffcanvas({ showFilter, handleCloseFilter }) {
  const [selectedValues, setSelectedValues] = useState({});

  const handleSelection = (level, value) => {
    setSelectedValues((prev) => {
      // Limpa os valores selecionados nos níveis abaixo do atual
      const newSelection = { ...prev };
      for (let i = level; i < Object.keys(prev).length; i++) {
        delete newSelection[i];
      }
      newSelection[level] = value;
      return newSelection;
    });
  };

  return (
    <Offcanvas show={showFilter} onHide={handleCloseFilter} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Filtros</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <Form.Group controlId="filterReferencia">
            <Form.Label className='m-2'>Referência</Form.Label>
            <Form.Control type="text" placeholder="Digite a referência (Ex: Chefe da divisão)" />
          </Form.Group>

          <Form.Group controlId="filterNaturezaCargo">
            <Form.Label className='m-2'>Natureza do Cargo</Form.Label>
            <Form.Control as="select">
              <option value="">Selecione a natureza</option>
              <option value="efetivo">Efetivo</option>
              <option value="temporario">Temporário</option>
              <option value="comissionado">Comissionado</option>
              <option value="estagio">Estágio</option>
            </Form.Control>
          </Form.Group>

          {/* Componentes de filtros recursivos */}
          <RecursiveFilter
            options={organogramaOptions}
            selectedValues={selectedValues}
            handleSelection={handleSelection}
          />

          <Button variant="primary" type="submit" className="mt-3">Aplicar Filtro</Button>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default FilterOffcanvas;
