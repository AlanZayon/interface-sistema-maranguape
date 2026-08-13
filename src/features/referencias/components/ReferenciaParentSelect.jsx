import { useMemo } from "react";
import { Form } from "react-bootstrap";
import { useArvoreReferencias } from "../hooks/useReferencias";
import { collectIds, findNode, walkTree } from "../utils/tree";

/**
 * Escolhe a referência indicadora (parent). As opções são indentadas conforme a
 * profundidade e a própria referência e seus descendentes são removidos da
 * lista, o que impede o usuário de montar um ciclo antes mesmo do backend
 * recusar.
 */
export default function ReferenciaParentSelect({
  value = "",
  onChange,
  excludeId = null,
  label = "Indicado por",
  helpText = "Deixe em branco para que esta seja uma referência raiz.",
  disabled = false,
  id = "referencia-parent",
}) {
  const { data: arvore = [], isLoading } = useArvoreReferencias();

  const opcoes = useMemo(() => {
    const proibidos = new Set();
    if (excludeId) {
      proibidos.add(String(excludeId));
      const node = findNode(arvore, String(excludeId));
      collectIds(node ? [node] : []).forEach((childId) =>
        proibidos.add(childId)
      );
    }

    const lista = [];
    walkTree(arvore, (node, depth) => {
      if (node.tipo !== "referencia" || proibidos.has(node.id)) return;
      lista.push({ id: node.id, name: node.name, depth });
    });
    return lista;
  }, [arvore, excludeId]);

  return (
    <Form.Group controlId={id} className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={value || ""}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={disabled || isLoading}
      >
        <option value="">
          {isLoading ? "Carregando referências…" : "Nenhuma (referência raiz)"}
        </option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {`${"— ".repeat(opcao.depth)}${opcao.name}`}
          </option>
        ))}
      </Form.Select>
      {helpText ? (
        <Form.Text className="text-muted">{helpText}</Form.Text>
      ) : null}
    </Form.Group>
  );
}
