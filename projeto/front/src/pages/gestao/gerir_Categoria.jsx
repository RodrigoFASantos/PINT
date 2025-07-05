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
 * 
 * Permite aos administradores:
 * - Ver todas as categorias com contagem de áreas
 * - Criar novas categorias
 * - Editar categorias existentes
 * - Eliminar categorias (só se não tiverem áreas)
 * - Filtrar categorias por nome
 * - Navegar entre páginas (10 itens por página)
 * 
 * Acesso restrito: apenas utilizadores com id_cargo === 1 (administradores)
 */
const Gerir_Categoria = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para dados das categorias
  const [categorias, setCategorias] = useState([]);
  const [todasAsCategorias, setTodasAsCategorias] = useState([]);
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
  
  // Referência para timeout de filtros (evita muitas requisições)
  const filterTimeoutRef = useRef(null);

  /**
   * Alterna a visibilidade da barra lateral
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Busca as categorias da API com paginação e filtros
   * Implementa paginação automática no frontend quando a API retorna todas as categorias
   * @param {number} pagina - Número da página a buscar
   * @param {object} filtrosAtuais - Filtros a aplicar na busca
   */
  const buscarCategorias = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
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
      
      // Limpar parâmetros vazios
      Object.keys(params).forEach(key => 
        (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      // Fazer requisição à API
      const response = await axios.get(`${API_BASE}/categorias`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Processar diferentes formatos de resposta da API
      let categoriasData = [];
      let total = 0;
      let processouComSucesso = false;
      let usarPaginacaoFrontend = false;

      if (response.data && response.data.total !== undefined) {
        // Formato padrão: {total: 12, categorias: [...]} - API com paginação
        categoriasData = response.data.categorias;
        total = response.data.total || 0;
        processouComSucesso = true;
      } else if (Array.isArray(response.data)) {
        // Formato alternativo: array directo [{...}, {...}, ...] - API sem paginação
        const todasAsCategoriasRecebidas = response.data;
        
        // Aplicar filtros manualmente
        let categoriasFiltradas = todasAsCategoriasRecebidas;
        
        // Filtro por nome
        if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
          const termoBusca = filtrosAtuais.nome.trim().toLowerCase();
          categoriasFiltradas = categoriasFiltradas.filter(categoria => 
            categoria.nome?.toLowerCase().includes(termoBusca)
          );
        }
        
        total = categoriasFiltradas.length;
        
        // Implementar paginação manual no frontend
        const startIndex = (pagina - 1) * categoriasPorPagina;
        const endIndex = startIndex + categoriasPorPagina;
        categoriasData = categoriasFiltradas.slice(startIndex, endIndex);
        
        // Armazenar todas as categorias para futuras operações
        setTodasAsCategorias(todasAsCategoriasRecebidas);
        
        processouComSucesso = true;
        usarPaginacaoFrontend = true;
      } else if (response.data && Array.isArray(response.data.categorias)) {
        // Formato alternativo: {categorias: [...]} sem total
        categoriasData = response.data.categorias;
        total = response.data.total || response.data.categorias.length;
        processouComSucesso = true;
      }

      if (processouComSucesso) {
        // Verificar se os dados são válidos
        if (Array.isArray(categoriasData)) {
          setCategorias(categoriasData);
          setTotalCategorias(total || 0);
          setPaginaAtual(pagina);
        } else {
          toast.error('Formato de dados inválido recebido do servidor.');
          setCategorias([]);
          setTotalCategorias(0);
        }
      } else {
        toast.error('Erro ao carregar categorias do servidor.');
        setCategorias([]);
        setTotalCategorias(0);
      }
      
      setLoading(false);
    } catch (error) {
      // Gestão de erros específicos
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Não autorizado. Faz login novamente.');
          navigate('/login');
        } else {
          toast.error(`Erro ao carregar categorias: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro ao processar a requisição.');
      }
      
      setCategorias([]);
      setTotalCategorias(0);
      setLoading(false);
    }
  }, [categoriasPorPagina, navigate, filtros]);

  /**
   * Carrega dados iniciais quando o componente é montado
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Verificar se o utilizador está autenticado
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Verificar permissões de acesso
        if (currentUser) {
          if (currentUser.id_cargo !== 1) {
            toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
            navigate('/');
            return;
          }
        }
        
        // Carregar dados iniciais
        await buscarCategorias(1, { nome: '' });
        
      } catch (error) {
        if (error.response && error.response.status === 401) {
          toast.error('Não autorizado. Por favor, faz login novamente.');
          navigate('/login');
        } else {
          toast.error('Erro ao carregar dados. Por favor, tenta novamente mais tarde.');
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, currentUser, buscarCategorias]);

  /**
   * Gere alterações nos filtros com debounce para evitar muitas requisições
   * @param {Event} e - Evento de mudança do input
   */
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    
    // Cancelar timeout anterior se existir
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    setFiltros(prev => {
      const novosFiltros = {
        ...prev,
        [name]: value
      };
      
      setLoading(true);
      
      // Aplicar debounce de 600ms antes de fazer a busca
      filterTimeoutRef.current = setTimeout(() => {
        setPaginaAtual(1);
        buscarCategorias(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  /**
   * Limpa todos os filtros aplicados e recarrega as categorias
   */
  const handleLimparFiltros = () => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '' };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    buscarCategorias(1, filtrosLimpos);
  };

  /**
   * Navega para a página anterior
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      buscarCategorias(novaPagina, filtros);
    }
  };

  /**
   * Navega para a próxima página
   */
  const handleProximaPagina = () => {
    const totalPaginas = Math.max(1, Math.ceil(totalCategorias / categoriasPorPagina));
    if (paginaAtual < totalPaginas && !loading) {
      const novaPagina = paginaAtual + 1;
      buscarCategorias(novaPagina, filtros);
    }
  };

  /**
   * Abre o modal para criar nova categoria
   */
  const handleOpenCategoriaForm = () => {
    setShowCategoriaForm(true);
    setEditCategoria(null);
    setNewCategoriaNome('');
  };

  /**
   * Fecha o modal de criação/edição de categoria
   */
  const handleCloseCategoriaForm = () => {
    setShowCategoriaForm(false);
    setEditCategoria(null);
    setNewCategoriaNome('');
  };

  /**
   * Grava uma nova categoria ou atualiza uma existente
   */
  const handleSaveCategoria = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validar dados obrigatórios
      if (!newCategoriaNome.trim()) {
        toast.error('Por favor, insere um nome para a categoria.');
        return;
      }
      
      const dadosCategoria = {
        nome: newCategoriaNome
      };
      
      // Decidir se é edição ou criação
      if (editCategoria) {
        await axios.put(`${API_BASE}/categorias/${editCategoria.id_categoria}`, dadosCategoria, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria actualizada com sucesso!');
      } else {
        await axios.post(`${API_BASE}/categorias`, dadosCategoria, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria criada com sucesso!');
      }
      
      handleCloseCategoriaForm();
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
    }
  };

  /**
   * Prepara uma categoria para edição
   * @param {object} categoria - Categoria a ser editada
   */
  const handleEditarCategoria = (categoria) => {
    setEditCategoria(categoria);
    setNewCategoriaNome(categoria.nome);
    setShowCategoriaForm(true);
  };

  /**
   * Confirma a exclusão de uma categoria
   * @param {object} categoria - Categoria a ser excluída
   */
  const handleConfirmarExclusao = (categoria) => {
    setCategoriaParaExcluir(categoria);
    setShowDeleteConfirmation(true);
  };

  /**
   * Executa a exclusão de uma categoria
   */
  const handleExcluirCategoria = async () => {
    if (!categoriaParaExcluir) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/categorias/${categoriaParaExcluir.id_categoria}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Categoria eliminada com sucesso!');
      setShowDeleteConfirmation(false);
      setCategoriaParaExcluir(null);
      
      buscarCategorias(paginaAtual, filtros);
      
    } catch (error) {
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
   * Navega para a página de gestão de áreas
   */
  const handleIrParaAreas = () => {
    navigate('/admin/areas');
  };

  // Cálculos para paginação e apresentação
  const totalPaginas = Math.max(1, Math.ceil(totalCategorias / categoriasPorPagina));
  const categoriasParaMostrar = Array.isArray(categorias) ? categorias : [];
  
  // Criar linhas vazias para manter altura consistente da tabela
  const linhasVazias = [];
  const linhasNecessarias = Math.max(0, categoriasPorPagina - categoriasParaMostrar.length);
  for (let i = 0; i < linhasNecessarias; i++) {
    linhasVazias.push(i);
  }

  /**
   * Cleanup do timeout ao desmontar o componente
   */
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
        {/* Cabeçalho com título e acções principais */}
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
        
        {/* Secção de filtros */}
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
        
        {/* Tabela de categorias e controlos de paginação */}
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
              {/* Tabela com os dados das categorias */}
              <table className="categorias-table-gerir-categorias">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Categoria</th>
                    <th>Total de Áreas</th>
                    <th>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasParaMostrar.map((categoria, index) => {
                    if (!categoria || typeof categoria !== 'object') {
                      return null;
                    }
                    
                    const categoriaId = categoria.id_categoria || categoria.id || index;
                    
                    return (
                      <tr key={categoriaId}>
                        <td>{categoriaId}</td>
                        <td className="categoria-nome-gerir-categorias">{categoria.nome || 'Nome não disponível'}</td>
                        <td>{categoria.areas_count || 0}</td>
                        <td className="acoes-gerir-categorias">
                          <button 
                            className="btn-icon-gerir-categorias btn-editar-gerir-categorias"
                            onClick={() => handleEditarCategoria(categoria)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-gerir-categorias btn-excluir-gerir-categorias"
                            onClick={() => handleConfirmarExclusao(categoria)}
                            title="Eliminar"
                            disabled={(categoria.areas_count || 0) > 0}
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
              
              {/* Controlos de paginação */}
              <div className="paginacao-gerir-categorias">
                <button 
                  onClick={handlePaginaAnterior} 
                  disabled={paginaAtual === 1 || loading}
                  className="btn-pagina-gerir-categorias btn-anterior-gerir-categorias"
                  aria-label="Página anterior"
                  title="Página anterior"
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
                  aria-label="Próxima página"
                  title="Próxima página"
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
              >
                {editCategoria ? 'Actualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de eliminação */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-categorias">
          <div className="modal-content-gerir-categorias">
            <h3>Confirmar Eliminação</h3>
            <p>
              Tens a certeza que queres eliminar a categoria "{categoriaParaExcluir?.nome}"?
              Esta acção não pode ser desfeita.
            </p>
            <div className="modal-actions-gerir-categorias">
              <button 
                className="btn-cancelar-gerir-categorias"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-categorias"
                onClick={handleExcluirCategoria}
              >
                Confirmar Eliminação
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