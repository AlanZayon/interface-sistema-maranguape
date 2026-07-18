import { useState, useEffect } from "react";
import { IndicadorForm, IndicadorList } from "@features/referencias";
import { Tabs, Tab, Button, Alert } from "react-bootstrap";
import * as referenciasApi from "@shared/api/referencias";
import { PageHeader, AppBreadcrumb, LoadingState } from "@shared/ui";

const IndicadoresPage = () => {
  const [indicadores, setIndicadores] = useState([]);
  const [key, setKey] = useState("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleIndicadorCriado = () => {
    setKey("list");
    fetchIndicadores();
  };

  const fetchIndicadores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await referenciasApi.getReferencias();
      setIndicadores(data.referencias || data || []);
    } catch (err) {
      console.error("Erro ao carregar indicadores:", err);
      setError(
        err.response?.data?.message ||
          "Não foi possível carregar as referências. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (key === "list") {
      fetchIndicadores();
    }
  }, [key]);

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: "Início", to: "/estrutura" },
          { label: "Referências", active: true },
        ]}
      />
      <PageHeader
        title="Referências"
        subtitle="Cadastro e consulta de indicadores de referência"
        actions={
          key === "list" ? (
            <Button variant="primary" size="sm" onClick={() => setKey("form")}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Cadastrar
            </Button>
          ) : (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setKey("list")}
            >
              <i className="bi bi-list-ul me-1" aria-hidden="true" />
              Ver lista
            </Button>
          )
        }
      />

      <Tabs
        id="indicadores-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="list" title="Lista">
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <LoadingState label="Carregando referências..." />
          ) : (
            <IndicadorList
              indicadores={indicadores}
              setIndicadores={setIndicadores}
            />
          )}
        </Tab>
        <Tab eventKey="form" title="Cadastrar">
          <IndicadorForm onIndicadorCriado={handleIndicadorCriado} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default IndicadoresPage;
