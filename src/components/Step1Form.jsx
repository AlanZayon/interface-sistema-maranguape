import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Row, Col, Form, Button, Modal, Spinner } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import { API_BASE_URL } from '../utils/apiConfig';
import { useAuth } from './AuthContext'; // Importa o contexto

const fetchSetoresData = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/referencias/referencias-dados`);
    return response.data.referencias;
};


function Step1Form({
    coordenadoriaId,
    nextStep,
    newUser,
    setNewUser,
    ObservationHistoryButton,
    ObservationHistoryModal,
    handleCloseModal,

}) {
    const { setorId, '*': subPath } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [referenciasRegistradas, setReferenciasRegistradas] = useState([]); // Lista de referências
    const [filteredReferencias, setFilteredReferencias] = useState([]);
    const [showModalObs, setShowModalObs] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [fileName, setFileName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({}); // Estado para armazenar erros de validação
    const { addFuncionarios } = useAuth(); // Usar o contexto de autenticação
    const currentSetorId = subPath ? subPath.split('/').pop() : setorId;

    // Regenera a pré-visualização ao montar ou ao mudar `newUser.foto`
    useEffect(() => {
        if (newUser?.foto) {
            const objectUrl = URL.createObjectURL(newUser.foto);
            setPreviewImage(objectUrl);

            // Limpeza para evitar vazamento de memória
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreviewImage(null);
        }
    }, [newUser?.foto]);

    // Regenera o nome do arquivo ao mudar o estado
    useEffect(() => {
        if (newUser?.arquivo) {
            setFileName(newUser.arquivo.name); // Atualiza o nome do arquivo
        } else {
            setFileName(""); // Reseta se não houver arquivo
        }
    }, [newUser?.arquivo]);

    useEffect(() => {
        // Aqui você pode simular a obtenção das referências de uma API ou de uma lista de dados.
        const fetchReferencias = async () => {
            try {
                const referencias = await fetchSetoresData();
                setReferenciasRegistradas(referencias);
            } catch (error) {
                console.error("Erro ao obter referências:", error);
            }
        };

        fetchReferencias();
    }, []); // Rodar uma vez quando o componente for montado

    useEffect(() => {
        // Filtrando as referências conforme o valor digitado
        const searchValue = newUser.referencia.toLowerCase();
        const filtered = referenciasRegistradas.filter(referencia =>
            referencia.name.toLowerCase().includes(searchValue)
        );
        setFilteredReferencias(filtered);
    }, [newUser.referencia, referenciasRegistradas]);

    const validateFields = () => {
        const newErrors = {};

        // Validação de campos obrigatórios
        if (!newUser.nome) newErrors.nome = 'O campo Nome é obrigatório';
        if (!newUser.secretaria) newErrors.secretaria = 'O campo Secretaria é obrigatório';
        if (!newUser.funcao) newErrors.funcao = 'O campo Função é obrigatório';
        if (!newUser.natureza) newErrors.natureza = 'O campo Natureza é obrigatório';
        if (!newUser.referencia) newErrors.referencia = 'O campo Referência é obrigatório';
        else {
            // Verifica se a referência digitada existe nas referências puxadas do backend
            const isReferenciaValid = referenciasRegistradas.some(referencia => referencia.name.toLowerCase() === newUser.referencia.toLowerCase());
            if (!isReferenciaValid) {
                newErrors.referencia = 'A referência informada não é válida';
            }
        }

        // Validação de salário bruto (verifica se é um número)
        if (!newUser.salarioBruto) newErrors.salarioBruto = 'O campo Salário Bruto é obrigatório';
        else if (isNaN(newUser.salarioBruto) || newUser.salarioBruto <= 0) {
            newErrors.salarioBruto = 'O campo Salário Bruto deve ser um número válido';
        }

        // Validação de salário líquido (verifica se é um número)
        if (!newUser.salarioLiquido) newErrors.salarioLiquido = 'O campo Salário Líquido é obrigatório';
        else if (isNaN(newUser.salarioLiquido) || newUser.salarioLiquido <= 0) {
            newErrors.salarioLiquido = 'O campo Salário Líquido deve ser um número válido';
        }

        if (!newUser.endereco) newErrors.endereco = 'O campo Endereço é obrigatório';
        if (!newUser.bairro) newErrors.bairro = 'O campo Bairro é obrigatório';
        if (!newUser.telefone) newErrors.telefone = 'O campo Telefone é obrigatório';

        setErrors(newErrors); // Atualiza o estado com os erros
        return Object.keys(newErrors).length === 0; // Retorna true se não houver erros
    };



    const fileInputRef = useRef(null);  // Referência para o input de arquivo

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewUser((prevState) => ({ ...prevState, foto: file }));
            setPreviewImage(URL.createObjectURL(file)); // Cria uma URL de pré-visualização para a imagem
        }
    };

    // Função para abrir o seletor de arquivos ao clicar na foto ou ícone
    const handlePhotoClick = () => {
        fileInputRef.current.click();  // Simula um clique no input file
    };

    const queryClient = useQueryClient();

    // Mutation para enviar dados ao backend
    const { mutate: submitUserData } = useMutation({
        mutationFn: async () => {

            newUser.redesSociais = newUser.redesSociais.filter(item => item.link && item.nome);


            const formData = new FormData();
            formData.append('nome', newUser.nome);
            formData.append('foto', newUser.foto || null);  // Envia o arquivo de foto
            formData.append('secretaria', newUser.secretaria);
            formData.append('funcao', newUser.funcao);
            formData.append('natureza', newUser.natureza);
            formData.append('referencia', newUser.referencia);
            formData.append('redesSociais', JSON.stringify(newUser.redesSociais) || '');
            formData.append('salarioBruto', newUser.salarioBruto);
            formData.append('salarioLiquido', newUser.salarioLiquido);
            formData.append('endereco', newUser.endereco);
            formData.append('bairro', newUser.bairro);
            formData.append('telefone', newUser.telefone);
            formData.append('arquivo', newUser.arquivo || null);
            formData.append('observacoes', JSON.stringify(newUser.observacoes));
            formData.append('coordenadoria', coordenadoriaId);

            const response = await axios.post(`${API_BASE_URL}/api/funcionarios/${currentSetorId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        },
        onSuccess: (data) => {
            console.log(data);
            queryClient.invalidateQueries('funcionarios');
            addFuncionarios(data)
            handleCloseModal()
            alert('cadatrado')
        },
        onError: (error) => {
            console.error("Erro ao enviar os dados:", error);
        },
        onSettled: () => {
            setIsLoading(false);
            // Adicione aqui a lógica que deve ser executada em qualquer caso
        }

    });

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!nextStep && validateFields()) {
            setIsLoading(true);
            submitUserData();
        } else if (nextStep && validateFields()) {
            // updateNewUser(newUser);
            nextStep();
        }
    };

    const handleAddObservation = (observation) => {
        setNewUser((prevState) => ({
            ...prevState,  // mantém os outros dados do usuário
            observacoes: [...prevState.observacoes, observation] // adiciona a nova observação
        }));
    };

    const fileMessage = newUser?.arquivo
        ? `Arquivo Selecionado: ${newUser.arquivo.name}`
        : "Nenhum arquivo selecionado"; // Aqui você pode customizar a mensagem

    return (
        <Form>

            {/* Campo de Upload de Foto de Perfil (invisível e clicável) */}
            <Row>
                <Col md={12}>
                    <Form.Group controlId="formFoto">
                        <Form.Label>Foto de Perfil</Form.Label>
                        <div className="profile-photo-upload d-flex justify-content-center">
                            {/* Exibe foto ou ícone */}
                            {newUser?.foto ? (
                                <img
                                    src={previewImage}
                                    alt="Foto do Funcionário"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        border: '2px solid #ccc',
                                        cursor: 'pointer'  // Mostra que é clicável
                                    }}
                                    onClick={handlePhotoClick}  // Ao clicar, abre o seletor de arquivos
                                />
                            ) : (
                                <div
                                    className="default-avatar"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ddd',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        border: '2px solid #ccc',
                                        cursor: 'pointer'  // Mostra que é clicável
                                    }}
                                    onClick={handlePhotoClick}  // Ao clicar, abre o seletor de arquivos
                                >
                                    <FaUserCircle style={{ fontSize: '50px', color: '#555' }} />
                                </div>
                            )}
                            {/* Input de arquivo invisível */}
                            <input
                                ref={fileInputRef}  // Referência para o input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}  // Esconde o input de arquivo
                                onChange={handleFileChange}  // Atualiza o estado quando o arquivo é selecionado
                            />
                        </div>
                    </Form.Group>
                </Col>
            </Row>


            <Row>
                <Col md={6}>
                    <Form.Group controlId="formServidor">
                        <Form.Label>Servidor</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o servidor"
                            value={newUser?.nome} // Bind ao estado do servidor
                            onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                            isInvalid={!!errors.nome}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group controlId="formSecretaria">
                        <Form.Label>Secretaria</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite a secretaria"
                            value={newUser?.secretaria} // Bind ao estado da secretaria
                            onChange={(e) => setNewUser({ ...newUser, secretaria: e.target.value })}
                            isInvalid={!!errors.secretaria}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Form.Group controlId="formFuncao">
                        <Form.Label>Função</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite a função"
                            value={newUser?.funcao} // Bind ao estado da função
                            onChange={(e) => setNewUser({ ...newUser, funcao: e.target.value })}
                            isInvalid={!!errors.funcao}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group controlId="formNatureza">
                        <Form.Label>Natureza</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite a natureza"
                            value={newUser?.natureza} // Bind ao estado da natureza
                            onChange={(e) => setNewUser({ ...newUser, natureza: e.target.value })}
                            isInvalid={!!errors.natureza}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Form.Group controlId="formReferência">
                        <Form.Label>Referência</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite a referência"
                            value={newUser?.referencia} // Bind ao estado da referência
                            onChange={(e) => setNewUser({ ...newUser, referencia: e.target.value })}
                            list="referencias-list"  // Adicionando o atributo list
                            isInvalid={!!errors.referencia}
                            autoComplete="off"  // Desabilita o autocompletar do navegador

                        />
                        {/* Datalist com as referências sugeridas */}
                        <datalist id="referencias-list">
                            {filteredReferencias.map((referencia, index) => (
                                <option key={index} value={referencia.name} />
                            ))}
                        </datalist>
                        <Form.Control.Feedback type="invalid">
                            {errors.referencia}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Col>
            </Row>

            {/* Redes Sociais */}
            <Row>
                <Col md={12}>
                    <Form.Group controlId="formRedesSociais">
                        <Form.Label>Redes Sociais</Form.Label>
                        <div>
                            {newUser?.redesSociais && newUser?.redesSociais.map((social, index) => (
                                <div key={index}>
                                    {/* Campo para o nome da rede social */}
                                    <Form.Control className='w-50'
                                        type="text"
                                        placeholder={`Nome da Rede Social ${index + 1}`}
                                        value={social.nome} // Bind ao campo nome no estado da rede social
                                        onChange={(e) => {
                                            const updatedRedes = [...newUser?.redesSociais];
                                            updatedRedes[index].nome = e.target.value;
                                            setNewUser({ ...newUser, redesSociais: updatedRedes });
                                        }}
                                    />
                                    <Form.Control
                                        type="text"
                                        placeholder={`Rede Social ${index + 1}`}
                                        value={social.link} // Bind ao estado da rede social
                                        onChange={(e) => {
                                            const updatedRedes = [...newUser?.redesSociais];
                                            updatedRedes[index].link = e.target.value;
                                            setNewUser({ ...newUser, redesSociais: updatedRedes });
                                        }}
                                    />
                                </div>
                            ))}
                            <Button
                                variant="link"
                                onClick={() => setNewUser({
                                    ...newUser,
                                    redesSociais: [...newUser?.redesSociais, { link: '', nome: '' }]
                                })}
                            >
                                Adicionar Rede Social
                            </Button>
                        </div>
                    </Form.Group>
                </Col>
            </Row>

            {/* Informações Financeiras */}
            <Row>
                <Col md={6}>
                    <Form.Group controlId="formSalarioBruto">
                        <Form.Label>Salário Bruto</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o salário bruto"
                            value={newUser?.salarioBruto} // Bind ao estado do salário bruto
                            onChange={(e) => setNewUser({ ...newUser, salarioBruto: e.target.value })}
                            isInvalid={!!errors.salarioBruto}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.salarioBruto}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group controlId="formSalarioLiquido">
                        <Form.Label>Salário Líquido</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o salário líquido"
                            value={newUser?.salarioLiquido} // Bind ao estado do salário líquido
                            onChange={(e) => setNewUser({ ...newUser, salarioLiquido: e.target.value })}
                            isInvalid={!!errors.salarioLiquido}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.salarioLiquido}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Col>
            </Row>

            {/* Informações Pessoais */}
            <Row>
                <Col md={6}>
                    <Form.Group controlId="formEndereco">
                        <Form.Label>Endereço</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o endereço"
                            value={newUser?.endereco} // Bind ao estado do endereço
                            onChange={(e) => setNewUser({ ...newUser, endereco: e.target.value })}
                            isInvalid={!!errors.endereco}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group controlId="formEndereco">
                        <Form.Label>Bairro</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o endereço"
                            value={newUser?.bairro} // Bind ao estado do endereço
                            onChange={(e) => setNewUser({ ...newUser, bairro: e.target.value })}
                            isInvalid={!!errors.bairro}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group controlId="formTelefone">
                        <Form.Label>Telefone</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Digite o telefone"
                            value={newUser?.telefone} // Bind ao estado do telefone
                            onChange={(e) => setNewUser({ ...newUser, telefone: e.target.value })}
                            isInvalid={!!errors.telefone}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Row><Form.Label>Upload de Arquivo</Form.Label></Row>
                        <Form.Control
                            type="file"
                            id="file-upload"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                // Atualize o estado com o arquivo selecionado ou faça o upload imediatamente
                                setNewUser({ ...newUser, arquivo: file });
                            }}
                            style={{ display: 'none' }}
                        />
                        <Form.Label
                            htmlFor="file-upload"
                            className="btn btn-primary"
                            style={{
                                cursor: "pointer",
                                padding: "6px 16px", // Definir o tamanho do botão
                                marginRight: "10px", // Espaçamento entre o botão e o campo
                            }}
                        >
                            Escolher Arquivo
                        </Form.Label>
                        <div>{fileMessage}</div>
                    </Form.Group>
                </Col>

                <ObservationHistoryModal
                    show={showModalObs}
                    onHide={() => setShowModalObs(false)}
                    onAddObservation={handleAddObservation}
                    observacoes={newUser?.observacoes}
                />

                <ObservationHistoryButton className="w-50"
                    onClick={() => setShowModalObs(true)}
                />

            </Row>
            <Modal.Footer>
                {isLoading ? (
                    <div className="loading-screen">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Carregando...</span>
                        </Spinner>
                    </div>
                ) : (
                    <div>
                        <Button className='mx-1' variant="secondary" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            Avançar
                        </Button>
                    </div>
                )}

            </Modal.Footer>
        </Form>
    );
}

export default Step1Form;
