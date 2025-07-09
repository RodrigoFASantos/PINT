import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Cursos.css';
import Sidebar from '../../components/Sidebar';

/**
 * Componente para gestão de cursos de formação
 * 
 * Permite aos administradores:
 * - Visualizar todos os cursos organizados por categorias, áreas e formadores
 * - Criar novos cursos de formação
 * - Editar cursos existentes
 * - Eliminar cursos
 * - Filtrar cursos por nome, categoria, formador e estado
 * - Ordenar cursos por diferentes critérios
 * - Navegar entre páginas com tabela sempre de 10 linhas
 * - Ver detalhes dos cursos e formadores
 * 
 * HIERARQUIA: Categoria → Área → Tópico → Curso
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
const Gerir_Cursos = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para dados dos cursos
  const [cursos, setCursos] = useState([]);
  const [todosOsCursos, setTodosOsCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formadores, setFormadores] = useState([]);
  const [totalCursos, setTotalCursos] = useState(0);
  
  // Estados para paginação e filtros - PADRONIZADO: sempre 10 itens por página
  const [paginaAtual, setPaginaAtual] = useState(1);
  const cursosPorPagina = 10;
  const [filtros, setFiltros] = useState({ 
    nome: '', 
    idCategoria: '', 
    idFormador: '', 
    estado: '' 
  });
  
  // Estados para ordenação da tabela
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  
  // Estados para modais de confirmação e edição
  const [cursoParaExcluir, setCursoParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // Referência para controlo do timeout dos filtros
  const filterTimeoutRef = useRef(null);

  /**
   * Alterna a visibilidade da barra lateral de navegação
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Ordena os cursos com base no campo e direção especificados
   * 
   * @param {Array} cursos - Array de cursos a ordenar
   * @param {string} campo - Campo pelo qual ordenar ('nome', 'categoria', 'formador', 'estado' ou 'vagas')
   * @param {string} direcao - Direção da ordenação ('asc' ou 'desc')
   * @returns {Array} Array de cursos ordenado
   */
  const ordenarCursos = (cursos, campo, direcao) => {
    return [...cursos].sort((a, b) => {
      let valorA, valorB;
      
      switch (campo) {
        case 'id':
          valorA = a.id_curso || a.id || 0;
          valorB = b.id_curso || b.id || 0;
          break;
        case 'nome':
          valorA = a.nome || a.titulo || '';
          valorB = b.nome || b.titulo || '';
          break;
        case 'categoria':
          valorA = getCategoriaName(a);
          valorB = getCategoriaName(b);
          break;
        case 'formador':
          valorA = getFormadorName(a);
          valorB = getFormadorName(b);
          break;
        case 'estado':
          valorA = formatarEstado(a.estado, a.ativo);
          valorB = formatarEstado(b.estado, b.ativo);
          break;
        case 'vagas':
          valorA = a.vagas || a.totalVagas || 0;
          valorB = b.vagas || b.totalVagas || 0;
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
    const cursosOrdenados = ordenarCursos(cursos, novaOrdenacao.campo, novaOrdenacao.direcao);
    setCursos(cursosOrdenados);
  };

  /**
   * Busca os cursos da API com suporte a paginação, filtros e ordenação
   * Implementa paginação controlada para sempre mostrar exatamente 10 linhas
   * 
   * @param {number} pagina - Número da página a carregar
   * @param {Object} filtrosAtuais - Filtros a aplicar na busca
   */
  const buscarCursos = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Efetuar requisição à API para buscar TODOS os cursos
      const response = await axios.get(`${API_BASE}/cursos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let todosOsCursosRecebidos = [];
      
      // Processar diferentes formatos de resposta da API
      if (response.data && Array.isArray(response.data.cursos)) {
        todosOsCursosRecebidos = response.data.cursos;
      } else if (Array.isArray(response.data)) {
        todosOsCursosRecebidos = response.data;
      } else {
        toast.error('Formato de dados inválido recebido do servidor.');
        setCursos([]);
        setTotalCursos(0);
        return;
      }
      
      // Aplicar filtros se especificados
      let cursosFiltrados = todosOsCursosRecebidos;
      
      // Filtro por nome
      if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
        const termoBusca = filtrosAtuais.nome.trim().toLowerCase();
        cursosFiltrados = cursosFiltrados.filter(curso => 
          (curso.nome || curso.titulo || '').toLowerCase().includes(termoBusca)
        );
      }
      
      // Filtro por categoria
      if (filtrosAtuais.idCategoria) {
        cursosFiltrados = cursosFiltrados.filter(curso => {
          const categoriaId = curso.categoria?.id_categoria || curso.id_categoria;
          return categoriaId == filtrosAtuais.idCategoria;
        });
      }
      
      // Filtro por formador
      if (filtrosAtuais.idFormador) {
        cursosFiltrados = cursosFiltrados.filter(curso => {
          const formadorId = curso.formador?.id_utilizador || curso.id_formador;
          return formadorId == filtrosAtuais.idFormador;
        });
      }
      
      // Filtro por estado
      if (filtrosAtuais.estado) {
        if (filtrosAtuais.estado === 'Inativo') {
          cursosFiltrados = cursosFiltrados.filter(curso => curso.ativo === false);
        } else {
          // Mapeamento dos estados da interface para API
          const estadosMap = {
            'Planeado': 'planeado',
            'Em curso': 'em_curso',
            'Terminado': 'terminado'
          };
          
          const estadoAPI = estadosMap[filtrosAtuais.estado];
          if (estadoAPI) {
            cursosFiltrados = cursosFiltrados.filter(curso => 
              curso.estado === estadoAPI && curso.ativo !== false
            );
          }
        }
      }
      
      // Aplicar ordenação se estiver definida
      if (ordenacao.campo) {
        cursosFiltrados = ordenarCursos(cursosFiltrados, ordenacao.campo, ordenacao.direcao);
      }
      
      // Implementar paginação manual - SEMPRE 10 itens por página
      const totalItens = cursosFiltrados.length;
      const startIndex = (pagina - 1) * cursosPorPagina;
      const endIndex = startIndex + cursosPorPagina;
      const cursosParaPagina = cursosFiltrados.slice(startIndex, endIndex);
      
      // Atualizar estados com os dados processados
      setCursos(cursosParaPagina);
      setTotalCursos(totalItens);
      setPaginaAtual(pagina);
      setTodosOsCursos(todosOsCursosRecebidos);
      
    } catch (error) {
      // Gestão específica de erros
      if (error.response?.status === 401) {
        toast.error('Não autorizado. Faz login novamente.');
        navigate('/login');
      } else {
        toast.error(`Erro ao carregar cursos: ${error.response?.data?.message || 'Erro desconhecido'}`);
      }
      
      setCursos([]);
      setTotalCursos(0);
    } finally {
      setLoading(false);
    }
  }, [cursosPorPagina, navigate, ordenacao]);

  /**
   * Busca todas as categorias disponíveis para os filtros
   */
  const buscarCategorias = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        let categoriasData = [];
        
        if (Array.isArray(response.data.categorias)) {
          categoriasData = response.data.categorias;
        } else if (Array.isArray(response.data)) {
          categoriasData = response.data;
        }
        
        setCategorias(categoriasData);
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias para o filtro.');
      setCategorias([]);
    }
  }, []);

  /**
   * Busca todos os formadores disponíveis para os filtros
   */
  const buscarFormadores = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/users/formadores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormadores(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error('Erro ao carregar formadores para o filtro.');
      setFormadores([]);
    }
  }, []);

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
        
        // Verificar permissões de acesso (apenas administradores)
        if (currentUser && currentUser.id_cargo !== 1) {
          toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
          navigate('/');
          return;
        }
        
        // Carregar dados iniciais sequencialmente
        await buscarCategorias();
        await buscarFormadores();
        await buscarCursos(1, { nome: '', idCategoria: '', idFormador: '', estado: '' });
        
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
  }, [navigate, currentUser, buscarCursos, buscarCategorias, buscarFormadores]);

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
      const novosFiltros = {
        ...prev,
        [name]: value
      };
      
      setLoading(true);
      
      // Aplicar debounce de 600ms para evitar requisições excessivas
      filterTimeoutRef.current = setTimeout(() => {
        setPaginaAtual(1);
        buscarCursos(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  /**
   * Remove todos os filtros aplicados e recarrega os cursos
   */
  const handleLimparFiltros = () => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '', idCategoria: '', idFormador: '', estado: '' };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    buscarCursos(1, filtrosLimpos);
  };

  /**
   * Navegar para a página anterior na paginação
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      buscarCursos(novaPagina, filtros);
    }
  };

  /**
   * Navegar para a próxima página na paginação
   */
  const handleProximaPagina = () => {
    const totalPaginas = Math.max(1, Math.ceil(totalCursos / cursosPorPagina));
    if (paginaAtual < totalPaginas && !loading) {
      const novaPagina = paginaAtual + 1;
      buscarCursos(novaPagina, filtros);
    }
  };

  /**
   * Navega para a página de detalhes do formador
   * 
   * @param {number} formadorId - ID do formador
   */
  const handleVerFormador = (formadorId) => {
    if (formadorId) {
      navigate(`/formadores/${formadorId}`);
    }
  };

  /**
   * Navega para a página de detalhes do curso
   * 
   * @param {number} cursoId - ID do curso
   */
  const handleVerCurso = (cursoId) => {
    navigate(`/cursos/${cursoId}`);
  };

  /**
   * Navega para a página de edição do curso
   * 
   * @param {number} cursoId - ID do curso
   * @param {Event} e - Evento do clique
   */
  const handleEditarCurso = (cursoId, e) => {
    e.stopPropagation();
    navigate(`/admin/cursos/${cursoId}/editar`);
  };

  /**
   * Prepara o modal de confirmação para eliminar um curso
   * 
   * @param {Object} curso - Curso a eliminar
   * @param {Event} e - Evento do clique
   */
  const handleConfirmarExclusao = (curso, e) => {
    e.stopPropagation();
    setCursoParaExcluir(curso);
    setShowDeleteConfirmation(true);
  };

  /**
   * Executa a eliminação definitiva de um curso
   */
  const handleExcluirCurso = async () => {
    if (!cursoParaExcluir) return;
    
    const cursoId = cursoParaExcluir.id_curso || cursoParaExcluir.id;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Curso eliminado com sucesso!');
      
      // Atualizar a lista de cursos
      buscarCursos(paginaAtual, filtros);
      
    } catch (error) {
      toast.error(`Erro ao eliminar curso: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
      setShowDeleteConfirmation(false);
      setCursoParaExcluir(null);
    }
  };

  /**
   * Navega para a página de criação de novo curso
   */
  const handleCriarCurso = () => {
    navigate('/admin/criar-curso');
  };

  /**
   * Formata o estado do curso para exibição
   * 
   * @param {string} estado - Estado do curso
   * @param {boolean} ativo - Se o curso está ativo
   * @returns {string} Estado formatado
   */
  const formatarEstado = (estado, ativo) => {
    if (ativo === false) return 'INATIVO';
    if (!estado) return 'DESCONHECIDO';

    const estadosMap = {
      'planeado': 'PLANEADO',
      'em_curso': 'EM CURSO',
      'terminado': 'TERMINADO'
    };

    const estadoNormalizado = estado.toLowerCase().replace(/[\s_]+/g, '_');
    return estadosMap[estadoNormalizado] || estado.toUpperCase();
  };

  /**
   * Obtém a classe CSS para o badge do estado
   * 
   * @param {string} estado - Estado do curso
   * @param {boolean} ativo - Se o curso está ativo
   * @returns {string} Classe CSS
   */
  const getEstadoClass = (estado, ativo) => {
    if (ativo === false) return 'inativo';
    if (!estado) return 'desconhecido';
    
    return estado.toLowerCase().replace(/[\s_]+/g, '-');
  };

  /**
   * Obtém o nome da categoria do curso
   * 
   * @param {Object} curso - Objeto do curso
   * @returns {string} Nome da categoria
   */
  const getCategoriaName = (curso) => {
    return curso.categoria
      ? (typeof curso.categoria === 'object' ? curso.categoria.nome : curso.categoria)
      : curso.nome_categoria || "Não especificada";
  };

  /**
   * Obtém o nome do formador do curso
   * 
   * @param {Object} curso - Objeto do curso
   * @returns {string} Nome do formador
   */
  const getFormadorName = (curso) => {
    return curso.formador
      ? (typeof curso.formador === 'object' ? curso.formador.nome : curso.formador)
      : curso.nome_formador || "Curso Assíncrono";
  };

  /**
   * Obtém o ID do formador do curso
   * 
   * @param {Object} curso - Objeto do curso
   * @returns {number|null} ID do formador
   */
  const getFormadorId = (curso) => {
    return curso.formador && typeof curso.formador === 'object'
      ? (curso.formador.id_utilizador || curso.formador.id)
      : curso.id_formador;
  };

  // Cálculos para paginação e apresentação
  const totalPaginas = Math.max(1, Math.ceil(totalCursos / cursosPorPagina));
  const cursosParaMostrar = Array.isArray(cursos) ? cursos : [];
  
  // Gerar SEMPRE as linhas vazias necessárias para completar 10 linhas
  const linhasVazias = [];
  const cursosNaPagina = cursosParaMostrar.length;
  const linhasVaziasNecessarias = Math.max(0, cursosPorPagina - cursosNaPagina);
  
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
  if (loading && cursos.length === 0) {
    return (
      <div className="gerenciar-cursos-container-gerir-cursos">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content-gerir-cursos">
          <div className="loading-container-gerir-cursos">
            <div className="loading-spinner-gerir-cursos"></div>
            <p>A carregar cursos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gerenciar-cursos-container-gerir-cursos">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content-gerir-cursos">
        {/* Cabeçalho da página com título e ações principais */}
        <div className="cursos-header-gerir-cursos">
          <h1>
            Gestão de Cursos
            <span className="total-count-gerir-cursos">({totalCursos})</span>
          </h1>
          <button
            className="criar-curso-btn-gerir-cursos"
            onClick={handleCriarCurso}
          >
            Criar Novo Curso
          </button>
        </div>

        {/* Secção de filtros de pesquisa */}
        <div className="filtros-container-gerir-cursos">
          <div className="filtros-principais-gerir-cursos">
            <div className="filtro-gerir-cursos">
              <label htmlFor="nome">Nome do Curso:</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Filtrar por nome"
              />
            </div>

            <div className="filtro-gerir-cursos">
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
                    key={categoria.id_categoria || categoria.id}
                    value={categoria.id_categoria || categoria.id}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-gerir-cursos">
              <label htmlFor="idFormador">Formador:</label>
              <select
                id="idFormador"
                name="idFormador"
                value={filtros.idFormador}
                onChange={handleFiltroChange}
              >
                <option value="">Todos os formadores</option>
                {formadores.map(formador => (
                  <option
                    key={formador.id_utilizador || formador.id_user || formador.id}
                    value={formador.id_utilizador || formador.id_user || formador.id}
                  >
                    {formador.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-gerir-cursos">
              <label htmlFor="estado">Estado:</label>
              <select
                id="estado"
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="Planeado">Planeado</option>
                <option value="Em curso">Em curso</option>
                <option value="Terminado">Terminado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div className="filtro-acoes-gerir-cursos">
            <button
              className="btn-limpar-gerir-cursos"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabela principal de cursos */}
        <div className="cursos-table-container-gerir-cursos">
          {loading ? (
            <div className="loading-container-gerir-cursos">
              <div className="loading-spinner-gerir-cursos"></div>
              <p>A carregar cursos...</p>
            </div>
          ) : (
            <>
              <table className="cursos-table-gerir-cursos">
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
                      Curso
                      <span className="sort-icon">
                        {ordenacao.campo === 'nome' ? (
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
                      onClick={() => handleOrdenacao('formador')}
                    >
                      Formador
                      <span className="sort-icon">
                        {ordenacao.campo === 'formador' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('vagas')}
                    >
                      Vagas
                      <span className="sort-icon">
                        {ordenacao.campo === 'vagas' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('estado')}
                    >
                      Estado
                      <span className="sort-icon">
                        {ordenacao.campo === 'estado' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mostrar cursos existentes */}
                  {cursosParaMostrar.map((curso, index) => {
                    if (!curso || typeof curso !== 'object') {
                      return null;
                    }
                    
                    // Obter ID do curso de maneira consistente
                    const cursoId = curso.id_curso || curso.id || index;
                    
                    // Obter informações formatadas
                    const categoriaNome = getCategoriaName(curso);
                    const formadorNome = getFormadorName(curso);
                    const formadorId = getFormadorId(curso);
                    
                    // Normalizar estado para exibição
                    let estadoExibicao = formatarEstado(curso.estado, curso.ativo);
                    const estadoClass = getEstadoClass(curso.estado, curso.ativo);
                    
                    // Calcular vagas disponíveis
                    const totalVagas = curso.vagas || curso.totalVagas || 0;
                    
                    return (
                      <tr
                        key={cursoId}
                        className={!curso.ativo ? 'inativo-gerir-cursos' : ''}
                        onClick={() => handleVerCurso(cursoId)}
                      >
                        <td>{cursoId}</td>
                        <td className="curso-nome-gerir-cursos overflow-cell">
                          <div className="cell-content">
                            {curso.nome || curso.titulo || 'Nome não disponível'}
                          </div>
                        </td>
                        <td className="overflow-cell">
                          <div className="cell-content">
                            {categoriaNome}
                          </div>
                        </td>
                        <td
                          className={formadorId ? "formador-cell-gerir-cursos" : ""}
                          onClick={e => {
                            e.stopPropagation();
                            if (formadorId) handleVerFormador(formadorId);
                          }}
                        >
                          {formadorNome}
                        </td>
                        <td>
                          {totalVagas !== null && totalVagas !== undefined
                            ? totalVagas
                            : "?"}
                        </td>
                        <td className="status-cell-gerir-cursos">
                          <span className={`estado-gerir-cursos ${estadoClass}`}>
                            {estadoExibicao}
                          </span>
                        </td>
                        <td className="acoes-gerir-cursos">
                          <button
                            className="btn-icon-gerir-cursos btn-editar-gerir-cursos"
                            onClick={(e) => handleEditarCurso(cursoId, e)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon-gerir-cursos btn-excluir-gerir-cursos"
                            onClick={(e) => handleConfirmarExclusao(curso, e)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* SEMPRE completar até 10 linhas com linhas vazias */}
                  {linhasVazias.map((_, index) => (
                    <tr key={`empty-${index}`} className="linha-vazia-gerir-cursos">
                      <td>&nbsp;</td>
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
              <div className="paginacao-gerir-cursos">
                <button
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1 || loading}
                  className="btn-pagina-gerir-cursos btn-anterior-gerir-cursos"
                  aria-label="Página anterior"
                  title="Página anterior"
                >
                  <span className="pagination-icon-gerir-cursos">&#8249;</span>
                  <span className="btn-text-gerir-cursos">Anterior</span>
                </button>

                <div className="pagina-info-gerir-cursos">
                  <span className="pagina-atual-gerir-cursos">
                    {loading ? 'A carregar...' : `Página ${paginaAtual} de ${totalPaginas}`}
                  </span>
                </div>

                <button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual >= totalPaginas || loading}
                  className="btn-pagina-gerir-cursos btn-seguinte-gerir-cursos"
                  aria-label="Próxima página"
                  title="Próxima página"
                >
                  <span className="btn-text-gerir-cursos">Seguinte</span>
                  <span className="pagination-icon-gerir-cursos">&#8250;</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmação de eliminação */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-cursos">
          <div className="modal-content-gerir-cursos">
            <h3>Confirmar Eliminação</h3>
            <p>
              Tens a certeza que queres eliminar o curso "{cursoParaExcluir?.nome || cursoParaExcluir?.titulo}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions-gerir-cursos">
              <button
                className="btn-cancelar-gerir-cursos"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-gerir-cursos"
                onClick={handleExcluirCurso}
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

export default Gerir_Cursos;