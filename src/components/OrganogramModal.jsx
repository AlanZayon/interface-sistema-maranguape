import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  FiSearch as Search,
  FiChevronRight as ChevronRight,
  FiUsers as Users,
  FiX as X,
  FiEdit as Edit,
  FiTrash as Trash,
  FiChevronLeft as ChevronLeft,
  FiHome as Home,
  FiPlus as Plus,
  FiMinus as Minus,
  FiExternalLink as ExternalLink,
  FiZoomIn as ZoomIn,
  FiZoomOut as ZoomOut,
  FiMove as Move
} from 'react-icons/fi';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { API_BASE_URL } from '../utils/apiConfig';
import { useNavigate } from 'react-router-dom';
import ConfirmDeleteModal from './ConfirmDeleteModal';

// Estilos CSS para prevenir seleção
const preventSelectionStyles = `
  .organogram-modal * {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
  }
  
  .organogram-modal input,
  .organogram-modal textarea {
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
  }
  
  .organogram-node {
    cursor: default !important;
  }
  
  .node-actions {
    cursor: pointer !important;
  }
  
  .organogram-viewport {
    -webkit-user-drag: none !important;
    -khtml-user-drag: none !important;
    -moz-user-drag: none !important;
    -o-user-drag: none !important;
    user-drag: none !important;
  }
`;

