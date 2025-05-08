import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import { useAuth } from '../../contexts/AuthContext';
import './css/gerir_Cursos.css';
import Sidebar from '../../components/Sidebar';

const Gerir_Cursos = () => {
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

  // Ref para controlar debounce nos filtros
  const filterTimeoutRef = useRef(null);

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] Gerir_Cursos: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar cursos com paginação e filtros (usando useCallback)
  const buscarCursos = useCallback(async (pagina = 1, filtrosAtuais = filtros) => {
    try {
      console.log('[DEBUG] Gerir_Cursos: A iniciar busca de cursos - Página:', pagina);
      console.log('[DEBUG] Gerir_Cursos: Filtros aplicados:', filtrosAtuais);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Criar objeto de parâmetros para a requisição
      const params = {
        page: pagina,
        limit: cursosPorPagina,
      };
      
      // Adicionar filtros válidos - mapear nomes dos campos para API
      if (filtrosAtuais.nome) {
        params.search = filtrosAtuais.nome;
      }
      
      if (filtrosAtuais.idCategoria) {
        params.categoria = filtrosAtuais.idCategoria;
      }
      
      if (filtrosAtuais.idFormador) {
        params.formador = filtrosAtuais.idFormador;
      }
      
      // CORREÇÃO FILTRO DE ESTADO
      if (filtrosAtuais.estado) {
        // Log específico para debug do estado
        console.log('[DEBUG] Gerir_Cursos: Estado original do filtro:', filtrosAtuais.estado);
        
        // Mapeamento exato entre valores da interface e valores da API
        const mapeamentoEstados = {
          'Planeado': 'planeado',
          'Em curso': 'em_curso',
          'Terminado': 'terminado'
        };
        
        // Se for "Inativo", não enviamos estado, apenas ativo=false
        if (filtrosAtuais.estado === 'Inativo') {
          params.ativo = false;
          console.log('[DEBUG] Gerir_Cursos: A configurar parâmetro ativo=false');
        } 
        // Para outros estados, usar o mapeamento
        else if (mapeamentoEstados[filtrosAtuais.estado]) {
          params.estado = mapeamentoEstados[filtrosAtuais.estado];
          console.log('[DEBUG] Gerir_Cursos: Estado mapeado para API:', params.estado);
        }
      }
      
      if (filtrosAtuais.vagas) {
        // Se filtro de vagas for preenchido, enviar para o backend
        params.vagas = parseInt(filtrosAtuais.vagas, 10);
      }
      
      // Remover parâmetros vazios
      Object.keys(params).forEach(key => 
        (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]
      );
      
      console.log('[DEBUG] Gerir_Cursos: A buscar cursos com os parâmetros finais:', params);
      
      const response = await axios.get(`${API_BASE}/cursos`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Cursos: Resposta da API:', response.data);
      
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
          console.error('[DEBUG] Gerir_Cursos: Formato de resposta inesperado:', response.data);
          toast.error('Formato de dados inválido recebido do servidor.');
          setCursos([]);
          setTotalCursos(0);
        }
      } else {
        console.error('[DEBUG] Gerir_Cursos: Resposta vazia ou inválida');
        toast.error('Nenhum dado recebido do servidor.');
        setCursos([]);
        setTotalCursos(0);
      }
      
      setPaginaAtual(pagina);
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] Gerir_Cursos: Erro ao buscar cursos:', error);
      
      if (error.response) {
        console.error('[DEBUG] Gerir_Cursos: Dados do erro:', error.response.data);
        console.error('[DEBUG] Gerir_Cursos: Status:', error.response.status);
        console.error('[DEBUG] Gerir_Cursos: Headers:', error.response.headers);
        
        if (error.response.status === 401) {
          console.log('[DEBUG] Gerir_Cursos: Erro 401 - Não autorizado. A redirecionar para login...');
          toast.error('Não autorizado. Faça login novamente.');
          navigate('/login');
        } else if (error.response.status === 500) {
          toast.error('Erro no servidor. Tente novamente em alguns instantes.');
        } else {
          toast.error(`Erro ao carregar cursos: ${error.response.data.message || 'Erro desconhecido'}`);
        }
      } else if (error.request) {
        console.error('[DEBUG] Gerir_Cursos: Erro de requisição:', error.request);
        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
      } else {
        console.error('[DEBUG] Gerir_Cursos: Erro:', error.message);
        toast.error('Erro ao processar a requisição.');
      }
      
      setCursos([]);
      setTotalCursos(0);
      setLoading(false);
    }
  }, [cursosPorPagina, navigate]);

  // Buscar dados iniciais - apenas na montagem do componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DEBUG] Gerir_Cursos: ===== A INICIAR VERIFICAÇÕES DE AUTENTICAÇÃO =====');
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('[DEBUG] Gerir_Cursos: Token no localStorage:', token ? 'SIM' : 'NÃO');
        console.log('[DEBUG] Gerir_Cursos: Token value:', token ? token.substring(0, 50) + '...' : 'null');
        
        if (!token) {
          console.log('[DEBUG] Gerir_Cursos: Token não encontrado. A redirecionar para login...');
          navigate('/login');
          return;
        }
        
        // Log do usuário atual do AuthContext
        console.log('[DEBUG] Gerir_Cursos: Utilizador atual do AuthContext:', currentUser);
        
        if (currentUser) {
          console.log('[DEBUG] Gerir_Cursos: Dados do utilizador do AuthContext:', {
            id_utilizador: currentUser.id_utilizador,
            nome: currentUser.nome,
            id_cargo: currentUser.id_cargo,
            cargoTipo: typeof currentUser.id_cargo,
            email: currentUser.email,
            cargo: currentUser.cargo
          });
        }
        
        console.log('[DEBUG] Gerir_Cursos: Autenticação verificada com sucesso. A buscar dados...');
        
        // Obter categorias para o filtro
        const categoriasResponse = await axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Cursos: Categorias carregadas:', categoriasResponse.data);
        setCategorias(categoriasResponse.data);
        
        // Obter formadores para o filtro
        const formadoresResponse = await axios.get(`${API_BASE}/users/formadores`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] Gerir_Cursos: Formadores carregados:', formadoresResponse.data);
        setFormadores(formadoresResponse.data);
        
        // Obter cursos (primeira página) - com filtros vazios inicialmente
        await buscarCursos(1, filtros);
        
      } catch (error) {
        console.error('[DEBUG] Gerir_Cursos: Erro ao carregar dados:', error);
        
        // Tratamento mais específico de erros
        if (error.response) {
          console.error('[DEBUG] Gerir_Cursos: Erro da resposta:', error.response.data);
          console.error('[DEBUG] Gerir_Cursos: Status do erro:', error.response.status);
          
          if (error.response.status === 403) {
            console.log('[DEBUG] Gerir_Cursos: Erro 403 - Acesso negado. A redirecionar para página inicial...');
            toast.error('Acesso negado. Você não tem permissão para acessar esta página.');
            navigate('/');
          } else if (error.response.status === 401) {
            console.log('[DEBUG] Gerir_Cursos: Erro 401 - Não autorizado. A redirecionar para login...');
            toast.error('Não autorizado. Por favor, faça login novamente.');
            navigate('/login');
          } else {
            toast.error('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
          }
        } else {
          console.error('[DEBUG] Gerir_Cursos: Erro de conexão:', error.message);
          toast.error('Erro de conexão. Verifique sua conexão com a internet.');
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, buscarCursos, currentUser]); // Removido 'filtros' das dependências

  // Handler para mudança de filtros com debounce melhorado
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] Gerir_Cursos: Filtro alterado: ${name} = ${value}`);
    
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
      
      console.log('[DEBUG] Gerir_Cursos: Novos filtros:', novosFiltros);
      
      // Ativar o indicador de carregamento imediatamente
      setLoading(true);
      
      // Configurar novo temporizador de debounce
      filterTimeoutRef.current = setTimeout(() => {
        // Quando o temporizador disparar, usar os valores atuais dos filtros
        buscarCursos(1, novosFiltros);
      }, 600); // Aumentar ligeiramente o tempo de debounce
      
      return novosFiltros;
    });
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    console.log('[DEBUG] Gerir_Cursos: A limpar filtros');
    
    // Limpar qualquer temporizador existente
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    const filtrosLimpos = {
      nome: '',
      idCategoria: '',
      idFormador: '',
      estado: '',
      vagas: ''
    };
    
    setFiltros(filtrosLimpos);
    setPaginaAtual(1);
    
    // Buscar dados com filtros limpos
    buscarCursos(1, filtrosLimpos);
  };

  // Funções de navegação
  const handlePaginaAnterior = () => {
    console.log('[DEBUG] Gerir_Cursos: A navegar para página anterior');
    if (paginaAtual > 1) {
      buscarCursos(paginaAtual - 1, filtros);
    }
  };

  const handleProximaPagina = () => {
    console.log('[DEBUG] Gerir_Cursos: A navegar para próxima página');
    const totalPaginas = Math.ceil(totalCursos / cursosPorPagina);
    if (paginaAtual < totalPaginas) {
      buscarCursos(paginaAtual + 1, filtros);
    }
  };

  // Função para navegar para a página de detalhes do formador
  const handleVerFormador = (formadorId) => {
    console.log('[DEBUG] Gerir_Cursos: A navegar para detalhes do formador:', formadorId);
    if (formadorId) {
      navigate(`/formadores/${formadorId}`);
    }
  };

  // Função para navegar para a página de detalhes do curso
  const handleVerCurso = (cursoId) => {
    console.log('[DEBUG] Gerir_Cursos: A navegar para detalhes do curso:', cursoId);
    navigate(`/cursos/${cursoId}`);
  };

  // Função para navegar para a página de edição do curso
  const handleEditarCurso = (cursoId, e) => {
    e.stopPropagation(); // Impede que o clique propague para a linha
    console.log('[DEBUG] Gerir_Cursos: A navegar para edição do curso:', cursoId);
    navigate(`/admin/cursos/${cursoId}/editar`);
  };

  // Função para mostrar confirmação de exclusão
  const handleConfirmarExclusao = (curso, e) => {
    e.stopPropagation(); // Impede que o clique propague para a linha
    console.log('[DEBUG] Gerir_Cursos: A solicitar confirmação de exclusão para curso:', curso);
    setCursoParaExcluir(curso);
    setShowDeleteConfirmation(true);
  };

  // Função para excluir o curso
  const handleExcluirCurso = async () => {
    if (!cursoParaExcluir) return;
    
    const cursoId = cursoParaExcluir.id_curso || cursoParaExcluir.id;
    console.log('[DEBUG] Gerir_Cursos: A iniciar exclusão do curso:', cursoId);
    
    try {
      const token = localStorage.getItem('token');
      console.log(`[DEBUG] Gerir_Cursos: A enviar requisição de exclusão para curso ${cursoId}`);
      
      await axios.delete(`${API_BASE}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] Gerir_Cursos: Curso excluído com sucesso');
      toast.success('Curso excluído com sucesso!');
      
      // Atualizar a lista de cursos
      buscarCursos(paginaAtual, filtros);
      
    } catch (error) {
      console.error(`[DEBUG] Gerir_Cursos: Erro ao excluir curso ${cursoId}:`, error);
      
      if (error.response) {
        console.error('[DEBUG] Gerir_Cursos: Detalhes da resposta:', {
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
    console.log('[DEBUG] Gerir_Cursos: A navegar para criação de novo curso');
    navigate('/admin/criar-curso');
  };

  // Calcular número total de páginas
  const totalPaginas = Math.ceil(totalCursos / cursosPorPagina);

  // Formatar estado do curso para exibição
  const formatarEstado = (estado) => {
    if (!estado) return "Desconhecido";
    
    // Mapear estados do banco para exibição
    const estadosMap = {
      'planeado': 'PLANEADO',
      'em_curso': 'EM CURSO',
      'terminado': 'TERMINADO'
    };
    
    // Normalizar para minúsculas e remover espaços para comparação
    const estadoNormalizado = estado.toLowerCase().replace(/[\s_]+/g, '_');
    
    return estadosMap[estadoNormalizado] || estado.toUpperCase();
  };

  // Limpar timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Limpar qualquer temporizador pendente durante a desmontagem
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Interface de carregamento
  if (loading && cursos.length === 0) {
    return (
      <div className="gerenciar-cursos-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>A carregar cursos...</p>
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
          <h1>Cursos</h1>
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
              <option value="Planeado">Planeado</option>
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
        
        <div className="cursos-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>A carregar cursos...</p>
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
                    <th>Período</th>
                    <th>Vagas</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map(curso => {
                    // Obter ID do curso de maneira consistente
                    const cursoId = curso.id_curso || curso.id;
                    
                    // Obter nome da categoria
                    const categoriaNome = curso.categoria 
                      ? (typeof curso.categoria === 'object' ? curso.categoria.nome : curso.categoria) 
                      : curso.nome_categoria || "Não especificada";
                    
                    // Obter informações do formador
                    const formadorNome = curso.formador 
                      ? (typeof curso.formador === 'object' ? curso.formador.nome : curso.formador) 
                      : curso.nome_formador || "Curso Assíncrono";
                    
                    const formadorId = curso.formador && typeof curso.formador === 'object'
                      ? (curso.formador.id_utilizador || curso.formador.id)
                      : curso.id_formador;
                    
                    // Normalizar estado para exibição
                    let estadoExibicao = formatarEstado(curso.estado);
                    
                    // Obter classe CSS para a badge de estado
                    let estadoClass = 'desconhecido';
                    if (curso.estado) {
                      // Normalizar o estado para o formato da classe CSS
                      const estadoNormalizado = curso.estado.toLowerCase().replace(/[\s_]+/g, '-');
                      estadoClass = estadoNormalizado || 'desconhecido';
                    } 
                    
                    // Verificar se o curso está inativo
                    if (curso.ativo === false) {
                      estadoClass = 'inativo';
                      estadoExibicao = 'INATIVO';
                    }
                    
                    // Formatar datas
                    const dataInicio = curso.data_inicio || curso.dataInicio;
                    const dataFim = curso.data_fim || curso.dataFim;
                    
                    // Calcular vagas disponíveis
                    const vagasOcupadas = curso.vagas_ocupadas || curso.inscritos || 0;
                    const totalVagas = curso.vagas || curso.totalVagas || 0;
                    
                    return (
                      <tr 
                        key={cursoId} 
                        className={!curso.ativo ? 'inativo' : ''}
                        onClick={() => handleVerCurso(cursoId)}
                      >
                        <td className="curso-nome">{curso.nome || curso.titulo}</td>
                        <td>{categoriaNome}</td>
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
                          {dataInicio ? 
                            `${new Date(dataInicio).toLocaleDateString()} - 
                            ${new Date(dataFim).toLocaleDateString()}`
                            : "Datas não disponíveis"}
                        </td>

                        <td>
                          {/* Mostrar apenas o número total de vagas ou "?" se for null */}
                          {totalVagas !== null && totalVagas !== undefined 
                            ? totalVagas
                            : "?"}
                        </td>
                        
                        <td>
                          <span className={`status-badge perfil ${estadoClass}`}>
                            {estadoExibicao}
                          </span>
                        </td>

                        <td className="acoes">
                          <button 
                            className="btn-icon btn-editar"
                            onClick={(e) => handleEditarCurso(cursoId, e)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon btn-excluir"
                            onClick={(e) => handleConfirmarExclusao(curso, e)}
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

export default Gerir_Cursos;