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
 * Funcionalidades principais:
 * - Visualizar lista de categorias com contagem de áreas associadas
 * - Criar novas categorias de formação
 * - Editar categorias existentes
 * - Eliminar categorias (com validações de integridade referencial)
 * - Filtrar categorias por nome
 * - Ordenar categorias de forma ascendente/descendente por ID, nome ou áreas
 * - Ver detalhes das áreas associadas a cada categoria
 * 
 * Hierarquia do sistema: Categoria → Área → Tópico → Curso
 * 
 * Restrições de acesso: Apenas administradores (id_cargo === 1)
 * 
 * @returns {JSX.Element} Interface de gestão de categorias
 */
const Gerir_Categoria = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Estados de controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados de dados das categorias
  const [categorias, setCategorias] = useState([]);
  const [totalCategorias, setTotalCategorias] = useState(0);
  
  // Estados de paginação e filtros
  const [paginaAtual, setPaginaAtual] = useState(1);
  const categoriasPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '' });
  
  // Estados de ordenação da tabela
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  
  // Estados dos modais de edição e eliminação
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editCategoria, setEditCategoria] = useState(null);
  const [newCategoriaNome, setNewCategoriaNome] = useState('');
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  
  // Estados do modal de visualização de áreas
  const [showAreasModal, setShowAreasModal] = useState(false);
  const [areasCategoria, setAreasCategoria] = useState([]);
  const [categoriaComAreas, setCategoriaComAreas] = useState(null);
  
  // Referência para controlo do timeout dos filtros
  const filterTimeoutRef = useRef(null);

  /**
   * Alterna a visibilidade da barra lateral de navegação
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Ordena as categorias com base no campo e direção especificados
   * 
   * @param {Array} categorias - Array de categorias a ordenar
   * @param {string} campo - Campo pelo qual ordenar ('id', 'nome' ou 'areas')
   * @param {string} direcao - Direção da ordenação ('asc' ou 'desc')
   * @returns {Array} Array de categorias ordenado
   */
  const ordenarCategorias = (categorias, campo, direcao) => {
    return [...categorias].sort((a, b) => {
      let valorA, valorB;
      
      switch (campo) {
        case 'id':
          valorA = a.id_categoria || a.id || 0;
          valorB = b.id_categoria || b.id || 0;
          break;
        case 'nome':
          valorA = a.nome || '';
          valorB = b.nome || '';
          break;
        case 'areas':
          valorA = a.areas_count || 0;
          valorB = b.areas_count || 0;
          break;
        default:
          return 0;
      }
      
      // Normalizar strings para comparação case-insensitive
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }
      
      // Aplicar direção da ordenação
      if (direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  };

  /**
   * Gere o clique nos cabeçalhos da tabela para ordenação
   * Alterna entre ascendente, descendente e sem ordenação
   * 
   * @param {string} campo - Campo a ordenar
   */
  const handleOrdenacao = (campo) => {
    const novaOrdenacao = {
      campo,
      direcao: ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc'
    };
    
    setOrdenacao(novaOrdenacao);
    
    // Aplicar ordenação imediatamente aos dados atuais
    const categoriasOrdenadas = ordenarCategorias(categorias, novaOrdenacao.campo, novaOrdenacao.direcao);
    setCategorias(categoriasOrdenadas);
  };

  /**
   * Busca categorias da API com suporte a paginação, filtros e contagem de áreas
   * 
   * @param {number} pagina - Número da página a carregar
   * @param {Object} filtrosAtuais - Filtros a aplicar na busca
   */
  const buscarCategorias = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Efetuar requisição para buscar TODAS as categorias (sem paginação na API)
      const response = await axios.get(`${API_BASE}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let todasAsCategorias = [];
      
      // Processar diferentes formatos de resposta da API
      if (response.data && response.data.success && Array.isArray(response.data.categorias)) {
        // Formato estruturado com metadados
        todasAsCategorias = response.data.categorias;
      } else if (Array.isArray(response.data)) {
        // Formato array direto
        todasAsCategorias = response.data;
      } else {
        toast.error('Formato de dados inválido recebido do servidor');
        setCategorias([]);
        setTotalCategorias(0);
        return;
      }
      
      // Buscar contagem de áreas para cada categoria
      try {
        todasAsCategorias = await Promise.all(
          todasAsCategorias.map(async (categoria) => {
            try {
              // Requisição individual para contar áreas desta categoria
              const areasResponse = await axios.get(`${API_BASE}/areas`, {
                params: { categoria_id: categoria.id_categoria },
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Contar áreas associadas a esta categoria específica
              let areasCount = 0;
              if (areasResponse.data && Array.isArray(areasResponse.data)) {
                areasCount = areasResponse.data.filter(area => area.id_categoria === categoria.id_categoria).length;
              } else if (areasResponse.data && areasResponse.data.areas) {
                areasCount = areasResponse.data.areas.filter(area => area.id_categoria === categoria.id_categoria).length;
              }
              
              return {
                ...categoria,
                areas_count: areasCount
              };
              
            } catch (error) {
              // Em caso de erro, assumir 0 áreas para esta categoria
              return {
                ...categoria,
                areas_count: 0
              };
            }
          })
        );
      } catch (error) {
        // Fallback: definir areas_count = 0 para todas as categorias
        todasAsCategorias = todasAsCategorias.map(categoria => ({
          ...categoria,
          areas_count: 0
        }));
      }
      
      // Aplicar filtros se especificados
      let categoriasFiltradas = todasAsCategorias;
      if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
        const termoBusca = filtrosAtuais.nome.trim().toLowerCase();
        categoriasFiltradas = todasAsCategorias.filter(categoria => 
          categoria.nome?.toLowerCase().includes(termoBusca)
        );
      }
      
      // Aplicar ordenação se estiver definida
      if (ordenacao.campo) {
        categoriasFiltradas = ordenarCategorias(categoriasFiltradas, ordenacao.campo, ordenacao.direcao);
      }
      
      // Implementar paginação manual - SEMPRE 10 itens por página
      const totalItens = categoriasFiltradas.length;
      const startIndex = (pagina - 1) * categoriasPorPagina;
      const endIndex = startIndex + categoriasPorPagina;
      const categoriasParaPagina = categoriasFiltradas.slice(startIndex, endIndex);
      
      // Atualizar estados com os dados processados
      setCategorias(categoriasParaPagina);
      setTotalCategorias(totalItens);
      setPaginaAtual(pagina);
      
    } catch (error) {
      // Gestão de erros específicos
      if (error.response?.status === 401) {
        toast.error('Não autorizado. Faz login novamente.');
        navigate('/login');
      } else {
        toast.error(`Erro ao carregar categorias: ${error.response?.data?.message || 'Erro desconhecido'}`);
      }
      
      // Reset dos dados em caso de erro
      setCategorias([]);
      setTotalCategorias(0);
      
    } finally {
      setLoading(false);
    }
  }, [categoriasPorPagina, navigate, filtros, ordenacao]);

  /**
   * Inicialização do componente - carrega dados e verifica permissões
   */
  useEffect(() => {
    const inicializar = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Verificar autenticação
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Verificar permissões de administrador
        if (currentUser && currentUser.id_cargo !== 1) {
          toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
          navigate('/');
          return;
        }
        
        // Carregar dados iniciais
        await buscarCategorias(1, { nome: '' });
        
      } catch (error) {
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
   * Gere alterações nos filtros com debounce para otimizar performance
   * 
   * @param {Event} e - Evento de mudança do input
   */
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    
    // Cancelar timeout anterior se existir
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    setFiltros(prev => {
      const novosFiltros = { ...prev, [name]: value };
      
      setLoading(true);
      
      // Aplicar debounce de 600ms para evitar requisições excessivas
      filterTimeoutRef.current = setTimeout(() => {
        setPaginaAtual(1);
        buscarCategorias(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  /**
   * Remove todos os filtros aplicados e recarrega as categorias
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
   * Navegar para a página anterior na paginação
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      buscarCategorias(novaPagina, filtros);
    }
  };

  /**
   * Navegar para a próxima página na paginação
   */
  const handleProximaPagina = () => {
    const totalPaginas = Math.max(1, Math.ceil(totalCategorias / categoriasPorPagina));
    if (paginaAtual < totalPaginas && !loading) {
      const novaPagina = paginaAtual + 1;
      buscarCategorias(novaPagina, filtros);
    }
  };

  /**
   * Abre o modal para criar uma nova categoria
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
   * Grava uma categoria (criação ou edição) na base de dados
   */
  const handleSaveCategoria = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validação do nome da categoria
      if (!newCategoriaNome.trim()) {
        toast.error('Por favor, insere um nome para a categoria.');
        return;
      }
      
      const dadosCategoria = { nome: newCategoriaNome.trim() };
      
      if (editCategoria) {
        // Modo edição - atualizar categoria existente
        await axios.put(`${API_BASE}/categorias/${editCategoria.id_categoria}`, dadosCategoria, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria atualizada com sucesso!');
      } else {
        // Modo criação - criar nova categoria
        await axios.post(`${API_BASE}/categorias`, dadosCategoria, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Categoria criada com sucesso!');
      }
      
      // Fechar modal e atualizar lista
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
   * Prepara uma categoria para edição, preenchendo o formulário
   * 
   * @param {Object} categoria - Categoria a editar
   */
  const handleEditarCategoria = (categoria) => {
    setEditCategoria(categoria);
    setNewCategoriaNome(categoria.nome);
    setShowCategoriaForm(true);
  };

  /**
   * Prepara o modal de confirmação para eliminar uma categoria
   * 
   * @param {Object} categoria - Categoria a eliminar
   */
  const handleConfirmarExclusao = (categoria) => {
    setCategoriaParaExcluir(categoria);
    setShowDeleteConfirmation(true);
  };

  /**
   * Executa a eliminação definitiva de uma categoria
   * ATENÇÃO: Esta operação remove em cascata todas as áreas, tópicos e cursos associados
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
      
      // Recarregar lista de categorias
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
   * Carrega e exibe as áreas associadas a uma categoria específica
   * 
   * @param {Object} categoria - Categoria cujas áreas queremos visualizar
   */
  const handleMostrarAreas = async (categoria) => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar áreas desta categoria específica
      const response = await axios.get(`${API_BASE}/areas`, {
        params: { categoria: categoria.id_categoria },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Processar resposta e filtrar áreas da categoria
      let areas = [];
      if (Array.isArray(response.data)) {
        areas = response.data.filter(area => area.id_categoria === categoria.id_categoria);
      } else if (response.data && Array.isArray(response.data.areas)) {
        areas = response.data.areas.filter(area => area.id_categoria === categoria.id_categoria);
      }
      
      // Exibir modal com as áreas encontradas
      setCategoriaComAreas(categoria);
      setAreasCategoria(areas);
      setShowAreasModal(true);
      
    } catch (error) {
      toast.error('Erro ao carregar áreas da categoria.');
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
  
  // Gerar SEMPRE as linhas vazias necessárias para completar 10 linhas
  const linhasVazias = [];
  const categoriasNaPagina = categoriasParaMostrar.length;
  const linhasVaziasNecessarias = Math.max(0, categoriasPorPagina - categoriasNaPagina);
  
  for (let i = 0; i < linhasVaziasNecessarias; i++) {
    linhasVazias.push(i);
  }

  // Limpeza do timeout ao desmontar o componente
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
        {/* Cabeçalho da página com título e ações principais */}
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
        
        {/* Secção de filtros de pesquisa */}
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
        
        {/* Tabela principal de categorias */}
        <div className="categorias-table-container-gerir-categorias">
          {loading ? (
            <div className="loading-container-gerir-categorias">
              <div className="loading-spinner-gerir-categorias"></div>
              <p>A carregar categorias...</p>
            </div>
          ) : (
            <>
              <table className="categorias-table-gerir-categorias">
                <thead>
                  <tr>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('id')}
                    >
                      ID
                      <span className="sort-icon">
                        {ordenacao.campo === 'id' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('nome')}
                    >
                      Categoria
                      <span className="sort-icon">
                        {ordenacao.campo === 'nome' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('areas')}
                    >
                      Áreas
                      <span className="sort-icon">
                        {ordenacao.campo === 'areas' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mostrar categorias existentes */}
                  {categoriasParaMostrar.map((categoria, index) => {
                    if (!categoria || typeof categoria !== 'object') {
                      return null;
                    }
                    
                    const categoriaId = categoria.id_categoria || categoria.id || index;
                    const areasCount = categoria.areas_count;
                    
                    return (
                      <tr key={categoriaId}>
                        <td>{categoriaId}</td>
                        <td className="categoria-nome-gerir-categorias overflow-cell">
                          <div className="cell-content">
                            {categoria.nome || 'Nome não disponível'}
                          </div>
                        </td>
                        <td className="areas-count-gerir-categorias">
                          <span 
                            className="count-number"
                            onClick={() => handleMostrarAreas(categoria)}
                            style={{ cursor: 'pointer' }}
                            title="Clique para ver as áreas desta categoria"
                          >
                            {areasCount || 0}
                          </span>
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
                            title="Eliminar categoria"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* SEMPRE completar até 10 linhas com linhas vazias */}
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
      
      {/* Modal de confirmação de eliminação (igual ao dos tópicos) */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-categorias">
          <div className="modal-content-gerir-categorias">
            <h3>Confirmar Eliminação</h3>
            <p>
              <strong>ATENÇÃO:</strong> Tens a certeza que queres eliminar a categoria "<strong>{categoriaParaExcluir?.nome}</strong>"?
            </p>
            <p>
              Esta ação irá eliminar <strong>permanentemente</strong>:
            </p>
            <ul className="warning-list-gerir-categorias">
              <li>Todas as áreas associadas a esta categoria</li>
              <li>Todos os tópicos dessas áreas</li>
              <li>Todos os cursos associados a esses tópicos</li>
              <li>Todas as inscrições de formandos nesses cursos</li>
              <li>Todas as associações de formadores</li>
            </ul>
            <p><strong>Esta ação não pode ser desfeita!</strong></p>
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

      {/* Modal para visualizar áreas da categoria */}
      {showAreasModal && (
        <div className="modal-overlay-gerir-categorias">
          <div className="modal-content-gerir-categorias">
            <h3>Áreas da Categoria "{categoriaComAreas?.nome}"</h3>
            {areasCategoria.length === 0 ? (
              <div className="no-areas-message-gerir-categorias">
                <p>Esta categoria não tem áreas associadas.</p>
              </div>
            ) : (
              <div className="areas-list-gerir-categorias">
                {areasCategoria.map((area, index) => (
                  <div key={area.id_area || index} className="area-item-gerir-categorias">
                    <div className="area-info-gerir-categorias">
                      <strong className="area-name-gerir-categorias">{area.nome}</strong>
                      {area.topicos_count && (
                        <span className="topicos-count-gerir-categorias">
                          ({area.topicos_count} tópicos)
                        </span>
                      )}
                    </div>
                    {area.descricao && (
                      <p className="area-description-gerir-categorias">{area.descricao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions-gerir-categorias">
              <button 
                className="btn-confirmar-gerir-categorias"
                onClick={() => {
                  setShowAreasModal(false);
                  setCategoriaComAreas(null);
                  setAreasCategoria([]);
                }}
              >
                Fechar
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