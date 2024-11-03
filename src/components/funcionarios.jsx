import React, { useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa'; // Ícones de edição e remoção
import FunList from "./FuncionariosList"


function Funcionarios({ secretaria }) {

    const [expandedGroups, setExpandedGroups] = useState({});

    const userData = [
        {
            id: 'card-1',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-2',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Professora',
            natureza: 'Temporário',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-3',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Professora',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-4',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Saúde',
            funcao: 'Analista',
            natureza: 'Temporário',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-5',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-6',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-7',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-8',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-9',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        },
        {
            id: 'card-10',
            codigo: '12345',
            servidor: 'João da Silva',
            secretaria: 'Administração',
            funcao: 'Analista',
            natureza: 'Permanente',
            financeiro: {
                bruto: 'R$ 10.000,00',
                liquido: 'R$ 8.000,00',
                banco: 'Banco XYZ',
                agencia: '1234',
                conta: '56789-0'
            },
            pessoal: {
                endereco: 'Rua das Flores, 123',
                telefone: '(11) 99999-9999',
                cpf: '123.456.789-10',
                dependentes: 2
            },
            profissional: {
                cargo: 'Analista Sênior',
                formacao: 'Administração',
                setor: 'Recursos Humanos',
                promocao: '01/01/2023'
            }
        }
    ];


    // Agrupa funcionários por setor
    const groupedFuncionarios = userData
        .filter(user => user.secretaria === secretaria)
        .reduce((acc, user) => {
            const sector = user.profissional.setor || "Outro";
            if (!acc[sector]) acc[sector] = [];
            acc[sector].push(user);
            return acc;
        }, {});

    // Função para expandir/recolher setores
    const toggleGroupExpand = (sector) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [sector]: !prev[sector]
        }));
    };



    return (
        <Container>

            {Object.keys(groupedFuncionarios).map(sector => (
                <Card key={sector} className="my-3">
                    <Card.Header
                        className="d-flex justify-content-between align-items-center"
                        onClick={() => toggleGroupExpand(sector)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span>{sector}</span>
                        {expandedGroups[sector] ? <FaAngleUp /> : <FaAngleDown />}
                    </Card.Header>


                    <FunList 
                    sector={sector}
                    expandedGroups={expandedGroups}
                    secretaria={secretaria}
                    />




                </Card>
            ))}
        </Container >
    )

}

export default Funcionarios;
