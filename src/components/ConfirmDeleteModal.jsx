import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

function ConfirmDeleteModal({ showModal, handleClose, handleConfirmDelete }) {
    const [isDeleting, setIsDeleting] = useState(false); // Estado para controlar o carregamento

    const handleConfirmClick = async () => {
        setIsDeleting(true); // Ativa o estado de carregamento
        try {
            await handleConfirmDelete();
        } finally {
            setIsDeleting(false); // Desativa o estado de carregamento após conclusão
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
                <p> Atenção: Ao excluir este setor/divisão, todos os subsetores e divisões vinculados a ele serão
                    permanentemente apagados. Além disso, os funcionários associados a este setor/divisão não poderão mais ser
                    acessados através dele. Esta ação não pode ser desfeita. Você tem certeza de que deseja continuar?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={handleClose}
                    disabled={isDeleting} // Desabilita durante o carregamento
                >
                    Cancelar
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleConfirmClick}
                    disabled={isDeleting} // Desabilita durante o carregamento
                >
                    {isDeleting ? 'Excluindo...' : 'Prosseguir'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ConfirmDeleteModal;