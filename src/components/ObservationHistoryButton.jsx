// ObservationHistoryButton.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { FaClipboardList  } from 'react-icons/fa';

function ObservationHistoryButton({ onClick }) {
    return (
        <Button variant="outline-dark" className="m-1 w-25" onClick={onClick}>
            <FaClipboardList   />   
        </Button>
    );
}

export default ObservationHistoryButton;
