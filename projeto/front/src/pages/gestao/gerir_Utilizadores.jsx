import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import API_BASE from '../../api';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../components/Sidebar';
import './css/gerir_Utilizadores.css';

/**
 * Componente para gestão de utilizadores do sistema
 * 
 * Permite aos administradores:
 * - Visualizar todos os utilizadores do sistema
 * - Criar novos utilizadores
 * - Editar utilizadores existentes
 * - Eliminar utilizadores (com validações específicas)
 * - Filtrar utilizadores por múltiplos critérios
 * - Ordenar a tabela por diferentes campos
 * - Navegar entre páginas
 * 
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
const GerenciarUtilizadores = () => {
  const navigate = useNavigate();
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [utilizadorParaExcluir, setUtilizadorParaExcluir] = useState(null);
  const [showCursosModal, setShowCursosModal] = useState(false);
  const [cursosFormador, setCursosFormador] = useState([]);
  const [formadorComCursos, setFormadorComCursos] = useState(null);

  // Auth context
  const { currentUser } = useAuth();

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalUtilizadores, setTotalUtilizadores] = useState(0);
  const utilizadoresPorPagina = 20;

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    perfil: '',
    email: ''
  });

  // Estados para ordenação
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });

  /**
   * Toggle para a sidebar
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Função para ordenar os utilizadores
   */
  const ordenarUtilizadores = (utilizadores, campo, direcao) => {
    return [...utilizadores].sort((a, b) => {
      let valorA, valorB;
      
      switch (campo) {
        case 'nome':
          valorA = a.nome || '';
          valorB = b.nome || '';
          break;
        case 'email':
          valorA = a.email || '';
          valorB = b.email || '';
          break;
        case 'perfil':
          valorA = getNomeCargo(a.id_cargo);
          valorB = getNomeCargo(b.id_cargo);
          break;
        case 'telefone':
          valorA = a.telefone || '';
          valorB = b.telefone || '';
          break;
        default:
          return 0;
      }
      
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }
      
      if (direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  };

  /**
   * Handler para ordenação da tabela
   */
  const handleOrdenacao = (campo) => {
    const novaOrdenacao = {
      campo,
      direcao: ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc'
    };
    
    setOrdenacao(novaOrdenacao);
    
    // Reordenar utilizadores atuais filtrados
    const utilizadoresFiltradosOrdenados = ordenarUtilizadores(utilizadoresFiltrados, novaOrdenacao.campo, novaOrdenacao.direcao);
    // Nota: Como utilizamos uma variável calculada para utilizadoresFiltrados, 
    // o re-render automático irá aplicar a ordenação
  };

  /**
   * Função para buscar utilizadores com paginação e filtros
   */
  const buscarUtilizadores = useCallback(async (pagina = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Aplicar filtros localmente
      let utilizadoresFiltrados = [...utilizadores];

      if (filtros.nome) {
        utilizadoresFiltrados = utilizadoresFiltrados.filter(u =>
          u.nome?.toLowerCase().includes(filtros.nome.toLowerCase())
        );
      }

      if (filtros.email) {
        utilizadoresFiltrados = utilizadoresFiltrados.filter(u =>
          u.email?.toLowerCase().includes(filtros.email.toLowerCase())
        );
      }

      if (filtros.perfil) {
        utilizadoresFiltrados = utilizadoresFiltrados.filter(u =>
          u.id_cargo === parseInt(filtros.perfil)
        );
      }

      // Se for a primeira vez ou não há utilizadores carregados, buscar do servidor
      if (utilizadores.length === 0 ||
        (filtros.nome === '' && filtros.email === '' && filtros.perfil === '')) {
        const response = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (Array.isArray(response.data)) {
          setUtilizadores(response.data);
          utilizadoresFiltrados = response.data;
        }
      }

      // Aplicar ordenação se definida
      if (ordenacao.campo) {
        utilizadoresFiltrados = ordenarUtilizadores(utilizadoresFiltrados, ordenacao.campo, ordenacao.direcao);
      }

      // Atualizar com filtros aplicados
      setTotalUtilizadores(utilizadoresFiltrados.length);
      setLoading(false);

    } catch (error) {
      setTotalUtilizadores(0);
      setLoading(false);
    }
  }, [filtros, utilizadores, ordenacao]);

  /**
   * Buscar dados iniciais
   */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Verificar permissões de acesso
        if (currentUser && currentUser.id_cargo !== 1) {
          toast.error('Acesso negado. Não tens permissão para aceder a esta página.');
          navigate('/');
          return;
        }

        const response = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (Array.isArray(response.data)) {
          setUtilizadores(response.data);
          setTotalUtilizadores(response.data.length);
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, currentUser]);

  /**
   * Handler para mudança de filtros para filtrar em tempo real
   */
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));

    // Aplicar filtros imediatamente
    let filtrado = [...utilizadores];

    const novosFiltros = { ...filtros, [name]: value };

    if (novosFiltros.nome) {
      filtrado = filtrado.filter(u =>
        u.nome?.toLowerCase().includes(novosFiltros.nome.toLowerCase())
      );
    }

    if (novosFiltros.email) {
      filtrado = filtrado.filter(u =>
        u.email?.toLowerCase().includes(novosFiltros.email.toLowerCase())
      );
    }

    if (novosFiltros.perfil) {
      filtrado = filtrado.filter(u =>
        u.id_cargo === parseInt(novosFiltros.perfil)
      );
    }

    // Aplicar ordenação se definida
    if (ordenacao.campo) {
      filtrado = ordenarUtilizadores(filtrado, ordenacao.campo, ordenacao.direcao);
    }

    setTotalUtilizadores(filtrado.length);
  };

  /**
   * Handler para limpar filtros
   */
  const handleLimparFiltros = () => {
    setFiltros({
      nome: '',
      perfil: '',
      email: ''
    });
    setTotalUtilizadores(utilizadores.length);
  };

  /**
   * Função para determinar o nome do cargo
   */
  const getNomeCargo = (idCargo) => {
    switch (parseInt(idCargo)) {
      case 1: return 'Gestor';
      case 2: return 'Formador';
      case 3: return 'Formando';
      default: return 'Desconhecido';
    }
  };

  /**
   * Função para navegar para o perfil do utilizador
   */
  const handleVerPerfil = (utilizadorId) => {
    navigate(`/admin/users/${utilizadorId}`);
  };

  /**
   * Função para editar utilizador (navegar para página de edição)
   */
  const handleEditarUtilizador = (utilizadorId) => {
    navigate(`/admin/users/${utilizadorId}/editar`);
  };

  /**
   * Função para mostrar confirmação de exclusão
   */
  const handleConfirmarExclusao = (utilizador, e) => {
    e.stopPropagation();
    setUtilizadorParaExcluir(utilizador);
    setShowDeleteConfirmation(true);
  };

  /**
   * Função para excluir o utilizador
   */
  const handleExcluirUtilizador = async () => {
    if (!utilizadorParaExcluir) return;

    const utilizadorId = utilizadorParaExcluir.id_utilizador;
    let shouldCloseModal = true;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/users/${utilizadorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remover da lista local
      const novaLista = utilizadores.filter(u => u.id_utilizador !== utilizadorId);
      setUtilizadores(novaLista);
      setTotalUtilizadores(novaLista.length);
      toast.success('Utilizador excluído com sucesso!');

    } catch (error) {
      if (error.response?.status === 400) {
        const data = error.response.data;

        // Apenas formador com cursos ativos - mostrar modal
        if (data.tipo === "formador_com_cursos") {
          setFormadorComCursos(utilizadorParaExcluir);
          setCursosFormador(data.cursos);
          setShowCursosModal(true);
          setShowDeleteConfirmation(false);
          shouldCloseModal = false;
        }
        // Qualquer outra mensagem de erro 400
        else {
          toast.error(data.message);
        }
      } else {
        toast.error('Erro ao excluir utilizador: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      if (shouldCloseModal) {
        setShowDeleteConfirmation(false);
        setUtilizadorParaExcluir(null);
      }
    }
  };

  /**
   * Função para criar um novo utilizador
   */
  const handleCriarUtilizador = () => {
    navigate('/admin/criar-usuario');
  };

  // Aplicar filtros aos utilizadores
  const utilizadoresFiltrados = utilizadores.filter(utilizador => {
    const nomeMatch = !filtros.nome || utilizador.nome?.toLowerCase().includes(filtros.nome.toLowerCase());
    const emailMatch = !filtros.email || utilizador.email?.toLowerCase().includes(filtros.email.toLowerCase());
    const perfilMatch = !filtros.perfil || utilizador.id_cargo === parseInt(filtros.perfil);

    return nomeMatch && emailMatch && perfilMatch;
  });

  // Aplicar ordenação aos utilizadores filtrados
  const utilizadoresOrdenados = ordenacao.campo 
    ? ordenarUtilizadores(utilizadoresFiltrados, ordenacao.campo, ordenacao.direcao)
    : utilizadoresFiltrados;

  // Paginação
  const indexOfLastUser = paginaAtual * utilizadoresPorPagina;
  const indexOfFirstUser = indexOfLastUser - utilizadoresPorPagina;
  const utilizadoresAtuais = utilizadoresOrdenados.slice(indexOfFirstUser, indexOfLastUser);
  const totalPaginas = Math.ceil(utilizadoresOrdenados.length / utilizadoresPorPagina);

  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  // Interface de carregamento
  if (loading && utilizadores.length === 0) {
    return (
      <div className="gerenciar-usuarios-container-gerir-utilizadores">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content-gerir-utilizadores">
          <div className="loading-container-gerir-utilizadores">
            <div className="loading-spinner-gerir-utilizadores"></div>
            <p>A carregar utilizadores...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="gerenciar-usuarios-container-gerir-utilizadores">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content-gerir-utilizadores">
        <div className="usuarios-header-gerir-utilizadores">
          <h1>
            Gestão de Utilizadores
            <span className="total-count-gerir-utilizadores">({utilizadoresOrdenados.length})</span>
          </h1>
          <button
            className="criar-usuario-btn-gerir-utilizadores"
            onClick={handleCriarUtilizador}
          >
            Criar Novo Utilizador
          </button>
        </div>

        <div className="filtros-container-gerir-utilizadores">
          <div className="filtros-principais-gerir-utilizadores">
            <div className="filtro-gerir-utilizadores">
              <label htmlFor="nome">Nome:</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Filtrar por nome"
              />
            </div>

            <div className="filtro-gerir-utilizadores">
              <label htmlFor="email">Email:</label>
              <input
                type="text"
                id="email"
                name="email"
                value={filtros.email}
                onChange={handleFiltroChange}
                placeholder="Filtrar por email"
              />
            </div>

            <div className="filtro-gerir-utilizadores">
              <label htmlFor="perfil">Perfil:</label>
              <select
                id="perfil"
                name="perfil"
                value={filtros.perfil}
                onChange={handleFiltroChange}
              >
                <option value="">Todos os perfis</option>
                <option value="1">Gestor</option>
                <option value="2">Formador</option>
                <option value="3">Formando</option>
              </select>
            </div>
          </div>

          <div className="filtro-acoes-gerir-utilizadores">
            <button
              className="btn-limpar-gerir-utilizadores"
              onClick={handleLimparFiltros}
              disabled={loading}
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="usuarios-table-container-gerir-utilizadores">
          {loading ? (
            <div className="loading-container-gerir-utilizadores">
              <div className="loading-spinner-gerir-utilizadores"></div>
              <p>A carregar utilizadores...</p>
            </div>
          ) : utilizadoresAtuais.length === 0 ? (
            <div className="no-items-gerir-utilizadores">
              <p>Nenhum utilizador encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="usuarios-table-gerir-utilizadores">
                <thead>
                  <tr>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('nome')}
                    >
                      Nome
                      <span className="sort-icon">
                        {ordenacao.campo === 'nome' ? (
                          ordenacao.direcao === 'asc' ? '▲' : '▼'
                        ) : ''}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('email')}
                    >
                      Email
                      <span className="sort-icon">
                        {ordenacao.campo === 'email' ? (
                          ordenacao.direcao === 'asc' ? '▲' : '▼'
                        ) : ''}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('perfil')}
                    >
                      Perfil
                      <span className="sort-icon">
                        {ordenacao.campo === 'perfil' ? (
                          ordenacao.direcao === 'asc' ? '▲' : '▼'
                        ) : ''}
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleOrdenacao('telefone')}
                    >
                      Telefone
                      <span className="sort-icon">
                        {ordenacao.campo === 'telefone' ? (
                          ordenacao.direcao === 'asc' ? '▲' : '▼'
                        ) : ''}
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {utilizadoresAtuais.map(utilizador => (
                    <tr
                      key={utilizador.id_utilizador}
                      className={utilizador.ativo !== 1 ? 'inativo' : ''}
                    >
                      <td
                        className="usuario-nome-gerir-utilizadores overflow-cell clickable"
                        onClick={() => handleVerPerfil(utilizador.id_utilizador)}
                      >
                        <div className="cell-content">
                          {utilizador.nome}
                        </div>
                      </td>
                      <td
                        className="usuario-email-gerir-utilizadores overflow-cell clickable"
                        onClick={() => handleVerPerfil(utilizador.id_utilizador)}
                      >
                        <div className="cell-content">
                          {utilizador.email}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge perfil perfil-${getNomeCargo(utilizador.id_cargo).toLowerCase()}`}>
                          {getNomeCargo(utilizador.id_cargo)}
                        </span>
                      </td>
                      <td className="telefone-cell-gerir-utilizadores overflow-cell">
                        <div className="cell-content">
                          {utilizador.telefone || 'N/A'}
                        </div>
                      </td>
                      <td className="acoes-gerir-utilizadores">
                        <button
                          className="btn-icon-gerir-utilizadores btn-editar-gerir-utilizadores"
                          onClick={() => handleEditarUtilizador(utilizador.id_utilizador)}
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          className="btn-icon-gerir-utilizadores btn-excluir-gerir-utilizadores"
                          onClick={(e) => handleConfirmarExclusao(utilizador, e)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sempre mostrar a paginação, independente do número de páginas */}
              <div className="paginacao-gerir-utilizadores">
                <button
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1 || loading}
                  className="btn-pagina-gerir-utilizadores btn-anterior-gerir-utilizadores"
                  aria-label="Página anterior"
                >
                  <span className="pagination-icon-gerir-utilizadores">&#8249;</span>
                  <span className="btn-text-gerir-utilizadores">Anterior</span>
                </button>

                <div className="pagina-info-gerir-utilizadores">
                  <span className="pagina-atual-gerir-utilizadores">
                    {loading ? 'A carregar...' : `Página ${paginaAtual} de ${totalPaginas > 0 ? totalPaginas : 1}`}
                  </span>
                </div>

                <button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas || totalPaginas <= 1 || loading}
                  className="btn-pagina-gerir-utilizadores btn-seguinte-gerir-utilizadores"
                  aria-label="Próxima página"
                >
                  <span className="btn-text-gerir-utilizadores">Seguinte</span>
                  <span className="pagination-icon-gerir-utilizadores">&#8250;</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirmation && (
        <div className="modal-overlay-gerir-utilizadores">
          <div className="modal-content-gerir-utilizadores">
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja excluir o utilizador "{utilizadorParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions-gerir-utilizadores">
              <button
                className="btn-cancelar-gerir-utilizadores"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-gerir-utilizadores"
                onClick={handleExcluirUtilizador}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cursos do formador */}
      {showCursosModal && (
        <div className="modal-overlay-gerir-utilizadores">
          <div className="modal-content-gerir-utilizadores modal-cursos-gerir-utilizadores">
            <h3>Cursos Ativos do Formador</h3>
            <p>
              O formador "{formadorComCursos?.nome}" não pode ser eliminado pois leciona os seguintes cursos ativos:
            </p>

            <div className="cursos-list-gerir-utilizadores">
              {cursosFormador.map((curso, index) => (
                <div key={curso.id} className="curso-item-gerir-utilizadores">
                  <h4>{curso.nome}</h4>
                  <p className="curso-descricao">{curso.descricao}</p>
                  {curso.data_inicio && (
                    <p className="curso-dates">
                      Início: {new Date(curso.data_inicio).toLocaleDateString('pt-BR')}
                      {curso.data_fim && ` | Fim: ${new Date(curso.data_fim).toLocaleDateString('pt-BR')}`}
                    </p>
                  )}
                  <span className={`badge-status ${curso.status.toLowerCase()}`}>
                    {curso.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="modal-actions-gerir-utilizadores">
              <button
                className="btn-cancelar-gerir-utilizadores"
                onClick={() => {
                  setShowCursosModal(false);
                  setFormadorComCursos(null);
                  setCursosFormador([]);
                  setUtilizadorParaExcluir(null);
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default GerenciarUtilizadores;