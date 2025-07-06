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
 * - Navegar entre páginas
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
  
  // Estados para paginação e filtros
  const [paginaAtual, setPaginaAtual] = useState(1);
  const areasPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '', idCategoria: '' });
  
  // Estados para modais de confirmação e edição
  const [areaParaExcluir, setAreaParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editArea, setEditArea] = useState(null);
  const [newAreaNome, setNewAreaNome] = useState('');
  const [newAreaCategoria, setNewAreaCategoria] = useState('');
  const [showAreaForm, setShowAreaForm] = useState(false);
  
  // Referência para timeout de filtros (evita requisições excessivas)
  const filterTimeoutRef = useRef(null);

  /**
   * Alterna a visibilidade da barra lateral
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Busca as áreas da API com paginação e filtros
   * Implementa paginação no frontend quando a API retorna todas as áreas
   */
  const buscarAreas = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Preparar parâmetros da requisição
      const params = {
        page: pagina,
        limit: areasPorPagina,
      };
      
      // Adicionar filtro de nome se especificado
      if (filtrosAtuais.nome && filtrosAtuais.nome.trim()) {
        params.search = filtrosAtuais.nome.trim();
      }
      
      // Adicionar filtro de categoria se especificado
      if (filtrosAtuais.idCategoria) {
        params.categoria = filtrosAtuais.idCategoria;
      }
      
      // Limpar parâmetros vazios
      Object.keys(params).forEach(key => 
        (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      // Fazer requisição à API
      const response = await axios.get(`${API_BASE}/areas`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Processar diferentes formatos de resposta da API
      let areasData = [];
      let total = 0;
      let processouComSucesso = false;

      if (response.data && response.data.success) {
        // Formato padrão: {success: true, areas: [...], total: 12} - API com paginação
        areasData = response.data.areas;
        total = response.data.total || 0;
        processouComSucesso = true;
      } else if (Array.isArray(response.data)) {
        // Formato alternativo: array direto [{...}, {...}, ...] - API sem paginação
        const todasAsAreasRecebidas = response.data;
        
        // Aplicar filtros manualmente
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
        
        total = areasFiltradas.length;
        
        // Implementar paginação manual no frontend
        const startIndex = (pagina - 1) * areasPorPagina;
        const endIndex = startIndex + areasPorPagina;
        areasData = areasFiltradas.slice(startIndex, endIndex);
        
        // Armazenar todas as áreas para futuras operações
        setTodasAsAreas(todasAsAreasRecebidas);
        processouComSucesso = true;
      } else if (response.data && Array.isArray(response.data.areas)) {
        // Formato alternativo: {areas: [...]} sem success
        areasData = response.data.areas;
        total = response.data.total || response.data.areas.length;
        processouComSucesso = true;
      }

      if (processouComSucesso) {
console.log("API /areas response:", response.data);
        // Verificar se os dados são válidos
        if (Array.isArray(areasData)) {
          setAreas(areasData);
          console.log("Áreas para mostrar na tabela:", areasData);
          setTotalAreas(total || 0);
          setPaginaAtual(pagina);
        } else {
          toast.error('Formato de dados inválido recebido do servidor.');
          setAreas([]);
          setTotalAreas(0);
        }
      } else {
        toast.error('Erro ao carregar áreas do servidor.');
        setAreas([]);
        setTotalAreas(0);
      }
      
      setLoading(false);
    } catch (error) {
      // Gestão específica de erros
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Não autorizado. Faz login novamente.');
          navigate('/login');
        } else {
          toast.error(`Erro ao carregar áreas: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro ao processar a requisição.');
      }
      
      setAreas([]);
      setTotalAreas(0);
      setLoading(false);
    }
  }, [areasPorPagina, navigate, filtros]);


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
        
        // Carregar dados iniciais
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
   * Gere alterações nos filtros com debounce para evitar muitas requisições
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
        buscarAreas(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  /**
   * Limpa todos os filtros aplicados e recarrega as áreas
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
   * Navega para a página anterior
   */
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1 && !loading) {
      const novaPagina = paginaAtual - 1;
      buscarAreas(novaPagina, filtros);
    }
  };

  /**
   * Navega para a próxima página
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
   * Grava uma nova área ou atualiza uma existente
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
        nome: newAreaNome,
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
   * Prepara uma área para edição
   */
  const handleEditarArea = (area) => {
    setEditArea(area);
    setNewAreaNome(area.nome);
    setNewAreaCategoria(area.id_categoria || (area.categoria ? area.categoria.id_categoria : ''));
    setShowAreaForm(true);
  };

  /**
   * Confirma a exclusão de uma área
   */
  const handleConfirmarExclusao = (area) => {
    setAreaParaExcluir(area);
    setShowDeleteConfirmation(true);
  };

  /**
   * Executa a exclusão de uma área
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

  // Cálculos para paginação e apresentação
  const totalPaginas = Math.max(1, Math.ceil(totalAreas / areasPorPagina));
  const areasParaMostrar = Array.isArray(areas) ? areas : [];
  
  // Criar linhas vazias para manter altura consistente da tabela
  const linhasVazias = [];
  const linhasNecessarias = Math.max(0, areasPorPagina - areasParaMostrar.length);
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
        {/* Cabeçalho com título e ações principais */}
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
        
        {/* Secção de filtros */}
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
        
        {/* Tabela de áreas e controlos de paginação */}
        <div className="areas-table-container-gerir-area">
          {loading ? (
            <div className="loading-container-gerir-area">
              <div className="loading-spinner-gerir-area"></div>
              <p>A carregar áreas...</p>
            </div>
          ) : !Array.isArray(areasParaMostrar) || areasParaMostrar.length === 0 ? (
            <div className="no-items-gerir-area">
              <p>Nenhuma área encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              {/* Tabela com os dados das áreas */}
              <table className="areas-table-gerir-area">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Área</th>
                    <th>Categoria</th>
                    <th>Tópicos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {areasParaMostrar.map((area, index) => {
                    if (!area || typeof area !== 'object') {
                      return null;
                    }
                    
                    // Processar nome da categoria de forma segura
                    const categoriaObj = categorias.find(cat => String(cat.id_categoria) === String(area.id_categoria));
const categoriaNome = categoriaObj ? categoriaObj.nome : "Não especificada";


                    
                    const areaId = area.id_area || area.id || index;
                    console.log("Renderizar área:", area);

                    return (
                      <tr key={areaId}>
                        <td>{areaId}</td>
                        <td className="area-nome-gerir-area">{area.nome || 'Nome não disponível'}</td>
                        <td>{categoriaNome}</td>
                        <td>{area.topicos_count || area.topicosCount || 0}</td>
                        <td className="acoes-gerir-area">
                          <button 
                            className="btn-icon-gerir-area btn-editar-gerir-area"
                            onClick={() => handleEditarArea(area)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-gerir-area btn-excluir-gerir-area"
                            onClick={() => handleConfirmarExclusao(area)}
                            title="Eliminar"
                            disabled={(area.topicos_count || area.topicosCount || 0) > 0}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  
                  
                  )}
                  
                  {/* Linhas vazias para manter altura consistente */}
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
                className="btn-confirmar-gerir-area"
                onClick={handleExcluirArea}
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

export default Gerir_Area;