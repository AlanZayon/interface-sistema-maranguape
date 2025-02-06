import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { Modal, Button, Form, ListGroup, Spinner, Alert } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { API_BASE_URL } from '../utils/apiConfig';

function ObservationHistoryModal({ show, onHide, userId, initialObservations }) {
    const { setorId, '*': subPath } = useParams();
    const [observacoes, setObservacoes] = useState(initialObservations || []);
    const [newObservation, setNewObservation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const currentSetorId = subPath ? subPath.split('/').pop() : setorId;


    useEffect(() => {
        setObservacoes(initialObservations)
    }, [initialObservations]);

    const updateObservations = async (newObservations) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/funcionarios/observacoes/${userId}/${currentSetorId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ observacoes: newObservations }),
            });

            if (!response.ok) throw new Error("Erro ao atualizar observações");

            setObservacoes(newObservations);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddObservation = async () => {
        const trimmedObservation = newObservation.trim();
        if (!trimmedObservation || observacoes.includes(trimmedObservation)) return;

        await updateObservations([...observacoes, trimmedObservation]);
        setNewObservation("");
    };

    const handleDeleteObservation = async (index) => {
        const updatedObservations = observacoes.filter((_, i) => i !== index);
        await updateObservations(updatedObservations);
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Histórico de Observações</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <div
                    style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        padding: "10px",
                        borderRadius: "5px",
                        backgroundColor: "#f8f9fa"
                    }}
                >
                    {(observacoes || []).length > 0 ? (
                        <ListGroup variant="flush">
                            {observacoes.map((obs, index) => (
                                <ListGroup.Item
                                    key={index}
                                    className="d-flex justify-content-between align-items-center border rounded p-2 shadow-sm bg-white"
                                    style={{ marginBottom: "8px" }}
                                >
                                    <div>
                                        <span className="text-muted small">#{index + 1}</span>
                                        <p className="mb-0">{obs}</p>
                                    </div>
                                    <Button
                                        variant="outline-black"
                                        size="sm"
                                        onClick={() => handleDeleteObservation(index)}
                                        disabled={loading}
                                    >
                                        {loading ? <Spinner size="sm" animation="border" /> : <FaTrash size={16} />}
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <p className="text-muted">Nenhuma observação registrada.</p>
                    )}
                </div>
                <Form.Group className="mt-3">
                    <Form.Label>Nova Observação</Form.Label>
                    <Form.Control
                        type="text"
                        value={newObservation}
                        onChange={(e) => setNewObservation(e.target.value)}
                        placeholder="Digite uma observação..."
                        disabled={loading}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fechar
                </Button>
                <Button variant="primary" onClick={handleAddObservation} disabled={!newObservation.trim() || loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : "Adicionar Observação"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ObservationHistoryModal;
