import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { FaExclamationTriangle, FaUsers } from 'react-icons/fa';
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

function ConfirmDeleteModal({
    showModal,
    handleClose,
    handleConfirmDelete,
    entityId,
    entityType
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasEmployees, setHasEmployees] = useState(false);
    const [checkingEmployees, setCheckingEmployees] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (showModal) {
            // Resetar estados quando o modal é aberto
            setHasEmployees(false);
            setError(null);
        }
    }, [showModal]);

    const checkForEmployees = async () => {
        setCheckingEmployees(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/funcionarios/${entityId}/has-funcionarios`);
            setHasEmployees(response.data.hasEmployees);
            return response.data.hasEmployees;
        } catch (err) {
            setError('Erro ao verificar funcionários. Por favor, tente novamente.');
            console.error('Error checking employees:', err);
            return true; // Assume que há funcionários para prevenir exclusão acidental
        } finally {
            setCheckingEmployees(false);
        }
    };

    const handleConfirmClick = async () => {
        const employeesExist = await checkForEmployees();

        if (employeesExist) {
            return; // Não prossegue com a exclusão
        }

        setIsDeleting(true);
        try {
            await handleConfirmDelete();
            handleClose();
        } catch (err) {
            setError('Erro ao excluir. Por favor, tente novamente.');
            console.error('Error deleting:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal show={showModal} onHide={isDeleting ? null : handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaExclamationTriangle style={{ color: 'orange', marginRight: '10px' }} />
                    Atenção
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Atenção: Ao excluir este {entityType}, todos os subsetores e coordenadorias vinculados serão
                    permanentemente apagados. Além disso, os funcionários associados não poderão mais ser
                    acessados através dele. Esta ação não pode ser desfeita. Você tem certeza de que deseja continuar?</p>

                {checkingEmployees && (
                    <div className="text-center my-3">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Verificando se existem funcionários cadastrados...
                    </div>
                )}

                {hasEmployees && (
                    <Alert variant="danger" className="mt-3">
                        <FaUsers className="me-2" />
                        Não é possível excluir esta {entityType.toLowerCase()} pois existem funcionários cadastrados nela ou em suas subunidades.
                        Por favor, reassigne ou remova os funcionários antes de prosseguir com a exclusão.
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger" className="mt-3">
                        {error}
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isDeleting || checkingEmployees}
                >
                    Cancelar
                </Button>
                <Button
                    variant="danger"
                    onClick={handleConfirmClick}
                    disabled={isDeleting || checkingEmployees || hasEmployees}
                >
                    {isDeleting ? 'Excluindo...' :
                        checkingEmployees ? 'Verificando...' : 'Prosseguir'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ConfirmDeleteModal;