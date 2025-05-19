import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Categoria.css';
import Sidebar from '../../components/Sidebar';

const Gerir_Categoria = () => {
  const navigate = useNavigate();
  
  // Auth context
  const { currentUser } = useAuth();
  
  // Estados para sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para categorias
  const [categorias, setCategorias] = useState([]);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const categoriasPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '' });
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editCategoria, setEditCategoria] = useState(null);
  const [newCategoriaNome, setNewCategoriaNome] = useState('');
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  
  // Estado de carregamento
  const [loading, setLoading] = useState(true);
  
  // Ref para debounce
  const filterTimeoutRef = useRef(null);

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] Gerir_Categoria: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar categorias com paginação e filtros
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
      
      console.log('[DEBUG] Gerir_Categoria: Resposta da API (categorias):', response.data);
      
      if (response.data) {
        if (Array.isArray(response.data.categorias)) {
          setCategorias(response.data.categorias);
          setTotalCategorias(response.data.total || response.data.categorias.length);
        } else if (Array.isArray(response.data)) {
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
          toast.error(`Erro ao carregar categorias: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        console.error('[DEBUG] Gerir_Categoria: Erro:', error.message);
        toast.error('Erro ao processar a requisição.');
      }
      
      setCategorias([]);
      setTotalCategorias(0);
      setLoading(false);
    }
  }, [categoriasPorPagina, navigate]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DEBUG] Gerir_Categoria: ===== A INICIAR VERIFICAÇÕES DE AUTENTICAÇÃO =====');
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('[DEBUG] Gerir_Categoria: Token no localStorage:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
          console.log('[DEBUG] Gerir_Categoria: Token não encontrado. A redirecionar para login...');
          navigate('/login');
          return;
        }
        
        // Log do usuário atual do AuthContext
        console.log('[DEBUG] Gerir_Categoria: Utilizador atual do AuthContext:', currentUser);
        
        if (currentUser) {
          console.log('[DEBUG] Gerir_Categoria: Dados do utilizador do AuthContext:', {
            id_utilizador: currentUser.id_utilizador,
            nome: currentUser.nome,
            id_cargo: currentUser.id_cargo,
            email: currentUser.email,
            cargo: currentUser.cargo
          });
          
          // Verificar se o usuário tem permissão (admin ou gestor)
          if (currentUser.id_cargo !== 1) {
            console.log('[DEBUG] Gerir_Categoria: Usuário não é administrador. Redirecionando...');
            toast.error('Acesso negado. Você não tem permissão para acessar esta página.');
            navigate('/');
            return;
          }
        }
        
        console.log('[DEBUG] Gerir_Categoria: Autenticação verificada com sucesso. A buscar dados...');
        
        // Buscar categorias iniciais
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
  }, [navigate, currentUser, buscarCategorias]);

  // Handler para mudança de filtros com debounce
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] Gerir_Categoria: Filtro alterado: ${name} = ${value}`);
    
    // Limpar qualquer temporizador existente
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Atualizar o estado dos filtros
    setFiltros(prev => {
      const novosFiltros = {
        ...prev,
        [name]: value
      };
      
      console.log('[DEBUG] Gerir_Categoria: Novos filtros:', novosFiltros);
      
      // Ativar o indicador de carregamento imediatamente
      setLoading(true);
      
      // Configurar novo temporizador de debounce
      filterTimeoutRef.current = setTimeout(() => {
        // Quando o temporizador disparar, usar os valores atuais dos filtros
        buscarCategorias(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    console.log('[DEBUG] Gerir_Categoria: A limpar filtros');
    
    // Limpar qualquer temporizador existente
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '' };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    
    // Buscar dados com filtros limpos
    buscarCategorias(1, filtrosLimpos);
  };

  // Funções de navegação
  const handlePaginaAnterior = () => {
    console.log('[DEBUG] Gerir_Categoria: A navegar para página anterior');
    if (paginaAtual > 1) {
      buscarCategorias(paginaAtual - 1, filtros);
    }
  };

  const handleProximaPagina = () => {
    console.log('[DEBUG] Gerir_Categoria: A navegar para próxima página');
    const totalPaginas = Math.ceil(totalCategorias / categoriasPorPagina);
    if (paginaAtual < totalPaginas) {
      buscarCategorias(paginaAtual + 1, filtros);
    }
  };

  // Funções para criar nova categoria
  const handleOpenCategoriaForm = () => {
    setShowCategoriaForm(true);
    setEditCategoria(null);
    setNewCategoriaNome('');
  };

  const handleCloseCategoriaForm = () => {
    setShowCategoriaForm(false);
    setEditCategoria(null);
    setNewCategoriaNome('');
  };

  const handleSaveCategoria = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!newCategoriaNome.trim()) {
        toast.error('Por favor, insira um nome para a categoria.');
        return;
      }
      
      // Modo edição
      if (editCategoria) {
        console.log(`[DEBUG] Gerir_Categoria: A atualizar categoria ID ${editCategoria.id_categoria}`);
        
        await axios.put(`${API_BASE}/categorias/${editCategoria.id_categoria}`, {
          nome: newCategoriaNome
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria atualizada com sucesso!');
      } 
      // Modo criação
      else {
        console.log('[DEBUG] Gerir_Categoria: A criar nova categoria');
        
        await axios.post(`${API_BASE}/categorias`, {
          nome: newCategoriaNome
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria criada com sucesso!');
      }
      
      // Fechar o formulário e atualizar a lista
      handleCloseCategoriaForm();
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Categoria: Erro ao salvar categoria:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tente novamente.');
      }
    }
  };

  // Funções para editar categoria
  const handleEditarCategoria = (categoria) => {
    console.log(`[DEBUG] Gerir_Categoria: A editar categoria ID ${categoria.id_categoria}`);
    setEditCategoria(categoria);
    setNewCategoriaNome(categoria.nome);
    setShowCategoriaForm(true);
  };

  // Funções para excluir categoria
  const handleConfirmarExclusao = (categoria) => {
    console.log(`[DEBUG] Gerir_Categoria: A confirmar exclusão da categoria ID ${categoria.id_categoria}`);
    setCategoriaParaExcluir(categoria);
    setShowDeleteConfirmation(true);
  };

  const handleExcluirCategoria = async () => {
    if (!categoriaParaExcluir) return;
    
    try {
      const token = localStorage.getItem('token');
      console.log(`[DEBUG] Gerir_Categoria: A excluir categoria ID ${categoriaParaExcluir.id_categoria}`);
      
      await axios.delete(`${API_BASE}/categorias/${categoriaParaExcluir.id_categoria}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Categoria excluída com sucesso!');
      setShowDeleteConfirmation(false);
      setCategoriaParaExcluir(null);
      
      // Atualizar a lista
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Categoria: Erro ao excluir categoria:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tente novamente.');
      }
      
      setShowDeleteConfirmation(false);
      setCategoriaParaExcluir(null);
    }
  };

  // Função para navegar para a página de áreas
  const handleIrParaAreas = () => {
    navigate('/admin/areas');
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
          <h1>Gestão de Categorias</h1>
          <div className="header-actions">
            <button 
              className="btn-navegacao"
              onClick={handleIrParaAreas}
            >
              Gerir Áreas
            </button>
            <button 
              className="criar-btn"
              onClick={handleOpenCategoriaForm}
            >
              Criar Nova Categoria
            </button>
          </div>
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
            <div className="no-items">
              <p>Nenhuma categoria encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="categorias-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Categoria</th>
                    <th>Total de Áreas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(categoria => (
                    <tr key={categoria.id_categoria}>
                      <td>{categoria.id_categoria}</td>
                      <td className="categoria-nome">{categoria.nome}</td>
                      <td>{categoria.areas_count || 0}</td>
                      <td className="acoes">
                        <button 
                          className="btn-icon btn-editar"
                          onClick={() => handleEditarCategoria(categoria)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon btn-excluir"
                          onClick={() => handleConfirmarExclusao(categoria)}
                          title="Excluir"
                          disabled={categoria.areas_count > 0}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
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
      
      {/* Modal de formulário de categoria */}
      {showCategoriaForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h3>
            <div className="form-group">
              <label htmlFor="newCategoriaNome">Nome da Categoria:</label>
              <input 
                type="text" 
                id="newCategoriaNome" 
                value={newCategoriaNome}
                onChange={(e) => setNewCategoriaNome(e.target.value)}
                placeholder="Digite o nome da categoria"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={handleCloseCategoriaForm}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleSaveCategoria}
              >
                {editCategoria ? 'Atualizar' : 'Criar'}
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