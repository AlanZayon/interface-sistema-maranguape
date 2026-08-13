import { useMemo, useState } from "react";
import { Table, Button, Pagination, Card, Badge } from "react-bootstrap";
import { EmptyState, ConfirmDialog, AppNotice } from "@shared/ui";
import ReferenciaEditModal from "./ReferenciaEditModal";
import {
  useExcluirReferencia,
  useImpactoExclusao,
} from "../hooks/useReferencias";

const ITEMS_PER_PAGE = 20;

/** Descreve o que acontece com os filhos da referência que será excluída. */
function DeleteMessage({ referencia, impacto, carregando }) {
  const total = impacto
    ? impacto.filhos.referencias + impacto.filhos.funcionarios
    : 0;

  return (
    <>
      <p className="mb-2">
        Tem certeza que deseja excluir <strong>{referencia?.name}</strong>?
      </p>
      {carregando ? (
        <p className="text-muted small mb-0">Verificando indicações…</p>
      ) : total === 0 ? (
        <p className="text-muted small mb-0">
          Esta referência não possui indicações vinculadas.
        </p>
      ) : (
        <p className="small mb-0">
          {impacto.filhos.referencias > 0
            ? `${impacto.filhos.referencias} referência(s)`
            : null}
          {impacto.filhos.referencias > 0 && impacto.filhos.funcionarios > 0
            ? " e "
            : null}
          {impacto.filhos.funcionarios > 0
            ? `${impacto.filhos.funcionarios} funcionário(s)`
            : null}{" "}
          {impacto.novoParent ? (
            <>
              passarão a ser indicados por{" "}
              <strong>{impacto.novoParent.name}</strong>.
            </>
          ) : (
            <>ficarão sem indicador e se tornarão referências raiz.</>
          )}
        </p>
      )}
    </>
  );
}

const IndicadorList = ({ indicadores = [], onVerArvore }) => {
  const [erro, setErro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [toEdit, setToEdit] = useState(null);

  const excluir = useExcluirReferencia({
    onSuccess: () => setToDelete(null),
    onError: (error) =>
      setErro(
        error.response?.data?.message ||
          "Erro ao excluir referência. Tente novamente."
      ),
  });
  const { data: impacto, isLoading: carregandoImpacto } = useImpactoExclusao(
    toDelete?._id
  );

  const nomePorId = useMemo(() => {
    const mapa = new Map();
    indicadores.forEach((item) => mapa.set(String(item._id), item.name));
    return mapa;
  }, [indicadores]);

  const totalPages = Math.ceil(indicadores.length / ITEMS_PER_PAGE) || 1;
  const page = Math.min(currentPage, totalPages);
  const currentItems = indicadores.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (!indicadores.length) {
    return (
      <EmptyState
        icon="bi-sliders"
        title="Nenhuma referência cadastrada"
        description="Cadastre um funcionário existente ou uma referência externa."
      />
    );
  }

  return (
    <div>
      {erro ? <AppNotice variant="danger">{erro}</AppNotice> : null}

      <Card className="border">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th>Indicado por</th>
                <th>Origem</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((indicador) => {
                const parentName = indicador.parentId
                  ? nomePorId.get(String(indicador.parentId))
                  : null;
                const excluindo =
                  excluir.isPending && toDelete?._id === indicador._id;

                return (
                  <tr key={indicador._id}>
                    <td>{`${indicador.name || ""}`.trim()}</td>
                    <td>
                      {parentName ? (
                        parentName
                      ) : indicador.parentId ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <Badge bg="success-subtle" text="success-emphasis">
                          Raiz
                        </Badge>
                      )}
                    </td>
                    <td>
                      {indicador.origem === "funcionario" ||
                      indicador.funcionarioId
                        ? "Funcionário"
                        : "Externa"}
                    </td>
                    <td>{indicador.cargo || "—"}</td>
                    <td>{indicador.telefone || "—"}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        {onVerArvore ? (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => onVerArvore(indicador)}
                          >
                            Ver árvore
                          </Button>
                        ) : null}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setToEdit(indicador)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setErro("");
                            setToDelete(indicador);
                          }}
                          disabled={excluindo}
                        >
                          {excluindo ? "Excluindo..." : "Excluir"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={Boolean(toDelete)}
        onHide={() => setToDelete(null)}
        onConfirm={() => excluir.mutate(toDelete._id)}
        title="Excluir referência"
        message={
          <DeleteMessage
            referencia={toDelete}
            impacto={impacto}
            carregando={carregandoImpacto}
          />
        }
        confirmLabel="Excluir"
        loading={excluir.isPending}
      />

      <ReferenciaEditModal
        referencia={toEdit}
        onHide={() => setToEdit(null)}
      />

      {indicadores.length > ITEMS_PER_PAGE && (
        <Pagination className="justify-content-center mt-3 mb-0">
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={page === 1}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage(Math.max(page - 1, 1))}
            disabled={page === 1}
          />
          <Pagination.Item active>{page}</Pagination.Item>
          <Pagination.Next
            onClick={() => setCurrentPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={page === totalPages}
          />
        </Pagination>
      )}
    </div>
  );
};

export default IndicadorList;
