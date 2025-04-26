import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import Sidebar from "../components/Sidebar";
import "./css/detalhesFormadores.css";

const DetalhesFormadores = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formador, setFormador] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' ou 'ativos'
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchFormador = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar detalhes do formador
      const formadorResponse = await fetch(`${API_BASE}/formadores/${id}`);
      
      if (!formadorResponse.ok) {
        const errorData = await formadorResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erro ${formadorResponse.status}: ${formadorResponse.statusText}`;
        throw new Error(errorMessage);
      }
      
      const formadorData = await formadorResponse.json();
      setFormador(formadorData);
      
      // Se o formador já tem cursos ministrados na resposta, use-os
      if (formadorData.cursos_ministrados && Array.isArray(formadorData.cursos_ministrados)) {
        setCursos(formadorData.cursos_ministrados);
      } else {
        // Caso contrário, busque os cursos separadamente
        try {
          const cursosResponse = await fetch(`${API_BASE}/formadores/${id}/cursos`);
          
          if (cursosResponse.ok) {
            const cursosData = await cursosResponse.json();
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

  // Função melhorada para obter o URL da imagem
  const getImageUrl = (formador, type = 'avatar') => {
    if (!formador) return type === 'avatar' ? '/placeholder-formador.jpg' : '/placeholder-cover.jpg';
    
    if (type === 'avatar') {
      // Para avatar (foto de perfil)
      if (formador.foto_perfil && (formador.foto_perfil.startsWith('http') || formador.foto_perfil.startsWith('/'))) {
        return formador.foto_perfil;
      }
      
      const email = formador.email;
      if (!email) return '/placeholder-formador.jpg';
      
      if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
        return IMAGES.FORMADOR(email);
      } else if (IMAGES && typeof IMAGES.USER_AVATAR === 'function') {
        return IMAGES.USER_AVATAR(email);
      }
      
      return '/placeholder-formador.jpg';
    } else {
      // Para foto de capa
      if (formador.foto_capa && (formador.foto_capa.startsWith('http') || formador.foto_capa.startsWith('/'))) {
        return formador.foto_capa;
      }
      
      const email = formador.email;
      if (!email) return '/placeholder-cover.jpg';
      
      // Adicionando verificação para USER_CAPA
      if (IMAGES && typeof IMAGES.USER_CAPA === 'function') {
        return IMAGES.USER_CAPA(email);
      } else if (IMAGES && IMAGES.DEFAULT_CAPA) {
        return IMAGES.DEFAULT_CAPA;
      }
      
      return '/placeholder-cover.jpg';
    }
  };

  const handleVoltar = () => {
    navigate(-1);
  };

  // Filtrar cursos ativos/todos
  const filteredCursos = activeTab === 'ativos' 
    ? cursos.filter(curso => curso.estado === 'em_curso' || curso.estado === 'Disponível')
    : cursos;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
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
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
              <div className="mt-4 space-x-4">
                <button onClick={fetchFormador} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Tentar novamente
                </button>
                <button onClick={handleVoltar} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
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
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg">Formador não encontrado ou indisponível.</p>
              <button onClick={handleVoltar} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Voltar para lista de formadores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug da URL da imagem de capa
  const coverImageUrl = getImageUrl(formador, 'cover');
  console.log("URL da imagem de capa:", coverImageUrl);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 fade-in">
          <div className="page-container">
            <button onClick={handleVoltar} className="back-button">
              <svg className="back-button-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para a lista de formadores
            </button>
            
            {/* Nova seção com foto de capa e foto de perfil */}
            <div className="cover-container">
              {/* Usando uma tag img em vez de background-image para a capa */}
              <img 
                src={coverImageUrl} 
                alt="Capa" 
                className="cover-image"
                onError={(e) => {
                  console.log("Erro ao carregar imagem de capa, usando fallback");
                  // Tenta usar a capa padrão como fallback
                  if (IMAGES && IMAGES.DEFAULT_CAPA) {
                    e.target.src = IMAGES.DEFAULT_CAPA;
                  } else {
                    e.target.src = '/placeholder-cover.jpg';
                  }
                }}
              />
              <div className="cover-overlay"></div>
              <div className="profile-avatar-container">
                <img 
                  src={getImageUrl(formador, 'avatar')} 
                  alt={formador.nome || "Formador"} 
                  className="profile-avatar"
                  onError={(e) => {
                    console.log("Erro ao carregar imagem de perfil, usando fallback");
                    if (IMAGES && IMAGES.DEFAULT_AVATAR) {
                      e.target.src = IMAGES.DEFAULT_AVATAR;
                    } else {
                      e.target.src = '/placeholder-formador.jpg';
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="content-section">
              <div className="formador-header">
                <h1 className="formador-name">{formador.nome || "Ferreira2"}</h1>
                <span className="formador-badge">Formador</span>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{formador.email || "Email não disponível"}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Idade</span>
                  <span className="info-value">
                    {formador.idade ? `${formador.idade} anos` : "Não disponível"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="content-section descricao-section">
              <h2 className="section-title">Descrição</h2>
              <div className="descricao-content">
                {formador.biografia || "Nenhuma descrição disponível para este formador."}
              </div>
            </div>
            
            <div className="content-section cursos-section">
              <div className="cursos-header">
                <h2 className="section-title">Cursos Associados</h2>
                <span className="cursos-count">{cursos.length}</span>
              </div>
              
              <div className="cursos-tabs">
                <button 
                  className={`tab-button ${activeTab === 'todos' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('todos')}
                >
                  Todos
                  <span className="tab-count">{cursos.length}</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'ativos' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('ativos')}
                >
                  Ativos
                  <span className="tab-count">
                    {cursos.filter(c => c.estado === 'em_curso' ).length}
                    
                  </span>
                </button>
              </div>
              
              <div className="cursos-list">
                {filteredCursos.length > 0 ? (
                  filteredCursos.map((curso, index) => (
                    <div 
                      key={curso.id || curso.id_curso || index} 
                      className="curso-item"
                      onClick={() => navigate(`/cursos/${curso.id || curso.id_curso}`)}
                    >
                      <h3 className="curso-title">{curso.titulo || curso.nome || "Título"}</h3>
                      <div className="curso-info">
                        {curso.data_inicio && (
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(curso.data_inicio).toLocaleDateString('pt-PT')}
                          </span>
                        )}
                        
                        {curso.estado && (
                          <span className={`curso-status ${
                            curso.estado === 'em_curso' ? 'status-ativo' :
                            curso.estado === 'Terminado' ? 'status-terminado' :
                            'status-disponivel'
                          }`}>
                            {curso.estado}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-cursos">
                    Este formador é atrasado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesFormadores;