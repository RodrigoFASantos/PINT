import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Categoria.css';
import Sidebar from '../../components/Sidebar';

/**
 * Componente para gestão de categorias de formação
 * Permite visualizar, criar, editar e eliminar categorias com validações de integridade
 */
const Gerir_Categoria = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para gestão dos dados das categorias
  const [categorias, setCategorias] = useState([]);
  const [totalCategorias, setTotalCategorias] = useState(0);
  
  // Estados para paginação e filtros
  const [paginaAtual, setPaginaAtual] = useState(1);
  const categoriasPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '' });
  
  // Estados para modais de confirmação e edição
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editCategoria, setEditCategoria] = useState(null);
  const [newCategoriaNome, setNewCategoriaNome] = useState('');
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  
  // Referência para timeout de filtros
  const filterTimeoutRef = useRef(null);

  /**
   * Alternar visibilidade da barra lateral
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Buscar categorias da API com paginação e filtros
   */
  const buscarCategorias = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    console.log('🔄 [FRONTEND] A buscar categorias...', { pagina, filtros: filtrosAtuais });
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Preparar parâmetros da requisição
      const params = {
        page: pagina,
        limit: categoriasPorPagina,
      };
      
      // Adicionar filtro de nome se especificado
      if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
        params.search = filtrosAtuais.nome.trim();
      }
      
      console.log('📡 [FRONTEND] Parâmetros da requisição:', params);
      console.log('📡 [FRONTEND] URL completa:', `${API_BASE}/categorias`);
      
      // Fazer requisição à API
      const response = await axios.get(`${API_BASE}/categorias`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📨 [FRONTEND] ========== RESPOSTA COMPLETA ==========');
      console.log('📨 [FRONTEND] Status:', response.status);
      console.log('📨 [FRONTEND] Headers:', response.headers);
      console.log('📨 [FRONTEND] Dados:', response.data);
      console.log('📨 [FRONTEND] Tipo da resposta:', typeof response.data);
      console.log('📨 [FRONTEND] É array?:', Array.isArray(response.data));
      
      let categoriasRecebidas = [];
      let totalRecebido = 0;
      
      // Processar resposta da API - suportar múltiplos formatos
      if (response.data && response.data.success && Array.isArray(response.data.categorias)) {
        // Formato estruturado: {success: true, categorias: [...], total: ...}
        categoriasRecebidas = response.data.categorias;
        totalRecebido = response.data.total || 0;
        console.log('✅ [FRONTEND] Formato estruturado detectado');
        
      } else if (Array.isArray(response.data)) {
        // Formato array direto: [{...}, {...}]
        console.log('⚠️ [FRONTEND] Formato array direto detectado - a API não está a usar o controlador correto!');
        categoriasRecebidas = response.data;
        totalRecebido = response.data.length;
        
        // Tentar buscar contagem de áreas manualmente para cada categoria
        console.log('🔧 [FRONTEND] A tentar buscar contagem de áreas manualmente...');
        
        try {
          categoriasRecebidas = await Promise.all(
            categoriasRecebidas.map(async (categoria) => {
              try {
                // Buscar áreas para esta categoria específica
                const areasResponse = await axios.get(`${API_BASE}/areas`, {
                  params: { categoria_id: categoria.id_categoria },
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                let areasCount = 0;
                if (areasResponse.data && Array.isArray(areasResponse.data)) {
                  areasCount = areasResponse.data.filter(area => area.id_categoria === categoria.id_categoria).length;
                } else if (areasResponse.data && areasResponse.data.areas) {
                  areasCount = areasResponse.data.areas.filter(area => area.id_categoria === categoria.id_categoria).length;
                }
                
                console.log(`🔍 [FRONTEND] Categoria "${categoria.nome}" tem ${areasCount} área(s) (contagem manual)`);
                
                return {
                  ...categoria,
                  areas_count: areasCount
                };
                
              } catch (error) {
                console.warn(`⚠️ [FRONTEND] Erro ao buscar áreas para categoria ${categoria.nome}:`, error.message);
                return {
                  ...categoria,
                  areas_count: 0
                };
              }
            })
          );
        } catch (error) {
          console.error('❌ [FRONTEND] Erro na contagem manual de áreas:', error);
          // Fallback: adicionar areas_count = 0 se a contagem manual falhar
          categoriasRecebidas = categoriasRecebidas.map(categoria => ({
            ...categoria,
            areas_count: 0
          }));
        }
        
      } else {
        console.error('❌ [FRONTEND] Formato de resposta não reconhecido:', response.data);
        toast.error('Formato de dados inválido recebido do servidor');
        setCategorias([]);
        setTotalCategorias(0);
        return;
      }
      
      console.log(`✅ [FRONTEND] Processadas ${categoriasRecebidas.length} categorias de um total de ${totalRecebido}`);
      
      // Log detalhado de cada categoria para verificar areas_count
      categoriasRecebidas.forEach((categoria, index) => {
        console.log(`📂 [FRONTEND] Categoria ${index + 1}:`, {
          id: categoria.id_categoria,
          nome: categoria.nome,
          areas_count: categoria.areas_count,
          tipo_areas_count: typeof categoria.areas_count,
          objeto_completo: categoria
        });
      });
      
      // Atualizar estados
      setCategorias(categoriasRecebidas);
      setTotalCategorias(totalRecebido);
      setPaginaAtual(pagina);
      
      console.log('📊 [FRONTEND] Estados atualizados com sucesso');
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao buscar categorias:', error);
      
      if (error.response?.status === 401) {
        toast.error('Não autorizado. Faz login novamente.');
        navigate('/login');
      } else {
        toast.error(`Erro ao carregar categorias: ${error.response?.data?.message || 'Erro desconhecido'}`);
      }
      
      setCategorias([]);
      setTotalCategorias(0);
      
    } finally {
      setLoading(false);
    }
  }, [categoriasPorPagina, navigate, filtros]);

  /**
   * Carregamento inicial das categorias
   */
  useEffect(() => {
    console.log('🚀 [FRONTEND] Inicializando componente...');
    
    const inicializar = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('🔒 [FRONTEND] Token não encontrado, redirecionando para login');
          navigate('/login');
          return;
        }
        
        // Verificar permissões do utilizador
        if (currentUser) {
          console.log('👤 [FRONTEND] Utilizador atual:', currentUser);
          
          if (currentUser.id_cargo !== 1) {
            console.log('⛔ [FRONTEND] Utilizador sem permissões de administrador');
            toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
            navigate('/');
            return;
          }
        }
        
        // Carregar categorias
        await buscarCategorias(1, { nome: '' });
        
      } catch (error) {
        console.error('❌ [FRONTEND] Erro na inicialização:', error);
        
        if (error.response?.status === 401) {
          toast.error('Não autorizado. Por favor, faz login novamente.');
          navigate('/login');
        } else {
          toast.error('Erro ao carregar dados. Por favor, tenta novamente mais tarde.');
        }
        
        setLoading(false);
      }
    };

    inicializar();
  }, [navigate, currentUser, buscarCategorias]);

  /**
   * Gerir alterações nos filtros com delay para melhorar performance
   */
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    
    // Limpar timeout anterior se existir
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    setFiltros(prev => {
      const novosFiltros = { ...prev, [name]: value };
      
      setLoading(true);
      
      // Aplicar filtros com delay para evitar muitas requisições
      filterTimeoutRef.current = setTimeout(() => {
        console.log('🔍 [FRONTEND] Aplicando filtros:', novosFiltros);
        setPaginaAtual(1);
        buscarCategorias(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  /**
   * Limpar todos os filtros aplicados
   */
  const handleLimparFiltros = () => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '' };
    
    console.log('🧹 [FRONTEND] A limpar filtros');
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    buscarCategorias(1, filtrosLimpos);
  };

  /**
   * Navegar para a página anterior
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      console.log(`⬅️ [FRONTEND] Página anterior: ${novaPagina}`);
      buscarCategorias(novaPagina, filtros);
    }
  };

  /**
   * Navegar para a próxima página
   */
  const handleProximaPagina = () => {
    const totalPaginas = Math.max(1, Math.ceil(totalCategorias / categoriasPorPagina));
    if (paginaAtual < totalPaginas && !loading) {
      const novaPagina = paginaAtual + 1;
      console.log(`➡️ [FRONTEND] Próxima página: ${novaPagina}`);
      buscarCategorias(novaPagina, filtros);
    }
  };

  /**
   * Abrir formulário para criar nova categoria
   */
  const handleOpenCategoriaForm = () => {
    setShowCategoriaForm(true);
    setEditCategoria(null);
    setNewCategoriaNome('');
  };

  /**
   * Fechar formulário de categoria
   */
  const handleCloseCategoriaForm = () => {
    setShowCategoriaForm(false);
    setEditCategoria(null);
    setNewCategoriaNome('');
  };

  /**
   * Guardar categoria (criar ou editar)
   */
  const handleSaveCategoria = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!newCategoriaNome.trim()) {
        toast.error('Por favor, insere um nome para a categoria.');
        return;
      }
      
      const dadosCategoria = { nome: newCategoriaNome.trim() };
      
      if (editCategoria) {
        console.log(`✏️ [FRONTEND] A editar categoria ${editCategoria.id_categoria}`);
        
        await axios.put(`${API_BASE}/categorias/${editCategoria.id_categoria}`, dadosCategoria, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria atualizada com sucesso!');
      } else {
        console.log('➕ [FRONTEND] A criar nova categoria');
        
        await axios.post(`${API_BASE}/categorias`, dadosCategoria, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria criada com sucesso!');
      }
      
      handleCloseCategoriaForm();
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao guardar categoria:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
    }
  };

  /**
   * Abrir formulário de edição para uma categoria específica
   */
  const handleEditarCategoria = (categoria) => {
    console.log('✏️ [FRONTEND] A editar categoria:', categoria);
    setEditCategoria(categoria);
    setNewCategoriaNome(categoria.nome);
    setShowCategoriaForm(true);
  };

  /**
   * Confirmar eliminação de categoria
   */
  const handleConfirmarExclusao = (categoria) => {
    console.log('🗑️ [FRONTEND] A confirmar eliminação da categoria:', categoria);
    setCategoriaParaExcluir(categoria);
    setShowDeleteConfirmation(true);
  };

  /**
   * Eliminar categoria após confirmação
   */
  const handleExcluirCategoria = async () => {
    if (!categoriaParaExcluir) return;
    
    try {
      const token = localStorage.getItem('token');
      
      console.log(`🗑️ [FRONTEND] A eliminar categoria ${categoriaParaExcluir.id_categoria}`);
      
      await axios.delete(`${API_BASE}/categorias/${categoriaParaExcluir.id_categoria}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Categoria eliminada com sucesso!');
      setShowDeleteConfirmation(false);
      setCategoriaParaExcluir(null);
      
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao eliminar categoria:', error);
      
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Categoria não encontrada. Pode já ter sido eliminada.');
        } else {
          toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
      
      setShowDeleteConfirmation(false);
      setCategoriaParaExcluir(null);
    }
  };

  /**
   * Navegar para gestão de áreas
   */
  const handleIrParaAreas = () => {
    navigate('/admin/areas');
  };

  // Cálculos para apresentação
  const totalPaginas = Math.max(1, Math.ceil(totalCategorias / categoriasPorPagina));
  const categoriasParaMostrar = Array.isArray(categorias) ? categorias : [];
  
  // Linhas vazias para manter altura consistente da tabela
  const linhasVazias = [];
  const linhasNecessarias = Math.max(0, categoriasPorPagina - categoriasParaMostrar.length);
  for (let i = 0; i < linhasNecessarias; i++) {
    linhasVazias.push(i);
  }

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Ecrã de carregamento inicial
  if (loading && categorias.length === 0) {
    return (
      <div className="gerenciar-categorias-container-gerir-categorias">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content-gerir-categorias">
          <div className="loading-container-gerir-categorias">
            <div className="loading-spinner-gerir-categorias"></div>
            <p>A carregar categorias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gerenciar-categorias-container-gerir-categorias">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content-gerir-categorias">
        {/* Cabeçalho principal */}
        <div className="categorias-header-gerir-categorias">
          <h1>
            Gestão de Categorias 
            <span className="total-count-gerir-categorias">({totalCategorias})</span>
          </h1>
          <div className="header-actions-gerir-categorias">
            <button 
              className="btn-navegacao-gerir-categorias"
              onClick={handleIrParaAreas}
            >
              Gerir Áreas
            </button>
            <button 
              className="criar-btn-gerir-categorias"
              onClick={handleOpenCategoriaForm}
            >
              Criar Nova Categoria
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="filtros-container-gerir-categorias">
          <div className="filtros-principais-gerir-categorias">
            <div className="filtro-gerir-categorias">
              <label htmlFor="nome">Nome da Categoria:</label>
              <input 
                type="text"
                id="nome"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Filtrar por nome"
              />
            </div>
          </div>
          
          <div className="filtro-acoes-gerir-categorias">
            <button 
              className="btn-limpar-gerir-categorias"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        {/* Tabela principal */}
        <div className="categorias-table-container-gerir-categorias">
          {loading ? (
            <div className="loading-container-gerir-categorias">
              <div className="loading-spinner-gerir-categorias"></div>
              <p>A carregar categorias...</p>
            </div>
          ) : !Array.isArray(categoriasParaMostrar) || categoriasParaMostrar.length === 0 ? (
            <div className="no-items-gerir-categorias">
              <p>Nenhuma categoria encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="categorias-table-gerir-categorias">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Categoria</th>
                    <th>Total de Áreas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasParaMostrar.map((categoria, index) => {
                    if (!categoria || typeof categoria !== 'object') {
                      console.warn(`⚠️ [FRONTEND] Categoria inválida no índice ${index}:`, categoria);
                      return null;
                    }
                    
                    const categoriaId = categoria.id_categoria || categoria.id || index;
                    const areasCount = categoria.areas_count;
                    
                    // Log para debug da contagem de áreas
                    console.log(`📊 [FRONTEND] Renderizando categoria "${categoria.nome}": areas_count = ${areasCount} (tipo: ${typeof areasCount})`);
                    
                    return (
                      <tr key={categoriaId}>
                        <td>{categoriaId}</td>
                        <td className="categoria-nome-gerir-categorias">
                          {categoria.nome || 'Nome não disponível'}
                        </td>
                        <td className="areas-count-gerir-categorias">
                          {(() => {
                            // Validação robusta do valor areas_count
                            if (areasCount === null || areasCount === undefined) {
                              console.warn(`⚠️ [FRONTEND] areas_count nulo/indefinido para categoria "${categoria.nome}"`);
                              return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>N/A</span>;
                            }
                            
                            if (typeof areasCount === 'number') {
                              return (
                                <span 
                                  className="count-badge-gerir-categorias"
                                  style={{ 
                                    backgroundColor: areasCount === 0 ? '#f8f9fa' : '#d4edda',
                                    color: areasCount === 0 ? '#6c757d' : '#155724',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                  }}
                                >
                                  {areasCount}
                                </span>
                              );
                            }
                            
                            // Tentar converter para número
                            const numericCount = parseInt(areasCount, 10);
                            if (!isNaN(numericCount)) {
                              return (
                                <span 
                                  className="count-badge-gerir-categorias"
                                  style={{ 
                                    backgroundColor: numericCount === 0 ? '#f8f9fa' : '#d4edda',
                                    color: numericCount === 0 ? '#6c757d' : '#155724',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                  }}
                                >
                                  {numericCount}
                                </span>
                              );
                            }
                            
                            console.error(`❌ [FRONTEND] Valor inválido areas_count para categoria "${categoria.nome}":`, areasCount);
                            return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>ERRO</span>;
                          })()}
                        </td>
                        <td className="acoes-gerir-categorias">
                          <button 
                            className="btn-icon-gerir-categorias btn-editar-gerir-categorias"
                            onClick={() => handleEditarCategoria(categoria)}
                            title="Editar categoria"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-gerir-categorias btn-excluir-gerir-categorias"
                            onClick={() => handleConfirmarExclusao(categoria)}
                            title={areasCount > 0 ? 
                              `Não é possível eliminar - tem ${areasCount} área(s) associada(s)` : 
                              'Eliminar categoria'
                            }
                            disabled={areasCount > 0}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Linhas vazias para manter altura consistente */}
                  {linhasVazias.map((_, index) => (
                    <tr key={`empty-${index}`} className="linha-vazia-gerir-categorias">
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginação */}
              <div className="paginacao-gerir-categorias">
                <button 
                  onClick={handlePaginaAnterior} 
                  disabled={paginaAtual === 1 || loading}
                  className="btn-pagina-gerir-categorias btn-anterior-gerir-categorias"
                >
                  <span className="pagination-icon-gerir-categorias">&#8249;</span>
                  <span className="btn-text-gerir-categorias">Anterior</span>
                </button>
                
                <div className="pagina-info-gerir-categorias">
                  <span className="pagina-atual-gerir-categorias">
                    {loading ? 'A carregar...' : `Página ${paginaAtual} de ${totalPaginas}`}
                  </span>
                </div>
                
                <button 
                  onClick={handleProximaPagina}
                  disabled={paginaAtual >= totalPaginas || loading}
                  className="btn-pagina-gerir-categorias btn-seguinte-gerir-categorias"
                >
                  <span className="btn-text-gerir-categorias">Seguinte</span>
                  <span className="pagination-icon-gerir-categorias">&#8250;</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal para criar/editar categoria */}
      {showCategoriaForm && (
        <div className="modal-overlay-gerir-categorias">
          <div className="modal-content-gerir-categorias">
            <h3>{editCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h3>
            <div className="form-group-gerir-categorias">
              <label htmlFor="newCategoriaNome">Nome da Categoria:</label>
              <input 
                type="text" 
                id="newCategoriaNome" 
                value={newCategoriaNome}
                onChange={(e) => setNewCategoriaNome(e.target.value)}
                placeholder="Digite o nome da categoria"
                maxLength="100"
                autoFocus
              />
            </div>
            <div className="modal-actions-gerir-categorias">
              <button 
                className="btn-cancelar-gerir-categorias"
                onClick={handleCloseCategoriaForm}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-categorias"
                onClick={handleSaveCategoria}
                disabled={!newCategoriaNome.trim()}
              >
                {editCategoria ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para confirmar eliminação */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-categorias">
          <div className="modal-content-gerir-categorias">
            <h3>Confirmar Eliminação</h3>
            <p>
              Tens a certeza que queres eliminar a categoria "<strong>{categoriaParaExcluir?.nome}</strong>"?
            </p>
            <p className="warning-text-gerir-categorias">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions-gerir-categorias">
              <button 
                className="btn-cancelar-gerir-categorias"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-categorias btn-danger-gerir-categorias"
                onClick={handleExcluirCategoria}
              >
                Confirmar Eliminação
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Gerir_Categoria;