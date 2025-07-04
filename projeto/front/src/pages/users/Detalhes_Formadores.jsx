import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import Sidebar from "../../components/Sidebar";
import fallbackCurso from '../../images/default_image.png';
import { toast } from 'react-toastify';
import "../users/css/Detalhes_Formadores.css";

/**
 * Componente para exibir detalhes de um formador específico
 * Mostra informações pessoais e cursos associados
 */
const DetalhesFormadores = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formador, setFormador] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Carregar dados do formador e seus cursos
   */
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
      
      // Buscar cursos ministrados
      if (formadorData.cursos_ministrados && Array.isArray(formadorData.cursos_ministrados)) {
        setCursos(formadorData.cursos_ministrados);
      } else {
        // Buscar cursos em endpoint separado se necessário
        try {
          const cursosResponse = await fetch(`${API_BASE}/formadores/${id}/cursos`);
          
          if (cursosResponse.ok) {
            const cursosData = await cursosResponse.json();
            setCursos(Array.isArray(cursosData) ? cursosData : []);
          } else {
            setCursos([]);
          }
        } catch (error) {
          setCursos([]);
        }
      }
      
    } catch (error) {
      setError(error.message || "Erro desconhecido ao carregar dados do formador.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFormador();
  }, [fetchFormador]);

  /**
   * Obter URL da imagem de perfil
   */
  const getImageUrl = (formador, type = 'avatar') => {
    if (!formador) return type === 'avatar' ? '/placeholder-formador.jpg' : '/placeholder-cover.jpg';
    
    if (type === 'avatar') {
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
      // Foto de capa
      if (formador.foto_capa && (formador.foto_capa.startsWith('http') || formador.foto_capa.startsWith('/'))) {
        return formador.foto_capa;
      }
      
      const email = formador.email;
      if (!email) return '/placeholder-cover.jpg';
      
      if (IMAGES && typeof IMAGES.USER_CAPA === 'function') {
        return IMAGES.USER_CAPA(email);
      } else if (IMAGES && IMAGES.DEFAULT_CAPA) {
        return IMAGES.DEFAULT_CAPA;
      }
      
      return '/placeholder-cover.jpg';
    }
  };

  /**
   * Obter URL da imagem do curso
   */
  const getCursoImageUrl = (curso) => {
    if (curso && curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }

    if (curso && curso.nome) {
      const nomeCursoSlug = curso.nome
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return `${API_BASE}/uploads/cursos/${nomeCursoSlug}/capa.png`;
    }

    return fallbackCurso;
  };

  /**
   * Obter classe CSS para o estado do curso
   */
  const getStatusClass = (estado) => {
    if (!estado) return 'status-pendente';
    
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower === 'em_curso' || estadoLower === 'em curso') {
      return 'status-em-andamento';
    } else if (estadoLower === 'terminado') {
      return 'status-completo';
    } else if (estadoLower === 'planeado' || estadoLower === 'planejado' || estadoLower === 'agendado') {
      return 'status-pendente';
    }
    
    return 'status-pendente';
  };

  /**
   * Formatar nome do estado para exibição
   */
  const formatStatusName = (estado) => {
    if (!estado) return 'Agendado';
    
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower === 'em_curso' || estadoLower === 'em curso') {
      return 'Em Curso';
    } else if (estadoLower === 'terminado') {
      return 'Terminado';
    } else if (estadoLower === 'planeado' || estadoLower === 'planejado') {
      return 'Agendado';
    }
    
    return estado;
  };

  const handleVoltar = () => {
    navigate(-1);
  };

  /**
   * Verificar se utilizador está inscrito no curso
   */
  const verificarInscricao = async (cursoId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(`${API_BASE}/inscricoes/verificar/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.inscrito || false;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  /**
   * Verificar se curso é acessível
   */
  const verificarAcessoCurso = (curso) => {
    const estado = curso.estado?.toLowerCase() || '';
    
    return estado.includes('planeado') || 
           estado.includes('planejado') || 
           estado.includes('agendado');
  };
  
  /**
   * Navegar para página do curso
   */
  const irParaCurso = async (curso) => {
    const cursoId = curso.id_curso || curso.id;
    const estado = curso.estado?.toLowerCase() || '';
    
    // Permitir acesso se curso está agendado
    const ehAgendado = estado.includes('planeado') || 
                        estado.includes('planejado') || 
                        estado.includes('agendado');
    
    if (ehAgendado) {
      navigate(`/cursos/${cursoId}`);
      return;
    }
    
    // Verificar inscrição para outros estados
    const inscrito = await verificarInscricao(cursoId);
    if (inscrito) {
      navigate(`/cursos/${cursoId}`);
    } else {
      toast.warning("Acesso restrito: Não está inscrito neste curso.", {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  // Filtrar cursos conforme tab ativa
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
            <p className="ml-3 text-gray-600">A carregar detalhes do formador...</p>
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
                  Voltar para a lista de formadores
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
                Voltar para a lista de formadores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coverImageUrl = getImageUrl(formador, 'cover');
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 fade-in">
          <div className="page-container">
            
            {/* Foto de capa e perfil */}
            <div className="cover-container">
              <img 
                src={coverImageUrl} 
                alt="Capa" 
                className="cover-image"
                onError={(e) => {
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
                    if (IMAGES && IMAGES.DEFAULT_AVATAR) {
                      e.target.src = IMAGES.DEFAULT_AVATAR;
                    } else {
                      e.target.src = '/placeholder-formador.jpg';
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Informações do formador */}
            <div className="content-section">
              <div className="formador-header" style={{ marginTop: "40px" }}>
                <h1 style={{ 
                  fontSize: "1.75rem", 
                  fontWeight: "700", 
                  color: "#000000", 
                  marginBottom: "1rem" 
                }}>
                  {formador.nome || formador.name || "Nome do Formador"}
                </h1>
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
            
            {/* Descrição */}
            <div className="content-section descricao-section">
              <h2 className="section-title">Descrição</h2>
              <div className="descricao-content">
                {formador.biografia || formador.descricao || "Nenhuma descrição disponível para este formador."}
              </div>
            </div>
            
            {/* Cursos associados */}
            <div className="content-section">
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
                    {cursos.filter(c => c.estado === 'em_curso' || c.estado === 'Disponível').length}
                  </span>
                </button>
              </div>
              
              <div className="cursos-container">
                {filteredCursos.length === 0 ? (
                  <div className="sem-cursos">
                    Este formador não possui cursos {activeTab === 'ativos' ? 'ativos' : ''}.
                  </div>
                ) : (
                  <div className="cursos-grid">
                    {filteredCursos.map((curso) => (
                      <div
                        key={curso.id_curso || curso.id}
                        className={`cartao-curso ${verificarAcessoCurso(curso) ? 'curso-acessivel' : 'curso-restrito'}`}
                        onClick={() => irParaCurso(curso)}
                      >
                        <div className="curso-imagem-container">
                          <img
                            src={getCursoImageUrl(curso)}
                            alt={curso.nome || curso.titulo || "Curso"}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = fallbackCurso;
                            }}
                          />
                        </div>
                        <div className="curso-info">
                          <p className="curso-titulo">{curso.nome || curso.titulo}</p>
                          <p className="curso-detalhe">
                            Categoria: {curso.categoria_nome || curso.categoria || "N/A"}
                          </p>
                          <p className="curso-detalhe">
                            Área: {curso.area_nome || curso.area || "N/A"}
                          </p>
                          <div className={`status-badge ${getStatusClass(curso.estado)}`}>
                            {formatStatusName(curso.estado)}
                          </div>
                        </div>
                      </div>
                    ))}
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