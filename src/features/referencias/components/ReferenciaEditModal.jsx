import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { AppModal, AppModalFooter, AppNotice } from "@shared/ui";
import ReferenciaParentSelect from "./ReferenciaParentSelect";
import { useAtualizarReferencia } from "../hooks/useReferencias";

/** Edita os dados e, principalmente, a posição da referência na hierarquia. */
export default function ReferenciaEditModal({ referencia, onHide }) {
  const [form, setForm] = useState({ name: "", cargo: "", telefone: "" });
  const [parentId, setParentId] = useState("");
  const [erro, setErro] = useState("");

  const atualizar = useAtualizarReferencia({
    onSuccess: () => onHide(),
    onError: (error) =>
      setErro(
        error.response?.data?.message ||
          "Não foi possível atualizar a referência."
      ),
  });

  useEffect(() => {
    if (!referencia) return;
    setForm({
      name: referencia.name || "",
      cargo: referencia.cargo || "",
      telefone: referencia.telefone || "",
    });
    setParentId(referencia.parentId ? String(referencia.parentId) : "");
    setErro("");
  }, [referencia]);

  const submit = () => {
    setErro("");
    atualizar.mutate({
      id: referencia._id,
      name: form.name,
      cargo: form.cargo,
      telefone: form.telefone,
      parentId: parentId || null,
    });
  };

  return (
    <AppModal
      show={Boolean(referencia)}
      onHide={onHide}
      title="Editar referência"
      subtitle="Altere os dados ou mova a referência para outro ponto da hierarquia."
      icon="bi-diagram-2"
      preventClose={atualizar.isPending}
      footer={
        <AppModalFooter
          onCancel={onHide}
          onConfirm={submit}
          confirmLabel="Salvar"
          loading={atualizar.isPending}
          disableConfirm={!form.name.trim()}
        />
      }
    >
      {erro ? <AppNotice variant="danger">{erro}</AppNotice> : null}

      <Form.Group className="mb-3" controlId="referencia-edit-name">
        <Form.Label>Nome</Form.Label>
        <Form.Control
          type="text"
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="referencia-edit-cargo">
        <Form.Label>Cargo</Form.Label>
        <Form.Control
          type="text"
          value={form.cargo}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, cargo: event.target.value }))
          }
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="referencia-edit-telefone">
        <Form.Label>Telefone</Form.Label>
        <Form.Control
          type="text"
          value={form.telefone}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, telefone: event.target.value }))
          }
        />
      </Form.Group>

      <ReferenciaParentSelect
        value={parentId}
        onChange={(id) => setParentId(id || "")}
        excludeId={referencia?._id}
        id="referencia-edit-parent"
        helpText="Descendentes desta referência não aparecem na lista, para evitar ciclos."
      />
    </AppModal>
  );
}
