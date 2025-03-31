import { useState, useEffect } from "react";
import IndicadorForm from "./IndicadorForm";
import IndicadorList from "./IndicadorList";
import axios from "axios";
import { Container, Tabs, Tab } from "react-bootstrap";
import { API_BASE_URL } from '../utils/apiConfig';

const IndicadoresPage = () => {
  const [indicadores, setIndicadores] = useState([]);
  const [key, setKey] = useState("list");

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
      <h2 className="mt-4 mb-4 text-center">Gerenciamento de Referências</h2>
      <Tabs
        id="indicadores-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-4"
      >
        <Tab eventKey="list" title="Lista de Referências">
          <IndicadorList indicadores={indicadores} setIndicadores={setIndicadores}/>
        </Tab>
        <Tab eventKey="form" title="Cadastrar Referências">
          <IndicadorForm onIndicadorCriado={handleIndicadorCriado} />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default IndicadoresPage;