import { Form } from "react-bootstrap";
import { AppModal, AppModalFooter } from "@shared/ui";

const RelatorioTypeModal = ({
  show,
  onHide,
  onConfirm,
  selectedType,
  setSelectedType,
}) => {
  const reportTypes = [
    {
      value: "geral",
      label: "Relatório Geral",
      hint: "Visão completa dos dados dos funcionários selecionados",
    },
    {
      value: "salarial",
      label: "Relatório Salarial",
      hint: "Foco em remuneração e referências salariais",
    },
    {
      value: "referencias",
      label: "Relatório de Indicações",
      hint: "Indicadores e referências vinculadas",
    },
    {
      value: "localidade",
      label: "Relatório de Localidade",
      hint: "Endereço, bairro e cidade",
    },
  ];

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title="Tipo de relatório"
      subtitle="Escolha o formato e abra a pré-visualização para conferir ou gerar o PDF"
      icon="bi-file-earmark-text"
      footer={
        <AppModalFooter
          onCancel={onHide}
          onConfirm={onConfirm}
          cancelLabel="Cancelar"
          confirmLabel="Abrir pré-visualização"
          disableConfirm={!selectedType}
        />
      }
    >
      <Form>
        <div role="radiogroup" aria-label="Tipo de relatório">
          {reportTypes.map((type) => {
            const selected = selectedType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                className={`report-type-option${selected ? " is-selected" : ""}`}
                onClick={() => setSelectedType(type.value)}
                aria-pressed={selected}
              >
                <div className="d-flex align-items-start gap-2">
                  <Form.Check
                    type="radio"
                    checked={selected}
                    onChange={() => setSelectedType(type.value)}
                    id={`report-type-${type.value}`}
                    className="mt-1"
                    tabIndex={-1}
                  />
                  <div>
                    <div className="report-type-option__label">{type.label}</div>
                    <div className="report-type-option__hint">{type.hint}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Form>
    </AppModal>
  );
};

export default RelatorioTypeModal;
