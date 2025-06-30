import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Form, Button, Modal, Card, Spinner, InputGroup, Badge, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext'; 
import { API_BASE_URL } from '../utils/apiConfig';
import { FaSyncAlt, FaSave, FaTimes, FaSearch, FaInfoCircle } from 'react-icons/fa';
import debounce from 'lodash/debounce';

const ITEMS_PER_PAGE = 3;

function EditUsersForm({
    usuariosIds, 
    handleCloseModal,
    setShowSelectionControlsEdit,
    setActivateModified
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedPath, setSelectedPath] = useState([]);
    const { addFuncionarios, addFuncionariosPath } = useAuth();
    
    // Estados de paginação
    const [currentPageSetores, setCurrentPageSetores] = useState(1);
    const [currentPageSubsetores, setCurrentPageSubsetores] = useState(1);
    const [currentPageCoordenadorias, setCurrentPageCoordenadorias] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchSetoresData = async () => {
        const response = await axios.get(`${API_BASE_URL}/api/setores/setoresOrganizados`);
        return response.data;
    };

    const { data, isError, error, refetch } = useQuery({
        queryKey: ['setores'],
        queryFn: fetchSetoresData
    });

    const [setoresOrganizados, setSetoresOrganizados] = useState([]);
    const [setorSelecionado, setSetorSelecionado] = useState(null);
    const [subsetorSelecionado, setSubsetorSelecionado] = useState([]);
    const [coordenadoriaSelecionada, setCoordenadoriaSelecionada] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (data && data.setores) {
            setSetoresOrganizados(data.setores);
        }
    }, [data]);

    const findSubsetorById = (subsetores, subsetorId) => {
        for (let subsetor of subsetores) {
            if (subsetor._id === subsetorId) {
                return subsetor;
            } else if (subsetor.subsetores && subsetor.subsetores.length > 0) {
                const found = findSubsetorById(subsetor.subsetores, subsetorId);
                if (found) return found;
            }
        }
        return null;
    };

    const refreshAll = () => {
        setSetorSelecionado(null);
        setSubsetorSelecionado([]);
        setCoordenadoriaSelecionada(null);
        setSelectedPath([]);
        setCurrentPageSetores(1);
        setCurrentPageSubsetores(1);
        setCurrentPageCoordenadorias(1);
        refetch();
    };

    const findItemPath = (item, type) => {
        const path = [];
        
        if (type === 'coordenadoria') {
            // Encontrar o subsetor e setor pai da coordenadoria
            for (const setor of setoresOrganizados) {
                // Verificar coordenadorias diretas do setor
                if (setor.coordenadorias?.some(c => c._id === item._id)) {
                    path.push({ type: 'setor', item: setor });
                    path.push({ type, item });
                    return path;
                }
                
                // Verificar subsetores do setor
                const subsetorPath = findSubsetorWithCoordenadoria(setor.subsetores, item._id);
                if (subsetorPath) {
                    path.push({ type: 'setor', item: setor });
                    path.push(...subsetorPath);
                    path.push({ type, item });
                    return path;
                }
            }
        } else if (type === 'subsetor') {
            // Encontrar o setor pai e qualquer subsetor pai
            for (const setor of setoresOrganizados) {
                if (setor._id === item._id) {
                    // Se o "subsetor" for na verdade um setor (caso especial)
                    path.push({ type: 'setor', item });
                    return path;
                }
                
                const subsetorPath = findSubsetorPath(setor.subsetores, item._id);
                if (subsetorPath) {
                    path.push({ type: 'setor', item: setor });
                    path.push(...subsetorPath);
                    return path;
                }
            }
        } else if (type === 'setor') {
            path.push({ type, item });
            return path;
        }
        
        return path;
    };

    const findSubsetorPath = (subsetores, subsetorId, currentPath = []) => {
        for (const subsetor of subsetores || []) {
            if (subsetor._id === subsetorId) {
                return [...currentPath, { type: 'subsetor', item: subsetor }];
            }
            
            const foundInChildren = findSubsetorPath(subsetor.subsetores, subsetorId, [
                ...currentPath,
                { type: 'subsetor', item: subsetor }
            ]);
            
            if (foundInChildren) {
                return foundInChildren;
            }
        }
        return null;
    };

    const findSubsetorWithCoordenadoria = (subsetores, coordenadoriaId) => {
        for (const subsetor of subsetores || []) {
            if (subsetor.coordenadorias?.some(c => c._id === coordenadoriaId)) {
                return [{ type: 'subsetor', item: subsetor }];
            }
            
            const foundInChildren = findSubsetorWithCoordenadoria(subsetor.subsetores, coordenadoriaId);
            if (foundInChildren) {
                return [{ type: 'subsetor', item: subsetor }, ...foundInChildren];
            }
        }
        return null;
    };

    const updateSelectedPath = (type, item) => {
        const newPath = findItemPath(item, type);
        setSelectedPath(newPath);
        
        // Atualiza os estados correspondentes baseados no caminho
        if (type === 'coordenadoria') {
            // Encontrar o setor e subsetor pai
            const setorItem = newPath.find(p => p.type === 'setor');
            const subsetorItem = newPath.find(p => p.type === 'subsetor');
            
            if (setorItem) {
                setSetorSelecionado(setorItem.item);
            }
            
            if (subsetorItem) {
                setSubsetorSelecionado([subsetorItem.item]);
            } else {
                setSubsetorSelecionado([]);
            }
            
            setCoordenadoriaSelecionada(item);
        } else if (type === 'subsetor') {
            const setorItem = newPath.find(p => p.type === 'setor');
            
            if (setorItem) {
                setSetorSelecionado(setorItem.item);
            }
            
            setSubsetorSelecionado([item]);
            setCoordenadoriaSelecionada(null);
        } else if (type === 'setor') {
            setSetorSelecionado(item);
            setSubsetorSelecionado([]);
            setCoordenadoriaSelecionada(null);
        }
    };

    const getAllSubsetores = (subsetores) => {
        let allSubsetores = [];
        subsetores?.forEach(subsetor => {
            allSubsetores.push(subsetor);
            if (subsetor.subsetores) {
                allSubsetores = [...allSubsetores, ...getAllSubsetores(subsetor.subsetores)];
            }
        });
        return allSubsetores;
    };

    const getAllCoordenadorias = (setores) => {
        let allCoords = [];
        setores?.forEach(setor => {
            if (setor.coordenadorias) {
                allCoords = [...allCoords, ...setor.coordenadorias];
            }
            
            if (setor.subsetores) {
                setor.subsetores.forEach(subsetor => {
                    if (subsetor.coordenadorias) {
                        allCoords = [...allCoords, ...subsetor.coordenadorias];
                    }
                    if (subsetor.subsetores) {
                        allCoords = [...allCoords, ...getAllCoordenadorias(subsetor.subsetores)];
                    }
                });
            }
        });
        return allCoords;
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setSetorSelecionado(null);
        setSubsetorSelecionado([]);
        setCoordenadoriaSelecionada(null);
        setSelectedPath([]);
        setCurrentPageSetores(1);
        setCurrentPageSubsetores(1);
        setCurrentPageCoordenadorias(1);
    };

    const itemMatchesSearch = (item, searchTerm) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return item.nome.toLowerCase().includes(searchLower);
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm && activeFilter === 'all') return setoresOrganizados;

        const searchLower = searchTerm?.toLowerCase() || '';

        switch(activeFilter) {
            case 'setores':
                return setoresOrganizados.filter(setor => 
                    !searchTerm || setor.nome.toLowerCase().includes(searchLower)
                );
            
            case 'subsetores':
                const allSubsetores = getAllSubsetores(setoresOrganizados.flatMap(s => s.subsetores));
                return allSubsetores.filter(subsetor => 
                    !searchTerm || subsetor.nome.toLowerCase().includes(searchLower)
                );
            
            case 'coordenadorias':
                const allCoordenadorias = getAllCoordenadorias(setoresOrganizados);
                return allCoordenadorias.filter(coord => 
                    !searchTerm || coord.nome.toLowerCase().includes(searchLower)
                );
            
            default:
                return setoresOrganizados.filter(setor => 
                    !searchTerm || 
                    setor.nome.toLowerCase().includes(searchLower) ||
                    (setor.subsetores?.some(sub => 
                        sub.nome.toLowerCase().includes(searchLower) ||
                        sub.coordenadorias?.some(coord => 
                            coord.nome.toLowerCase().includes(searchLower)
                        )
                    )) ||
                    setor.coordenadorias?.some(coord => 
                        coord.nome.toLowerCase().includes(searchLower)
                    )
                );
        }
    }, [searchTerm, setoresOrganizados, activeFilter]);

    const getPaginatedItems = (items, page) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return items.slice(startIndex, endIndex);
    };

    useEffect(() => {
        if (filteredItems) {
            setTotalPages(Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
        }
    }, [filteredItems]);

    const debouncedSearch = useCallback(
        debounce((term) => {
            setSearchTerm(term);
            setCurrentPageSetores(1);
            setCurrentPageSubsetores(1);
            setCurrentPageCoordenadorias(1);
        }, 300),
        []
    );

    const handleSearchChange = (e) => {
        debouncedSearch(e.target.value);
    };

    const renderSetores = () => {
        if (activeFilter !== 'all' && activeFilter !== 'setores') return null;
        
        const itemsToRender = activeFilter === 'setores' ? 
            getPaginatedItems(filteredItems, currentPageSetores) : 
            getPaginatedItems(
                setoresOrganizados.filter(setor => 
                    !searchTerm || itemMatchesSearch(setor, searchTerm)
                ),
                currentPageSetores
            );

        if (itemsToRender.length === 0) return null;

        return (
            <>
                <Row className="mt-3">
                    <Col md={12}>
                        <Form.Group controlId="formSetor">
                            <Form.Label className="fw-bold">Setores:</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {itemsToRender.map((setor) => (
                                    <Button
                                        key={setor._id}
                                        variant={
                                            setorSelecionado?._id === setor._id
                                                ? "primary"
                                                : "outline-primary"
                                        }
                                        onClick={() => {
                                            setSetorSelecionado(setor);
                                            setSubsetorSelecionado([]);
                                            setCoordenadoriaSelecionada(null);
                                            updateSelectedPath('setor', setor);
                                            setCurrentPageSetores(1);
                                        }}
                                        className="d-flex align-items-center"
                                    >
                                        {setor.nome}
                                        {setor.subsetores?.length > 0 && (
                                            <Badge bg="light" text="dark" className="ms-2">
                                                {setor.subsetores.length}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
                {renderPagination('setores')}
            </>
        );
    };

    const renderSubsetores = () => {
        if (activeFilter !== 'all' && activeFilter !== 'subsetores') return null;
        
        let allSubsetores = setorSelecionado ? 
            getAllSubsetores(setorSelecionado.subsetores) : 
            getAllSubsetores(setoresOrganizados.flatMap(s => s.subsetores));
        
        const filteredSubsetores = allSubsetores.filter(subsetor => 
            !searchTerm || itemMatchesSearch(subsetor, searchTerm)
        );
        
        const paginatedSubsetores = getPaginatedItems(filteredSubsetores, currentPageSubsetores);
        const subsetoresTotalPages = Math.ceil(filteredSubsetores.length / ITEMS_PER_PAGE);

        if (paginatedSubsetores.length === 0) return null;

        return (
            <>
                <Row className="mt-3">
                    <Col md={12}>
                        <Form.Group controlId="formSubsetor">
                            <Form.Label className="fw-bold">Subsetores:</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {paginatedSubsetores.map((subsetor) => (
                                    <Button
                                        key={subsetor._id}
                                        variant={
                                            subsetorSelecionado.some(s => s._id === subsetor._id)
                                                ? "info"
                                                : "outline-info"
                                        }
                                        onClick={() => {
                                            const foundSubsetor = findSubsetorById(
                                                setorSelecionado?.subsetores || 
                                                setoresOrganizados.flatMap(s => s.subsetores), 
                                                subsetor._id
                                            );
                                            if (foundSubsetor) {
                                                setSubsetorSelecionado([foundSubsetor]);
                                                setCoordenadoriaSelecionada(null);
                                                updateSelectedPath('subsetor', foundSubsetor);
                                                setCurrentPageSubsetores(1);
                                            }
                                        }}
                                        className="d-flex align-items-center"
                                    >
                                        {subsetor.nome}
                                        {subsetor.coordenadorias?.length > 0 && (
                                            <Badge bg="light" text="dark" className="ms-2">
                                                {subsetor.coordenadorias.length}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
                {subsetoresTotalPages > 1 && renderPagination('subsetores', subsetoresTotalPages)}
            </>
        );
    };

    const renderCoordenadorias = () => {
        if (activeFilter !== 'all' && activeFilter !== 'coordenadorias') return null;
        
        let coordenadoriasToRender = [];
        
        if (activeFilter === 'coordenadorias') {
            coordenadoriasToRender = getPaginatedItems(filteredItems, currentPageCoordenadorias);
        } else {
            if (subsetorSelecionado.length > 0) {
                coordenadoriasToRender = subsetorSelecionado.flatMap(s => s.coordenadorias || []);
            } else if (setorSelecionado) {
                coordenadoriasToRender = setorSelecionado.coordenadorias || [];
            } else {
                coordenadoriasToRender = getAllCoordenadorias(setoresOrganizados);
            }
            
            coordenadoriasToRender = getPaginatedItems(
                coordenadoriasToRender.filter(coord => 
                    !searchTerm || itemMatchesSearch(coord, searchTerm)
                ),
                currentPageCoordenadorias
            );
        }

        if (coordenadoriasToRender.length === 0) return null;

        const parentName = subsetorSelecionado.length > 0 ? 
            subsetorSelecionado[0].nome : 
            setorSelecionado?.nome || 'Todas';

        return (
            <>
                <Row className="mt-3">
                    <Col md={12}>
                        <Form.Group controlId="formCoordenadoria">
                            <Form.Label className="fw-bold">Divisões: {parentName}</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {coordenadoriasToRender.map((coordenadoria) => (
                                    <Button
                                        key={coordenadoria._id}
                                        variant={
                                            coordenadoriaSelecionada?._id === coordenadoria._id
                                                ? "warning"
                                                : "outline-warning"
                                        }
                                        onClick={() => {
                                            setCoordenadoriaSelecionada(coordenadoria);
                                            updateSelectedPath('coordenadoria', coordenadoria);
                                        }}
                                    >
                                        {coordenadoria.nome}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
                {renderPagination('coordenadorias')}
            </>
        );
    };

    const renderPagination = (type = 'all', customTotalPages = totalPages) => {
        if (customTotalPages <= 1) return null;

        let currentPage, handlePageChange;

        switch(type) {
            case 'setores':
                currentPage = currentPageSetores;
                handlePageChange = setCurrentPageSetores;
                break;
            case 'subsetores':
                currentPage = currentPageSubsetores;
                handlePageChange = setCurrentPageSubsetores;
                break;
            case 'coordenadorias':
                currentPage = currentPageCoordenadorias;
                handlePageChange = setCurrentPageCoordenadorias;
                break;
            default:
                currentPage = 1;
                handlePageChange = () => {};
        }

        return (
            <Row className="mt-3">
                <Col md={12} className="d-flex justify-content-center">
                    <Pagination>
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        
                        {Array.from({ length: Math.min(5, customTotalPages) }, (_, i) => {
                            let pageNumber;
                            if (customTotalPages <= 5) {
                                pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                            } else if (currentPage >= customTotalPages - 2) {
                                pageNumber = customTotalPages - 4 + i;
                            } else {
                                pageNumber = currentPage - 2 + i;
                            }
                            return (
                                <Pagination.Item 
                                    key={pageNumber}
                                    active={pageNumber === currentPage}
                                    onClick={() => handlePageChange(pageNumber)}
                                >
                                    {pageNumber}
                                </Pagination.Item>
                            );
                        })}
                        
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === customTotalPages} />
                        <Pagination.Last onClick={() => handlePageChange(customTotalPages)} disabled={currentPage === customTotalPages} />
                    </Pagination>
                </Col>
            </Row>
        );
    };

    const handleSubmit = async () => {
        if (!coordenadoriaSelecionada) {
            alert("Por favor, selecione uma divisão antes de continuar");
            return;
        }

        setIsSaving(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/api/funcionarios/editar-coordenadoria-usuario`, {
                usuariosIds: usuariosIds,
                coordenadoriaId: coordenadoriaSelecionada._id
            });
            addFuncionarios(response.data);
            addFuncionariosPath(response.data);
            handleCloseModal();
            setShowSelectionControlsEdit(false);
            setActivateModified(true);
            alert("Usuários transferidos com sucesso!");
        } catch (error) {
            console.error('Erro ao transferir os usuários:', error);
            alert("Ocorreu um erro ao transferir. Por favor, tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const SelectedPathIndicator = () => (
        <div className="mb-3">
            <small className="text-muted">Caminho selecionado:</small>
            <div className="d-flex align-items-center flex-wrap">
                {selectedPath.length === 0 ? (
                    <Badge bg="light" text="dark" className="me-2">
                        Nenhum item selecionado
                    </Badge>
                ) : (
                    selectedPath.map((item, index) => (
                        <React.Fragment key={`${item.type}-${item.item._id}`}>
                            <Badge bg={item.type === 'setor' ? 'primary' : item.type === 'subsetor' ? 'info' : 'warning'} className="me-2">
                                {item.item.nome}
                            </Badge>
                            {index < selectedPath.length - 1 && <span className="me-2">›</span>}
                        </React.Fragment>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <Form>
            <Card className="mb-3">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Button onClick={refreshAll} variant="outline-secondary" size="sm" className="me-2">
                            <FaSyncAlt className="me-1" /> Recarregar
                        </Button>
                        
                        <div className="d-flex">
                            <Button
                                variant={activeFilter === 'all' ? 'primary' : 'outline-primary'}
                                size="sm"
                                className="me-2"
                                onClick={() => handleFilterChange('all')}
                            >
                                Todos
                            </Button>
                            <Button
                                variant={activeFilter === 'setores' ? 'primary' : 'outline-primary'}
                                size="sm"
                                className="me-2"
                                onClick={() => handleFilterChange('setores')}
                            >
                                Setores
                            </Button>
                            <Button
                                variant={activeFilter === 'subsetores' ? 'primary' : 'outline-primary'}
                                size="sm"
                                className="me-2"
                                onClick={() => handleFilterChange('subsetores')}
                            >
                                Subsetores
                            </Button>
                            <Button
                                variant={activeFilter === 'coordenadorias' ? 'primary' : 'outline-primary'}
                                size="sm"
                                onClick={() => handleFilterChange('coordenadorias')}
                            >
                                Divisões
                            </Button>
                        </div>
                    </div>

                    <Form.Group controlId="formSearch" className="mb-4">
                        <InputGroup>
                            <InputGroup.Text>
                                <FaSearch />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Pesquisar setores, subsetores ou divisões..."
                                onChange={handleSearchChange}
                            />
                        </InputGroup>
                    </Form.Group>

                    <SelectedPathIndicator />

                    {searchTerm && (
                        <div className="alert alert-info mb-4">
                            <FaInfoCircle className="me-2" />
                            Mostrando resultados para: <strong>{searchTerm}</strong>
                        </div>
                    )}

                    {renderSetores()}
                    {renderSubsetores()}
                    {renderCoordenadorias()}
                </Card.Body>
            </Card>

            <Modal.Footer className="d-flex justify-content-between">
                <div>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        <FaTimes className="me-1" /> Cancelar
                    </Button>
                </div>
                
                {isSaving ? (
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Transferindo...</span>
                    </Spinner>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!coordenadoriaSelecionada}
                    >
                        <FaSave className="me-1" /> 
                        {coordenadoriaSelecionada ? "Transferir Funcionários" : "Selecione uma divisão"}
                    </Button>
                )}
            </Modal.Footer>
        </Form>
    );
}

export default EditUsersForm;