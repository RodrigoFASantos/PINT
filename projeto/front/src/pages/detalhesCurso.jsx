import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cursoService as cursosService, inscricoesService, authService } from '../../src/services/api';
import './css/detalhesCurso.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConteudoCursoList from '../components/ConteudoCursoList';
import FormularioInscricao from '../components/FormularioInscricao';

const DetalhesCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [inscrito, setInscrito] = useState(false);
  const [showInscricaoForm, setShowInscricaoForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      
      // Obter detalhes do curso
      const cursoData = await cursosService.getCursoById(id);
      setCurso(cursoData);
      
      // Verificar perfil do usuário
      const userData = await authService.getPerfil();
      
      // Definir perfil baseado no cargo (1=Gestor, 2=Formador, 3=Formando)
      const userCargo = userData.id_cargo;
      setUserRole(userCargo === 1 ? 'gestor' : userCargo === 2 ? 'formador' : 'formando');
      
      // Verificar se o usuário está inscrito neste curso
      const inscricaoData = await inscricoesService.verificarInscricao(id);
      setInscrito(inscricaoData.inscrito);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar detalhes do curso:', error);
      setError('Não foi possível carregar os detalhes do curso. Por favor, tente novamente mais tarde.');
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

  // Abrir formulário de inscrição
  const handleInscricao = () => {
    setShowInscricaoForm(true);
  };

  // Após inscrição bem-sucedida
  const handleInscricaoSuccess = () => {
    setInscrito(true);
    setShowInscricaoForm(false);
    // Exibir mensagem de sucesso temporária
    alert('Inscrição realizada com sucesso! Você receberá um email de confirmação.');
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
            <div className="curso-header p-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{curso.nome}</h1>
                  <p className="text-sm opacity-80">
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
                {/* Para formandos não inscritos e curso em estado "Agendado" */}
                {userRole === 'formando' && !inscrito && statusCurso === "Agendado" && (
                  <div className="not-enrolled-actions">
                    {curso.tipo === 'sincrono' && vagasDisponiveis <= 0 ? (
                      <div className="no-vacancy bg-red-100 text-red-800 p-4 rounded-md">
                        <p className="font-medium">Não há vagas disponíveis para este curso no momento.</p>
                      </div>
                    ) : (
                      <button 
                        className="inscricao-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
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
                  <div className="enrolled-info bg-green-50 border border-green-200 rounded-md p-4">
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
                    
                    {statusCurso === "Terminado" && (
                      <div className="curso-resultado">
                        <div className="mt-4">
                          <h3 className="font-semibold text-lg mb-2">Resultado do Curso</h3>
                          
                          {curso.notaFinal ? (
                            <div className="bg-white p-4 rounded-md border border-gray-200">
                              <p className="mb-2">
                                <span className="font-medium">Nota final:</span> {curso.notaFinal}
                              </p>
                              
                              {curso.certificadoDisponivel && (
                                <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                  Ver Certificado
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-600">
                              O formador ainda não atribuiu uma nota final.
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="font-semibold text-lg mb-3">Materiais do Curso</h3>
                          <ConteudoCursoList cursoId={id} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Para formadores que estão associados ao curso */}
                {userRole === 'formador' && curso.id_formador && curso.formador && 
                 curso.formador.id_utilizador === parseInt(localStorage.getItem('userId')) && (
                  <div className="formador-actions mt-4">
                    <p className="text-blue-700 font-medium mb-3">
                      Você é o formador deste curso.
                    </p>
                    
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => navigate(`/cursos/${id}/conteudos`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Gerenciar Conteúdos
                      </button>
                      
                      {(statusCurso === "Em curso" || statusCurso === "Terminado") && (
                        <button 
                          onClick={() => navigate(`/cursos/${id}/avaliacoes`)}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                          Gerenciar Avaliações
                        </button>
                      )}
                      
                      <button 
                        onClick={() => navigate(`/cursos/${id}/alunos`)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Ver Alunos Inscritos
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Para gestores/administradores */}
                {userRole === 'gestor' && (
                  <div className="gestor-actions mt-4">
                    <p className="text-purple-700 font-medium mb-3">
                      Acesso de administrador
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => navigate(`/admin/cursos/${id}/editar`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Editar Curso
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/admin/cursos/${id}/conteudos`)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Gerenciar Conteúdos
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/admin/cursos/${id}/inscricoes`)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Gerenciar Inscrições
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/admin/cursos/${id}/avaliacoes`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Gerenciar Avaliações
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de inscrição */}
      {showInscricaoForm && (
        <FormularioInscricao 
          cursoId={id} 
          onClose={() => setShowInscricaoForm(false)}
          onSuccess={handleInscricaoSuccess}
        />
      )}
    </div>
  );
};

export default DetalhesCurso;