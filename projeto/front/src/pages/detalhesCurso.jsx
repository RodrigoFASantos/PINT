import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/detalhesCurso.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConteudoCursoList from '../components/ConteudoCursoList';
import API_BASE, { IMAGES } from "../api";

const DetalhesCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Definir userRole diretamente como 'admin' para teste
  const [userRole, setUserRole] = useState('admin');
  const [inscrito, setInscrito] = useState(false);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [showInscricaoForm, setShowInscricaoForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  // Adicionar estado para controlar carregamento durante exclusão
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        setCurso(cursoData);

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

  // Abrir pop-up de confirmação de inscrição
  const handleInscricao = () => {
    console.log('Botão de inscrição clicado');
    console.log('Abrindo modal de confirmação de inscrição');
    setShowInscricaoForm(true);
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





  // Após inscrição bem-sucedida
  const handleInscricaoSuccess = () => {
    setInscrito(true);
    setShowInscricaoForm(false);
    // Exibir mensagem de sucesso temporária
    alert('Inscrição realizada com sucesso! Você receberá um email de confirmação.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
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

  // Verificar vagas disponíveis
  const vagasDisponiveis =
    curso.tipo === 'sincrono' && curso.vagas
      ? curso.vagas - (curso.inscricoesAtivas || 0)
      : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirmation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">Confirmar Exclusão</h2>
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


        <div className="flex-1 p-6 overflow-y-auto">
          <div className="curso-details-container bg-white rounded-lg shadow-md">
            {/* Cabeçalho do curso */}
            <div className="curso-header p-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className='titulo'>{curso.nome}</h1>
                  <p className="subtitulo">
                    {curso.area?.nome} {curso.area?.categoria && `> ${curso.area.categoria.nome}`}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`status-badge ${statusCurso.toLowerCase().replace(' ', '-')}`}>
                    {statusCurso}
                  </span>
                  {/* Mostrar botão de exclusão para todos no momento, já que estamos simulando admin */}
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="btn-apagar"
                    disabled={isDeleting}
                  >
                    Excluir Curso
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="curso-content p-6">
              {/* Descrição */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Descrição</h2>
                <p className="text-gray-700">{curso.descricao || 'Sem descrição disponível.'}</p>
              </div>

              {/* Detalhes do curso */}
              <div className="curso-meta mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="meta-item">
                  <span className="meta-label">Tipo:</span>
                  <span className="meta-value">{curso.tipo === 'sincrono' ? 'Síncrono (com formador)' : 'Assíncrono (auto-estudo)'}</span>
                </div>

                {curso.id_formador && curso.formador && (
                  <div className="meta-item">
                    <span className="meta-label">Formador:</span>
                    <span className="meta-value">{curso.formador.nome}</span>
                  </div>
                )}

                <div className="meta-item">
                  <span className="meta-label">Data de início:</span>
                  <span className="meta-value">{new Date(curso.data_inicio).toLocaleDateString()}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Data de término:</span>
                  <span className="meta-value">{new Date(curso.data_fim).toLocaleDateString()}</span>
                </div>

                {curso.tipo === 'sincrono' && (
                  <div className="meta-item">
                    <span className="meta-label">Vagas:</span>
                    <span className="meta-value">
                      {vagasDisponiveis !== null ? `${curso.inscricoesAtivas || 0} / ${curso.vagas}` : 'Sem limite'}
                    </span>
                  </div>
                )}

                {curso.horas_curso && (
                  <div className="meta-item">
                    <span className="meta-label">Duração:</span>
                    <span className="meta-value">{curso.horas_curso} horas</span>
                  </div>
                )}
              </div>

              {/* Botão de inscrição ou informações para alunos inscritos */}
              <div className="curso-actions mt-8">
                {/* Verificar se o curso não está terminado para mostrar o botão de inscrição */}
                {statusCurso !== "Terminado" && (
                  <div className="mb-6">
                    {inscrito ? (
                      <div className="inscrito-badge bg-green-100 text-green-800 py-2 px-4 rounded-md inline-flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="font-medium">Inscrito</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleInscricao}
                        className="btn-inscrever"
                        disabled={statusCurso === "Terminado"}
                      >
                        Inscrever
                      </button>
                    )}
                  </div>
                )}

                {/* Acesso de administrador */}
                <div className="gestor-actions mt-4">
                  <p className="text-purple-700 font-medium mb-3">
                    Acesso de administrador
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/admin/cursos/${id}/editar`)}
                      className="btn-editar"
                    >
                      Editar Curso
                    </button>

                    <button
                      onClick={() => navigate(`/admin/cursos/${id}/conteudos`)}
                      className="btn-conteudos"
                    >
                      Gerenciar Conteúdos
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
              </div>
            </div>
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