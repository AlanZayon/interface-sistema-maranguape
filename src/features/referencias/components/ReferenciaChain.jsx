import { Badge } from "react-bootstrap";

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Cadeia linear de indicação, da raiz até o alvo. Recebe a cadeia já resolvida
 * pelo backend, de modo que qualquer profundidade é renderizada igual.
 */
export default function ReferenciaChain({ cadeia = [], emptyLabel = null }) {
  if (!cadeia.length) {
    return (
      <p className="text-muted mb-0 small">
        {emptyLabel || "Sem cadeia de indicação registrada."}
      </p>
    );
  }

  return (
    <ol className="referencia-chain" aria-label="Cadeia de indicação">
      {cadeia.map((node, index) => {
        const isAlvo = index === cadeia.length - 1;
        const isRaiz = index === 0;
        return (
          <li
            key={node.id}
            className={`referencia-chain__item${isAlvo ? " is-target" : ""}`}
          >
            <span
              className={`referencia-picker__avatar${
                node.tipo === "funcionario" ? " is-ext" : " is-func"
              }`}
              aria-hidden="true"
            >
              {initials(node.name)}
            </span>
            <span className="referencia-chain__body">
              <span className="referencia-chain__name">{node.name}</span>
              <span className="referencia-chain__sub text-muted">
                {node.cargo || "Sem cargo"}
                {node.telefone ? ` · ${node.telefone}` : ""}
              </span>
            </span>
            {isRaiz && cadeia.length > 1 ? (
              <Badge bg="success" className="referencia-chain__badge">
                Raiz
              </Badge>
            ) : null}
            {isAlvo && cadeia.length > 1 ? (
              <Badge bg="dark" className="referencia-chain__badge">
                {node.tipo === "funcionario" ? "Funcionário" : "Atual"}
              </Badge>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
