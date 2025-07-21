import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  FiSearch as Search,
  FiChevronRight as ChevronRight,
  FiUsers as Users,
  FiX as X,
  FiCheck as Check,
  FiChevronLeft as ChevronLeft,
  FiHome as Home,
  FiPlus as Plus,
  FiMinus as Minus
} from 'react-icons/fi';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { API_BASE_URL } from '../utils/apiConfig';

const SectorModal = ({ show, onHide, onConfirm, initialSelected = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodes, setSelectedNodes] = useState(new Map());
  const [navigationPath, setNavigationPath] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const searchTimeoutRef = useRef();

  // Initialize with initial selected nodes
useEffect(() => {
  if (!initialSelected || initialSelected.length === 0) return;

  const newIds = initialSelected.map(node => node.id).sort();
  const currentIds = Array.from(selectedNodes.keys()).sort();

  const isDifferent =
    newIds.length !== currentIds.length ||
    newIds.some((id, i) => id !== currentIds[i]);

  if (isDifferent) {
    const initialMap = new Map();
    initialSelected.forEach(node => initialMap.set(node.id, node));
    setSelectedNodes(initialMap);
  }
}, [initialSelected]);



  // Transform data from API to expected structure
const transformData = useCallback((data) => {
  const transformNode = (node) => {
    const transformedNode = {
      id: node._id,
      name: node.nome,
      type: node.tipo?.toLowerCase() || 'divisao',
      employees: node.funcionarios?.length || node.quantidadeFuncionarios || 0
    };

    // Process children (subsetores and coordenadorias)
    const children = [
      ...(node.subsetores || []).map(transformNode),
      ...(node.coordenadorias || []).map(coord => ({
        id: coord._id,
        name: coord.nome,
        type: 'divisao',
        employees: coord.quantidadeFuncionarios || 0
      }))
    ];

    // Only add children if they exist
    if (children.length > 0) {
      transformedNode.children = children;
    }

    return transformedNode;
  };

  return data.setores.map(transformNode);
}, []);

  // Fetch hierarchy data from backend
  useEffect(() => {
    if (!show) return;

    const fetchHierarchy = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/setores/setoresOrganizados`);
        if (!response.ok) {
          throw new Error('Falha ao carregar dados da hierarquia');
        }
        const data = await response.json();
        const transformedData = transformData(data);
        
        const rootNode = {
          id: 'root',
          name: 'Todos os Setores',
          type: 'root',
          children: transformedData
        };
        
        setHierarchyData(rootNode);
        setNavigationPath([{ node: rootNode, index: 0 }]);
      } catch (err) {
        console.error('Erro ao carregar hierarquia:', err);
        setError('Falha ao carregar dados da hierarquia. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchy();
  }, [show, transformData]);

  const currentNode = navigationPath[navigationPath.length - 1]?.node || hierarchyData;

  // Debounced search
  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
    }, 300);
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

  // Memoized search results
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

  // Display nodes (either current level or search results)
  const displayNodes = useMemo(() => {
    if (!currentNode) return [];
    return searchQuery.trim() ? searchResults : currentNode.children || [];
  }, [searchQuery, searchResults, currentNode]);

  // Check if all divisions in a subtree are selected
  const areAllDivisionsSelected = useCallback((node) => {
    const getDivisions = (n) => {
      const divisions = [];
      if (n.type === 'divisao') {
        divisions.push(n);
      } else if (n.children) {
        n.children.forEach(child => divisions.push(...getDivisions(child)));
      }
      return divisions;
    };

    const allDivisions = getDivisions(node);
    return allDivisions.length > 0 && allDivisions.every(div => selectedNodes.has(div.id));
  }, [selectedNodes]);

  // Check if all direct divisions in current layer are selected
  const areAllDirectDivisionsSelected = useCallback((node) => {
    if (!node.children) return false;
    
    const directDivisions = node.children.filter(child => child.type === 'divisao');
    return directDivisions.length > 0 && directDivisions.every(div => selectedNodes.has(div.id));
  }, [selectedNodes]);

  // Toggle selection
  const toggleSelection = useCallback((node, isSelected) => {
    setSelectedNodes(prev => {
      const newMap = new Map(prev);
      
      if (node.type === 'divisao') {
        if (isSelected) {
          newMap.set(node.id, node);
        } else {
          newMap.delete(node.id);
        }
      } else {
        // For sectors/subsectors, toggle only direct divisions (current layer)
        node.children?.forEach(child => {
          if (child.type === 'divisao') {
            if (isSelected) {
              newMap.set(child.id, child);
            } else {
              newMap.delete(child.id);
            }
          }
        });
      }
      
      return newMap;
    });
  }, []);

  // Toggle selection recursively for "Select All" buttons
  const toggleSelectionRecursive = useCallback((node, isSelected) => {
    setSelectedNodes(prev => {
      const newMap = new Map(prev);
      
      const toggleDivisionsRecursive = (n, select) => {
        if (n.type === 'divisao') {
          if (select) {
            newMap.set(n.id, n);
          } else {
            newMap.delete(n.id);
          }
        } else if (n.children) {
          n.children.forEach(child => toggleDivisionsRecursive(child, select));
        }
      };
      
      toggleDivisionsRecursive(node, isSelected);
      return newMap;
    });
  }, []);

  // Navigate to child
  const navigateToChild = useCallback((child) => {
    setNavigationPath(prev => [...prev, { node: child, index: prev.length }]);
  }, []);

  // Navigate to specific breadcrumb level
  const navigateToBreadcrumb = useCallback((index) => {
    setNavigationPath(prev => prev.slice(0, index + 1));
  }, []);

  // Get type-specific styling
  const getTypeStyle = useCallback((type) => {
    const styles = {
      setor: 'bg-primary text-white',
      subsetor: 'bg-success text-white',
      divisao: 'bg-warning text-dark'
    };
    return styles[type] || 'bg-secondary text-white';
  }, []);

  // Get type label
  const getTypeLabel = useCallback((type) => {
    const labels = {
      setor: 'Setor',
      subsetor: 'Subsetor',
      divisao: 'Divisão',
      coordenadoria: 'Divisão'
    };
    return labels[type] || type;
  }, []);


const handleConfirmSelection = () => {
  const idsDivisoes = Array.from(selectedNodes.values()).map(n => n.id);
  onConfirm(idsDivisoes); // Agora envia apenas IDs
  onHide();
};

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!show) return;
      
      if (e.key === 'Escape') {
        onHide();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleConfirmSelection();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [show, selectedNodes, onHide, handleConfirmSelection]);

  const TreeItem = ({ node }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodes.has(node.id);
    const allChildrenSelected = areAllDivisionsSelected(node);
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div className="mb-2">
        <div 
          className={`
            d-flex align-items-center p-2 rounded cursor-pointer
            ${isSelected ? 'bg-primary bg-opacity-10' : 'hover-bg-light'}
          `}
        >
          {hasChildren && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2 p-1"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedNodes(prev => {
                  const newSet = new Set(prev);
                  if (isExpanded) {
                    newSet.delete(node.id);
                  } else {
                    newSet.add(node.id);
                  }
                  return newSet;
                });
              }}
            >
              {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
            </Button>
          )}
          
          <Form.Check
            type="checkbox"
            checked={node.type === 'divisao' ? isSelected : areAllDirectDivisionsSelected(node)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelection(node, e.target.checked);
            }}
            className="me-3"
          />
          
          <div className="flex-grow-1 d-flex align-items-center gap-2">
            <Badge pill className={getTypeStyle(node.type)}>
              {getTypeLabel(node.type)}
            </Badge>
            
            <span className="fw-medium">{node.name}</span>
            
            {node.type === 'divisao' && (
              <small className="text-muted d-flex align-items-center">
                <Users size={14} className="me-1" />
                {node.employees}
              </small>
            )}
          </div>
          
          {hasChildren && (
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const allRecursiveSelected = areAllDivisionsSelected(node);
                  toggleSelectionRecursive(node, !allRecursiveSelected);
                }}
              >
                {areAllDivisionsSelected(node) ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="p-1"
                onClick={() => navigateToChild(node)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ms-4 mt-2 ps-3 border-start">
            {node.children?.map(child => (
              <TreeItem key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Selecionar Setores e Divisões</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0" style={{ minHeight: '60vh' }}>
        <div className="d-flex h-100">
          {/* Left Panel - Navigation */}
          <div className="flex-grow-1 border-end d-flex flex-column" style={{ minWidth: '70%' }}>
            {/* Search */}
            <div className="p-3 border-bottom">
              <Form.Group>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Pesquisar setores, subsetores ou divisões..."
                    className="ps-5"
                  />
                  <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={20} />
                  {isSearching && (
                    <Spinner 
                      animation="border" 
                      size="sm" 
                      className="position-absolute top-50 end-0 translate-middle-y me-3" 
                    />
                  )}
                </div>
              </Form.Group>
              
              {/* Global Select All */}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    if (!hierarchyData) return;
                    
                    const allDivisions = [];
                    const collectDivisions = (node) => {
                      if (node.type === 'divisao') {
                        allDivisions.push(node);
                      } else if (node.children) {
                        node.children.forEach(collectDivisions);
                      }
                    };
                    collectDivisions(hierarchyData);
                    
                    const allSelected = allDivisions.every(div => selectedNodes.has(div.id));
                    
                    setSelectedNodes(prev => {
                      const newMap = new Map(prev);
                      if (allSelected) {
                        allDivisions.forEach(div => newMap.delete(div.id));
                      } else {
                        allDivisions.forEach(div => newMap.set(div.id, div));
                      }
                      return newMap;
                    });
                  }}
                >
                  {(() => {
                    if (!hierarchyData) return 'Marcar Todas as Divisões';
                    
                    const allDivisions = [];
                    const collectDivisions = (node) => {
                      if (node.type === 'divisao') {
                        allDivisions.push(node);
                      } else if (node.children) {
                        node.children.forEach(collectDivisions);
                      }
                    };
                    collectDivisions(hierarchyData);
                    const allSelected = allDivisions.every(div => selectedNodes.has(div.id));
                    return allSelected ? 'Desmarcar Todas as Divisões' : 'Marcar Todas as Divisões';
                  })()}
                </Button>
                <small className="text-muted">
                  {selectedNodes.size} divisões selecionadas
                </small>
              </div>
            </div>

            {/* Breadcrumbs */}
            {!searchQuery && navigationPath.length > 0 && (
              <div className="p-3 border-bottom">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    {navigationPath.map((path, index) => (
                      <li 
                        key={path.node.id}
                        className={`breadcrumb-item ${index === navigationPath.length - 1 ? 'active' : ''}`}
                        aria-current={index === navigationPath.length - 1 ? 'page' : undefined}
                      >
                        {index === 0 ? (
                          <button 
                            onClick={() => navigateToBreadcrumb(0)}
                            className="btn btn-link p-0 text-decoration-none"
                          >
                            <Home size={16} className="me-1 align-text-bottom" />
                            Início
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigateToBreadcrumb(index)}
                            className="btn btn-link p-0 text-decoration-none"
                          >
                            {path.node.name}
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            )}

            {/* Navigation Back Button */}
            {!searchQuery && navigationPath.length > 1 && (
              <div className="p-3 border-bottom">
                <Button
                  variant="link"
                  onClick={() => setNavigationPath(prev => prev.slice(0, -1))}
                  className="p-0 text-decoration-none"
                >
                  <ChevronLeft size={16} className="me-1" />
                  Voltar
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-grow-1 overflow-auto p-3">
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : displayNodes.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum item encontrado'}
                </div>
              ) : (
                <div>
                  {displayNodes.map(node => (
                    <TreeItem key={node.id} node={node} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Selected Items */}
          <div className="flex-shrink-0 p-3 bg-light" style={{ width: '30%' }}>
            <h5 className="mb-3">
              Divisões Selecionadas <Badge bg="primary">{selectedNodes.size}</Badge>
            </h5>
            
            {selectedNodes.size === 0 ? (
              <p className="text-muted text-center py-4">
                Nenhuma divisões selecionada
              </p>
            ) : (
              <ListGroup variant="flush">
                {Array.from(selectedNodes.values()).map(node => (
                  <ListGroup.Item key={node.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-medium">{node.name}</div>
                      <small className="text-muted d-flex align-items-center">
                        <Users size={12} className="me-1" />
                        {node.employees} funcionários
                      </small>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0"
                      onClick={() => toggleSelection(node, false)}
                    >
                      <X size={16} />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <small className="text-muted me-auto">
          Pressione Ctrl + Enter para confirmar
        </small>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConfirmSelection}
          disabled={selectedNodes.size === 0}
        >
          <Check className="me-2" size={16} />
          Confirmar Seleção
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SectorModal;