import { useState } from "react";
import { Table, Button, Pagination, Card } from "react-bootstrap";
import * as referenciasApi from "@shared/api/referencias";
import { EmptyState, ConfirmDialog, AppNotice } from "@shared/ui";

const IndicadorList = ({ indicadores, setIndicadores }) => {
  const [erro, setErro] = useState("");
  const [loadingIds, setLoadingIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const itemsPerPage = 20;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = indicadores.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = async (id) => {
    setLoadingIds((prev) => [...prev, id]);
    setErro("");

    try {
      await referenciasApi.deleteReferencia(id);
      setIndicadores(indicadores.filter((indicador) => indicador._id !== id));

      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setToDelete(null);
    } catch (error) {
      setErro(
        error.response?.data?.message ||
          "Erro ao excluir indicador. Tente novamente."
      );
      console.error("Erro ao excluir indicador:", error);
    } finally {
      setLoadingIds((prev) => prev.filter((item) => item !== id));
    }
  };

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
                <th>Origem</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((indicador) => (
                <tr key={indicador._id}>
                  <td>{`${indicador.name || ""}`.trim()}</td>
                  <td>
                    {indicador.origem === "funcionario" || indicador.funcionarioId
                      ? "Funcionário"
                      : "Externa"}
                  </td>
                  <td>{indicador.cargo || "—"}</td>
                  <td>{indicador.telefone || "—"}</td>
                  <td className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setToDelete(indicador)}
                      disabled={loadingIds.includes(indicador._id)}
                    >
                      {loadingIds.includes(indicador._id)
                        ? "Excluindo..."
                        : "Excluir"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={Boolean(toDelete)}
        onHide={() => setToDelete(null)}
        onConfirm={() => handleDelete(toDelete._id)}
        title="Excluir referência"
        message={`Tem certeza que deseja excluir "${toDelete?.name || ""}"?`}
        confirmLabel="Excluir"
        loading={toDelete ? loadingIds.includes(toDelete._id) : false}
      />

      {indicadores.length > itemsPerPage && (
        <Pagination className="justify-content-center mt-3 mb-0">
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          />
          <Pagination.Item active>{currentPage}</Pagination.Item>
          <Pagination.Next
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(indicadores.length / itemsPerPage))
              )
            }
            disabled={
              currentPage === Math.ceil(indicadores.length / itemsPerPage)
            }
          />
          <Pagination.Last
            onClick={() =>
              setCurrentPage(Math.ceil(indicadores.length / itemsPerPage))
            }
            disabled={
              currentPage === Math.ceil(indicadores.length / itemsPerPage)
            }
          />
        </Pagination>
      )}
    </div>
  );
};

export default IndicadorList;
