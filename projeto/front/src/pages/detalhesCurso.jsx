import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/detalhesCurso.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CursoConteudos from '../components/CursoConteudos';
import API_BASE, { IMAGES } from "../api";
import Avaliacao_curso from '../components/Avaliacao_curso';

const DetalhesCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [inscrito, setInscrito] = useState(false);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [showInscricaoForm, setShowInscricaoForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [categoria, setCategoria] = useState(null);
  const [carregandoCategoria, setCarregandoCategoria] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDetalhes = () => setMostrarDetalhes(!mostrarDetalhes);

  // Função para buscar categoria diretamente pelo ID
  const getCategoriaById = async (categoriaId) => {
    try {
      setCarregandoCategoria(true);
      const token = localStorage.getItem('token');
      if (!token) return null;

      // Chamada direta para o endpoint de categorias para obter uma categoria específica
      const response = await fetch(`${API_BASE}/categorias/${categoriaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error(`Erro ao buscar categoria ${categoriaId}: ${response.status}`);
        return null;
      }

      const categoriaData = await response.json();
      setCategoria(categoriaData);
      return categoriaData;
    } catch (error) {
      console.error(`Erro ao buscar categoria ${categoriaId}:`, error);
      return null;
    } finally {
      setCarregandoCategoria(false);
    }
  };

  // Abrir pop-up de confirmação de inscrição
  const handleInscricao = () => {
    console.log('Botão de inscrição clicado');
    setShowInscricaoForm(true);
  };

  // Verificar se o usuário já está inscrito no curso
  const verificarInscricao = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/inscricoes/verificar/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Erro ao verificar inscrição:', response.status);
        return;
      }

      const data = await response.json();
      setInscrito(data.inscrito);

    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  }, [id]);

  // Buscar dados do curso
  const fetchCursoDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
        return;
      }

      // Obter detalhes do curso usando API_BASE
      try {
        const response = await fetch(`${API_BASE}/cursos/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const cursoData = await response.json();
        console.log('Dados do curso recebidos da API:', JSON.stringify(cursoData, null, 2));

        setCurso(cursoData);

        // Se temos id_categoria, buscar os detalhes da categoria
        if (cursoData.id_categoria) {
          getCategoriaById(cursoData.id_categoria);
        }

        // Verificar se o usuário está inscrito neste curso
        await verificarInscricao();

      } catch (cursoError) {
        console.error('Erro ao carregar curso:', cursoError);
        throw new Error('Não foi possível carregar os detalhes do curso.');
      }

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar curso:", error);
      setError("Não foi possível carregar os detalhes do curso. Tente novamente mais tarde.");
      setLoading(false);
    }
  }, [id, navigate, verificarInscricao]);

  useEffect(() => {
    fetchCursoDetails();
  }, [fetchCursoDetails]);

  // Verificar o status do curso em relação às datas
  const verificarStatusCurso = (curso) => {
    if (!curso) return 'Indisponível';

    const hoje = new Date();
    const dataInicio = new Date(curso.data_inicio);
    const dataFim = new Date(curso.data_fim);

    if (hoje >= dataInicio && hoje <= dataFim) {
      return "Em curso";
    } else if (hoje > dataFim) {
      return "Terminado";
    } else {
      return "Agendado";
    }
  };

  // Confirmar inscrição no curso
  const handleInscricaoConfirm = async () => {
    try {
      setInscrevendo(true);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
        return;
      }

      const userId = JSON.parse(atob(token.split('.')[1])).id_utilizador;

      // Verificar a conexão com o servidor antes de enviar a requisição principal
      try {
        const pingResponse = await fetch(`${API_BASE}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!pingResponse.ok) {
          throw new Error("Servidor indisponível no momento. Tente novamente mais tarde.");
        }
      } catch (pingError) {
        throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão com a internet.");
      }

      const response = await fetch(`${API_BASE}/inscricoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_utilizador: userId,
          id_curso: id
        })
      });

      if (!response.ok) {
        // Tentar obter a mensagem de erro da resposta
        let errorMessage = "Erro ao realizar inscrição";

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir extrair o JSON, usar mensagens baseadas no status HTTP
          if (response.status === 503) {
            errorMessage = "Serviço temporariamente indisponível. Tente novamente mais tarde.";
          } else if (response.status === 400) {
            errorMessage = "Não foi possível completar sua inscrição. Você pode já estar inscrito ou não há vagas disponíveis.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Você não tem permissão para se inscrever neste curso.";
          }
        }

        throw new Error(errorMessage);
      }

      // Obter a resposta da API para atualizar o número de vagas 
      const responseData = await response.json();

      // Atualizar o estado do curso com o novo número de vagas se disponível
      if (responseData.vagasRestantes !== undefined && curso) {
        setCurso(prevCurso => ({
          ...prevCurso,
          vagas: responseData.vagasRestantes
        }));
      } else {
        // Se o backend não retornar o número de vagas atualizado, recarregar os detalhes do curso
        fetchCursoDetails();
      }

      setInscrito(true);
      setShowInscricaoForm(false);
      // Exibir mensagem de sucesso temporária
      alert('Inscrição realizada com sucesso! Você receberá um email de confirmação.');

    } catch (error) {
      console.error('Erro ao realizar inscrição:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setInscrevendo(false);
    }
  };

  // Função para excluir curso
  const handleDeleteCurso = async () => {
    try {
      setIsDeleting(true); // Mostrar indicador de carregamento

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/cursos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Verificar o status da resposta
      if (!response.ok) {
        const errorData = await response.json();

        // Verificar os tipos específicos de erro
        if (response.status === 503) {
          throw new Error("Banco de dados temporariamente indisponível. Tente novamente mais tarde.");
        } else if (response.status === 403) {
          throw new Error("Você não tem permissão para excluir este curso.");
        } else if (response.status === 404) {
          throw new Error("Curso não encontrado ou já foi excluído.");
        } else {
          throw new Error(errorData.message || "Erro ao excluir curso");
        }
      }

      // Sucesso
      alert('Curso excluído com sucesso!');
      navigate('/cursos');
    } catch (err) {
      // Mostrar uma mensagem de erro mais amigável
      alert(`Erro: ${err.message}`);
      console.error("Erro ao excluir curso:", err);
    } finally {
      setIsDeleting(false); // Desativar indicador de carregamento
      setShowDeleteConfirmation(false); // Fechar o modal de confirmação
    }
  };

  const getImageUrl = (curso) => {
    // Se não tiver curso ou a imagem não estiver definida, usar imagem padrão
    if (!curso || !curso.imagem_path) return '/placeholder-curso.jpg';

    // Usar o caminho da imagem que veio do backend
    return `${API_BASE}/${curso.imagem_path}`;
  };

  if (loading) {
    return (
      <div className="main-container">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="loading-spinner"></div>
            <p className="ml-3 text-gray-600">Carregando detalhes do curso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-container">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="error-container">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => fetchCursoDetails()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => navigate('/cursos')}
                className="mt-4 ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Voltar para lista de cursos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="main-container">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="error-container">
              <p className="text-gray-600">Curso não encontrado ou indisponível.</p>
              <button
                onClick={() => navigate('/cursos')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Voltar para lista de cursos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Definir o status do curso
  const statusCurso = verificarStatusCurso(curso);

  return (
    <div className="main-container">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirmation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">Confirmar</h2>
              <p className="modal-text">
                Tem certeza que deseja excluir este curso? Esta ação irá remover o curso e todas as inscrições associadas.
              </p>
              <div className="modal-buttons">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="btn-cancelar"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteCurso}
                  className="btn-confirmar"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir Curso'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="curso-container">
            {/* Cabeçalho do curso */}
            <div
              className="curso-cabecalho"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%), url(${getImageUrl(curso)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h1 className='titulo'>{curso.nome}</h1>
                  <p className="subtitulo">
                    {curso.area?.nome} {categoria && `> ${categoria.nome}`}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`status-badge ${statusCurso.toLowerCase().replace(' ', '-')}`}>
                    {statusCurso}
                  </span>

                  {/* Botão de excluir, se usuário for admin */}
                  {userRole === 'admin' && (
                    <div className="top-right-button">
                      <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="btn-apagar"
                        disabled={isDeleting}
                      >
                        <i className='fas fa-trash'></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ícone de informação no canto inferior direito (apenas info, conteúdos já são mostrados) */}
              <div className="action-icons-container">
                <button
                  className="info-icon"
                  onClick={toggleDetalhes}
                  aria-label="Mostrar detalhes do curso"
                >
                  {mostrarDetalhes ? (
                    <i className='fas fa-times'></i>
                  ) : (
                    <i className='fas fa-info'></i>
                  )}
                </button>

                {/* Removido o botão de toggle para conteúdos */}
              </div>
            </div>

            {/* Detalhes do curso */}
            {mostrarDetalhes && (
              <div className="curso-pormenores">
                <div className="formulario-layout">
                  {/* Primeira linha */}
                  <div className="form-row">
                    <div className="form-campo formador">
                      <label>Formador</label>
                      <div className="campo-valor">
                        {curso?.formador?.nome || "Não atribuído"}
                      </div>
                    </div>
                    <div className="form-campo estado-inscricao">
                      <div
                        className={`inscricao-status ${inscrito ? 'inscrito' : 'nao-inscrito'}`}
                        onClick={!inscrito ? handleInscricao : undefined}
                      >
                        {inscrito ? "Inscrito" : "Inscrever"}
                      </div>
                    </div>
                  </div>

                  {/* Segunda linha */}
                  <div className="form-row">
                    <div className="form-campo estado">
                      <label>Estado</label>
                      <div className="campo-valor">
                        {statusCurso}
                      </div>
                    </div>
                    <div className="form-campo vagas">
                      <label>Vagas</label>
                      <div className="campo-valor">
                        {curso.tipo === 'sincrono' && curso.vagas !== null
                          ? `${curso.vagas}`
                          : 'Sem limite'}
                      </div>
                    </div>
                  </div>

                  {/* Terceira linha */}
                  <div className="form-row">
                    <div className="form-campo area">
                      <label>Área</label>
                      <div className="campo-valor">
                        {curso.area?.nome || "Não atribuída"}
                      </div>
                    </div>
                    <div className="form-campo inicio">
                      <label>Início</label>
                      <div className="campo-valor">
                        {new Date(curso.data_inicio).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="form-campo fim">
                      <label>Fim</label>
                      <div className="campo-valor">
                        {new Date(curso.data_fim).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Quarta linha */}
                  <div className="form-row">
                    <div className="form-campo tipo-curso">
                      <label>Tipo Curso</label>
                      <div className="campo-valor">
                        {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
                      </div>
                    </div>
                    <div className="form-campo categoria">
                      <label>Categoria</label>
                      <div className="campo-valor">
                        {carregandoCategoria
                          ? "Carregando..."
                          : (categoria?.nome || "Não atribuída")}
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="form-row">
                    <div className="form-campo descricao">
                      <label>Descrição</label>
                      <div className="campo-valor descricao-texto">
                        {curso.descricao || 'Sem descrição disponível.'}
                      </div>
                    </div>
                  </div>

                  {/* Botões de administrador (se o usuário for admin) */}
                  {userRole === 'admin' && (
                    <div className="admin-buttons">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate(`/admin/cursos/${id}/editar`)}
                          className="btn-editar"
                        >
                          Editar Curso
                        </button>

                        <button
                          onClick={() => navigate(`/admin/cursos/${id}/inscricoes`)}
                          className="btn-inscricoes"
                        >
                          Gerenciar Inscrições
                        </button>

                        <button
                          onClick={() => navigate(`/admin/cursos/${id}/avaliacoes`)}
                          className="btn-avaliacoes"
                        >
                          Gerenciar Avaliações
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conteúdos do curso - agora aparecem sempre, sem condição */}
            <div className="curso-conteudos-wrapper">
              <CursoConteudos cursoId={id} inscrito={inscrito} />
            </div>


            <Avaliacao_curso
              cursoId={id}
              userRole={userRole}
              formadorId={curso.id_formador}
            />


          </div>
        </div>
      </div>

      {/* Modal de confirmação de inscrição */}
      {showInscricaoForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Inscrição</h3>
            <p className="modal-text">Tem certeza que deseja se inscrever no curso "{curso.nome}"?</p>
            <div className="modal-buttons">
              <button
                onClick={() => setShowInscricaoForm(false)}
                className="btn-cancelar"
                disabled={inscrevendo}
              >
                Cancelar
              </button>
              <button
                onClick={handleInscricaoConfirm}
                className={`btn-confirmar ${inscrevendo ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={inscrevendo}
              >
                {inscrevendo ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DetalhesCurso;