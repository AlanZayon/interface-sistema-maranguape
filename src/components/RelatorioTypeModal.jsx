import { Modal, Button, Form } from 'react-bootstrap';
const RelatorioTypeModal = ({ 
  show, 
  onHide, 
  onConfirm, 
  selectedType, 
  setSelectedType 
}) => {
  const reportTypes = [
    { value: 'geral', label: 'Relatório Geral' },
    { value: 'salarial', label: 'Relatório Salarial' },
    { value: 'referencias', label: 'Relatório de Indicações' },
    { value: 'localidade', label: 'Relatório de Localidade' }
  ];

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Selecione o Tipo de Relatório</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {reportTypes.map((type) => (
            <Form.Check
              key={type.value}
              type="radio"
              id={`report-type-${type.value}`}
              label={type.label}
              checked={selectedType === type.value}
              onChange={() => setSelectedType(type.value)}
              className="mb-2"
            />
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Gerar Relatório
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RelatorioTypeModal;