const OrganogramModal = ({ show, onHide }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationPath, setNavigationPath] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('subsetor');
  const [parentNodeId, setParentNodeId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [refreshType, setRefreshType] = useState(null);
  const searchTimeoutRef = useRef();
  const organogramContainerRef = useRef();

  // Adicionar estilos de prevenção de seleção
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = preventSelectionStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Função para prevenir seleção de texto
  const preventSelection = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);

  // Reset states quando o modal fechar
  const resetStates = useCallback(() => {
    setSearchQuery('');
    setNavigationPath([]);
    setIsSearching(false);
    setExpandedNodes(new Set());
    setIsLoading(true);
    setError(null);
    setHierarchyData(null);
    setEditingNodeId(null);
    setEditedName('');
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setNeedsRefresh(false);
    setRefreshType(null);
  }, []);

  // Transformar dados da API
  const transformData = useCallback((data) => {
    const transformNode = (node) => {
      const transformedNode = {
        id: node._id,
        name: node.nome,
        type: node.tipo?.toLowerCase() || 'setor',
        employees: node.funcionarios?.length || node.quantidadeFuncionarios || 0,
        path: node.path || [],
        parentId: node.parent || null
      };

      // Processar filhos
      const children = [
        ...(node.subsetores || []).map(transformNode),
        ...(node.coordenadorias || []).map(coord => ({
          id: coord._id,
          name: coord.nome,
          type: 'divisao',
          employees: coord.quantidadeFuncionarios || 0,
          path: [...(node.path || []), { id: node._id, name: node.nome }],
          parentId: node._id
        }))
      ];

      if (children.length > 0) {
        transformedNode.children = children;
      }

      return transformedNode;
    };

    return data.setores.map(transformNode);
  }, []);

  // Buscar dados hierárquicos
  useEffect(() => {
    if (!show) return;

    const fetchHierarchy = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/setores/setoresOrganizados`);
        if (!response.ok) throw new Error('Falha ao carregar dados da hierarquia');

        const data = await response.json();
        const transformedData = transformData(data);

        const rootNode = {
          id: 'root',
          name: 'Organograma Completo',
          type: 'root',
          children: transformedData
        };

        setHierarchyData(rootNode);
        setNavigationPath([{ node: rootNode, index: 0 }]);
      } catch (err) {
        console.error('Erro ao carregar hierarquia:', err);
        setError('Falha ao carregar dados. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchy();
  }, [show, transformData]);

  const currentNode = navigationPath[navigationPath.length - 1]?.node || hierarchyData;

  // Navegação
  const navigateToChild = useCallback((child) => {
    setNavigationPath(prev => [...prev, { node: child, index: prev.length }]);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const navigateToBreadcrumb = useCallback((index) => {
    setNavigationPath(prev => prev.slice(0, index + 1));
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Controles de zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Controles de pan (arrastar)
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPanPoint({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y
    });
    e.currentTarget.style.cursor = 'grabbing';
  }, [panPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;

    setPanPosition({
      x: e.clientX - startPanPoint.x,
      y: e.clientY - startPanPoint.y
    });
  }, [isPanning, startPanPoint]);

  const handleMouseUp = useCallback((e) => {
    setIsPanning(false);
    e.currentTarget.style.cursor = 'grab';
  }, []);

  // Pesquisa
  const debouncedSearch = useCallback((query) => {
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 300);
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setIsSearching(true);
      debouncedSearch(value);
    } else {
      setIsSearching(false);
    }
  }, [debouncedSearch]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !hierarchyData) return [];

    const results = [];
    const searchInNode = (node) => {
      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(node);
      }
      node.children?.forEach(searchInNode);
    };

    hierarchyData.children?.forEach(searchInNode);
    return results;
  }, [searchQuery, hierarchyData]);

  const displayNodes = useMemo(() => {
    if (!currentNode) return [];
    return searchQuery.trim() ? searchResults : currentNode.children || [];
  }, [searchQuery, searchResults, currentNode]);

  // Estilos e labels
  const getTypeStyle = useCallback((type) => {
    const styles = {
      setor: 'org-node-setor',
      subsetor: 'org-node-subsetor',
      divisao: 'org-node-divisao',
      coordenadoria: 'org-node-divisao'
    };
    return styles[type] || 'org-node-default';
  }, []);

  const getTypeLabel = useCallback((type) => {
    const labels = {
      setor: 'Setor',
      subsetor: 'Subsetor',
      divisao: 'Divisão',
      coordenadoria: 'Divisão'
    };
    return labels[type] || type;
  }, []);

  // Função para atualizar o caminho de navegação
  const updateNavigationPath = useCallback((updatedHierarchy) => {
    setNavigationPath(prev => {
      const newPath = [];
      let currentNode = updatedHierarchy;

      newPath.push({ node: currentNode, index: 0 });

      for (let i = 1; i < prev.length; i++) {
        const originalNode = prev[i].node;
        if (currentNode.children) {
          const foundChild = currentNode.children.find(child => child.id === originalNode.id);
          if (foundChild) {
            newPath.push({ node: foundChild, index: i });
            currentNode = foundChild;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return newPath;
    });
  }, []);

  const handleClose = () => {
    if (needsRefresh) {
      if (refreshType === 'reload') {
        window.location.reload();
      } else if (refreshType === 'navigate') {
        navigate('/mainscreen');
      }
      onHide();
    } else {
      resetStates();
      onHide();
    }
  };

  // Operações CRUD
  const handleEdit = useCallback((node) => {
    setEditingNodeId(node.id);
    setEditedName(node.name);
  }, []);

  const handleSaveEdit = async (nodeId) => {
    if (!editedName.trim()) {
      alert('O nome não pode estar vazio!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/setores/rename/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editedName })
      });

      if (response.ok) {
        const updateNodeInTree = (nodes) => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, name: editedName };
            }
            if (node.children) {
              return { ...node, children: updateNodeInTree(node.children) };
            }
            return node;
          });
        };

        setHierarchyData(prev => {
          const updatedHierarchy = {
            ...prev,
            children: updateNodeInTree(prev.children)
          };

          updateNavigationPath(updatedHierarchy);

          return updatedHierarchy;
        });

        setNeedsRefresh(true);
        setRefreshType('reload');
        setEditingNodeId(null);
        setEditedName('');
      } else {
        throw new Error('Falha ao atualizar');
      }
    } catch (error) {
      console.error('Erro ao editar:', error);
      alert('Erro ao editar. Tente novamente.');
    }
  };

  const handleDelete = useCallback((node) => {
    setNodeToDelete(node);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = async () => {
    if (!nodeToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/setores/del/${nodeToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const removeNodeFromTree = (nodes) => {
          return nodes.filter(node => node.id !== nodeToDelete.id)
            .map(node => {
              if (node.children) {
                return { ...node, children: removeNodeFromTree(node.children) };
              }
              return node;
            });
        };

        setHierarchyData(prev => {
          const updatedHierarchy = {
            ...prev,
            children: removeNodeFromTree(prev.children)
          };

          updateNavigationPath(updatedHierarchy);

          return updatedHierarchy;
        });

        if (nodeToDelete.type === 'setor') {
          setRefreshType('reload');
        } else {
          setRefreshType('navigate');
        }

        setNeedsRefresh(true);
        setShowDeleteModal(false);
        setNodeToDelete(null);
      } else {
        throw new Error('Falha ao excluir');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir. Tente novamente.');
    }
  };

  const handleCreate = useCallback((parentNode) => {
    setParentNodeId(parentNode.id);
    setNewNodeName('');
    setNewNodeType('subsetor');
    setShowCreateModal(true);
  }, []);

  const handleCreateSubmit = async () => {
    if (!newNodeName.trim()) {
      alert('O nome não pode estar vazio!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/setores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newNodeName,
          tipo: newNodeType === 'divisao' ? 'Coordenadoria' : 'Subsetor',
          parent: parentNodeId
        })
      });

      if (response.ok) {
        const newData = await response.json();

        const addNodeToTree = (nodes) => {
          return nodes.map(node => {
            if (node.id === parentNodeId) {
              const newNode = {
                id: newData._id,
                name: newData.nome,
                type: newNodeType,
                employees: 0,
                parentId: parentNodeId,
                children: newNodeType === 'divisao' ? undefined : []
              };
              return {
                ...node,
                children: [...(node.children || []), newNode]
              };
            }
            if (node.children) {
              return { ...node, children: addNodeToTree(node.children) };
            }
            return node;
          });
        };

        setHierarchyData(prev => {
          const updatedHierarchy = {
            ...prev,
            children: addNodeToTree(prev.children)
          };

          updateNavigationPath(updatedHierarchy);

          return updatedHierarchy;
        });

        setNeedsRefresh(true);
        setShowCreateModal(false);
        setNewNodeName('');
      } else {
        throw new Error('Falha ao criar');
      }
    } catch (error) {
      console.error('Erro ao criar:', error);
      alert('Erro ao criar. Tente novamente.');
    }
  };

  // Função para encontrar o nó pai mais próximo que não seja uma divisão
  const findValidParentNode = useCallback((nodeId) => {
    const findNode = (currentNode, targetId) => {
      if (currentNode.id === targetId) return currentNode;
      
      if (currentNode.children) {
        for (const child of currentNode.children) {
          const found = findNode(child, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    let currentNode = findNode(hierarchyData, nodeId);
    
    // Se o nó atual for uma divisão, subir na hierarquia até encontrar um setor ou subsetor
    while (currentNode && (currentNode.type === 'divisao' || currentNode.type === 'coordenadoria')) {
      if (currentNode.parentId) {
        currentNode = findNode(hierarchyData, currentNode.parentId);
      } else {
        break;
      }
    }
    
    return currentNode;
  }, [hierarchyData]);

  const handleNavigateTo = useCallback((node) => {
    // Se for uma divisão, encontrar o nó pai válido (setor ou subsetor)
    const targetNode = (node.type === 'divisao' || node.type === 'coordenadoria') 
      ? findValidParentNode(node.id) 
      : node;

    if (!targetNode) return;

    let fullPath = '';

    const findNodePath = (currentNode, targetId, path = []) => {
      if (currentNode.id === targetId) return [...path, currentNode];

      if (currentNode.children) {
        for (const child of currentNode.children) {
          const result = findNodePath(child, targetId, [...path, currentNode]);
          if (result) return result;
        }
      }
      return null;
    };

    const nodePath = findNodePath(hierarchyData, targetNode.id);

    if (nodePath) {
      const realPath = nodePath.slice(1);

      if (realPath.length === 0) return;

      const setor = realPath[0];

      if (realPath.length === 1) {
        fullPath = `/${setor.name}/${setor.id}`;
      } else {
        const subsetorAtual = realPath[realPath.length - 1];
        const idsPath = realPath.map(n => n.id).join('/');

        fullPath = `/${setor.name}/${subsetorAtual.name}/${idsPath}`;
      }
    }

    if (fullPath) {
      navigate(fullPath);
      onHide();
    }
  }, [hierarchyData, navigate, onHide, findValidParentNode]);

  // Renderizar organograma tradicional
  const renderOrganogram = (node, depth = 0) => {
    if (!node || !node.children || node.children.length === 0) return null;

    return (
      <div className={`organogram-level level-${depth}`}>
        {node.children.map((child, index) => (
          <div key={child.id} className="organogram-node-container">
            <div 
              className={`organogram-node ${getTypeStyle(child.type)}`}
              onMouseDown={preventSelection}
              onSelect={preventSelection}
            >
              {editingNodeId === child.id ? (
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    size="sm"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(child.id)}
                    autoFocus
                  />
                  <Button size="sm" variant="success" onClick={() => handleSaveEdit(child.id)}>
                    ✓
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingNodeId(null)}>
                    ✗
                  </Button>
                </div>
              ) : (
                <>
                  <div className="node-header">
                    <Badge pill className="node-type-badge">
                      {getTypeLabel(child.type)}
                    </Badge>
                    <Dropdown>
                      <Dropdown.Toggle 
                        variant="light" 
                        size="sm" 
                        className="node-actions"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        ⋮
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleNavigateTo(child)}>
                          <ExternalLink className="me-2" /> Acessar
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleEdit(child)}>
                          <Edit className="me-2" /> Editar
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => handleDelete(child)}
                        >
                          <Trash className="me-2" /> Excluir
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <div className="node-content">
                    <div className="node-title">{child.name}</div>
                    {child.employees > 0 && (
                      <div className="node-employees">
                        <Users size={14} className="me-1" />
                        {child.employees} funcionário(s)
                      </div>
                    )}
                  </div>

                  {child.children && child.children.length > 0 && (
                    <div className="node-expand">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedNodes(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(child.id)) newSet.delete(child.id);
                            else newSet.add(child.id);
                            return newSet;
                          });
                        }}
                      >
                        {expandedNodes.has(child.id) ? <Minus size={16} /> : <Plus size={16} />}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Linhas de conexão */}
            {index < node.children.length - 1 && (
              <div className="node-connector-horizontal"></div>
            )}

            {/* Filhos (se expandido) */}
            {child.children && child.children.length > 0 && expandedNodes.has(child.id) && (
              <>
                <div className="node-connector-vertical"></div>
                {renderOrganogram(child, depth + 1)}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!show) return null;

  return (
    <>
      <Modal 
        show={show} 
        onHide={handleClose} 
        size="xl" 
        centered 
        className="organogram-modal" 
        dialogClassName="organogram-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>Organograma - Visualização Hierárquica</Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0" style={{ maxHeight: '70vh' }}>
          <div className="d-flex h-100">
            {/* Painel Principal */}
            <div className="flex-grow-1 d-flex flex-column">
              {/* Cabeçalho */}
              <div className="p-3 border-bottom">
                <div className="d-flex gap-2 align-items-center">
                  <Form.Group className="">
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Pesquisar no organograma..."
                        className="ps-5"
                      />
                      <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    </div>
                  </Form.Group>

                  {/* Controles de Zoom */}
                  <ButtonGroup size="sm">
                    <Button variant="outline-secondary" onClick={handleZoomOut} title="Zoom Out">
                      <ZoomOut />
                    </Button>
                    <Button variant="outline-secondary" onClick={handleResetView} title="Resetar Visualização">
                      <Move />
                    </Button>
                    <Button variant="outline-secondary" onClick={handleZoomIn} title="Zoom In">
                      <ZoomIn />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              {/* Conteúdo - Organograma */}
              <div
                className="flex-grow-1 overflow-hidden organogram-viewport"
                ref={organogramContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                onSelect={preventSelection}
              >
                <div
                  className="organogram-container"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                    transformOrigin: '0 0'
                  }}
                >
                  {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                  ) : displayNodes.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum item nesta camada'}
                    </div>
                  ) : searchQuery ? (
                    // Modo de pesquisa - lista simples
                    <ListGroup variant="flush">
                      {searchResults.map(node => (
                        <ListGroup.Item 
                          key={node.id} 
                          className="d-flex align-items-center"
                          onMouseDown={preventSelection}
                        >
                          <Badge pill className={getTypeStyle(node.type) + ' me-2'}>
                            {getTypeLabel(node.type)}
                          </Badge>
                          <span className="fw-medium flex-grow-1">{node.name}</span>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleNavigateTo(node)}
                          >
                            Acessar
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    // Modo organograma tradicional
                    renderOrganogram(currentNode)
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <small className="text-muted me-auto">
            Clique em ⋮ para acessar, editar ou excluir qualquer item |
            Use o mouse para arrastar (pan) e os botões para zoom
          </small>
          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        showModal={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirmDelete={confirmDelete}
        entityId={nodeToDelete?.id}
        entityType={getTypeLabel(nodeToDelete?.type)}
      />

      {/* Modal de Criação */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Novo Nó</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="Digite o nome"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Tipo</Form.Label>
            <Form.Select
              value={newNodeType}
              onChange={(e) => setNewNodeType(e.target.value)}
            >
              <option value="subsetor">Subsetor</option>
              <option value="divisao">Divisão/Coordenadoria</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateSubmit}>
            Criar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrganogramModal;