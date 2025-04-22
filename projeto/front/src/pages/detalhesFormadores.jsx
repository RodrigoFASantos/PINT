import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./css/detalhesFormadores.css";

const DetalhesFormadores = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formador, setFormador] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchFormador = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Buscando formador com ID:", id);
      console.log("URL da API:", `${API_BASE}/formadores/${id}`);
      
      // Buscar detalhes do formador
      const formadorResponse = await fetch(`${API_BASE}/formadores/${id}`);
      
      if (!formadorResponse.ok) {
        const errorData = await formadorResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erro ${formadorResponse.status}: ${formadorResponse.statusText}`;
        console.error("Erro na resposta da API:", errorMessage);
        throw new Error(errorMessage);
      }
      
      const formadorData = await formadorResponse.json();
      console.log("Dados do formador recebidos:", formadorData);
      setFormador(formadorData);
      
      // Se o formador já tem cursos ministrados na resposta, use-os
      if (formadorData.cursos_ministrados && Array.isArray(formadorData.cursos_ministrados)) {
        console.log("Cursos encontrados na resposta do formador:", formadorData.cursos_ministrados.length);
        setCursos(formadorData.cursos_ministrados);
      } else {
        // Caso contrário, busque os cursos separadamente
        console.log("Buscando cursos separadamente para o formador ID:", id);
        try {
          const cursosResponse = await fetch(`${API_BASE}/formadores/${id}/cursos`);
          
          if (cursosResponse.ok) {
            const cursosData = await cursosResponse.json();
            console.log("Cursos recebidos separadamente:", cursosData);
            setCursos(Array.isArray(cursosData) ? cursosData : []);
          } else {
            console.warn(`Não foi possível carregar os cursos do formador. Status: ${cursosResponse.status}`);
            setCursos([]);
          }
        } catch (error) {
          console.error("Erro ao carregar cursos do formador:", error);
          setCursos([]);
        }
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados do formador:", error);
      setError(error.message || "Erro desconhecido ao carregar dados do formador.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFormador();
  }, [fetchFormador]);

  // Função para obter o URL da imagem
  const getImageUrl = (formador) => {
    if (!formador) return '/placeholder-formador.jpg';
    
    console.log("Obtendo URL de imagem para formador:", formador);
    
    // Se o formador já tiver uma URL de foto de perfil completa, use-a
    if (formador.foto_perfil && (formador.foto_perfil.startsWith('http') || formador.foto_perfil.startsWith('/'))) {
      console.log("Usando URL de foto já existente:", formador.foto_perfil);
      return formador.foto_perfil;
    }
    
    // Obter o email do formador para buscar sua imagem
    const email = formador.email;
    if (!email) {
      console.log("Email não encontrado, usando placeholder");
      return '/placeholder-formador.jpg';
    }
    
    // Usar a função de URLs de imagens com o email, se disponível
    if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
      const url = IMAGES.FORMADOR(email);
      console.log("URL gerada por IMAGES.FORMADOR:", url);
      return url;
    } else if (IMAGES && typeof IMAGES.USER_AVATAR === 'function') {
      const url = IMAGES.USER_AVATAR(email);
      console.log("URL gerada por IMAGES.USER_AVATAR:", url);
      return url;
    }
    
    console.log("Nenhuma URL válida encontrada, usando placeholder");
    return '/placeholder-formador.jpg';
  };

  const handleVoltar = () => {
    console.log("Voltando para a lista de formadores");
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Carregando detalhes do formador...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={fetchFormador} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tentar novamente
                </button>
                <button 
                  onClick={handleVoltar} 
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Voltar para lista de formadores
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formador) {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg">Formador não encontrado ou indisponível.</p>
              <button 
                onClick={handleVoltar} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Voltar para lista de formadores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 p-6">
          <button 
            onClick={handleVoltar} 
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para a lista de formadores
          </button>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="h-64 md:h-full bg-gray-300 relative">
                  <img 
                    src={getImageUrl(formador)} 
                    alt={formador.nome || "Formador"} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("Erro ao carregar imagem, usando fallback");
                      e.target.src = '/placeholder-formador.jpg';
                    }}
                  />
                </div>
              </div>
              
              <div className="md:w-2/3 p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {formador.nome || "Nome não disponível"}
                </h1>
                
                <div className="mb-6">
                  <p className="text-gray-600">
                    <span className="font-semibold">Email:</span> {formador.email || "Email não disponível"}
                  </p>
                  {formador.idade && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Idade:</span> {formador.idade} anos
                    </p>
                  )}
                  {formador.telefone && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Telefone:</span> {formador.telefone}
                    </p>
                  )}
                  {formador.data_nascimento && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Data de Nascimento:</span> {new Date(formador.data_nascimento).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                  {formador.area_especializacao && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Área de Especialização:</span> {formador.area_especializacao}
                    </p>
                  )}
                  {formador.departamento && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Departamento:</span> {formador.departamento}
                    </p>
                  )}
                </div>
                
                {formador.biografia && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Biografia</h2>
                    <p className="text-gray-700">{formador.biografia}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Seção de Competências */}
            {formador.competencias && Array.isArray(formador.competencias) && formador.competencias.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Competências</h2>
                <div className="flex flex-wrap gap-2">
                  {formador.competencias.map((competencia, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {competencia}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Seção de Cursos Ministrados */}
            <div className="p-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Cursos Ministrados</h2>
              
              {cursos && cursos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cursos.map((curso, index) => (
                    <div 
                      key={curso.id || curso.id_curso || index} 
                      className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/cursos/${curso.id || curso.id_curso}`)}
                    >
                      <h3 className="font-medium text-gray-800">{curso.titulo || curso.nome || "Curso sem título"}</h3>
                      {curso.data_inicio && (
                        <p className="text-sm text-gray-600 mt-1">
                          Início: {new Date(curso.data_inicio).toLocaleDateString('pt-PT')}
                        </p>
                      )}
                      {(curso.categoria_nome || curso.area_nome || curso.categoria || curso.area) && (
                        <p className="text-sm text-gray-600">
                          {curso.categoria_nome || curso.area_nome || curso.categoria || curso.area}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          curso.estado === 'Em curso' ? 'bg-green-100 text-green-800' :
                          curso.estado === 'Terminado' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {curso.estado || 'Disponível'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Este formador ainda não tem cursos ministrados.</p>
              )}
            </div>
            
            {/* Seção de Avaliações, se existirem */}
            {formador.avaliacoes && formador.avaliacoes.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Avaliações de Alunos</h2>
                
                <div className="space-y-4">
                  {formador.avaliacoes.map((avaliacao, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className={`h-5 w-5 ${i < avaliacao.classificacao ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-gray-600 text-sm">{avaliacao.data && new Date(avaliacao.data).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <p className="text-gray-700">{avaliacao.comentario}</p>
                      <p className="text-gray-500 text-sm mt-1">- {avaliacao.formando_nome || 'Anônimo'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesFormadores;