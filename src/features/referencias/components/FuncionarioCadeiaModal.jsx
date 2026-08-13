import { AppModal, AppModalFooter } from "@shared/ui";
import FuncionarioReferenciaChain from "./FuncionarioReferenciaChain";

/** Abre a cadeia de indicação a partir do card ou da linha do funcionário. */
export default function FuncionarioCadeiaModal({ funcionario, onHide }) {
  return (
    <AppModal
      show={Boolean(funcionario)}
      onHide={onHide}
      title="Cadeia de indicação"
      subtitle={funcionario?.nome}
      icon="bi-diagram-3"
      size="sm"
      footer={<AppModalFooter onCancel={onHide} cancelLabel="Fechar" />}
    >
      <FuncionarioReferenciaChain funcionarioId={funcionario?._id} />
    </AppModal>
  );
}
