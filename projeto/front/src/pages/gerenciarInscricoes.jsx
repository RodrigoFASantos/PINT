import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/gerenciarInscricoes.css';
import Navbar from '../components/Navbar';
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Buscar dados do curso e inscrições
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Obter informações do usuário logado
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userData = JSON.parse(userInfoStr);
        setUserInfo(userData);
      }

      // Obter detalhes do curso
      const responseCurso = await fetch(`${API_BASE}/cursos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!responseCurso.ok) {
        throw new Error(`Erro ao carregar curso: ${responseCurso.status}`);
      }

      const cursoData = await responseCurso.json();
      setCurso(cursoData);

      // Obter inscrições do curso
      const responseInscricoes = await fetch(`${API_BASE}/inscricoes/curso/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!responseInscricoes.ok) {
        throw new Error(`Erro ao carregar inscrições: ${responseInscricoes.status}`);
      }

      const inscricoesData = await responseInscricoes.json();
      
      // Filtrar apenas inscrições ativas
      const inscricoesAtivas = inscricoesData.filter(inscricao => 
        inscricao.estado === 'inscrito'
      );
      
      setInscricoes(inscricoesAtivas); // Aqui usamos o filtro corretamente
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
      const temPermissao = userInfo.id_cargo === 1 || userInfo.id_utilizador === curso.id_formador;
      
      if (!temPermissao) {
        setError("Você não tem permissão para gerenciar inscrições neste curso.");
      }
    }
  }, [curso, userInfo]);

  // Função para abrir modal de confirmação de cancelamento de inscrição
  const handleCancelarInscricao = (inscricao) => {
    setSelectedInscricao(inscricao);
    setShowConfirmation(true);
  };





// Função para confirmar o cancelamento da inscrição
const confirmCancelarInscricao = async () => {
  if (!selectedInscricao) return;
  
  try {
    setRemovendo(true);
    const token = localStorage.getItem('token');
    
    // Enviar requisição para API com tratamento de erro adequado
    const response = await fetch(`${API_BASE}/inscricoes/${selectedInscricao.id_inscricao}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Tentar extrair os dados da resposta, se houver
    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      // Se não conseguir converter para JSON, continuar com objeto vazio
      console.warn('Resposta não contém JSON válido:', e);
    }

    // Log para depuração
    console.log('Response status:', response.status);
    console.log('Response data:', responseData);

    // Verificar o status da resposta
    if (!response.ok) {
      // Se tivermos uma mensagem de erro específica na resposta, usá-la
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
    
    // Verificar se é erro de conexão
    if (error.message.includes('temporariamente indisponível') || 
        error.message.includes('banco de dados')) {
      toast.error('O serviço está temporariamente indisponível. Por favor, tente novamente mais tarde.');
    } else {
      // Mensagem genérica ou específica caso exista
      toast.error(`Erro ao cancelar inscrição: ${error.message}`);
    }
    
  } finally {
    setShowConfirmation(false);
    setSelectedInscricao(null);
    setRemovendo(false);
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
            <p className="ml-3 text-gray-600">Carregando inscrições...</p>
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
  console.log(selectedInscricao);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
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
            
            {/* Conteúdo */}
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
            <div className="modal-buttons">
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