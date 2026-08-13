import { AppNotice, LoadingState } from "@shared/ui";
import ReferenciaChain from "./ReferenciaChain";
import { useCadeiaFuncionario } from "../hooks/useReferencias";

/**
 * Cadeia completa de indicação de um funcionário, subindo recursivamente até a
 * referência raiz. O backend resolve todos os níveis em uma requisição.
 */
export default function FuncionarioReferenciaChain({
  funcionarioId,
  enabled = true,
}) {
  const { data, isLoading, error } = useCadeiaFuncionario(funcionarioId, {
    enabled: enabled && Boolean(funcionarioId),
  });

  if (!funcionarioId) return null;
  if (isLoading) return <LoadingState label="Carregando cadeia..." />;
  if (error) {
    return (
      <AppNotice variant="danger">
        {error.response?.data?.message ||
          "Não foi possível carregar a cadeia de indicação."}
      </AppNotice>
    );
  }

  const cadeia = data?.cadeia || [];
  if (cadeia.length <= 1) {
    return (
      <p className="text-muted small mb-0">
        Este funcionário não possui referência vinculada.
      </p>
    );
  }

  return <ReferenciaChain cadeia={cadeia} />;
}
