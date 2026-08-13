import { useState } from "react";
import { Tabs, Tab, Button } from "react-bootstrap";
import { PageHeader, AppBreadcrumb, LoadingState, AppNotice } from "@shared/ui";
import IndicadorForm from "./IndicadorForm";
import IndicadorList from "./IndicadorList";
import ReferenciaTree from "./ReferenciaTree";
import ReferenciaDetailModal from "./ReferenciaDetailModal";
import { useArvoreReferencias, useReferencias } from "../hooks/useReferencias";

const IndicadoresPage = () => {
  const [key, setKey] = useState("list");
  const [detalhe, setDetalhe] = useState(null);

  const lista = useReferencias();
  const arvore = useArvoreReferencias();

  const abrirDetalhe = (node) => {
    if (node?.tipo === "funcionario") return;
    setDetalhe({ id: node._id || node.id, name: node.name });
  };

  const erro =
    lista.error || arvore.error
      ? (lista.error || arvore.error)?.response?.data?.message ||
        "Não foi possível carregar as referências. Tente novamente."
      : null;

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
        subtitle="Hierarquia de indicações: quem indicou quem, até o funcionário final"
        actions={
          key === "form" ? (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setKey("list")}
            >
              <i className="bi bi-list-ul me-1" aria-hidden="true" />
              Ver lista
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setKey("form")}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Cadastrar
            </Button>
          )
        }
      />

      {erro ? <AppNotice variant="danger">{erro}</AppNotice> : null}

      <Tabs
        id="indicadores-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="list" title="Lista">
          {lista.isLoading ? (
            <LoadingState label="Carregando referências..." />
          ) : (
            <IndicadorList
              indicadores={lista.data || []}
              onVerArvore={abrirDetalhe}
            />
          )}
        </Tab>

        <Tab eventKey="tree" title="Árvore">
          {arvore.isLoading ? (
            <LoadingState label="Montando árvore de indicações..." />
          ) : (
            <ReferenciaTree
              nodes={arvore.data || []}
              onSelect={abrirDetalhe}
              selectedId={detalhe?.id || null}
            />
          )}
        </Tab>

        <Tab eventKey="form" title="Cadastrar">
          <IndicadorForm onIndicadorCriado={() => setKey("list")} />
        </Tab>
      </Tabs>

      <ReferenciaDetailModal
        referenciaId={detalhe?.id || null}
        nome={detalhe?.name}
        onHide={() => setDetalhe(null)}
        onSelectNode={abrirDetalhe}
      />
    </div>
  );
};

export default IndicadoresPage;
