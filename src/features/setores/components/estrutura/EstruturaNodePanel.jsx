import React, { useState } from "react";
import {
  buildBreadcrumbItems,
  findAncestryInTree,
} from "../../utils/setorNavigation";
import { AppBreadcrumb, LoadingState } from "@shared/ui";
import { FuncionariosList } from "@features/funcionarios";
import EstruturaOverview from "./EstruturaOverview";
import EstruturaLotacaoPanel from "./EstruturaLotacaoPanel";

const TAB_KEY = "estrutura.painel.tab";
const TABS = ["funcionarios", "estrutura"];

function readStoredTab() {
  try {
    const stored = localStorage.getItem(TAB_KEY);
    if (TABS.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "funcionarios";
}

/**
 * Right-hand contextual panel for the Painel view (lista).
 * Organograma view is handled by OrganogramaWorkspace.
 */
export default function EstruturaNodePanel({
  nodes,
  selectedNode,
  selectedId,
  multiSelectIds = [],
  onClearMultiSelect,
  onSelect,
  onDeleted,
  loading,
}) {
  const [tab, setTab] = useState(readStoredTab);
  const ancestry = selectedId
    ? findAncestryInTree(nodes, selectedId)
    : null;
  const breadcrumbItems = buildBreadcrumbItems(ancestry);
  const showingMulti = multiSelectIds.length > 0;

  const changeTab = (next) => {
    if (!TABS.includes(next)) return;
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <LoadingState label="Carregando estrutura…" />;
  }

  if (showingMulti) {
    return (
      <div className="estrutura-panel">
        <div className="estrutura-panel__chrome">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <strong className="me-auto">Selecionados</strong>
            <span className="text-muted small">
              {multiSelectIds.length} setor(es)/subsetor(es)
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClearMultiSelect}
            >
              Limpar seleção
            </button>
          </div>
        </div>
        <div className="estrutura-panel__body">
          <FuncionariosList
            setorPathId="selected"
            departmentName="SELECIONADOS"
            idsDivisoes={multiSelectIds}
          />
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="estrutura-panel">
        <div className="estrutura-panel__chrome">
          <AppBreadcrumb items={breadcrumbItems} />
        </div>
        <div className="estrutura-panel__body">
          <EstruturaOverview
            node={null}
            nodes={nodes}
            onSelectChild={onSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="estrutura-panel">
      <div className="estrutura-panel__chrome">
        <AppBreadcrumb items={breadcrumbItems} />
        <div className="btn-group btn-group-sm mt-2" role="group">
          <button
            type="button"
            className={`btn btn-outline-secondary${tab === "funcionarios" ? " active" : ""}`}
            onClick={() => changeTab("funcionarios")}
          >
            Funcionários
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary${tab === "estrutura" ? " active" : ""}`}
            onClick={() => changeTab("estrutura")}
          >
            Estrutura
          </button>
        </div>
      </div>
      <div className="estrutura-panel__body">
        {tab === "funcionarios" ? (
          <EstruturaLotacaoPanel
            node={selectedNode}
            onDeleted={onDeleted}
          />
        ) : (
          <EstruturaOverview
            node={selectedNode}
            nodes={nodes}
            onSelectChild={onSelect}
          />
        )}
      </div>
    </div>
  );
}
