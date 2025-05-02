import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/gerenciarCursos.css';
import Sidebar from '../components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../api";
import { useAuth } from '../contexts/AuthContext';

const GerenciarCursos = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [formadores, setFormadores] = useState([]);
  const [totalCursos, setTotalCursos] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [cursoParaExcluir, setCursoParaExcluir] = useState(null);
  
  // Auth context
  const { currentUser } = useAuth();
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const cursosPorPagina = 20;
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    idCategoria: '',
    idFormador: '',
    estado: '',
    vagas: ''
  });

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] GerenciarCursos: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar cursos com paginação e filtros (usando useCallback)
  const buscarCursos = useCallback(async (pagina = 1) => {
    try {
      console.log('[DEBUG] GerenciarCursos: Iniciando busca de cursos - Página:', pagina);
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('[DEBUG] GerenciarCursos: Token encontrado:', token ? 'SIM' : 'NÃO');
      
      // Criar objeto de parâmetros para a requisição
      const params = {
        page: pagina,
        limit: cursosPorPagina,
        ...filtros
      };
      
      // Fazer algumas alterações nos nomes dos parâmetros para corresponder à API
      if (params.idCategoria) {
        params.categoria = params.idCategoria;
        delete params.idCategoria;
      }
      
      if (params.idFormador) {
        params.formador = params.idFormador;
        delete params.idFormador;
      }
      
      if (params.nome) {
        params.search = params.nome;
        delete params.nome;
      }
      
      // Remover parâmetros vazios
      Object.keys(params).forEach(key => 
        (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      console.log('[DEBUG] GerenciarCursos: Buscando cursos com os parâmetros:', params);
      
      const response = await axios.get(`${API_BASE}/cursos`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] GerenciarCursos: Resposta da API:', response.data);
      
      // Verifica a estrutura dos dados recebidos
      if (response.data) {
        if (Array.isArray(response.data.cursos)) {
          setCursos(response.data.cursos);
          setTotalCursos(response.data.total || response.data.cursos.length);
        } else if (Array.isArray(response.data)) {
          // Se a resposta for um array direto
          setCursos(response.data);
          setTotalCursos(response.data.length);
        } else {
          console.error('[DEBUG] GerenciarCursos: Formato de resposta inesperado:', response.data);
          toast.error('Formato de dados inválido recebido do servidor.');
          setCursos([]);
          setTotalCursos(0);
        }
      } else {
        console.error('[DEBUG] GerenciarCursos: Resposta vazia ou inválida');
        toast.error('Nenhum dado recebido do servidor.');
        setCursos([]);
        setTotalCursos(0);
      }
      
      setPaginaAtual(pagina);
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] GerenciarCursos: Erro ao buscar cursos:', error);
      
      if (error.response) {
        console.error('[DEBUG] GerenciarCursos: Dados do erro:', error.response.data);
        console.error('[DEBUG] GerenciarCursos: Status:', error.response.status);
        console.error('[DEBUG] GerenciarCursos: Headers:', error.response.headers);
        
        if (error.response.status === 401) {
          console.log('[DEBUG] GerenciarCursos: Erro 401 - Não autorizado. Redirecionando para login...');
          toast.error('Não autorizado. Faça login novamente.');
          navigate('/login');
        } else if (error.response.status === 500) {
          toast.error('Erro no servidor. Tente novamente em alguns instantes.');
        } else {
          toast.error(`Erro ao carregar cursos: ${error.response.data.message || 'Erro desconhecido'}`);
        }
      } else if (error.request) {
        console.error('[DEBUG] GerenciarCursos: Erro de requisição:', error.request);
        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
      } else {
        console.error('[DEBUG] GerenciarCursos: Erro:', error.message);
        toast.error('Erro ao processar a requisição.');
      }
      
      setCursos([]);
      setTotalCursos(0);
      setLoading(false);
    }
  }, [filtros, cursosPorPagina, navigate]);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DEBUG] GerenciarCursos: ===== INICIANDO VERIFICAÇÕES DE AUTENTICAÇÃO =====');
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('[DEBUG] GerenciarCursos: Token no localStorage:', token ? 'SIM' : 'NÃO');
        console.log('[DEBUG] GerenciarCursos: Token value:', token ? token.substring(0, 50) + '...' : 'null');
        
        if (!token) {
          console.log('[DEBUG] GerenciarCursos: Token não encontrado. Redirecionando para login...');
          navigate('/login');
          return;
        }
        
        // Log do usuário atual do AuthContext
        console.log('[DEBUG] GerenciarCursos: Usuário atual do AuthContext:', currentUser);
        
        if (currentUser) {
          console.log('[DEBUG] GerenciarCursos: Dados do usuário do AuthContext:', {
            id_utilizador: currentUser.id_utilizador,
            nome: currentUser.nome,
            id_cargo: currentUser.id_cargo,
            cargoTipo: typeof currentUser.id_cargo,
            email: currentUser.email,
            cargo: currentUser.cargo
          });
        }
        
        console.log('[DEBUG] GerenciarCursos: Autenticação verificada com sucesso. Buscando dados...');
        
        // Obter categorias para o filtro
        const categoriasResponse = await axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] GerenciarCursos: Categorias carregadas:', categoriasResponse.data);
        setCategorias(categoriasResponse.data);
        
        // Obter formadores para o filtro
        const formadoresResponse = await axios.get(`${API_BASE}/users/formadores`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] GerenciarCursos: Formadores carregados:', formadoresResponse.data);
        setFormadores(formadoresResponse.data);
        
        // Obter cursos (primeira página)
        await buscarCursos();
        
      } catch (error) {
        console.error('[DEBUG] GerenciarCursos: Erro ao carregar dados:', error);
        
        // Tratamento mais específico de erros
        if (error.response) {
          console.error('[DEBUG] GerenciarCursos: Erro da resposta:', error.response.data);
          console.error('[DEBUG] GerenciarCursos: Status do erro:', error.response.status);
          
          if (error.response.status === 403) {
            console.log('[DEBUG] GerenciarCursos: Erro 403 - Acesso negado. Redirecionando para página inicial...');
            toast.error('Acesso negado. Você não tem permissão para acessar esta página.');
            navigate('/');
          } else if (error.response.status === 401) {
            console.log('[DEBUG] GerenciarCursos: Erro 401 - Não autorizado. Redirecionando para login...');
            toast.error('Não autorizado. Por favor, faça login novamente.');
            navigate('/login');
          } else {
            toast.error('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
          }
        } else {
          console.error('[DEBUG] GerenciarCursos: Erro de conexão:', error.message);
          toast.error('Erro de conexão. Verifique sua conexão com a internet.');
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, buscarCursos, currentUser]);

  // Handler para mudança de filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] GerenciarCursos: Filtro alterado: ${name} = ${value}`);
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para aplicar filtros
  const handleAplicarFiltros = () => {
    console.log('[DEBUG] GerenciarCursos: Aplicando filtros:', filtros);
    setPaginaAtual(1); // Volta para a primeira página ao filtrar
    buscarCursos(1);
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    console.log('[DEBUG] GerenciarCursos: Limpando filtros');
    setFiltros({
      nome: '',
      idCategoria: '',
      idFormador: '',
      estado: '',
      vagas: ''
    });
    
    setPaginaAtual(1);
    buscarCursos(1);
  };

  // Funções de navegação
  const handlePaginaAnterior = () => {
    console.log('[DEBUG] GerenciarCursos: Navegando para página anterior');
    if (paginaAtual > 1) {
      buscarCursos(paginaAtual - 1);
    }
  };

  const handleProximaPagina = () => {
    console.log('[DEBUG] GerenciarCursos: Navegando para próxima página');
    const totalPaginas = Math.ceil(totalCursos / cursosPorPagina);
    if (paginaAtual < totalPaginas) {
      buscarCursos(paginaAtual + 1);
    }
  };

  // Função para determinar o status do curso
  const getStatusCurso = (curso) => {
    // Se o curso já tiver um estado definido, usá-lo diretamente
    if (curso.estado) {
      return curso.estado;
    }
    
    const hoje = new Date();
    // Tratar diferentes formatos de data possíveis
    const dataInicio = new Date(curso.data_inicio || curso.dataInicio);
    const dataFim = new Date(curso.data_fim || curso.dataFim);

    if (!curso.ativo) return "Inativo";
    if (hoje < dataInicio) return "Agendado";
    if (hoje >= dataInicio && hoje <= dataFim) return "Em curso";
    return "Terminado";
  };

  // Função para navegar para a página de detalhes do formador
  const handleVerFormador = (formadorId) => {
    console.log('[DEBUG] GerenciarCursos: Navegando para detalhes do formador:', formadorId);
    if (formadorId) {
      navigate(`/formadores/${formadorId}`);
    }
  };

  // Função para navegar para a página de detalhes do curso
  const handleVerCurso = (cursoId) => {
    console.log('[DEBUG] GerenciarCursos: Navegando para detalhes do curso:', cursoId);
    navigate(`/cursos/${cursoId}`);
  };

  // Função para navegar para a página de edição do curso
  const handleEditarCurso = (cursoId, e) => {
    e.stopPropagation(); // Impede que o clique propague para a linha
    console.log('[DEBUG] GerenciarCursos: Navegando para edição do curso:', cursoId);
    navigate(`/admin/cursos/${cursoId}/editar`);
  };

  // Função para mostrar confirmação de exclusão
  const handleConfirmarExclusao = (curso, e) => {
    e.stopPropagation(); // Impede que o clique propague para a linha
    console.log('[DEBUG] GerenciarCursos: Solicitando confirmação de exclusão para curso:', curso);
    setCursoParaExcluir(curso);
    setShowDeleteConfirmation(true);
  };

  // Função para excluir o curso
  const handleExcluirCurso = async () => {
    if (!cursoParaExcluir) return;
    
    const cursoId = cursoParaExcluir.id || cursoParaExcluir.id_curso;
    console.log('[DEBUG] GerenciarCursos: Iniciando exclusão do curso:', cursoId);
    
    try {
      const token = localStorage.getItem('token');
      console.log(`[DEBUG] GerenciarCursos: Enviando requisição de exclusão para curso ${cursoId}`);
      
      await axios.delete(`${API_BASE}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] GerenciarCursos: Curso excluído com sucesso');
      toast.success('Curso excluído com sucesso!');
      
      // Atualizar a lista de cursos
      buscarCursos(paginaAtual);
      
    } catch (error) {
      console.error(`[DEBUG] GerenciarCursos: Erro ao excluir curso ${cursoId}:`, error);
      
      if (error.response) {
        console.error('[DEBUG] GerenciarCursos: Detalhes da resposta:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      toast.error(`Erro ao excluir curso: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
      setShowDeleteConfirmation(false);
      setCursoParaExcluir(null);
    }
  };

  // Função para criar um novo curso
  const handleCriarCurso = () => {
    console.log('[DEBUG] GerenciarCursos: Navegando para criação de novo curso');
    navigate('/admin/criar-curso');
  };

  // Calcular número total de páginas
  const totalPaginas = Math.ceil(totalCursos / cursosPorPagina);

  // Interface de carregamento
  if (loading && cursos.length === 0) {
    return (
      <div className="gerenciar-cursos-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando cursos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="gerenciar-cursos-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <div className="cursos-header">
          <h1>Gerenciar Cursos</h1>
          <button 
            className="criar-curso-btn"
            onClick={handleCriarCurso}
          >
            Criar Novo Curso
          </button>
        </div>
        
        <div className="filtros-container">
          <div className="filtro">
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
          
          <div className="filtro">
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
          
          <div className="filtro">
            <label htmlFor="estado">Estado:</label>
            <select
              id="estado"
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
            >
              <option value="">Todos</option>
              <option value="Agendado">Agendado</option>
              <option value="Em curso">Em curso</option>
              <option value="Terminado">Terminado</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          
          <div className="filtro">
            <label htmlFor="vagas">Vagas disponíveis:</label>
            <input 
              type="number"
              id="vagas"
              name="vagas"
              value={filtros.vagas}
              onChange={handleFiltroChange}
              placeholder="Mínimo de vagas"
              min="0"
            />
          </div>
          
          <div className="filtro-acoes">
            <button 
              className="btn-aplicar"
              onClick={handleAplicarFiltros}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Aplicar Filtros'}
            </button>
            
            <button 
              className="btn-limpar"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        <div className="cursos-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando cursos...</p>
            </div>
          ) : cursos.length === 0 ? (
            <div className="no-cursos">
              <p>Nenhum curso encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="cursos-table">
                <thead>
                  <tr>
                    <th>Nome do Curso</th>
                    <th>Categoria</th>
                    <th>Formador</th>
                    <th>Estado</th>
                    <th>Período</th>
                    <th>Vagas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map(curso => {
                    const status = getStatusCurso(curso);
                    
                    // Lidar com diferentes estruturas de dados possíveis
                    const formadorNome = curso.formador 
                      ? (typeof curso.formador === 'object' ? curso.formador.nome : curso.formador) 
                      : curso.nome_formador || "Curso Assíncrono";
                    
                    const formadorId = curso.formador && typeof curso.formador === 'object'
                      ? (curso.formador.id_utilizador || curso.formador.id)
                      : curso.id_formador;
                    
                    const cursoId = curso.id || curso.id_curso;
                    
                    return (
                      <tr 
                        key={cursoId} 
                        className={!curso.ativo ? 'inativo' : ''}
                        onClick={() => handleVerCurso(cursoId)}
                      >
                        <td className="curso-nome">{curso.nome || curso.titulo}</td>
                        <td>{curso.categoria?.nome || curso.nome_categoria || "Não especificada"}</td>
                        <td 
                          className={formadorId ? "formador-cell" : ""}
                          onClick={e => {
                            e.stopPropagation();
                            if (formadorId) handleVerFormador(formadorId);
                          }}
                        >
                          {formadorNome}
                        </td>
                        <td>
                          <span className={`status-badge ${status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          {(curso.data_inicio || curso.dataInicio) ? 
                            `${new Date(curso.data_inicio || curso.dataInicio).toLocaleDateString()} - 
                            ${new Date(curso.data_fim || curso.dataFim).toLocaleDateString()}`
                            : "Datas não disponíveis"}
                        </td>
                        <td>
                          {status !== "Terminado" && curso.tipo === "sincrono" ? (
                            `${curso.vagas_ocupadas || curso.inscritos || 0} / ${curso.vagas || curso.totalVagas || 0}`
                          ) : (
                            status !== "Terminado" && curso.tipo !== "sincrono" ? (
                              curso.inscritos || 0
                            ) : (
                              "N/A"
                            )
                          )}
                        </td>
                        <td className="acoes">
                          <button 
                            className="btn-editar"
                            onClick={(e) => handleEditarCurso(cursoId, e)}
                          >
                            Editar
                          </button>
                          <button 
                            className="btn-excluir"
                            onClick={(e) => handleConfirmarExclusao(curso, e)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {totalPaginas > 1 && (
                <div className="paginacao">
                  <button 
                    onClick={handlePaginaAnterior} 
                    disabled={paginaAtual === 1 || loading}
                    className="btn-pagina"
                  >
                    Anterior
                  </button>
                  
                  <span className="pagina-atual">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  
                  <button 
                    onClick={handleProximaPagina}
                    disabled={paginaAtual === totalPaginas || loading}
                    className="btn-pagina"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja excluir o curso "{cursoParaExcluir?.nome || cursoParaExcluir?.titulo}"?
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
                onClick={handleExcluirCurso}
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

export default GerenciarCursos;