import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IndicadorForm from "./IndicadorForm";
import IndicadorList from "./IndicadorList";
import axios from "axios";
import { Container, Tabs, Tab, Button } from "react-bootstrap";
import { FiArrowLeft } from "react-icons/fi";
import { API_BASE_URL } from '../utils/apiConfig';

const IndicadoresPage = () => {
  const [indicadores, setIndicadores] = useState([]);
  const [key, setKey] = useState("list");
  const navigate = useNavigate();

  const handleIndicadorCriado = () => {
    setKey("list");
    fetchIndicadores();
  };

  const fetchIndicadores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/referencias/referencias-dados`);
      setIndicadores(response.data.referencias || []);
    } catch (error) {
      console.error("Erro ao carregar indicadores:", error);
    }
  };

  useEffect(() => {
    if (key === "list") {
      fetchIndicadores();
    }
  }, [key]);

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          variant="light"
          onClick={() => navigate(-1)}
          className="rounded-circle p-2 d-flex align-items-center justify-content-center back-button"
        >
          <FiArrowLeft size={20} style={{ color: "#495057" }} />
        </Button>
        <h2 className="mt-4 mb-4 text-center flex-grow-1">Gerenciamento de Referências</h2>
        <div style={{ width: "42px" }}></div>
      </div>

      <Tabs
        id="indicadores-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-4"
      >
        <Tab eventKey="list" title="Lista de Referências">
          <IndicadorList indicadores={indicadores} setIndicadores={setIndicadores} />
        </Tab>
        <Tab eventKey="form" title="Cadastrar Referências">
          <IndicadorForm onIndicadorCriado={handleIndicadorCriado} />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default IndicadoresPage;