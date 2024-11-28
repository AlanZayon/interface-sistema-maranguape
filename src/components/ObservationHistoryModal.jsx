import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

function ObservationHistoryModal({
    show,
    onHide,
    onAddObservation,
    observacoes,
}) {
    const [newObservation, setNewObservation] = useState("");

    const handleAddObservation = () => {
        const trimmedObservation = newObservation.trim();
        if (trimmedObservation) {
            if (!observacoes.includes(trimmedObservation)) {
                onAddObservation(trimmedObservation);
                setNewObservation("");
            } else {
                alert("Essa observação já foi adicionada."); // Feedback simples
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddObservation();
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Histórico de Observações</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {observacoes && observacoes.length > 0 ? (
                        <ul>
                            {observacoes.map((obs, index) => (
                                <li key={index}>{obs}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nenhuma observação registrada.</p>
                    )}
                </div>
                <Form.Group>
                    <Form.Label>Nova Observação</Form.Label>
                    <Form.Control
                        type="text"
                        value={newObservation}
                        onChange={(e) => setNewObservation(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fechar
                </Button>
                <Button variant="primary" onClick={handleAddObservation}>
                    Adicionar Observação
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ObservationHistoryModal;
