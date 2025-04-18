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
  const [userRole, setUserRole] = useState('formando'); // Definir como padrão para evitar verificações adicionais
  const [inscrito, setInscrito] = useState(false);
  const [showInscricaoForm, setShowInscricaoForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inscrevendo, setInscrevendo] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
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
      console.log(`Tentando obter detalhes do curso: ${API_BASE}/cursos/${id}`);
      const response = await fetch(`${API_BASE}/cursos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar curso: ${response.status}`);
      }
      
      const cursoData = await response.json();
      console.log("Dados do curso recebidos:", cursoData);
      setCurso(cursoData);
      
      // Verificar inscrição (simplificado)
      try {
        console.log(`Verificando se o usuário está inscrito: ${API_BASE}/users_inscricoes/verificar/${id}`);
        const inscricaoResponse = await fetch(`${API_BASE}/users_inscricoes/verificar/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (inscricaoResponse.ok) {
          const inscricaoData = await inscricaoResponse.json();
          setInscrito(inscricaoData.inscrito);
          console.log("Usuário está inscrito:", inscricaoData.inscrito);
        } else {
          console.log("Endpoint de verificação retornou erro, assumindo que não está inscrito");
          setInscrito(false);
        }
      } catch (inscricaoError) {
        console.error("Erro ao verificar inscrição:", inscricaoError);
        setInscrito(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar curso:", error);
      setError("Não foi possível carregar os detalhes do curso. Tente novamente mais tarde.");
      setLoading(false);
    }
  }, [id, navigate]);

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

  // Função que é chamada após confirmar no modal
  // Função que é chamada após confirmar no modal
// Função que é chamada após confirmar no modal
const handleInscricaoConfirm = async () => {
  if (inscrevendo) return; // Evitar múltiplos cliques
  
  try {
    setInscrevendo(true);
    console.log('Confirmação de inscrição recebida, processando...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
      return;
    }
    
    // Teste simplificado de POST direto - para diagnóstico
    console.log('Iniciando teste POST simplificado...');
    try {
      const testToken = token;
      let testId = id;
      
      // Obter ID do usuário do token para o teste
      let testUserId;
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        testUserId = userData.id_utilizador;
        console.log('ID do usuário para teste:', testUserId);
      } catch (err) {
        console.error('Erro ao obter ID do usuário:', err);
        testUserId = 1; // Valor padrão para teste
      }
      
      const testData = {
        id_utilizador: testUserId,
        id_curso: testId
      };
      
      console.log('Dados para teste POST:', testData);
      console.log('URL do teste:', 'http://localhost:4000/api/inscricoes');
      console.log('Token presente:', !!testToken);
      
      const testResponse = await fetch('http://localhost:4000/api/inscricoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Teste POST status:', testResponse.status);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('Erro do teste POST:', errorText);
      } else {
        const responseData = await testResponse.json();
        console.log('Resposta do teste POST:', responseData);
        
        // Se o teste for bem-sucedido, podemos considerar a inscrição realizada
        setInscrito(true);
        setShowInscricaoForm(false);
        
        // Exibir mensagem de sucesso
        const notificationElement = document.createElement('div');
        notificationElement.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notificationElement.textContent = 'Inscrição realizada com sucesso! Você receberá um email de confirmação.';
        document.body.appendChild(notificationElement);
        
        // Remover a notificação após 3 segundos
        setTimeout(() => {
          notificationElement.remove();
        }, 3000);
        
        // Interromper o resto da função, pois a inscrição já foi realizada
        return;
      }
    } catch (testError) {
      console.error('Erro no teste POST simplificado:', testError);
    }
    
    // O código abaixo só será executado se o teste simplificado falhar
    
    // Obter o ID do usuário do token JWT
    let id_utilizador;
    try {
      const userData = JSON.parse(atob(token.split('.')[1]));
      id_utilizador = userData.id_utilizador;
      console.log('ID do utilizador:', id_utilizador);
    } catch (tokenError) {
      console.error('Erro ao decodificar token:', tokenError);
      throw new Error('Erro na autenticação. Por favor, faça login novamente.');
    }
    
    // Usar URL fixa para teste
    const inscricaoUrl = 'http://localhost:4000/api/inscricoes';
    console.log('Usando URL fixa para teste:', inscricaoUrl);
    
    // Preparar dados para enviar
    const inscricaoData = {
      id_utilizador,
      id_curso: id
    };
    console.log('Dados completos a enviar:', JSON.stringify(inscricaoData));
    
    // Tentar fazer a requisição com tratamento explícito de erro
    console.log('Iniciando requisição POST para:', inscricaoUrl);
    
    try {
      const response = await fetch(inscricaoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inscricaoData)
      });
      
      console.log('Resposta recebida - Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Detalhes do erro da API:', errorText);
        throw new Error(`Erro do servidor: ${response.status} - ${errorText || 'Sem detalhes'}`);
      }
      
      // Resposta bem sucedida
      const responseData = await response.json();
      console.log('Inscrição criada com sucesso:', responseData);
      
      // Atualizar estado local
      setInscrito(true);
      setShowInscricaoForm(false);
      
      // Exibir mensagem de sucesso temporária
      const notificationElement = document.createElement('div');
      notificationElement.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notificationElement.textContent = 'Inscrição realizada com sucesso! Você receberá um email de confirmação.';
      document.body.appendChild(notificationElement);
      
      // Remover a notificação após 3 segundos
      setTimeout(() => {
        notificationElement.remove();
      }, 3000);
    } catch (fetchError) {
      console.error('Erro detalhado ao fazer fetch:', fetchError);
      
      // Verificar se é erro de conexão recusada
      if (fetchError.message.includes('Failed to fetch') || 
          fetchError.message.includes('NetworkError') ||
          fetchError.message.includes('net::')) {
        console.error('DIAGNÓSTICO: Erro de conexão detectado - servidor recusou a conexão');
        console.error('Possíveis causas:');
        console.error('1. Servidor não está rodando na porta 4000');
        console.error('2. Rota /api/inscricoes não está registrada ou está com erro');
        console.error('3. Firewall ou proxy bloqueando a conexão');
        console.error('4. CORS não configurado corretamente no servidor');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao realizar inscrição:', error);
    
    // Exibir mensagem de erro
    const notificationElement = document.createElement('div');
    notificationElement.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notificationElement.textContent = `Erro ao realizar inscrição: ${error.message}`;
    document.body.appendChild(notificationElement);
    
    // Remover a notificação após 5 segundos
    setTimeout(() => {
      notificationElement.remove();
    }, 5000);
  } finally {
    // Sempre resetar o estado de inscrevendo
    setInscrevendo(false);
    setShowInscricaoForm(false); // Fechar o modal
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
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="curso-details-container bg-white rounded-lg shadow-md">
            {/* Cabeçalho do curso */}
            <div className="curso-header p-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-2 text-black">{curso.nome}</h1>
                  <p className="text-sm text-white opacity-80">
                    {curso.area?.nome} {curso.area?.categoria && `> ${curso.area.categoria.nome}`}
                  </p>
                </div>
                <span className={`status-badge ${statusCurso.toLowerCase().replace(' ', '-')}`}>
                  {statusCurso}
                </span>
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
                {/* Botão de inscrição */}
                {userRole === 'formando' && !inscrito && (
                  <div className="not-enrolled-actions">
                    {curso.tipo === 'sincrono' && vagasDisponiveis <= 0 ? (
                      <div className="no-vacancy bg-red-100 text-red-800 p-4 rounded-md">
                        <p className="font-medium">Não há vagas disponíveis para este curso no momento.</p>
                      </div>
                    ) : (
                      <button 
                        className="inscricao-btn bg-orange-500 hover:bg-orange-600 text-black font-medium py-2 px-6 rounded-full transition-colors"
                        onClick={handleInscricao}
                      >
                        Inscrever-se neste curso
                      </button>
                    )}
                    
                    <p className="text-sm text-gray-600 mt-2">
                      Data limite para inscrição: {new Date(curso.data_inicio).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {/* Para formandos inscritos */}
                {userRole === 'formando' && inscrito && (
                  <div className="enrolled-info bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                    <p className="text-green-700 font-medium mb-2">
                      Você está inscrito neste curso!
                    </p>
                    
                    {statusCurso === "Agendado" && (
                      <p className="text-sm text-gray-600">
                        O curso começará em {new Date(curso.data_inicio).toLocaleDateString()}. 
                        Você receberá notificações sobre eventuais alterações.
                      </p>
                    )}
                    
                    {statusCurso === "Em curso" && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-3">Conteúdo do Curso</h3>
                        <ConteudoCursoList cursoId={id} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação de inscrição */}
      {showInscricaoForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative z-10 text-center">
            <h3 className="text-xl font-semibold mb-4">Confirmar Inscrição</h3>
            <p className="mb-6">Tem certeza que deseja se inscrever no curso "{curso.nome}"?</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setShowInscricaoForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={inscrevendo}
              >
                Cancelar
              </button>
              <button 
                onClick={handleInscricaoConfirm}
                className={`px-4 py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-600 transition-colors ${inscrevendo ? 'opacity-70 cursor-not-allowed' : ''}`}
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