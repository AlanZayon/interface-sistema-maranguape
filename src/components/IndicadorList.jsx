import { useState } from "react";
import axios from "axios";
import { Table, Button, Alert } from "react-bootstrap";
import { API_BASE_URL } from '../utils/apiConfig';

const IndicadorList = ({ indicadores, setIndicadores }) => {
  const [erro, setErro] = useState("");
  const [loadingIds, setLoadingIds] = useState([]); // Estado para controlar quais IDs estão em carregamento

  const handleDelete = async (id) => {
    setLoadingIds(prev => [...prev, id]); // Adiciona o ID à lista de carregamento
    setErro(""); // Limpa qualquer erro anterior

    try {
      await axios.delete(`${API_BASE_URL}/api/referencias/delete-referencia/${id}`);
      setIndicadores(indicadores.filter((indicador) => indicador._id !== id));
    } catch (error) {
      setErro("Erro ao excluir indicador. Tente novamente.");
      console.error("Erro ao excluir indicador:", error);
    } finally {
      setLoadingIds(prev => prev.filter(item => item !== id)); // Remove o ID da lista de carregamento
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
          {indicadores.map((indicador) => (
            <tr key={indicador._id}>
              <td>{`${indicador.name}`.trim()}</td>
              <td>{indicador.cargo}</td>
              <td>{indicador.telefone}</td>
              <td>
                <Button 
                  variant="danger" 
                  onClick={() => handleDelete(indicador._id)}
                  disabled={loadingIds.includes(indicador._id)} // Desabilita se estiver em carregamento
                >
                  {loadingIds.includes(indicador._id) ? 'Excluindo...' : 'Excluir'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default IndicadorList;