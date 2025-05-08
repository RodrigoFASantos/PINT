import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import API_BASE from '../../api';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../components/Sidebar';
import './css/gerir_Utilizadores.css';

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

  // Toggle para a sidebar
  const toggleSidebar = () => {
    console.log('[DEBUG] GerenciarUtilizadores: Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Função para buscar utilizadores com paginação e filtros (usando useCallback)
  const buscarUtilizadores = useCallback(async (pagina = 1) => {
    try {
      console.log('[DEBUG] GerenciarUtilizadores: Iniciando busca de utilizadores - Página:', pagina);
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

      // Atualizar com filtros aplicados
      setTotalUtilizadores(utilizadoresFiltrados.length);
      setLoading(false);

    } catch (error) {
      console.error('[DEBUG] GerenciarUtilizadores: Erro ao buscar utilizadores:', error);
      setTotalUtilizadores(0);
      setLoading(false);
    }
  }, [filtros, utilizadores]);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
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
        console.error('[DEBUG] GerenciarUtilizadores: Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // Handler para mudança de filtros - atualizado para filtrar em tempo real
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

    setTotalUtilizadores(filtrado.length);
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    setFiltros({
      nome: '',
      perfil: '',
      email: ''
    });
    setTotalUtilizadores(utilizadores.length);
  };

  // Função para determinar o nome do cargo
  const getNomeCargo = (idCargo) => {
    switch (parseInt(idCargo)) {
      case 1: return 'Gestor';
      case 2: return 'Formador';
      case 3: return 'Formando';
      default: return 'Desconhecido';
    }
  };

  // Função para navegar para o perfil do utilizador
  const handleVerPerfil = (utilizadorId) => {
    navigate(`/admin/users/${utilizadorId}`);
  };

  // Função para editar utilizador (navegar para página de edição)
  const handleEditarUtilizador = (utilizadorId) => {
    console.log("[DEBUG] ID do utilizador para editar:", utilizadorId);
    console.log("[DEBUG] Navegando para:", `/admin/users/${utilizadorId}/editar`);
    navigate(`/admin/users/${utilizadorId}/editar`);
  };

  // Função para mostrar confirmação de exclusão
  const handleConfirmarExclusao = (utilizador, e) => {
    e.stopPropagation();
    setUtilizadorParaExcluir(utilizador);
    setShowDeleteConfirmation(true);
  };

  // Função para excluir o utilizador
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
      console.error('Erro ao excluir utilizador:', error);

      if (error.response?.status === 400) {
        const data = error.response.data;

        // Formador com cursos ativos - mostrar modal
        if (data.tipo === "formador_com_cursos") {
          setFormadorComCursos(utilizadorParaExcluir);
          setCursosFormador(data.cursos);
          setShowCursosModal(true);
          setShowDeleteConfirmation(false);
          shouldCloseModal = false;
        }
        // Utilizador com inscrições
        else if (data.tipo === "utilizador_com_inscricoes") {
          toast.error(`${data.message}. Total de inscrições: ${data.inscricoes}`);
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

  // Função para criar um novo utilizador
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

  // Paginação
  const indexOfLastUser = paginaAtual * utilizadoresPorPagina;
  const indexOfFirstUser = indexOfLastUser - utilizadoresPorPagina;
  const utilizadoresAtuais = utilizadoresFiltrados.slice(indexOfFirstUser, indexOfLastUser);
  const totalPaginas = Math.ceil(utilizadoresFiltrados.length / utilizadoresPorPagina);

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
      <div className="gerenciar-usuarios-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>A carregar utilizadores...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="gerenciar-usuarios-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content">
        <div className="usuarios-header">
          <h1>Utilizadores</h1>
          <button
            className="criar-usuario-btn"
            onClick={handleCriarUtilizador}
          >
            Criar Novo Utilizador
          </button>
        </div>

        <div className="filtros-container">
          <div className="filtro">
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

          <div className="filtro">
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

          <div className="filtro">
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

        <div className="usuarios-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>A carregar utilizadores...</p>
            </div>
          ) : utilizadoresAtuais.length === 0 ? (
            <div className="no-usuarios">
              <p>Nenhum utilizador encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Telefone</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {utilizadoresAtuais.map(utilizador => (
                    <tr
                      key={utilizador.id_utilizador}
                      className={utilizador.ativo !== 1 ? 'inativo' : ''}
                    >
                      <td
                        className="usuario-nome clickable"
                        onClick={() => handleVerPerfil(utilizador.id_utilizador)}
                        style={{ cursor: 'pointer', color: '#3b82f6' }}
                      >
                        {utilizador.nome}
                      </td>
                      <td
                        className="usuario-email clickable"
                        onClick={() => handleVerPerfil(utilizador.id_utilizador)}
                        style={{ cursor: 'pointer', color: '#3b82f6' }}
                      >
                        {utilizador.email}
                      </td>
                      <td>
                        <span className={`status-badge perfil perfil-${getNomeCargo(utilizador.id_cargo).toLowerCase()}`}>
                          {getNomeCargo(utilizador.id_cargo)}
                        </span>
                      </td>
                      <td>{utilizador.telefone || 'N/A'}</td>
                      <td className="acoes">
                        <button
                          className="btn-icon btn-editar"
                          onClick={() => {
                            console.log("[DEBUG] Clicando para editar utilizador:", utilizador.id_utilizador);
                            console.log("[DEBUG] Dados do utilizador:", utilizador);
                            handleEditarUtilizador(utilizador.id_utilizador);
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          className="btn-icon btn-excluir"
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
                  {paginaAtual}/{totalPaginas > 0 ? totalPaginas : 1}
                </span>

                <button
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas || totalPaginas <= 1 || loading}
                  className="btn-pagina"
                  aria-label="Próxima página"
                >
                  <span className="pagination-icon">&#10095;</span>
                </button>
              </div>
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
              Tem certeza que deseja excluir o utilizador "{utilizadorParaExcluir?.nome}"?
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
                onClick={handleExcluirUtilizador}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Novo Modal de cursos do formador */}
      {showCursosModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-cursos">
            <h3>Cursos Ativos do Formador</h3>
            <p>
              O formador "{formadorComCursos?.nome}" não pode ser eliminado pois leciona os seguintes cursos ativos:
            </p>

            <div className="cursos-list">
              {cursosFormador.map((curso, index) => (
                <div key={curso.id} className="curso-item">
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

            <div className="modal-actions">
              <button
                className="btn-cancelar"
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