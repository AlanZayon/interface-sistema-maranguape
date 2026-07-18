import { useState, useEffect, useRef } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Badge,
  Table,
  Pagination,
  Card,
} from "react-bootstrap";
import * as referenciasApi from "@shared/api/referencias";
import * as funcionariosApi from "@shared/api/funcionarios";
import { AppNotice } from "@shared/ui";

const EMPTY_FORM = { name: "", cargo: "", telefone: "" };
const PAGE_SIZE = 15;

const IndicadorForm = ({ onIndicadorCriado }) => {
  const [modo, setModo] = useState("funcionario");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [natureza, setNatureza] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [funcao, setFuncao] = useState("");
  const [filtroOpcoes, setFiltroOpcoes] = useState({
    naturezas: [],
    secretarias: [],
    funcoes: [],
  });

  const [funcionarios, setFuncionarios] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (modo !== "funcionario") return;

    const requestId = ++requestIdRef.current;
    setTableLoading(true);
    setTableError("");

    funcionariosApi
      .buscarParaSelecao({
        q: debouncedQuery,
        natureza,
        secretaria,
        funcao,
        page,
        limit: PAGE_SIZE,
        incluirFiltros: page === 1 || filtroOpcoes.naturezas.length === 0,
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setFuncionarios(data.funcionarios || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        if (data.filtros) {
          setFiltroOpcoes({
            naturezas: data.filtros.naturezas || [],
            secretarias: data.filtros.secretarias || [],
            funcoes: data.filtros.funcoes || [],
          });
        }
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setFuncionarios([]);
        setTotal(0);
        setPages(1);
        setTableError("Não foi possível carregar os funcionários.");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setTableLoading(false);
      });
  }, [modo, debouncedQuery, natureza, secretaria, funcao, page]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModoChange = (novoModo) => {
    setModo(novoModo);
    setErro("");
    setFormData(EMPTY_FORM);
    setSearchQuery("");
    setDebouncedQuery("");
    setNatureza("");
    setSecretaria("");
    setFuncao("");
    setPage(1);
    setSelectedFuncionario(null);
  };

  const handleSelectFuncionario = (funcionario) => {
    setSelectedFuncionario(funcionario);
  };

  const clearSelectedFuncionario = () => {
    setSelectedFuncionario(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setNatureza("");
    setSecretaria("");
    setFuncao("");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || Boolean(natureza) || Boolean(secretaria) || Boolean(funcao);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      if (modo === "funcionario") {
        if (!selectedFuncionario?._id) {
          setErro("Selecione um funcionário na tabela.");
          setIsLoading(false);
          return;
        }
        await referenciasApi.createReferencia({
          funcionarioId: selectedFuncionario._id,
        });
      } else {
        await referenciasApi.createReferencia(formData);
      }

      setFormData(EMPTY_FORM);
      clearSelectedFuncionario();
      clearFilters();
      onIndicadorCriado();
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          const msg = error.response.data?.message || "";
          if (msg.includes("Todos os campos são obrigatórios")) {
            setErro("Nome é obrigatório.");
          } else if (
            msg.includes("Já existe uma referência com este nome") ||
            msg.includes("já está cadastrado como referência")
          ) {
            setErro(msg);
          } else {
            setErro(msg || "Erro ao cadastrar referência. Tente novamente.");
          }
        } else {
          setErro(
            error.response.data?.message ||
              "Erro ao cadastrar referência. Tente novamente."
          );
        }
      } else {
        setErro("Erro ao cadastrar referência. Tente novamente.");
      }

      console.error("Erro ao cadastrar indicador:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-3">Cadastrar Referência</h4>
      <p className="text-muted small mb-3">
        Referências são pessoas que podem indicar candidatos a cargos
        comissionados. Você pode vincular um funcionário já cadastrado ou
        registrar alguém externo à base.
      </p>

      {erro ? <AppNotice variant="danger">{erro}</AppNotice> : null}

      <Form onSubmit={handleSubmit} className="p-3 border rounded">
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Tipo de cadastro</Form.Label>
          <div className="d-flex flex-wrap gap-3">
            <Form.Check
              type="radio"
              id="modo-funcionario"
              name="modo"
              label="Funcionário existente"
              checked={modo === "funcionario"}
              onChange={() => handleModoChange("funcionario")}
            />
            <Form.Check
              type="radio"
              id="modo-externa"
              name="modo"
              label="Nova referência (externa)"
              checked={modo === "externa"}
              onChange={() => handleModoChange("externa")}
            />
          </div>
        </Form.Group>

        {modo === "funcionario" ? (
          <div className="mb-3">
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Buscar</Form.Label>
                  <Form.Control
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nome, função, secretaria, bairro, cidade..."
                    autoComplete="off"
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Natureza</Form.Label>
                  <Form.Select
                    value={natureza}
                    onChange={(e) => {
                      setNatureza(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Todas</option>
                    {filtroOpcoes.naturezas.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Secretaria</Form.Label>
                  <Form.Select
                    value={secretaria}
                    onChange={(e) => {
                      setSecretaria(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Todas</option>
                    {filtroOpcoes.secretarias.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Função</Form.Label>
                  <Form.Select
                    value={funcao}
                    onChange={(e) => {
                      setFuncao(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Todas</option>
                    {filtroOpcoes.funcoes.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">
                {tableLoading
                  ? "Carregando..."
                  : `${total} funcionário${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}
              </small>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  type="button"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            {tableError ? (
              <AppNotice variant="danger">{tableError}</AppNotice>
            ) : null}

            {selectedFuncionario && (
              <div className="referencia-sample mb-3 d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-semibold">{selectedFuncionario.nome}</span>
                    <Badge bg="secondary">Selecionado</Badge>
                  </div>
                  {selectedFuncionario.funcao && (
                    <div className="small text-muted">
                      Função: {selectedFuncionario.funcao}
                    </div>
                  )}
                  {selectedFuncionario.secretaria && (
                    <div className="small text-muted">
                      Secretaria: {selectedFuncionario.secretaria}
                    </div>
                  )}
                  {selectedFuncionario.telefone && (
                    <div className="small text-muted">
                      Telefone: {selectedFuncionario.telefone}
                    </div>
                  )}
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  type="button"
                  onClick={clearSelectedFuncionario}
                >
                  Trocar
                </Button>
              </div>
            )}

            <Card className="border">
              <Card.Body className="p-0 position-relative">
                {tableLoading && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(255,255,255,0.6)", zIndex: 1 }}
                  >
                    <Spinner animation="border" size="sm" />
                  </div>
                )}
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Nome</th>
                      <th>Função</th>
                      <th>Secretaria</th>
                      <th>Natureza</th>
                      <th className="text-end">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.length === 0 && !tableLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Nenhum funcionário encontrado.
                        </td>
                      </tr>
                    ) : (
                      funcionarios.map((func) => {
                        const isSelected =
                          selectedFuncionario?._id === func._id;
                        return (
                          <tr
                            key={func._id}
                            className={isSelected ? "table-primary" : undefined}
                          >
                            <td>{func.nome}</td>
                            <td>{func.funcao || "—"}</td>
                            <td>{func.secretaria || "—"}</td>
                            <td>{func.natureza || "—"}</td>
                            <td className="text-end">
                              <Button
                                variant={
                                  isSelected ? "primary" : "outline-primary"
                                }
                                size="sm"
                                type="button"
                                onClick={() => handleSelectFuncionario(func)}
                              >
                                {isSelected ? "Selecionado" : "Selecionar"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {pages > 1 && (
              <Pagination className="justify-content-center mt-3 mb-0">
                <Pagination.First
                  onClick={() => setPage(1)}
                  disabled={page === 1 || tableLoading}
                />
                <Pagination.Prev
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || tableLoading}
                />
                <Pagination.Item active>{page}</Pagination.Item>
                <Pagination.Next
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages || tableLoading}
                />
                <Pagination.Last
                  onClick={() => setPage(pages)}
                  disabled={page >= pages || tableLoading}
                />
              </Pagination>
            )}
          </div>
        ) : (
          <>
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome completo"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Cargo</Form.Label>
              <Form.Control
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                placeholder="Digite o cargo"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="Digite o telefone"
              />
            </Form.Group>
          </>
        )}

        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </Form>
    </div>
  );
};

export default IndicadorForm;
