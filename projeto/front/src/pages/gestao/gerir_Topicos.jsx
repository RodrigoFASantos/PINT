import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Topicos.css';
import Sidebar from '../../components/Sidebar';

/**
 * Componente para gestão de tópicos de discussão (3º nível da hierarquia)
 * 
 * Permite aos administradores e formadores:
 * - Visualizar todos os tópicos organizados por categorias e áreas
 * - Criar novos tópicos de discussão
 * - Editar tópicos existentes
 * - Eliminar tópicos (remove também chats e cursos associados em cascata)
 * - Filtrar tópicos por nome, categoria e área
 * - Ordenar tópicos por diferentes critérios
 * - Navegar entre páginas com tabela sempre de 10 linhas
 * 
 * HIERARQUIA: Categoria → Área → Tópico → Curso (com chats)
 * REGRA CRÍTICA: Eliminar tópico remove todos os cursos e chats associados
 * ACESSO: Administradores (id_cargo === 1) e Formadores (id_cargo === 2)
 */
const Gerir_Topicos = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para dados dos tópicos
  const [topicos, setTopicos] = useState([]);
  const [todosOsTopicos, setTodosOsTopicos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [totalTopicos, setTotalTopicos] = useState(0);
  
  // Estados para paginação e filtros - PADRONIZADO: sempre 10 itens por página
  const [paginaAtual, setPaginaAtual] = useState(1);
  const topicosPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '', idCategoria: '', idArea: '' });
  
  // Estados para ordenação da tabela
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  
  // Estados para modais de confirmação e edição
  const [topicoParaExcluir, setTopicoParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editTopico, setEditTopico] = useState(null);
  const [newTopicoTitulo, setNewTopicoTitulo] = useState('');
  const [newTopicoDescricao, setNewTopicoDescricao] = useState('');
  const [newTopicoCategoria, setNewTopicoCategoria] = useState('');
  const [newTopicoArea, setNewTopicoArea] = useState('');
  const [showTopicoForm, setShowTopicoForm] = useState(false);
  
  // Estados para gestão das áreas filtradas por categoria
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  
  // Referência para controlo do timeout dos filtros
  const filterTimeoutRef = useRef(null);

  /**
   * Alterna a visibilidade da barra lateral de navegação
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Ordena os tópicos com base no campo e direção especificados
   * 
   * @param {Array} topicos - Array de tópicos a ordenar
   * @param {string} campo - Campo pelo qual ordenar ('titulo', 'categoria', 'area' ou 'criado')
   * @param {string} direcao - Direção da ordenação ('asc' ou 'desc')
   * @returns {Array} Array de tópicos ordenado
   */
  const ordenarTopicos = (topicos, campo, direcao) => {
    return [...topicos].sort((a, b) => {
      let valorA, valorB;
      
      switch (campo) {
        case 'id':
          valorA = a.id_topico || a.id || 0;
          valorB = b.id_topico || b.id || 0;
          break;
        case 'titulo':
          valorA = a.titulo || '';
          valorB = b.titulo || '';
          break;
        case 'categoria':
          valorA = getCategoriaName(a.id_categoria);
          valorB = getCategoriaName(b.id_categoria);
          break;
        case 'area':
          valorA = getAreaName(a.id_area);
          valorB = getAreaName(b.id_area);
          break;
        case 'criado':
          valorA = a.data_criacao ? new Date(a.data_criacao) : new Date(0);
          valorB = b.data_criacao ? new Date(b.data_criacao) : new Date(0);
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
    const topicosOrdenados = ordenarTopicos(topicos, novaOrdenacao.campo, novaOrdenacao.direcao);
    setTopicos(topicosOrdenados);
  };

  /**
   * Busca os tópicos da API com suporte a paginação, filtros e ordenação
   * Implementa paginação controlada para sempre mostrar exatamente 10 linhas
   * 
   * @param {number} pagina - Número da página a carregar
   * @param {Object} filtrosAtuais - Filtros a aplicar na busca
   */
  const buscarTopicos = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Efetuar requisição à API para buscar TODOS os tópicos
      const response = await axios.get(`${API_BASE}/topicos-area`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let todosOsTopicosRecebidos = [];
      
      // Processar diferentes formatos de resposta da API
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        todosOsTopicosRecebidos = response.data.data;
      } else if (Array.isArray(response.data)) {
        todosOsTopicosRecebidos = response.data;
      } else {
        toast.error('Erro ao carregar tópicos do servidor.');
        setTopicos([]);
        setTotalTopicos(0);
        return;
      }
      
      // Aplicar filtros se especificados
      let topicosFiltrados = todosOsTopicosRecebidos;
      
      // Filtro por nome
      if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
        const termoBusca = filtrosAtuais.nome.trim().toLowerCase();
        topicosFiltrados = topicosFiltrados.filter(topico => 
          topico.titulo?.toLowerCase().includes(termoBusca) ||
          topico.descricao?.toLowerCase().includes(termoBusca)
        );
      }
      
      // Filtro por categoria
      if (filtrosAtuais.idCategoria) {
        topicosFiltrados = topicosFiltrados.filter(topico => 
          topico.id_categoria == filtrosAtuais.idCategoria
        );
      }
      
      // Filtro por área
      if (filtrosAtuais.idArea) {
        topicosFiltrados = topicosFiltrados.filter(topico => 
          topico.id_area == filtrosAtuais.idArea
        );
      }
      
      // Aplicar ordenação se estiver definida
      if (ordenacao.campo) {
        topicosFiltrados = ordenarTopicos(topicosFiltrados, ordenacao.campo, ordenacao.direcao);
      }
      
      // Implementar paginação manual - SEMPRE 10 itens por página
      const totalItens = topicosFiltrados.length;
      const startIndex = (pagina - 1) * topicosPorPagina;
      const endIndex = startIndex + topicosPorPagina;
      const topicosParaPagina = topicosFiltrados.slice(startIndex, endIndex);
      
      // Atualizar estados com os dados processados
      setTopicos(topicosParaPagina);
      setTotalTopicos(totalItens);
      setPaginaAtual(pagina);
      setTodosOsTopicos(todosOsTopicosRecebidos);
      
    } catch (error) {
      // Gestão específica de erros
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Não autorizado. Faz login novamente.');
          navigate('/login');
        } else {
          toast.error(`Erro ao carregar tópicos: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro ao processar a requisição.');
      }
      
      setTopicos([]);
      setTotalTopicos(0);
    } finally {
      setLoading(false);
    }
  }, [topicosPorPagina, navigate, ordenacao]);

  /**
   * Busca todas as categorias disponíveis para os filtros e formulários
   */
  const buscarCategorias = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        let categoriasData = [];
        
        // Processar resposta da API - diferentes formatos possíveis
        if (Array.isArray(response.data.categorias)) {
          categoriasData = response.data.categorias;
        } else if (Array.isArray(response.data)) {
          categoriasData = response.data;
        } else {
          toast.error('Erro ao carregar categorias para o filtro.');
          setCategorias([]);
          return;
        }
        
        setCategorias(categoriasData);
      } else {
        toast.error('Erro ao carregar categorias para o filtro.');
        setCategorias([]);
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias para o filtro.');
      setCategorias([]);
    }
  }, []);

  /**
   * Busca todas as áreas disponíveis para os filtros e formulários
   */
  const buscarAreas = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        let areasData = [];
        
        // Processar resposta da API - diferentes formatos possíveis
        if (Array.isArray(response.data.areas)) {
          areasData = response.data.areas;
        } else if (Array.isArray(response.data)) {
          areasData = response.data;
        } else {
          toast.error('Erro ao carregar áreas para o filtro.');
          setAreas([]);
          return;
        }
        
        setAreas(areasData);
      } else {
        toast.error('Erro ao carregar áreas para o filtro.');
        setAreas([]);
      }
    } catch (error) {
      toast.error('Erro ao carregar áreas para o filtro.');
      setAreas([]);
    }
  }, []);

  /**
   * Filtrar áreas baseadas na categoria selecionada
   * Implementa filtragem hierárquica: categoria → área
   */
  useEffect(() => {
    if (filtros.idCategoria) {
      const areasFiltered = areas.filter(area =>
        area.id_categoria === parseInt(filtros.idCategoria)
      );
      setAreasFiltradas(areasFiltered);
      
      // Limpar filtro de área se a categoria mudou e a área não corresponde
      if (filtros.idArea && !areasFiltered.some(a => a.id_area === parseInt(filtros.idArea))) {
        setFiltros(prev => ({ ...prev, idArea: '' }));
      }
    } else {
      setAreasFiltradas([]);
      setFiltros(prev => ({ ...prev, idArea: '' }));
    }
  }, [filtros.idCategoria, areas, filtros.idArea]);

  /**
   * Carrega dados iniciais quando o componente é montado
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Verificar se o utilizador está autenticado
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Verificar permissões de acesso (administradores e formadores)
        if (currentUser && currentUser.id_cargo !== 1 && currentUser.id_cargo !== 2) {
          toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
          navigate('/');
          return;
        }
        
        // Carregar dados iniciais sequencialmente
        await buscarCategorias();
        await buscarAreas();
        await buscarTopicos(1, { nome: '', idCategoria: '', idArea: '' });
        
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
  }, [navigate, currentUser]);

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
    
    // Atualizar filtros imediatamente
    const novosFiltros = {
      ...filtros,
      [name]: value
    };
    setFiltros(novosFiltros);
    
    // Mostrar loading apenas se houve mudança real
    if (filtros[name] !== value) {
      setLoading(true);
      
      // Aplicar debounce de 600ms para evitar requisições excessivas
      filterTimeoutRef.current = setTimeout(() => {
        setPaginaAtual(1);
        buscarTopicos(1, novosFiltros);
      }, 600);
    }
  };

  /**
   * Remove todos os filtros aplicados e recarrega os tópicos
   */
  const handleLimparFiltros = () => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '', idCategoria: '', idArea: '' };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    buscarTopicos(1, filtrosLimpos);
  };

  /**
   * Navegar para a página anterior na paginação
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      buscarTopicos(novaPagina, filtros);
    }
  };

  /**
   * Navegar para a próxima página na paginação
   */
  const handleProximaPagina = () => {
    const totalPaginas = Math.max(1, Math.ceil(totalTopicos / topicosPorPagina));
    if (paginaAtual < totalPaginas && !loading) {
      const novaPagina = paginaAtual + 1;
      buscarTopicos(novaPagina, filtros);
    }
  };

  /**
   * Abre o modal para criar novo tópico
   */
  const handleOpenTopicoForm = () => {
    setShowTopicoForm(true);
    setEditTopico(null);
    setNewTopicoTitulo('');
    setNewTopicoDescricao('');
    setNewTopicoCategoria('');
    setNewTopicoArea('');
  };

  /**
   * Fecha o modal de criação/edição de tópico
   */
  const handleCloseTopicoForm = () => {
    setShowTopicoForm(false);
    setEditTopico(null);
    setNewTopicoTitulo('');
    setNewTopicoDescricao('');
    setNewTopicoCategoria('');
    setNewTopicoArea('');
  };

  /**
   * Grava um novo tópico ou atualiza um existente na base de dados
   */
  const handleSaveTopico = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validar dados obrigatórios
      if (!newTopicoTitulo.trim()) {
        toast.error('Por favor, insere um título para o tópico.');
        return;
      }
      
      if (!newTopicoCategoria) {
        toast.error('Por favor, seleciona uma categoria para o tópico.');
        return;
      }
      
      if (!newTopicoArea) {
        toast.error('Por favor, seleciona uma área para o tópico.');
        return;
      }
      
      const dadosTopico = {
        titulo: newTopicoTitulo.trim(),
        descricao: newTopicoDescricao.trim(),
        id_categoria: newTopicoCategoria,
        id_area: newTopicoArea
      };
      
      // Decidir se é edição ou criação
      if (editTopico) {
        await axios.put(`${API_BASE}/topicos-area/${editTopico.id_topico || editTopico.id}`, dadosTopico, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Tópico atualizado com sucesso!');
      } else {
        await axios.post(`${API_BASE}/topicos-area`, dadosTopico, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Tópico criado com sucesso!');
      }
      
      handleCloseTopicoForm();
      buscarTopicos(paginaAtual, filtros);
      
    } catch (error) {
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
    }
  };

  /**
   * Prepara um tópico para edição, preenchendo o formulário
   * 
   * @param {Object} topico - Tópico a editar
   */
  const handleEditarTopico = (topico) => {
    setEditTopico(topico);
    setNewTopicoTitulo(topico.titulo);
    setNewTopicoDescricao(topico.descricao || '');
    setNewTopicoCategoria(topico.id_categoria);
    setNewTopicoArea(topico.id_area);
    setShowTopicoForm(true);
  };

  /**
   * Prepara o modal de confirmação para eliminar um tópico
   * 
   * @param {Object} topico - Tópico a eliminar
   */
  const handleConfirmarExclusao = (topico) => {
    setTopicoParaExcluir(topico);
    setShowDeleteConfirmation(true);
  };

  /**
   * Executa a eliminação definitiva de um tópico
   * IMPORTANTE: Esta operação remove em cascata:
   * - Todos os chats de conversa associados ao tópico
   * - Todos os cursos associados ao tópico
   * - Todas as associações formador-curso
   * - Todas as associações formando-curso
   * Esta é uma das regras críticas de integridade do sistema
   */
  const handleExcluirTopico = async () => {
    if (!topicoParaExcluir) return;
    
    try {
      const token = localStorage.getItem('token');
      const topicoId = topicoParaExcluir.id_topico || topicoParaExcluir.id;
      
      await axios.delete(`${API_BASE}/topicos-area/${topicoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tópico eliminado com sucesso! Todos os cursos e chats associados foram também removidos.');
      setShowDeleteConfirmation(false);
      setTopicoParaExcluir(null);
      
      buscarTopicos(paginaAtual, filtros);
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Tópico não encontrado. Pode já ter sido eliminado.');
        } else {
          toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
      
      setShowDeleteConfirmation(false);
      setTopicoParaExcluir(null);
    }
  };

  /**
   * Encontra o nome da categoria pelo ID
   * 
   * @param {number} id - ID da categoria
   * @returns {string} Nome da categoria ou 'N/A'
   */
  const getCategoriaName = (id) => {
    if (!id) return 'N/A';
    const categoria = categorias.find(c => c.id_categoria === id || c.id === id);
    return categoria ? categoria.nome : 'N/A';
  };

  /**
   * Encontra o nome da área pelo ID
   * 
   * @param {number} id - ID da área
   * @returns {string} Nome da área ou 'N/A'
   */
  const getAreaName = (id) => {
    if (!id) return 'N/A';
    const area = areas.find(a => a.id_area === id || a.id === id);
    return area ? area.nome : 'N/A';
  };

  // Cálculos para paginação e apresentação
  const totalPaginas = Math.max(1, Math.ceil(totalTopicos / topicosPorPagina));
  const topicosParaMostrar = Array.isArray(topicos) ? topicos : [];
  
  // Gerar SEMPRE as linhas vazias necessárias para completar 10 linhas
  const linhasVazias = [];
  const topicosNaPagina = topicosParaMostrar.length;
  const linhasVaziasNecessarias = Math.max(0, topicosPorPagina - topicosNaPagina);
  
  for (let i = 0; i < linhasVaziasNecessarias; i++) {
    linhasVazias.push(i);
  }

  /**
   * Limpeza do timeout ao desmontar o componente
   */
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Ecrã de carregamento inicial
  if (loading && topicos.length === 0 && totalTopicos === 0) {
    return (
      <div className="gerenciar-topicos-container-gerir-topicos">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content-gerir-topicos">
          <div className="loading-container-gerir-topicos">
            <div className="loading-spinner-gerir-topicos"></div>
            <p>A carregar tópicos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gerenciar-topicos-container-gerir-topicos">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content-gerir-topicos">
        {/* Cabeçalho da página com título e ações principais */}
        <div className="topicos-header-gerir-topicos">
          <h1>
            Gestão de Tópicos 
            <span className="total-count-gerir-topicos">({totalTopicos})</span>
          </h1>
          <div className="header-actions-gerir-topicos">
            <button 
              className="criar-btn-gerir-topicos"
              onClick={handleOpenTopicoForm}
            >
              Criar Novo Tópico
            </button>
          </div>
        </div>
        
        {/* Secção de filtros de pesquisa */}
        <div className="filtros-container-gerir-topicos">
          <div className="filtros-principais-gerir-topicos">
            <div className="filtro-gerir-topicos">
              <label htmlFor="nome">Nome do Tópico:</label>
              <input 
                type="text"
                id="nome"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Filtrar por título"
              />
            </div>
            
            <div className="filtro-gerir-topicos">
              <label htmlFor="idCategoria">Categoria:</label>
              <select
                id="idCategoria"
                name="idCategoria"
                value={filtros.idCategoria}
                onChange={handleFiltroChange}
              >
                <option value="">Todas as categorias</option>
                {categorias.map(categoria => (
                  <option 
                    key={categoria.id_categoria} 
                    value={categoria.id_categoria}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-gerir-topicos">
              <label htmlFor="idArea">Área:</label>
              <select
                id="idArea"
                name="idArea"
                value={filtros.idArea}
                onChange={handleFiltroChange}
                disabled={!filtros.idCategoria}
              >
                <option value="">
                  {!filtros.idCategoria 
                    ? "Seleciona uma categoria primeiro" 
                    : "Todas as áreas"}
                </option>
                {areasFiltradas.map(area => (
                  <option 
                    key={area.id_area} 
                    value={area.id_area}
                  >
                    {area.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filtro-acoes-gerir-topicos">
            <button 
              className="btn-limpar-gerir-topicos"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        {/* Tabela principal de tópicos */}
        <div className="topicos-table-container-gerir-topicos">
          {loading ? (
            <div className="loading-container-gerir-topicos">
              <div className="loading-spinner-gerir-topicos"></div>
              <p>A carregar tópicos...</p>
            </div>
          ) : (
            <>
              <table className="topicos-table-gerir-topicos">
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
                      onClick={() => handleOrdenacao('titulo')}
                    >
                      Tópico
                      <span className="sort-icon">
                        {ordenacao.campo === 'titulo' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('categoria')}
                    >
                      Categoria
                      <span className="sort-icon">
                        {ordenacao.campo === 'categoria' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('area')}
                    >
                      Área
                      <span className="sort-icon">
                        {ordenacao.campo === 'area' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('criado')}
                    >
                      Criado
                      <span className="sort-icon">
                        {ordenacao.campo === 'criado' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mostrar tópicos existentes */}
                  {topicosParaMostrar.map((topico, index) => {
                    if (!topico || typeof topico !== 'object') {
                      return null;
                    }
                    
                    const topicoId = topico.id_topico || topico.id || index;
                    
                    return (
                      <tr key={topicoId}>
                        <td>{topicoId}</td>
                        <td className="topico-titulo-gerir-topicos overflow-cell">
                          <div className="cell-content">
                            {topico.titulo || 'Título não disponível'}
                          </div>
                        </td>
                        <td className="categoria-nome-gerir-topicos overflow-cell">
                          <div className="cell-content">
                            {getCategoriaName(topico.id_categoria)}
                          </div>
                        </td>
                        <td className="area-nome-gerir-topicos overflow-cell">
                          <div className="cell-content">
                            {getAreaName(topico.id_area)}
                          </div>
                        </td>
                        <td>
                          {topico.data_criacao ? 
                            new Date(topico.data_criacao).toLocaleDateString('pt-PT') : 
                            'N/A'
                          }
                        </td>
                        <td className="acoes-gerir-topicos">
                          <button 
                            className="btn-icon-gerir-topicos btn-editar-gerir-topicos"
                            onClick={() => handleEditarTopico(topico)}
                            title="Editar tópico"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-gerir-topicos btn-excluir-gerir-topicos"
                            onClick={() => handleConfirmarExclusao(topico)}
                            title="Eliminar tópico (remove também cursos e chats)"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* SEMPRE completar até 10 linhas com linhas vazias */}
                  {linhasVazias.map((_, index) => (
                    <tr key={`empty-${index}`} className="linha-vazia-gerir-topicos">
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Controlos de paginação */}
              <div className="paginacao-gerir-topicos">
                <button 
                  onClick={handlePaginaAnterior} 
                  disabled={paginaAtual === 1 || loading}
                  className="btn-pagina-gerir-topicos btn-anterior-gerir-topicos"
                  aria-label="Página anterior"
                  title="Página anterior"
                >
                  <span className="pagination-icon-gerir-topicos">&#8249;</span>
                  <span className="btn-text-gerir-topicos">Anterior</span>
                </button>
                
                <div className="pagina-info-gerir-topicos">
                  <span className="pagina-atual-gerir-topicos">
                    {loading ? 'A carregar...' : `Página ${paginaAtual} de ${totalPaginas}`}
                  </span>
                </div>
                
                <button 
                  onClick={handleProximaPagina}
                  disabled={paginaAtual >= totalPaginas || loading}
                  className="btn-pagina-gerir-topicos btn-seguinte-gerir-topicos"
                  aria-label="Próxima página"
                  title="Próxima página"
                >
                  <span className="btn-text-gerir-topicos">Seguinte</span>
                  <span className="pagination-icon-gerir-topicos">&#8250;</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal para criar/editar tópico */}
      {showTopicoForm && (
        <div className="modal-overlay-gerir-topicos">
          <div className="modal-content-gerir-topicos">
            <h3>{editTopico ? 'Editar Tópico' : 'Novo Tópico'}</h3>
            
            <div className="form-group-gerir-topicos">
              <label htmlFor="newTopicoTitulo">Título do Tópico:</label>
              <input 
                type="text" 
                id="newTopicoTitulo" 
                value={newTopicoTitulo}
                onChange={(e) => setNewTopicoTitulo(e.target.value)}
                placeholder="Digite o título do tópico"
                maxLength="200"
                autoFocus
              />
            </div>

            <div className="form-group-gerir-topicos">
              <label htmlFor="newTopicoDescricao">Descrição:</label>
              <textarea 
                id="newTopicoDescricao" 
                value={newTopicoDescricao}
                onChange={(e) => setNewTopicoDescricao(e.target.value)}
                placeholder="Digite uma descrição para o tópico (opcional)"
                rows="4"
                maxLength="500"
              />
            </div>
            
            <div className="form-group-gerir-topicos">
              <label htmlFor="newTopicoCategoria">Categoria:</label>
              <select
                id="newTopicoCategoria"
                value={newTopicoCategoria}
                onChange={(e) => {
                  setNewTopicoCategoria(e.target.value);
                  setNewTopicoArea(''); // Limpar área quando categoria muda
                }}
              >
                <option value="">Seleciona uma categoria</option>
                {categorias.map(categoria => (
                  <option 
                    key={categoria.id_categoria} 
                    value={categoria.id_categoria}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-gerir-topicos">
              <label htmlFor="newTopicoArea">Área:</label>
              <select
                id="newTopicoArea"
                value={newTopicoArea}
                onChange={(e) => setNewTopicoArea(e.target.value)}
                disabled={!newTopicoCategoria}
              >
                <option value="">
                  {!newTopicoCategoria 
                    ? "Seleciona uma categoria primeiro" 
                    : "Seleciona uma área"}
                </option>
                {areas
                  .filter(area => area.id_categoria === parseInt(newTopicoCategoria))
                  .map(area => (
                    <option 
                      key={area.id_area} 
                      value={area.id_area}
                    >
                      {area.nome}
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div className="modal-actions-gerir-topicos">
              <button 
                className="btn-cancelar-gerir-topicos"
                onClick={handleCloseTopicoForm}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-topicos"
                onClick={handleSaveTopico}
                disabled={!newTopicoTitulo.trim() || !newTopicoCategoria || !newTopicoArea}
              >
                {editTopico ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de eliminação */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-topicos">
          <div className="modal-content-gerir-topicos">
            <h3>Confirmar Eliminação</h3>
            <p>
              <strong>ATENÇÃO:</strong> Tens a certeza que queres eliminar o tópico "{topicoParaExcluir?.titulo}"?
            </p>
            <p>
              Esta ação irá eliminar <strong>permanentemente</strong>:
            </p>
            <ul className="warning-list-gerir-topicos">
              <li>Todos os chats de conversa associados</li>
              <li>Todos os cursos associados a este tópico</li>
              <li>Todas as inscrições de formandos nesses cursos</li>
              <li>Todas as associações de formadores</li>
            </ul>
            <p><strong>Esta ação não pode ser desfeita!</strong></p>
            <div className="modal-actions-gerir-topicos">
              <button 
                className="btn-cancelar-gerir-topicos"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-topicos btn-danger-gerir-topicos"
                onClick={handleExcluirTopico}
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

export default Gerir_Topicos;