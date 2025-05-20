import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Area.css';
import Sidebar from '../../components/Sidebar';

const Gerir_Area = () => {
  const navigate = useNavigate();
  
  // Auth context
  const { currentUser } = useAuth();
  
  // Estados para sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para áreas
  const [areas, setAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [totalAreas, setTotalAreas] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const areasPorPagina = 10;
  const [filtros, setFiltros] = useState({ nome: '', idCategoria: '' });
  const [areaParaExcluir, setAreaParaExcluir] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editArea, setEditArea] = useState(null);
  const [newAreaNome, setNewAreaNome] = useState('');
  const [newAreaCategoria, setNewAreaCategoria] = useState('');
  const [showAreaForm, setShowAreaForm] = useState(false);
  
  // Estado de carregamento
  const [loading, setLoading] = useState(true);
  
  // Ref para debounce
  const filterTimeoutRef = useRef(null);

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] Gerir_Area: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar áreas com paginação e filtros
  const buscarAreas = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      console.log('[DEBUG] Gerir_Area: A iniciar busca de áreas - Página:', pagina);
      console.log('[DEBUG] Gerir_Area: Filtros aplicados:', filtrosAtuais);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Criar objeto de parâmetros para a requisição
      const params = {
        page: pagina,
        limit: areasPorPagina,
      };
      
      // Adicionar filtros válidos
      if (filtrosAtuais.nome) {
        params.search = filtrosAtuais.nome;
      }
      
      if (filtrosAtuais.idCategoria) {
        params.categoria = filtrosAtuais.idCategoria;
      }
      
      // Remover parâmetros vazios
      Object.keys(params).forEach(key => 
        (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      console.log('[DEBUG] Gerir_Area: A buscar áreas com os parâmetros finais:', params);
      
      const response = await axios.get(`${API_BASE}/areas`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Area: Resposta da API (áreas):', response.data);
      
      if (response.data) {
        if (Array.isArray(response.data.areas)) {
          setAreas(response.data.areas);
          setTotalAreas(response.data.total || response.data.areas.length);
        } else if (Array.isArray(response.data)) {
          setAreas(response.data);
          setTotalAreas(response.data.length);
        } else {
          console.error('[DEBUG] Gerir_Area: Formato de resposta inesperado:', response.data);
          toast.error('Formato de dados inválido recebido do servidor.');
          setAreas([]);
          setTotalAreas(0);
        }
      } else {
        console.error('[DEBUG] Gerir_Area: Resposta vazia ou inválida');
        toast.error('Nenhum dado recebido do servidor.');
        setAreas([]);
        setTotalAreas(0);
      }
      
      setPaginaAtual(pagina);
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] Gerir_Area: Erro ao buscar áreas:', error);
      
      if (error.response) {
        console.error('[DEBUG] Gerir_Area: Dados do erro:', error.response.data);
        console.error('[DEBUG] Gerir_Area: Status:', error.response.status);
        
        if (error.response.status === 401) {
          console.log('[DEBUG] Gerir_Area: Erro 401 - Não autorizado. A redirecionar para login...');
          toast.error('Não autorizado. Faça login novamente.');
          navigate('/login');
        } else {
          toast.error(`Erro ao carregar áreas: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else {
        console.error('[DEBUG] Gerir_Area: Erro:', error.message);
        toast.error('Erro ao processar a requisição.');
      }
      
      setAreas([]);
      setTotalAreas(0);
      setLoading(false);
    }
  }, [areasPorPagina, navigate]);

  // Função para buscar categorias para o select
  const buscarCategorias = useCallback(async () => {
    try {
      console.log('[DEBUG] Gerir_Area: A buscar categorias para o filtro');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Area: Categorias carregadas:', response.data);
      
      if (response.data && (Array.isArray(response.data.categorias) || Array.isArray(response.data))) {
        setCategorias(Array.isArray(response.data.categorias) ? response.data.categorias : response.data);
      } else {
        console.error('[DEBUG] Gerir_Area: Formato de resposta inesperado:', response.data);
        toast.error('Erro ao carregar categorias para o filtro.');
        setCategorias([]);
      }
    } catch (error) {
      console.error('[DEBUG] Gerir_Area: Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias para o filtro.');
      setCategorias([]);
    }
  }, []);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DEBUG] Gerir_Area: ===== A INICIAR VERIFICAÇÕES DE AUTENTICAÇÃO =====');
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('[DEBUG] Gerir_Area: Token no localStorage:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
          console.log('[DEBUG] Gerir_Area: Token não encontrado. A redirecionar para login...');
          navigate('/login');
          return;
        }
        
        // Log do usuário atual do AuthContext
        console.log('[DEBUG] Gerir_Area: Utilizador atual do AuthContext:', currentUser);
        
        if (currentUser) {
          console.log('[DEBUG] Gerir_Area: Dados do utilizador do AuthContext:', {
            id_utilizador: currentUser.id_utilizador,
            nome: currentUser.nome,
            id_cargo: currentUser.id_cargo,
            email: currentUser.email,
            cargo: currentUser.cargo
          });
          
          // Verificar se o usuário tem permissão (admin ou gestor)
          if (currentUser.id_cargo !== 1) {
            console.log('[DEBUG] Gerir_Area: Usuário não é administrador. Redirecionando...');
            toast.error('Acesso negado. Você não tem permissão para acessar esta página.');
            navigate('/');
            return;
          }
        }
        
        console.log('[DEBUG] Gerir_Area: Autenticação verificada com sucesso. A buscar dados...');
        
        // Buscar categorias para o filtro
        await buscarCategorias();
        
        // Buscar áreas iniciais
        await buscarAreas(1, filtros);
        
      } catch (error) {
        console.error('[DEBUG] Gerir_Area: Erro ao carregar dados:', error);
        
        if (error.response && error.response.status === 401) {
          console.log('[DEBUG] Gerir_Area: Erro 401 - Não autorizado. A redirecionar para login...');
          toast.error('Não autorizado. Por favor, faça login novamente.');
          navigate('/login');
        } else {
          toast.error('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, currentUser, buscarAreas, buscarCategorias]);

  // Handler para mudança de filtros com debounce
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] Gerir_Area: Filtro alterado: ${name} = ${value}`);
    
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
      
      console.log('[DEBUG] Gerir_Area: Novos filtros:', novosFiltros);
      
      // Ativar o indicador de carregamento imediatamente
      setLoading(true);
      
      // Configurar novo temporizador de debounce
      filterTimeoutRef.current = setTimeout(() => {
        // Quando o temporizador disparar, usar os valores atuais dos filtros
        buscarAreas(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    console.log('[DEBUG] Gerir_Area: A limpar filtros');
    
    // Limpar qualquer temporizador existente
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = { nome: '', idCategoria: '' };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    
    // Buscar dados com filtros limpos
    buscarAreas(1, filtrosLimpos);
  };

  // Funções de navegação
  const handlePaginaAnterior = () => {
    console.log('[DEBUG] Gerir_Area: A navegar para página anterior');
    if (paginaAtual > 1) {
      buscarAreas(paginaAtual - 1, filtros);
    }
  };

  const handleProximaPagina = () => {
    console.log('[DEBUG] Gerir_Area: A navegar para próxima página');
    const totalPaginas = Math.ceil(totalAreas / areasPorPagina);
    if (paginaAtual < totalPaginas) {
      buscarAreas(paginaAtual + 1, filtros);
    }
  };

  // Funções para criar nova área
  const handleOpenAreaForm = () => {
    setShowAreaForm(true);
    setEditArea(null);
    setNewAreaNome('');
    setNewAreaCategoria('');
  };

  const handleCloseAreaForm = () => {
    setShowAreaForm(false);
    setEditArea(null);
    setNewAreaNome('');
    setNewAreaCategoria('');
  };

  const handleSaveArea = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!newAreaNome.trim()) {
        toast.error('Por favor, insira um nome para a área.');
        return;
      }
      
      if (!newAreaCategoria) {
        toast.error('Por favor, selecione uma categoria para a área.');
        return;
      }
      
      // Modo edição
      if (editArea) {
        console.log(`[DEBUG] Gerir_Area: A atualizar área ID ${editArea.id_area}`);
        
        await axios.put(`${API_BASE}/areas/${editArea.id_area}`, {
          nome: newAreaNome,
          id_categoria: newAreaCategoria
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Área atualizada com sucesso!');
      } 
      // Modo criação
      else {
        console.log('[DEBUG] Gerir_Area: A criar nova área');
        
        await axios.post(`${API_BASE}/areas`, {
          nome: newAreaNome,
          id_categoria: newAreaCategoria
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Área criada com sucesso!');
      }
      
      // Fechar o formulário e atualizar a lista
      handleCloseAreaForm();
      buscarAreas(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Area: Erro ao salvar área:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tente novamente.');
      }
    }
  };

  // Funções para editar área
  const handleEditarArea = (area) => {
    console.log(`[DEBUG] Gerir_Area: A editar área ID ${area.id_area}`);
    setEditArea(area);
    setNewAreaNome(area.nome);
    setNewAreaCategoria(area.id_categoria || (area.categoria ? area.categoria.id_categoria : ''));
    setShowAreaForm(true);
  };

  // Funções para excluir área
  const handleConfirmarExclusao = (area) => {
    console.log(`[DEBUG] Gerir_Area: A confirmar exclusão da área ID ${area.id_area}`);
    setAreaParaExcluir(area);
    setShowDeleteConfirmation(true);
  };

  const handleExcluirArea = async () => {
    if (!areaParaExcluir) return;
    
    try {
      const token = localStorage.getItem('token');
      console.log(`[DEBUG] Gerir_Area: A excluir área ID ${areaParaExcluir.id_area}`);
      
      await axios.delete(`${API_BASE}/areas/${areaParaExcluir.id_area}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Área excluída com sucesso!');
      setShowDeleteConfirmation(false);
      setAreaParaExcluir(null);
      
      // Atualizar a lista
      buscarAreas(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Area: Erro ao excluir área:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tente novamente.');
      }
      
      setShowDeleteConfirmation(false);
      setAreaParaExcluir(null);
    }
  };

  // Função para navegar para a página de categorias
  const handleIrParaCategorias = () => {
    navigate('/admin/categorias');
  };

  // Calcular número total de páginas
  const totalPaginas = Math.ceil(totalAreas / areasPorPagina);

  // Limpar timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Interface de carregamento
  if (loading && areas.length === 0) {
    return (
      <div className="gerenciar-areas-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>A carregar áreas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="gerenciar-areas-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <div className="areas-header">
          <h1>Gestão de Áreas</h1>
          <div className="header-actions">
            <button 
              className="btn-navegacao"
              onClick={handleIrParaCategorias}
            >
              Gerir Categorias
            </button>
            <button 
              className="criar-btn"
              onClick={handleOpenAreaForm}
            >
              Criar Nova Área
            </button>
          </div>
        </div>
        
        <div className="filtros-container">
          <div className="filtro">
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
          
          <div className="filtro">
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
        
        <div className="areas-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>A carregar áreas...</p>
            </div>
          ) : areas.length === 0 ? (
            <div className="no-items">
              <p>Nenhuma área encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="areas-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Área</th>
                    <th>Categoria</th>
                    <th>Cursos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map(area => {
                    // Obter o nome da categoria de maneira segura
                    const categoriaNome = area.categoria ? 
                      (typeof area.categoria === 'object' ? area.categoria.nome : area.categoria) : 
                      "Não especificada";
                    
                    return (
                      <tr key={area.id_area}>
                        <td>{area.id_area}</td>
                        <td className="area-nome">{area.nome}</td>
                        <td>{categoriaNome}</td>
                        <td>{area.cursos_count || 0}</td>
                        <td className="acoes">
                          <button 
                            className="btn-icon btn-editar"
                            onClick={() => handleEditarArea(area)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon btn-excluir"
                            onClick={() => handleConfirmarExclusao(area)}
                            title="Excluir"
                            disabled={area.cursos_count > 0}
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
      
      {/* Modal de formulário de área */}
      {showAreaForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editArea ? 'Editar Área' : 'Nova Área'}</h3>
            <div className="form-group">
              <label htmlFor="newAreaNome">Nome da Área:</label>
              <input 
                type="text" 
                id="newAreaNome" 
                value={newAreaNome}
                onChange={(e) => setNewAreaNome(e.target.value)}
                placeholder="Digite o nome da área"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newAreaCategoria">Categoria:</label>
              <select
                id="newAreaCategoria"
                value={newAreaCategoria}
                onChange={(e) => setNewAreaCategoria(e.target.value)}
              >
                <option value="">Selecione uma categoria</option>
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
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={handleCloseAreaForm}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleSaveArea}
              >
                {editArea ? 'Atualizar' : 'Criar'}
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
              Tem certeza que deseja excluir a área "{areaParaExcluir?.nome}"?
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
                onClick={handleExcluirArea}
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

export default Gerir_Area;