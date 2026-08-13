import { useEffect, useMemo, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { EmptyState } from "@shared/ui";
import ReferenciaTreeNode from "./ReferenciaTreeNode";
import { collectExpandableIds, filterTree, treeDepth } from "../utils/tree";

/**
 * Árvore expansível de referências. Recebe a floresta já montada e delega a
 * recursão ao ReferenciaTreeNode.
 */
export default function ReferenciaTree({
  nodes = [],
  onSelect,
  selectedId = null,
  actions = null,
  searchable = true,
  defaultExpandedIds = null,
  emptyTitle = "Nenhuma referência cadastrada",
  emptyDescription = "Cadastre uma referência para começar a montar a hierarquia de indicações.",
}) {
  const [termo, setTermo] = useState("");
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(defaultExpandedIds ?? nodes.map((node) => node.id))
  );

  const visiveis = useMemo(() => filterTree(nodes, termo), [nodes, termo]);

  // Durante a busca todos os ramos que sobraram são relevantes, então abrem
  // automaticamente; sem termo, a escolha do usuário é preservada.
  useEffect(() => {
    if (!termo.trim()) return;
    setExpandedIds(new Set(collectExpandableIds(visiveis)));
  }, [termo, visiveis]);

  const toggle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandirTudo = () =>
    setExpandedIds(new Set(collectExpandableIds(nodes)));
  const recolherTudo = () => setExpandedIds(new Set());

  if (!nodes.length) {
    return (
      <EmptyState
        icon="bi-diagram-3"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="referencia-tree">
      <div className="referencia-tree__toolbar">
        {searchable ? (
          <InputGroup size="sm" className="referencia-tree__search">
            <InputGroup.Text>
              <i className="bi bi-search" aria-hidden="true" />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Buscar na árvore…"
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              aria-label="Buscar na árvore de referências"
            />
          </InputGroup>
        ) : null}

        <div className="referencia-tree__toolbar-actions">
          <Button variant="outline-secondary" size="sm" onClick={expandirTudo}>
            <i className="bi bi-arrows-expand me-1" aria-hidden="true" />
            Expandir tudo
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={recolherTudo}>
            <i className="bi bi-arrows-collapse me-1" aria-hidden="true" />
            Recolher tudo
          </Button>
          <span className="text-muted small">
            {nodes.length} {nodes.length === 1 ? "raiz" : "raízes"} ·{" "}
            {treeDepth(nodes)}{" "}
            {treeDepth(nodes) === 1 ? "nível" : "níveis"}
          </span>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <EmptyState
          icon="bi-search"
          title="Nenhum resultado"
          description={`Nada encontrado para “${termo.trim()}”.`}
        />
      ) : (
        <ul
          className="referencia-tree__root"
          role="tree"
          aria-label="Árvore de referências"
        >
          {visiveis.map((node) => (
            <ReferenciaTreeNode
              key={node.id}
              node={node}
              expandedIds={expandedIds}
              onToggle={toggle}
              onSelect={onSelect}
              selectedId={selectedId}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
