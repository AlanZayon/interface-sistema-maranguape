// components/FuncionariosScreen.js
import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Funcionarios from './funcionarios';

function FuncionariosScreen() {
  const { secretaria } = useParams();

  return (
    <>
      <h2 className="mt-4">Funcionários da Secretaria: {secretaria}</h2>
      <Funcionarios secretaria={secretaria} />
      <Button variant="secondary" className="mt-4" href="/secretarias">
        Voltar às Secretarias
      </Button>
    </>
  );
}

export default FuncionariosScreen;
