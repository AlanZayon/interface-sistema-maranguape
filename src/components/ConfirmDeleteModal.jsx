import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

function ConfirmDeleteModal({ showModal, handleClose, handleConfirmDelete }) {
    return (
        <Modal show={showModal} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaExclamationTriangle style={{ color: 'orange', marginRight: '10px' }} />
                    Atenção
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p> Atenção: Ao excluir este setor/cargo, todos os subsetores e cargos vinculados a ele serão
                    permanentemente apagados. Além disso, os funcionários associados a este setor/cargo não poderão mais ser
                    acessados através dele. Esta ação não pode ser desfeita. Você tem certeza de que deseja continuar?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancelar
                </Button>
                <Button variant="danger" onClick={handleConfirmDelete}>
                    Prosseguir
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ConfirmDeleteModal;
