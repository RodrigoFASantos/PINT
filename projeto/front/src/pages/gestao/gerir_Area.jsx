import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Area.css';
import Sidebar from '../../components/Sidebar';

/**
 * Componente para gestão de áreas de formação (2º nível da hierarquia)
 * 
 * Permite aos administradores:
 * - Visualizar todas as áreas organizadas por categorias
 * - Criar novas áreas de formação
 * - Editar áreas existentes
 * - Eliminar áreas (apenas se não tiverem tópicos dependentes)
 * - Filtrar áreas por nome e categoria
 * - Navegar entre páginas com tabela sempre de 10 linhas
 * - Ordenar áreas por diferentes critérios
 * 
 * HIERARQUIA: Categoria → Área → Tópico → Curso
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
const Gerir_Area = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para dados das áreas
  const [areas, setAreas] = useState([]);
  const [todasAsAreas, setTodasAsAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [totalAreas, setTotalAreas] = useState(0);
  
  // Estados para paginação e filtros - PADRONIZADO: sempre 10 itens por página
  const [paginaAtual, setPaginaAtual] = useState(1);
  const areasPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '', idCategoria: '' });
  
  // Estados para ordenação da tabela
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  
  // Estados para modais de confirmação e edição
  const [areaParaExcluir, setAreaParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editArea, setEditArea] = useState(null);
  const [newAreaNome, setNewAreaNome] = useState('');
  const [newAreaCategoria, setNewAreaCategoria] = useState('');
  const [showAreaForm, setShowAreaForm] = useState(false);
  
  // Referência para controlo do timeout dos filtros
  const filterTimeoutRef = useRef(null);

  /**
   * Alterna a visibilidade da barra lateral de navegação
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Ordena as áreas com base no campo e direção especificados
   * 
   * @param {Array} areas - Array de áreas a ordenar
   * @param {string} campo - Campo pelo qual ordenar ('id', 'nome', 'categoria' ou 'topicos')
   * @param {string} direcao - Direção da ordenação ('asc' ou 'desc')
   * @returns {Array} Array de áreas ordenado
   */
  const ordenarAreas = (areas, campo, direcao) => {
    return [...areas].sort((a, b) => {
      let valorA, valorB;
      
      switch (campo) {
        case 'id':
          valorA = a.id_area || a.id || 0;
          valorB = b.id_area || b.id || 0;
          break;
        case 'nome':
          valorA = a.nome || '';
          valorB = b.nome || '';
          break;
        case 'categoria':
          valorA = getCategoriaName(a.id_categoria);
          valorB = getCategoriaName(b.id_categoria);
          break;
        case 'topicos':
          valorA = a.topicos_count || a.topicosCount || 0;
          valorB = b.topicos_count || b.topicosCount || 0;
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
    const areasOrdenadas = ordenarAreas(areas, novaOrdenacao.campo, novaOrdenacao.direcao);
    setAreas(areasOrdenadas);
  };

  /**
   * Busca as áreas da API com suporte a paginação, filtros e contagem de tópicos
   * Implementa paginação controlada para sempre mostrar exatamente 10 linhas
   * 
   * @param {number} pagina - Número da página a carregar
   * @param {Object} filtrosAtuais - Filtros a aplicar na busca
   */
  const buscarAreas = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Efetuar requisição para buscar TODAS as áreas
      const response = await axios.get(`${API_BASE}/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let todasAsAreasRecebidas = [];
      
      // Processar diferentes formatos de resposta da API
      if (response.data && response.data.success && Array.isArray(response.data.areas)) {
        todasAsAreasRecebidas = response.data.areas;
      } else if (Array.isArray(response.data)) {
        todasAsAreasRecebidas = response.data;
      } else {
        toast.error('Formato de dados inválido recebido do servidor');
        setAreas([]);
        setTotalAreas(0);
        return;
      }
      
      // Aplicar filtros se especificados
      let areasFiltradas = todasAsAreasRecebidas;
      
      // Filtro por nome
      if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
        const termoBusca = filtrosAtuais.nome.trim().toLowerCase();
        areasFiltradas = areasFiltradas.filter(area => 
          area.nome?.toLowerCase().includes(termoBusca)
        );
      }
      
      // Filtro por categoria
      if (filtrosAtuais.idCategoria) {
        areasFiltradas = areasFiltradas.filter(area => 
          area.id_categoria == filtrosAtuais.idCategoria
        );
      }
      
      // Aplicar ordenação se estiver definida
      if (ordenacao.campo) {
        areasFiltradas = ordenarAreas(areasFiltradas, ordenacao.campo, ordenacao.direcao);
      }
      
      // Implementar paginação manual - SEMPRE 10 itens por página
      const totalItens = areasFiltradas.length;
      const startIndex = (pagina - 1) * areasPorPagina;
      const endIndex = startIndex + areasPorPagina;
      const areasParaPagina = areasFiltradas.slice(startIndex, endIndex);
      
      // Atualizar estados com os dados processados
      setAreas(areasParaPagina);
      setTotalAreas(totalItens);
      setPaginaAtual(pagina);
      setTodasAsAreas(todasAsAreasRecebidas);
      
    } catch (error) {
      // Gestão específica de erros
      if (error.response?.status === 401) {
        toast.error('Não autorizado. Faz login novamente.');
        navigate('/login');
      } else {
        toast.error(`Erro ao carregar áreas: ${error.response?.data?.message || 'Erro desconhecido'}`);
      }
      
      setAreas([]);
      setTotalAreas(0);
    } finally {
      setLoading(false);
    }
  }, [areasPorPagina, navigate, ordenacao]);

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
        if (currentUser) {
          if (currentUser.id_cargo !== 1) {
            toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
            navigate('/');
            return;
          }
        }
        
        // Carregar dados iniciais sequencialmente
        await buscarCategorias();
        await buscarAreas(1, { nome: '', idCategoria: '' });
        
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
  }, [navigate, currentUser, buscarAreas, buscarCategorias]);

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
        buscarAreas(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  /**
   * Remove todos os filtros aplicados e recarrega as áreas
   */
  const handleLimparFiltros = () => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '', idCategoria: '' };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    buscarAreas(1, filtrosLimpos);
  };

  /**
   * Navegar para a página anterior na paginação
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      buscarAreas(novaPagina, filtros);
    }
  };

  /**
   * Navegar para a próxima página na paginação
   */
  const handleProximaPagina = () => {
    const totalPaginas = Math.max(1, Math.ceil(totalAreas / areasPorPagina));
    if (paginaAtual < totalPaginas && !loading) {
      const novaPagina = paginaAtual + 1;
      buscarAreas(novaPagina, filtros);
    }
  };

  /**
   * Abre o modal para criar nova área
   */
  const handleOpenAreaForm = () => {
    setShowAreaForm(true);
    setEditArea(null);
    setNewAreaNome('');
    setNewAreaCategoria('');
  };

  /**
   * Fecha o modal de criação/edição de área
   */
  const handleCloseAreaForm = () => {
    setShowAreaForm(false);
    setEditArea(null);
    setNewAreaNome('');
    setNewAreaCategoria('');
  };

  /**
   * Grava uma nova área ou atualiza uma existente na base de dados
   */
  const handleSaveArea = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validar dados obrigatórios
      if (!newAreaNome.trim()) {
        toast.error('Por favor, insere um nome para a área.');
        return;
      }
      
      if (!newAreaCategoria) {
        toast.error('Por favor, seleciona uma categoria para a área.');
        return;
      }
      
      const dadosArea = {
        nome: newAreaNome.trim(),
        id_categoria: newAreaCategoria
      };
      
      // Decidir se é edição ou criação
      if (editArea) {
        await axios.put(`${API_BASE}/areas/${editArea.id_area}`, dadosArea, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Área atualizada com sucesso!');
      } else {
        await axios.post(`${API_BASE}/areas`, dadosArea, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Área criada com sucesso!');
      }
      
      handleCloseAreaForm();
      buscarAreas(paginaAtual, filtros);
      
    } catch (error) {
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
    }
  };

  /**
   * Prepara uma área para edição, preenchendo o formulário
   * 
   * @param {Object} area - Área a editar
   */
  const handleEditarArea = (area) => {
    setEditArea(area);
    setNewAreaNome(area.nome);
    setNewAreaCategoria(area.id_categoria || (area.categoria ? area.categoria.id_categoria : ''));
    setShowAreaForm(true);
  };

  /**
   * Prepara o modal de confirmação para eliminar uma área
   * 
   * @param {Object} area - Área a eliminar
   */
  const handleConfirmarExclusao = (area) => {
    setAreaParaExcluir(area);
    setShowDeleteConfirmation(true);
  };

  /**
   * Executa a eliminação definitiva de uma área
   * NOTA: A eliminação de áreas segue a regra de integridade:
   * - Só pode ser eliminada se não tiver tópicos dependentes
   * - O backend valida automaticamente esta restrição
   */
  const handleExcluirArea = async () => {
    if (!areaParaExcluir) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/areas/${areaParaExcluir.id_area}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Área eliminada com sucesso!');
      setShowDeleteConfirmation(false);
      setAreaParaExcluir(null);
      
      buscarAreas(paginaAtual, filtros);
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Área não encontrada. Pode já ter sido eliminada.');
        } else {
          toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
      
      setShowDeleteConfirmation(false);
      setAreaParaExcluir(null);
    }
  };

  /**
   * Navega para a página de gestão de categorias
   */
  const handleIrParaCategorias = () => {
    navigate('/admin/categorias');
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

  // Cálculos para paginação e apresentação
  const totalPaginas = Math.max(1, Math.ceil(totalAreas / areasPorPagina));
  const areasParaMostrar = Array.isArray(areas) ? areas : [];
  
  // Gerar SEMPRE as linhas vazias necessárias para completar 10 linhas
  const linhasVazias = [];
  const areasNaPagina = areasParaMostrar.length;
  const linhasVaziasNecessarias = Math.max(0, areasPorPagina - areasNaPagina);
  
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
  if (loading && areas.length === 0) {
    return (
      <div className="gerenciar-areas-container-gerir-area">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content-gerir-area">
          <div className="loading-container-gerir-area">
            <div className="loading-spinner-gerir-area"></div>
            <p>A carregar áreas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gerenciar-areas-container-gerir-area">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content-gerir-area">
        {/* Cabeçalho da página com título e ações principais */}
        <div className="areas-header-gerir-area">
          <h1>
            Gestão de Áreas 
            <span className="total-count-gerir-area">({totalAreas})</span>
          </h1>
          <div className="header-actions-gerir-area">
            <button 
              className="btn-navegacao-gerir-area"
              onClick={handleIrParaCategorias}
            >
              Gerir Categorias
            </button>
            <button 
              className="criar-btn-gerir-area"
              onClick={handleOpenAreaForm}
            >
              Criar Nova Área
            </button>
          </div>
        </div>
        
        {/* Secção de filtros de pesquisa */}
        <div className="filtros-container-gerir-area">
          <div className="filtros-principais-gerir-area">
            <div className="filtro-gerir-area">
              <label htmlFor="nome">Nome da Área:</label>
              <input 
                type="text"
                id="nome"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Filtrar por nome"
              />
            </div>
            
            <div className="filtro-gerir-area">
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
          </div>
          
          <div className="filtro-acoes-gerir-area">
            <button 
              className="btn-limpar-gerir-area"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        {/* Tabela principal de áreas */}
        <div className="areas-table-container-gerir-area">
          {loading ? (
            <div className="loading-container-gerir-area">
              <div className="loading-spinner-gerir-area"></div>
              <p>A carregar áreas...</p>
            </div>
          ) : (
            <>
              <table className="areas-table-gerir-area">
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
                      Área
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
                      onClick={() => handleOrdenacao('topicos')}
                    >
                      Tópicos
                      <span className="sort-icon">
                        {ordenacao.campo === 'topicos' ? (
                          ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'
                        ) : ' ↕'}
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mostrar áreas existentes */}
                  {areasParaMostrar.map((area, index) => {
                    if (!area || typeof area !== 'object') {
                      return null;
                    }
                    
                    const areaId = area.id_area || area.id || index;

                    return (
                      <tr key={areaId}>
                        <td>{areaId}</td>
                        <td className="area-nome-gerir-area overflow-cell">
                          <div className="cell-content">
                            {area.nome || 'Nome não disponível'}
                          </div>
                        </td>
                        <td className="overflow-cell">
                          <div className="cell-content">
                            {getCategoriaName(area.id_categoria)}
                          </div>
                        </td>
                        <td>{area.topicos_count || area.topicosCount || 0}</td>
                        <td className="acoes-gerir-area">
                          <button 
                            className="btn-icon-gerir-area btn-editar-gerir-area"
                            onClick={() => handleEditarArea(area)}
                            title="Editar área"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-gerir-area btn-excluir-gerir-area"
                            onClick={() => handleConfirmarExclusao(area)}
                            title="Eliminar área"
                            disabled={(area.topicos_count || area.topicosCount || 0) > 0}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* SEMPRE completar até 10 linhas com linhas vazias */}
                  {linhasVazias.map((_, index) => (
                    <tr key={`empty-${index}`} className="linha-vazia-gerir-area">
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
              <div className="paginacao-gerir-area">
                <button 
                  onClick={handlePaginaAnterior} 
                  disabled={paginaAtual === 1 || loading}
                  className="btn-pagina-gerir-area btn-anterior-gerir-area"
                  aria-label="Página anterior"
                  title="Página anterior"
                >
                  <span className="pagination-icon-gerir-area">&#8249;</span>
                  <span className="btn-text-gerir-area">Anterior</span>
                </button>
                
                <div className="pagina-info-gerir-area">
                  <span className="pagina-atual-gerir-area">
                    {loading ? 'A carregar...' : `Página ${paginaAtual} de ${totalPaginas}`}
                  </span>
                </div>
                
                <button 
                  onClick={handleProximaPagina}
                  disabled={paginaAtual >= totalPaginas || loading}
                  className="btn-pagina-gerir-area btn-seguinte-gerir-area"
                  aria-label="Próxima página"
                  title="Próxima página"
                >
                  <span className="btn-text-gerir-area">Seguinte</span>
                  <span className="pagination-icon-gerir-area">&#8250;</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal para criar/editar área */}
      {showAreaForm && (
        <div className="modal-overlay-gerir-area">
          <div className="modal-content-gerir-area">
            <h3>{editArea ? 'Editar Área' : 'Nova Área'}</h3>
            <div className="form-group-gerir-area">
              <label htmlFor="newAreaNome">Nome da Área:</label>
              <input 
                type="text" 
                id="newAreaNome" 
                value={newAreaNome}
                onChange={(e) => setNewAreaNome(e.target.value)}
                placeholder="Digite o nome da área"
                maxLength="100"
                autoFocus
              />
            </div>
            <div className="form-group-gerir-area">
              <label htmlFor="newAreaCategoria">Categoria:</label>
              <select
                id="newAreaCategoria"
                value={newAreaCategoria}
                onChange={(e) => setNewAreaCategoria(e.target.value)}
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
            <div className="modal-actions-gerir-area">
              <button 
                className="btn-cancelar-gerir-area"
                onClick={handleCloseAreaForm}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-area"
                onClick={handleSaveArea}
                disabled={!newAreaNome.trim() || !newAreaCategoria}
              >
                {editArea ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de eliminação */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-area">
          <div className="modal-content-gerir-area">
            <h3>Confirmar Eliminação</h3>
            <p>
              Tens a certeza que queres eliminar a área "{areaParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions-gerir-area">
              <button 
                className="btn-cancelar-gerir-area"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar-gerir-area btn-danger-gerir-area"
                onClick={handleExcluirArea}
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

export default Gerir_Area;