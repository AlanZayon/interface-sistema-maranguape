import { AppModal, AppModalFooter, AppNotice, LoadingState } from "@shared/ui";
import ReferenciaChain from "./ReferenciaChain";
import ReferenciaTree from "./ReferenciaTree";
import {
  useAncestraisReferencia,
  useDescendentesReferencia,
} from "../hooks/useReferencias";

/**
 * Mostra a navegação nos dois sentidos a partir de uma referência: a cadeia que
 * sobe até a raiz e a subárvore que desce até os funcionários.
 */
export default function ReferenciaDetailModal({
  referenciaId,
  nome,
  onHide,
  onSelectNode,
}) {
  const ancestrais = useAncestraisReferencia(referenciaId);
  const descendentes = useDescendentesReferencia(referenciaId);

  const cadeia = ancestrais.data?.cadeia || [];
  const subarvore = descendentes.data?.arvore
    ? [descendentes.data.arvore]
    : [];
  const carregando = ancestrais.isLoading || descendentes.isLoading;
  const erro = ancestrais.error || descendentes.error;

  return (
    <AppModal
      show={Boolean(referenciaId)}
      onHide={onHide}
      title={nome || "Referência"}
      subtitle="Cadeia de indicação e indicações feitas"
      icon="bi-diagram-3"
      size="lg"
      footer={<AppModalFooter onCancel={onHide} cancelLabel="Fechar" />}
    >
      {erro ? (
        <AppNotice variant="danger">
          {erro.response?.data?.message ||
            "Não foi possível carregar a hierarquia desta referência."}
        </AppNotice>
      ) : null}

      {carregando ? (
        <LoadingState label="Carregando hierarquia..." />
      ) : (
        <>
          <section className="mb-4">
            <h3 className="app-form-section__title">Indicada por</h3>
            {cadeia.length > 1 ? (
              <ReferenciaChain cadeia={cadeia} />
            ) : (
              <p className="text-muted small mb-0">
                Esta é uma referência raiz — não foi indicada por ninguém.
              </p>
            )}
          </section>

          <section>
            <h3 className="app-form-section__title">Indicações</h3>
            <ReferenciaTree
              key={referenciaId}
              nodes={subarvore}
              onSelect={onSelectNode}
              searchable={false}
              emptyTitle="Nenhuma indicação"
              emptyDescription="Esta referência ainda não indicou ninguém."
            />
          </section>
        </>
      )}
    </AppModal>
  );
}
