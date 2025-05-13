import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import './css/gerir_Categoria.css';

const Gerir_Categoria = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('criar'); // 'criar' ou 'editar'
  const [formData, setFormData] = useState({ nome: '' });
  
  // Auth context
  const { currentUser } = useAuth();
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const categoriasPorPagina = 20;
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    nome: ''
  });

  // Ref para controlar debounce nos filtros
  const filterTimeoutRef = useRef(null);

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] Gerir_Categoria: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar categorias com paginação e filtros (usando useCallback)
  const buscarCategorias = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      console.log('[DEBUG] Gerir_Categoria: A iniciar busca de categorias - Página:', pagina);
      console.log('[DEBUG] Gerir_Categoria: Filtros aplicados:', filtrosAtuais);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Criar objeto de parâmetros para a requisição
      const params = {
        page: pagina,
        limit: categoriasPorPagina,
      };
      
      // Adicionar filtros válidos
      if (filtrosAtuais.nome) {
        params.search = filtrosAtuais.nome;
      }
      
      // Remover parâmetros vazios
      Object.keys(params).forEach(key => 
        (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      console.log('[DEBUG] Gerir_Categoria: A buscar categorias com os parâmetros finais:', params);
      
      const response = await axios.get(`${API_BASE}/categorias`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Categoria: Resposta da API:', response.data);
      
      // Verifica a estrutura dos dados recebidos
      if (response.data) {
        if (Array.isArray(response.data.categorias)) {
          setCategorias(response.data.categorias);
          setTotalCategorias(response.data.total || response.data.categorias.length);
        } else if (Array.isArray(response.data)) {
          // Se a resposta for um array direto
          setCategorias(response.data);
          setTotalCategorias(response.data.length);
        } else {
          console.error('[DEBUG] Gerir_Categoria: Formato de resposta inesperado:', response.data);
          toast.error('Formato de dados inválido recebido do servidor.');
          setCategorias([]);
          setTotalCategorias(0);
        }
      } else {
        console.error('[DEBUG] Gerir_Categoria: Resposta vazia ou inválida');
        toast.error('Nenhum dado recebido do servidor.');
        setCategorias([]);
        setTotalCategorias(0);
      }
      
      setPaginaAtual(pagina);
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] Gerir_Categoria: Erro ao buscar categorias:', error);
      
      if (error.response) {
        console.error('[DEBUG] Gerir_Categoria: Dados do erro:', error.response.data);
        console.error('[DEBUG] Gerir_Categoria: Status:', error.response.status);
        
        if (error.response.status === 401) {
          console.log('[DEBUG] Gerir_Categoria: Erro 401 - Não autorizado. A redirecionar para login...');
          toast.error('Não autorizado. Faça login novamente.');
          navigate('/login');
        } else {
          toast.error(`Erro ao carregar categorias: ${error.response.data.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
      }
      
      setCategorias([]);
      setTotalCategorias(0);
      setLoading(false);
    }
  }, [categoriasPorPagina, navigate]);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DEBUG] Gerir_Categoria: ===== A INICIAR VERIFICAÇÕES DE AUTENTICAÇÃO =====');
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('[DEBUG] Gerir_Categoria: Token não encontrado. A redirecionar para login...');
          navigate('/login');
          return;
        }
        
        console.log('[DEBUG] Gerir_Categoria: Autenticação verificada com sucesso. A buscar dados...');
        
        // Obter categorias (primeira página) - com filtros vazios inicialmente
        await buscarCategorias(1, filtros);
        
      } catch (error) {
        console.error('[DEBUG] Gerir_Categoria: Erro ao carregar dados:', error);
        
        if (error.response && error.response.status === 401) {
          console.log('[DEBUG] Gerir_Categoria: Erro 401 - Não autorizado. A redirecionar para login...');
          toast.error('Não autorizado. Por favor, faça login novamente.');
          navigate('/login');
        } else {
          toast.error('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, buscarCategorias]);

  // Handler para mudança de filtros com debounce
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] Gerir_Categoria: Filtro alterado: ${name} = ${value}`);
    
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    setFiltros(prev => {
      const novosFiltros = {
        ...prev,
        [name]: value
      };
      
      setLoading(true);
      
      filterTimeoutRef.current = setTimeout(() => {
        buscarCategorias(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    console.log('[DEBUG] Gerir_Categoria: A limpar filtros');
    
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = {
      nome: ''
    };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    
    buscarCategorias(1, filtrosLimpos);
  };

  // Funções de navegação
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      buscarCategorias(paginaAtual - 1, filtros);
    }
  };

  const handleProximaPagina = () => {
    const totalPaginas = Math.ceil(totalCategorias / categoriasPorPagina);
    if (paginaAtual < totalPaginas) {
      buscarCategorias(paginaAtual + 1, filtros);
    }
  };

  // Função para mostrar o modal de criação
  const handleCriarCategoria = () => {
    setFormData({ nome: '' });
    setFormMode('criar');
    setShowFormModal(true);
  };

  // Função para mostrar o modal de edição
  const handleEditarCategoria = (categoria, e) => {
    e.stopPropagation();
    setFormData({ 
      id: categoria.id_categoria || categoria.id,
      nome: categoria.nome 
    });
    setFormMode('editar');
    setShowFormModal(true);
  };

  // Função para mostrar confirmação de exclusão
  const handleConfirmarExclusao = (categoria, e) => {
    e.stopPropagation();
    console.log('[DEBUG] Gerir_Categoria: A solicitar confirmação de exclusão para categoria:', categoria);
    setCategoriaParaExcluir(categoria);
    setShowDeleteConfirmation(true);
  };

  // Função para salvar categoria (criar ou editar)
  const handleSalvarCategoria = async () => {
    if (!formData.nome.trim()) {
      toast.error('O nome da categoria é obrigatório!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (formMode === 'criar') {
        console.log('[DEBUG] Gerir_Categoria: A criar nova categoria:', formData);
        
        const response = await axios.post(`${API_BASE}/categorias`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Categoria: Categoria criada com sucesso:', response.data);
        toast.success('Categoria criada com sucesso!');
      } else {
        console.log('[DEBUG] Gerir_Categoria: A atualizar categoria:', formData);
        
        const response = await axios.put(`${API_BASE}/categorias/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Categoria: Categoria atualizada com sucesso:', response.data);
        toast.success('Categoria atualizada com sucesso!');
      }
      
      setShowFormModal(false);
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Categoria: Erro ao salvar categoria:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data.message || 'Falha ao processar a requisição.'}`);
      } else {
        toast.error('Erro de conexão. Verifique sua conexão com a internet.');
      }
    }
  };

  // Função para excluir a categoria
  const handleExcluirCategoria = async () => {
    if (!categoriaParaExcluir) return;
    
    const categoriaId = categoriaParaExcluir.id_categoria || categoriaParaExcluir.id;
    console.log('[DEBUG] Gerir_Categoria: A iniciar exclusão da categoria:', categoriaId);
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/categorias/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Categoria: Categoria excluída com sucesso');
      toast.success('Categoria excluída com sucesso!');
      
      // Atualizar a lista de categorias
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Categoria: Erro ao excluir categoria:', error);
      
      if (error.response) {
        if (error.response.status === 400 && error.response.data.message.includes('áreas associadas')) {
          toast.error('Esta categoria não pode ser excluída porque possui áreas associadas.');
        } else {
          toast.error(`Erro ao excluir categoria: ${error.response.data.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro de conexão. Verifique sua conexão com a internet.');
      }
    } finally {
      setShowDeleteConfirmation(false);
      setCategoriaParaExcluir(null);
    }
  };

  // Calcular número total de páginas
  const totalPaginas = Math.ceil(totalCategorias / categoriasPorPagina);

  // Limpar timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Interface de carregamento
  if (loading && categorias.length === 0) {
    return (
      <div className="gerenciar-categorias-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>A carregar categorias...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="gerenciar-categorias-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <div className="categorias-header">
          <h1>Categorias</h1>
          <button 
            className="criar-categoria-btn"
            onClick={handleCriarCategoria}
          >
            Criar Nova Categoria
          </button>
        </div>
        
        <div className="filtros-container">
          <div className="filtro">
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
          
          <div className="filtro-acoes limpar-filtros-container">
            <button 
              className="btn-limpar"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        <div className="categorias-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>A carregar categorias...</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="no-categorias">
              <p>Nenhuma categoria encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="categorias-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Categoria</th>
                    <th>Áreas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(categoria => {
                    // Obter ID da categoria de maneira consistente
                    const categoriaId = categoria.id_categoria || categoria.id;
                    
                    // Obter número de áreas (se disponível)
                    const numAreas = categoria.areas_count || 0;
                    
                    return (
                      <tr 
                        key={categoriaId} 
                        className="categoria-row"
                      >
                        <td>{categoriaId}</td>
                        <td className="categoria-nome">{categoria.nome}</td>
                        <td>{numAreas} área{numAreas !== 1 ? 's' : ''}</td>
                        <td className="acoes">
                          <button 
                            className="btn-icon btn-editar"
                            onClick={(e) => handleEditarCategoria(categoria, e)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon btn-excluir"
                            onClick={(e) => handleConfirmarExclusao(categoria, e)}
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="paginacao">
                  <button 
                    onClick={handlePaginaAnterior} 
                    disabled={paginaAtual === 1 || loading}
                    className="btn-pagina"
                    aria-label="Página anterior"
                  >
                    <span className="pagination-icon">&#10094;</span>
                  </button>
                  
                  <span className="pagina-atual">
                    {paginaAtual}/{totalPaginas}
                  </span>
                  
                  <button 
                    onClick={handleProximaPagina}
                    disabled={paginaAtual === totalPaginas || loading}
                    className="btn-pagina"
                    aria-label="Próxima página"
                  >
                    <span className="pagination-icon">&#10095;</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modal de formulário (criar/editar) */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{formMode === 'criar' ? 'Criar Nova Categoria' : 'Editar Categoria'}</h3>
            <div className="form-group">
              <label htmlFor="categoria-nome">Nome da Categoria:</label>
              <input 
                type="text"
                id="categoria-nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => setShowFormModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleSalvarCategoria}
              >
                {formMode === 'criar' ? 'Criar Categoria' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja excluir a categoria "{categoriaParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleExcluirCategoria}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
};

export default Gerir_Categoria;