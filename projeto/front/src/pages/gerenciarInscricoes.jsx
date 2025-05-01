import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/gerenciarInscricoes.css';
import Sidebar from '../components/Sidebar';
import API_BASE from "../api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GerenciarInscricoes = () => {
  const { id } = useParams(); // id do curso
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedInscricao, setSelectedInscricao] = useState(null);
  const [removendo, setRemovendo] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [motivoError, setMotivoError] = useState('');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Buscar dados do curso e inscrições
  // Modificação na função fetchData para corrigir o problema de obtenção de informações do usuário

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar token
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Sessão expirada. Por favor, faça login novamente.");
        navigate('/login');
        return;
      }

      // Obter informações do usuário diretamente do token JWT
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo(tokenPayload);

        // Log para debug
        console.log("Informações do usuário extraídas do token:", tokenPayload);
      } catch (parseError) {
        console.error("Erro ao analisar token:", parseError);
        setError("Erro ao processar token de autenticação. Por favor, faça login novamente.");
        navigate('/login');
        return;
      }

      // Obter detalhes do curso com tratamento de erros melhorado
      try {
        console.log(`Buscando dados do curso ${id}...`);
        const responseCurso = await fetch(`${API_BASE}/cursos/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!responseCurso.ok) {
          throw new Error(`Erro ao carregar curso: ${responseCurso.status}`);
        }

        const cursoData = await responseCurso.json();
        console.log("Dados do curso obtidos:", cursoData);
        setCurso(cursoData);
      } catch (cursoError) {
        console.error("Erro ao carregar curso:", cursoError);
        setError(`Erro ao carregar informações do curso: ${cursoError.message}`);
        setLoading(false);
        return;
      }

      // Obter inscrições do curso com tratamento de erros melhorado
      try {
        console.log(`Buscando inscrições do curso ${id}...`);
        const responseInscricoes = await fetch(`${API_BASE}/inscricoes/curso/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!responseInscricoes.ok) {
          throw new Error(`Erro ao carregar inscrições: ${responseInscricoes.status}`);
        }

        const inscricoesData = await responseInscricoes.json();
        console.log(`Obtidas ${inscricoesData.length} inscrições`);

        // Filtrar apenas inscrições ativas
        const inscricoesAtivas = inscricoesData.filter(inscricao =>
          inscricao.estado === 'inscrito'
        );

        setInscricoes(inscricoesAtivas);
      } catch (inscricoesError) {
        console.error("Erro ao carregar inscrições:", inscricoesError);
        setError(`Erro ao carregar inscrições: ${inscricoesError.message}`);
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError(error.message || "Não foi possível carregar os dados. Tente novamente mais tarde.");
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Verificar permissões
  useEffect(() => {
    if (curso && userInfo) {
      const isAdmin = userInfo.id_cargo === 1;
      const isFormadorDoCurso = userInfo.id_cargo === 2 && userInfo.id_utilizador === curso.id_formador;

      if (!isAdmin && !isFormadorDoCurso) {
        setError("Você não tem permissão para gerenciar inscrições neste curso.");
      }
    }
  }, [curso, userInfo]);

  // Função para abrir modal de confirmação de cancelamento de inscrição
  const handleCancelarInscricao = (inscricao) => {
    setSelectedInscricao(inscricao);
    setMotivoCancelamento(''); // Limpar o motivo ao abrir o modal
    setMotivoError(''); // Limpar mensagens de erro
    setShowConfirmation(true);
  };

  // Função para confirmar o cancelamento da inscrição
  const confirmCancelarInscricao = async () => {
    if (!selectedInscricao) return;
    
    // Validar se o motivo foi fornecido
    if (!motivoCancelamento.trim()) {
      setMotivoError('Por favor, informe o motivo do cancelamento.');
      return;
    }

    try {
      setRemovendo(true);
      setMotivoError(''); // Limpar mensagem de erro
      const token = localStorage.getItem('token');

      // Modificado para usar o endpoint correto conforme definido no backend
      const response = await fetch(`${API_BASE}/inscricoes/cancelar-inscricao/${selectedInscricao.id_inscricao}`, {
        method: 'PATCH', // Alterado de DELETE para PATCH para corresponder à rota
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motivo_cancelamento: motivoCancelamento // Usando o motivo fornecido pelo usuário
        })
      });

      // Processar resposta
      let responseData = {};
      try {
        responseData = await response.json();
      } catch (e) {
        console.warn('Resposta não contém JSON válido:', e);
      }

      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.message || 'Erro ao cancelar inscrição';
        throw new Error(errorMessage);
      }

      // Atualizar a lista de inscrições após o cancelamento bem-sucedido
      setInscricoes(prevInscricoes =>
        prevInscricoes.filter(insc => insc.id_inscricao !== selectedInscricao.id_inscricao)
      );

      toast.success('Inscrição cancelada com sucesso!');

    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);

      if (error.message.includes('temporariamente indisponível') ||
        error.message.includes('banco de dados')) {
        toast.error('O serviço está temporariamente indisponível. Por favor, tente novamente mais tarde.');
      } else {
        toast.error(`Erro ao cancelar inscrição: ${error.message}`);
      }

    } finally {
      setShowConfirmation(false);
      setSelectedInscricao(null);
      setRemovendo(false);
      setMotivoCancelamento('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="loading-spinner"></div>
            <p className="ml-3 text-gray-600">Carregando inscrições...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="error-container">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => navigate(`/cursos/${id}`)}
                className="mt-4 ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Voltar para o curso
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se o usuário atual tem permissão para alterar o formador
  // Somente administradores (cargo 1) podem alterar formador
  const podeAlterarFormador = userInfo && (userInfo.id_cargo === 1 || (userInfo.id_cargo === 2 && userInfo.id_utilizador === curso?.id_formador));


  console.log("User Info:", userInfo);
  console.log("Curso:", curso);
  console.log("Permissão para alterar:", podeAlterarFormador);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="gerenciar-inscricoes-container bg-white rounded-lg shadow-md">
            {/* Cabeçalho */}
            <div className="header p-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Gerenciar Inscrições</h1>
                  <p className="mt-1">{curso?.nome}</p>
                </div>
                <button
                  onClick={() => navigate(`/cursos/${id}`)}
                  className="px-4 py-2 bg-white text-blue-700 rounded hover:bg-gray-100 transition-colors"
                >
                  Voltar ao Curso
                </button>
              </div>
            </div>

            {/* Seção do formador */}
            <div className="formador-section p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Formador</h2>
                  {curso?.formador ? (
                    <div className="formador-info">
                      <p className="text-gray-700">
                        <span className="font-medium">Nome:</span> {curso.formador.nome}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span> {curso.formador.email}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nenhum formador atribuído</p>
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo das inscrições */}
            <div className="content p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Alunos Inscritos ({inscricoes.length})</h2>
                {curso?.tipo === 'sincrono' && (
                  <p className="text-gray-600">
                    Vagas ocupadas: {inscricoes.length} / {curso.vagas || 'Ilimitado'}
                  </p>
                )}
              </div>

              {inscricoes.length === 0 ? (
                <div className="empty-state p-10 text-center border border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">Não há inscrições neste curso.</p>
                  <p className="text-sm text-gray-400">
                    Quando houver alunos inscritos, eles aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="inscricoes-table w-full">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Data de Inscrição</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscricoes.map(inscricao => (
                        <tr key={inscricao.id_inscricao}>
                          <td>{inscricao.utilizador?.nome || 'Nome indisponível'}</td>
                          <td>{inscricao.utilizador?.email || 'Email indisponível'}</td>
                          <td>
                            {new Date(inscricao.data_inscricao).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              onClick={() => handleCancelarInscricao(inscricao)}
                              className="btn-remover-inscricao"
                              title="Remover inscrição"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de cancelamento */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Cancelamento</h3>
            <p className="modal-text">
              Tem certeza que deseja cancelar a inscrição de
              <strong> {selectedInscricao?.utilizador?.nome || 'este aluno'}</strong>
              no curso?
            </p>
            
            {/* Novo campo para motivo do cancelamento */}
            <div className="form-group mt-4">
              <label htmlFor="motivoCancelamento" className="font-medium text-gray-700 block mb-2">
                Motivo do Cancelamento *
              </label>
              <textarea
                id="motivoCancelamento"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                className={`w-full border ${motivoError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows="3"
                placeholder="Informe o motivo do cancelamento da inscrição"
                disabled={removendo}
              ></textarea>
              {motivoError && <p className="text-red-500 text-sm mt-1">{motivoError}</p>}
            </div>
            
            <div className="modal-buttons mt-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn-cancelar"
                disabled={removendo}
              >
                Não
              </button>
              <button
                onClick={confirmCancelarInscricao}
                className="btn-confirmar btn-danger"
                disabled={removendo}
              >
                {removendo ? 'Processando...' : 'Sim, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default GerenciarInscricoes;