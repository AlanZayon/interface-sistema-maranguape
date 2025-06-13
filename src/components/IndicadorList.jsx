import { useState } from "react";
import axios from "axios";
import { Table, Button, Alert, Pagination } from "react-bootstrap";
import { API_BASE_URL } from '../utils/apiConfig';

const IndicadorList = ({ indicadores, setIndicadores }) => {
  const [erro, setErro] = useState("");
  const [loadingIds, setLoadingIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calcular itens para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = indicadores.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = async (id) => {
    setLoadingIds(prev => [...prev, id]);
    setErro("");

    try {
      await axios.delete(`${API_BASE_URL}/api/referencias/delete-referencia/${id}`);
      setIndicadores(indicadores.filter((indicador) => indicador._id !== id));
      
      // Ajustar página atual se a última página ficar vazia após exclusão
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      setErro("Erro ao excluir indicador. Tente novamente.");
      console.error("Erro ao excluir indicador:", error);
    } finally {
      setLoadingIds(prev => prev.filter(item => item !== id));
    }
  };

  return (
    <div>
      <h4>Lista de Referências</h4>
      {erro && <Alert variant="danger">{erro}</Alert>}
      
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cargo</th>
            <th>Telefone</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((indicador) => (
            <tr key={indicador._id}>
              <td>{`${indicador.name}`.trim()}</td>
              <td>{indicador.cargo}</td>
              <td>{indicador.telefone}</td>
              <td>
                <Button 
                  variant="danger" 
                  onClick={() => handleDelete(indicador._id)}
                  disabled={loadingIds.includes(indicador._id)}
                >
                  {loadingIds.includes(indicador._id) ? 'Excluindo...' : 'Excluir'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {indicadores.length > itemsPerPage && (
        <Pagination className="justify-content-center">
          <Pagination.First 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1} 
          />
          <Pagination.Prev 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
          />
          
          {/* Mostrar até 5 páginas ao redor da atual */}
          {Array.from({ length: Math.min(5, Math.ceil(indicadores.length / itemsPerPage)) }, (_, i) => {
            let pageNumber;
            const totalPages = Math.ceil(indicadores.length / itemsPerPage);
            
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <Pagination.Item
                key={pageNumber}
                active={pageNumber === currentPage}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </Pagination.Item>
            );
          })}
          
          <Pagination.Next 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(indicadores.length / itemsPerPage)))} 
            disabled={currentPage === Math.ceil(indicadores.length / itemsPerPage)} 
          />
          <Pagination.Last 
            onClick={() => setCurrentPage(Math.ceil(indicadores.length / itemsPerPage))} 
            disabled={currentPage === Math.ceil(indicadores.length / itemsPerPage)} 
          />
        </Pagination>
      )}
    </div>
  );
};

export default IndicadorList;