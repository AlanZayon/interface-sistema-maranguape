import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Form,
  Dropdown,
  InputGroup,
  Badge,
  Spinner,
} from "react-bootstrap";
import * as referenciasApi from "@shared/api/referencias";
import * as funcionariosApi from "@shared/api/funcionarios";
import ReferenciaField from "./ReferenciaField";

const NATUREZAS = [
  { value: "COMISSIONADO", label: "Comissionado", short: "C" },
  { value: "TEMPORARIO", label: "Temporário", short: "T" },
  { value: "EFETIVO", label: "Efetivo", short: "E" },
];

function groupCargosBySimbologia(cargos) {
  const grouped = {};
  cargos.forEach((cargo) => {
    if (!grouped[cargo.simbologia]) {
      grouped[cargo.simbologia] = {
        simbologia: cargo.simbologia,
        limite: cargo.simbologiaInfo?.limite ?? 0,
        cargos: [],
      };
    }
    grouped[cargo.simbologia].cargos.push(cargo);
  });
  return Object.values(grouped);
}

function toDateInput(value) {
  if (!value || value === "indeterminado") return "";
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Campos condicionais por natureza + seletor segmentado.
 *
 * @param {{
 *   user: Record<string, any>,
 *   setUser: (updater: any) => void,
 *   errors?: Record<string, string>,
 *   contratoIndeterminado: boolean,
 *   setContratoIndeterminado: (v: boolean) => void,
 *   onReferenciasLoaded?: (refs: Array<{name: string}>) => void,
 * }} props
 */
export default function NaturezaFields({
  user,
  setUser,
  errors = {},
  contratoIndeterminado,
  setContratoIndeterminado,
  onReferenciasLoaded,
}) {
  const [referencias, setReferencias] = useState([]);
  const [loadingReferencias, setLoadingReferencias] = useState(true);
  const [cargosComissionados, setCargosComissionados] = useState([]);
  const [salarios, setSalarios] = useState([]);
  const [searchSalario, setSearchSalario] = useState("");
  const [searchCargo, setSearchCargo] = useState("");
  const [showSalarioDropdown, setShowSalarioDropdown] = useState(false);
  const [showCargoDropdown, setShowCargoDropdown] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [prevFimContrato, setPrevFimContrato] = useState(null);

  const apply = (fields) => {
    setUser((prev) => ({ ...prev, ...fields }));
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingReferencias(true);
    referenciasApi
      .getReferencias()
      .then((data) => {
        if (cancelled) return;
        const list = data.referencias || data || [];
        setReferencias(list);
        onReferenciasLoaded?.(list);
      })
      .catch((err) => console.error("Erro ao obter referências:", err))
      .finally(() => {
        if (!cancelled) setLoadingReferencias(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onReferenciasLoaded]);

  useEffect(() => {
    if (user?.natureza !== "COMISSIONADO") return;
    let cancelled = false;
    setLoadingCargos(true);
    funcionariosApi
      .buscarCargos()
      .then((data) => {
        if (cancelled) return;
        setCargosComissionados(data || []);
        const unique = [...new Set((data || []).map((c) => c.aDefinir))];
        setSalarios(unique);
      })
      .catch((err) => console.error("Erro ao buscar cargos:", err))
      .finally(() => {
        if (!cancelled) setLoadingCargos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.natureza]);

  const cargos = useMemo(() => {
    if (!user?.salarioBruto) return [];
    return cargosComissionados.filter(
      (c) => c.aDefinir === Number(user.salarioBruto)
    );
  }, [user?.salarioBruto, cargosComissionados]);

  const filteredSalarios = useMemo(
    () =>
      salarios.filter((s) =>
        String(s).toLowerCase().includes(searchSalario.toLowerCase())
      ),
    [salarios, searchSalario]
  );

  const filteredCargos = useMemo(
    () =>
      cargos.filter((c) =>
        c.cargo.toLowerCase().includes(searchCargo.toLowerCase())
      ),
    [cargos, searchCargo]
  );

  const groupedCargos = useMemo(
    () => groupCargosBySimbologia(filteredCargos),
    [filteredCargos]
  );

  useEffect(() => {
    if (!user?.funcao || cargos.length === 0) return;
    const selected = cargos.find((c) => c.cargo === user.funcao);
    if (selected && selected.tipo !== user.tipo) {
      apply({ tipo: selected.tipo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.funcao, cargos]);

  const selectNatureza = (natureza) => {
    if (natureza === user?.natureza) return;
    apply({
      natureza,
      salarioBruto: "",
      funcao: "",
      tipo: "",
      inicioContrato: natureza === "TEMPORARIO" ? user?.inicioContrato || "" : "",
      fimContrato: natureza === "TEMPORARIO" ? user?.fimContrato || "" : "",
      referencia: natureza === "EFETIVO" ? "" : user?.referencia || "",
    });
    if (natureza !== "TEMPORARIO") {
      setContratoIndeterminado(false);
    }
  };

  return (
    <div className="natureza-fields">
      <Form.Group className="mb-3" data-field="natureza">
        <Form.Label>
          Natureza do cargo <span className="text-danger">*</span>
        </Form.Label>
        <div
          className="natureza-segment"
          role="radiogroup"
          aria-label="Natureza do cargo"
        >
          {NATUREZAS.map((opt) => {
            const active = user?.natureza === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`natureza-segment__btn${active ? " is-active" : ""}`}
                onClick={() => selectNatureza(opt.value)}
              >
                <span className="natureza-segment__short">{opt.short}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        {errors.natureza ? (
          <div className="text-danger small mt-1" role="alert">
            {errors.natureza}
          </div>
        ) : null}
      </Form.Group>

      {user?.natureza && user.natureza !== "EFETIVO" ? (
        <div className="mb-3">
          <ReferenciaField
            value={user?.referencia || ""}
            onChange={(referencia) => apply({ referencia })}
            referencias={referencias}
            loading={loadingReferencias}
            required={user.natureza === "COMISSIONADO"}
            optional={user.natureza === "TEMPORARIO"}
            error={errors.referencia}
          />
        </div>
      ) : null}

      {user?.natureza === "COMISSIONADO" ? (
        <Row className="g-3">
          <Col md={6}>
            <Form.Group data-field="salarioBruto">
              <Form.Label>
                Salário bruto <span className="text-danger">*</span>
              </Form.Label>
              {loadingCargos ? (
                <div className="text-muted small d-flex align-items-center gap-2 py-2">
                  <Spinner animation="border" size="sm" />
                  Carregando faixas salariais…
                </div>
              ) : (
                <Dropdown
                  show={showSalarioDropdown}
                  onToggle={setShowSalarioDropdown}
                >
                  <Dropdown.Toggle
                    variant="light"
                    id="dropdown-salario"
                    className="w-100 d-flex justify-content-between align-items-center form-select-toggle"
                  >
                    {user.salarioBruto ? (
                      <span>
                        R${" "}
                        {Number(user.salarioBruto).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <span className="text-muted">Selecione o salário</span>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    className="w-100 p-2"
                    style={{ maxHeight: 280, overflowY: "auto" }}
                    role="listbox"
                  >
                    <InputGroup size="sm" className="mb-2 sticky-top bg-white">
                      <Form.Control
                        type="text"
                        placeholder="Pesquisar"
                        value={searchSalario}
                        onChange={(e) => setSearchSalario(e.target.value)}
                        autoFocus
                      />
                    </InputGroup>
                    {filteredSalarios.map((salario) => (
                      <Dropdown.Item
                        key={salario}
                        role="option"
                        active={Number(user.salarioBruto) === Number(salario)}
                        onClick={() => {
                          apply({
                            salarioBruto: Number(salario),
                            funcao: "",
                            tipo: "",
                          });
                          setShowSalarioDropdown(false);
                        }}
                      >
                        R${" "}
                        {Number(salario).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              )}
              {errors.salarioBruto ? (
                <div className="text-danger small mt-1">{errors.salarioBruto}</div>
              ) : null}
            </Form.Group>
          </Col>

          {user.salarioBruto ? (
            <Col md={6}>
              <Form.Group data-field="funcao">
                <Form.Label>
                  Cargo <span className="text-danger">*</span>
                </Form.Label>
                <Dropdown
                  show={showCargoDropdown}
                  onToggle={setShowCargoDropdown}
                >
                  <Dropdown.Toggle
                    variant="light"
                    id="dropdown-cargo"
                    className="w-100 d-flex justify-content-between align-items-center form-select-toggle"
                  >
                    <span className="text-truncate">
                      {user.funcao || (
                        <span className="text-muted">Selecione o cargo</span>
                      )}
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    className="w-100 p-2"
                    style={{ maxHeight: 320, overflowY: "auto", minWidth: 280 }}
                    role="listbox"
                  >
                    <InputGroup size="sm" className="mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Pesquisar cargo"
                        value={searchCargo}
                        onChange={(e) => setSearchCargo(e.target.value)}
                        autoFocus
                      />
                    </InputGroup>
                    {groupedCargos.length === 0 ? (
                      <Dropdown.Item disabled>Nenhum cargo encontrado</Dropdown.Item>
                    ) : (
                      groupedCargos.map((grupo) => (
                        <React.Fragment key={grupo.simbologia}>
                          <Dropdown.Header className="d-flex justify-content-between align-items-center">
                            <span>Simbologia: {grupo.simbologia}</span>
                            <Badge bg={grupo.limite === 0 ? "danger" : "success"}>
                              Limite: {grupo.limite}
                            </Badge>
                          </Dropdown.Header>
                          {grupo.cargos.map((cargo) => (
                            <Dropdown.Item
                              key={cargo.cargo}
                              role="option"
                              disabled={grupo.limite === 0}
                              title={
                                grupo.limite === 0
                                  ? "Cota esgotada para esta simbologia"
                                  : cargo.cargo
                              }
                              active={user.funcao === cargo.cargo}
                              onClick={() => {
                                apply({
                                  funcao: cargo.cargo,
                                  tipo: cargo.tipo || "",
                                });
                                setShowCargoDropdown(false);
                              }}
                            >
                              <span className="d-block">{cargo.cargo}</span>
                              {cargo.tipo ? (
                                <small className="text-muted">
                                  Tipo: {cargo.tipo}
                                </small>
                              ) : null}
                              {grupo.limite === 0 ? (
                                <small className="text-danger d-block">
                                  Cota esgotada
                                </small>
                              ) : null}
                            </Dropdown.Item>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                {errors.funcao ? (
                  <div className="text-danger small mt-1">{errors.funcao}</div>
                ) : null}
              </Form.Group>
            </Col>
          ) : null}
        </Row>
      ) : null}

      {(user?.natureza === "EFETIVO" || user?.natureza === "TEMPORARIO") && (
        <Row className="g-3 mt-1">
          <Col md={6}>
            <Form.Group controlId="form-salario" data-field="salarioBruto">
              <Form.Label>
                Salário bruto <span className="text-danger">*</span>
              </Form.Label>
              <InputGroup>
                <InputGroup.Text>R$</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="0,00"
                  value={user?.salarioBruto ?? ""}
                  onChange={(e) => apply({ salarioBruto: e.target.value })}
                  isInvalid={!!errors.salarioBruto}
                  step="0.01"
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.salarioBruto}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="form-funcao" data-field="funcao">
              <Form.Label>
                Função <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite a função"
                value={user?.funcao || ""}
                onChange={(e) => apply({ funcao: e.target.value })}
                isInvalid={!!errors.funcao}
              />
              <Form.Control.Feedback type="invalid">
                {errors.funcao}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      )}

      {user?.natureza === "TEMPORARIO" ? (
        <Row className="g-3 mt-1">
          <Col md={6}>
            <Form.Group controlId="form-inicioContrato" data-field="inicioContrato">
              <Form.Label>
                Início do contrato <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={toDateInput(user?.inicioContrato)}
                onChange={(e) => apply({ inicioContrato: e.target.value })}
                isInvalid={!!errors.inicioContrato}
              />
              <Form.Control.Feedback type="invalid">
                {errors.inicioContrato}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="form-fimContrato" data-field="fimContrato">
              <Form.Label>
                Término do contrato
                {!contratoIndeterminado ? (
                  <span className="text-danger"> *</span>
                ) : null}
              </Form.Label>
              <Form.Control
                type="date"
                value={
                  contratoIndeterminado
                    ? ""
                    : toDateInput(user?.fimContrato)
                }
                onChange={(e) => apply({ fimContrato: e.target.value })}
                isInvalid={!!errors.fimContrato}
                min={toDateInput(user?.inicioContrato) || undefined}
                disabled={contratoIndeterminado}
                className="mb-2"
              />
              <Form.Check
                type="switch"
                id="contrato-indeterminado"
                label="Contrato indeterminado"
                checked={contratoIndeterminado}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setContratoIndeterminado(checked);
                  if (checked) {
                    if (
                      user?.fimContrato &&
                      user.fimContrato !== "indeterminado"
                    ) {
                      setPrevFimContrato(user.fimContrato);
                    }
                    apply({ fimContrato: "indeterminado" });
                  } else {
                    apply({ fimContrato: prevFimContrato || "" });
                  }
                }}
              />
              {errors.fimContrato ? (
                <div className="text-danger small mt-1">{errors.fimContrato}</div>
              ) : null}
              {contratoIndeterminado ? (
                <Form.Text className="text-muted">
                  Contrato sem data de término definida
                </Form.Text>
              ) : user?.inicioContrato &&
                user?.fimContrato &&
                user.fimContrato !== "indeterminado" ? (
                <Form.Text className="text-muted">
                  Duração:{" "}
                  {Math.floor(
                    (new Date(user.fimContrato) -
                      new Date(user.inicioContrato)) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  dias
                </Form.Text>
              ) : null}
            </Form.Group>
          </Col>
        </Row>
      ) : null}
    </div>
  );
}
