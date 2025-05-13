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
  const [areas, setAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAreas, setTotalAreas] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [areaParaExcluir, setAreaParaExcluir] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('criar'); // 'criar' ou 'editar'
  const [formData, setFormData] = useState({ 
    nome: '',
    id_categoria: ''
  });
  
  // Auth context
  const { currentUser } = useAuth();
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const areasPorPagina = 20;
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    idCategoria: ''
  });

  // Ref para controlar debounce nos filtros
  const filterTimeoutRef = useRef(null);

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] Gerir_Area: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar áreas com paginação e filtros (usando useCallback)
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
      
      console.log('[DEBUG] Gerir_Area: Resposta da API:', response.data);
      
      // Verifica a estrutura dos dados recebidos
      if (response.data) {
        if (Array.isArray(response.data.areas)) {
          setAreas(response.data.areas);
          setTotalAreas(response.data.total || response.data.areas.length);
        } else if (Array.isArray(response.data)) {
          // Se a resposta for um array direto
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
          toast.error(`Erro ao carregar áreas: ${error.response.data.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
      }
      
      setAreas([]);
      setTotalAreas(0);
      setLoading(false);
    }
  }, [areasPorPagina, navigate]);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DEBUG] Gerir_Area: ===== A INICIAR VERIFICAÇÕES DE AUTENTICAÇÃO =====');
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('[DEBUG] Gerir_Area: Token não encontrado. A redirecionar para login...');
          navigate('/login');
          return;
        }
        
        console.log('[DEBUG] Gerir_Area: Autenticação verificada com sucesso. A buscar dados...');
        
        // Obter categorias para o formulário e filtros
        const categoriasResponse = await axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Area: Categorias carregadas:', categoriasResponse.data);
        setCategorias(Array.isArray(categoriasResponse.data) 
          ? categoriasResponse.data 
          : categoriasResponse.data.categorias || []);
        
        // Obter áreas (primeira página) - com filtros vazios inicialmente
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
  }, [navigate, buscarAreas]);

  // Handler para mudança de filtros com debounce
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] Gerir_Area: Filtro alterado: ${name} = ${value}`);
    
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
        buscarAreas(1, novosFiltros);
      }, 600);
      
      return novosFiltros;
    });
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    console.log('[DEBUG] Gerir_Area: A limpar filtros');
    
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = {
      nome: '',
      idCategoria: ''
    };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    
    buscarAreas(1, filtrosLimpos);
  };

  // Funções de navegação
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      buscarAreas(paginaAtual - 1, filtros);
    }
  };

  const handleProximaPagina = () => {
    const totalPaginas = Math.ceil(totalAreas / areasPorPagina);
    if (paginaAtual < totalPaginas) {
      buscarAreas(paginaAtual + 1, filtros);
    }
  };

  // Função para mostrar o modal de criação
  const handleCriarArea = () => {
    setFormData({ 
      nome: '',
      id_categoria: categorias.length > 0 ? categorias[0].id_categoria || categorias[0].id : ''
    });
    setFormMode('criar');
    setShowFormModal(true);
  };

  // Função para mostrar o modal de edição
  const handleEditarArea = (area, e) => {
    e.stopPropagation();
    setFormData({ 
      id: area.id_area || area.id,
      nome: area.nome,
      id_categoria: area.id_categoria || (area.categoria ? area.categoria.id_categoria || area.categoria.id : '')
    });
    setFormMode('editar');
    setShowFormModal(true);
  };

  // Função para mostrar confirmação de exclusão
  const handleConfirmarExclusao = (area, e) => {
    e.stopPropagation();
    console.log('[DEBUG] Gerir_Area: A solicitar confirmação de exclusão para área:', area);
    setAreaParaExcluir(area);
    setShowDeleteConfirmation(true);
  };

  // Função para salvar área (criar ou editar)
  const handleSalvarArea = async () => {
    if (!formData.nome.trim()) {
      toast.error('O nome da área é obrigatório!');
      return;
    }
    
    if (!formData.id_categoria) {
      toast.error('A categoria é obrigatória!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (formMode === 'criar') {
        console.log('[DEBUG] Gerir_Area: A criar nova área:', formData);
        
        const response = await axios.post(`${API_BASE}/areas`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Area: Área criada com sucesso:', response.data);
        toast.success('Área criada com sucesso!');
      } else {
        console.log('[DEBUG] Gerir_Area: A atualizar área:', formData);
        
        const response = await axios.put(`${API_BASE}/areas/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Area: Área atualizada com sucesso:', response.data);
        toast.success('Área atualizada com sucesso!');
      }
      
      setShowFormModal(false);
      buscarAreas(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Area: Erro ao salvar área:', error);
      
      if (error.response) {
        toast.error(`Erro: ${error.response.data.message || 'Falha ao processar a requisição.'}`);
      } else {
        toast.error('Erro de conexão. Verifique sua conexão com a internet.');
      }
    }
  };

  // Função para excluir a área
  const handleExcluirArea = async () => {
    if (!areaParaExcluir) return;
    
    const areaId = areaParaExcluir.id_area || areaParaExcluir.id;
    console.log('[DEBUG] Gerir_Area: A iniciar exclusão da área:', areaId);
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/areas/${areaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Area: Área excluída com sucesso');
      toast.success('Área excluída com sucesso!');
      
      // Atualizar a lista de áreas
      buscarAreas(paginaAtual, filtros);
      
    } catch (error) {
      console.error('[DEBUG] Gerir_Area: Erro ao excluir área:', error);
      
      if (error.response) {
        if (error.response.status === 400 && error.response.data.message.includes('cursos associados')) {
          toast.error('Esta área não pode ser excluída porque possui cursos associados.');
        } else {
          toast.error(`Erro ao excluir área: ${error.response.data.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.error('Erro de conexão. Verifique sua conexão com a internet.');
      }
    } finally {
      setShowDeleteConfirmation(false);
      setAreaParaExcluir(null);
    }
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
          <h1>Áreas</h1>
          <button 
            className="criar-area-btn"
            onClick={handleCriarArea}
          >
            Criar Nova Área
          </button>
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
                  key={categoria.id_categoria || categoria.id} 
                  value={categoria.id_categoria || categoria.id}
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
            <div className="no-areas">
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
                    // Obter ID da área de maneira consistente
                    const areaId = area.id_area || area.id;
                    
                    // Obter categoria
                    const categoriaNome = area.categoria 
                      ? (typeof area.categoria === 'object' ? area.categoria.nome : area.categoria) 
                      : area.nome_categoria || "Não especificada";
                    
                    // Obter número de cursos (se disponível)
                    const numCursos = area.cursos_count || 0;
                    
                    return (
                      <tr 
                        key={areaId} 
                        className="area-row"
                      >
                        <td>{areaId}</td>
                        <td className="area-nome">{area.nome}</td>
                        <td>{categoriaNome}</td>
                        <td>{numCursos} curso{numCursos !== 1 ? 's' : ''}</td>
                        <td className="acoes">
                          <button 
                            className="btn-icon btn-editar"
                            onClick={(e) => handleEditarArea(area, e)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon btn-excluir"
                            onClick={(e) => handleConfirmarExclusao(area, e)}
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
            <h3>{formMode === 'criar' ? 'Criar Nova Área' : 'Editar Área'}</h3>
            <div className="form-group">
              <label htmlFor="area-nome">Nome da Área:</label>
              <input 
                type="text"
                id="area-nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome da área"
              />
            </div>
            <div className="form-group">
              <label htmlFor="area-categoria">Categoria:</label>
              <select
                id="area-categoria"
                value={formData.id_categoria}
                onChange={(e) => setFormData({...formData, id_categoria: e.target.value})}
              >
                <option value="">Selecione uma categoria</option>
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
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => setShowFormModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleSalvarArea}
              >
                {formMode === 'criar' ? 'Criar Área' : 'Salvar Alterações'}
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