import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import Sidebar from "../../components/Sidebar";
import fallbackCurso from '../../images/default_image.png';
import { toast } from 'react-toastify';
import "../users/css/Detalhes_Formadores.css";

/**
 * Componente para apresentar detalhes completos de um formador específico
 * 
 * Este componente carrega e apresenta informações detalhadas sobre um formador,
 * incluindo dados pessoais, biografia e lista completa dos cursos que ministra.
 * Permite navegação para os cursos e filtragem por estado.
 * 
 * Funcionalidades principais:
 * - Apresentação do perfil completo do formador
 * - Lista de cursos ministrados com filtros
 * - Navegação para detalhes dos cursos
 * - Verificação de permissões de acesso
 * - Interface responsiva com sidebar
 */
const DetalhesFormadores = () => {
  // Parâmetros da rota e navegação
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados principais para gestão de dados
  const [formador, setFormador] = useState(null);
  const [cursos, setCursos] = useState([]);
  
  // Estados para controlo da interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Carrega os dados completos do formador e os seus cursos
   * 
   * Primeiro tenta obter os dados do formador através do endpoint principal.
   * Se os cursos não estiverem incluídos, faz uma chamada separada para obtê-los.
   * Implementa gestão robusta de erros e fallbacks para garantir boa experiência.
   */
  const fetchFormador = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 [FRONTEND] Iniciando busca do formador com ID: ${id}`);
      console.log(`🔍 [FRONTEND] URL principal: ${API_BASE}/formadores/${id}`);
      
      // Busca dados principais do formador
      const formadorResponse = await fetch(`${API_BASE}/formadores/${id}`);
      
      console.log(`📡 [FRONTEND] Status da resposta do formador: ${formadorResponse.status}`);
      
      if (!formadorResponse.ok) {
        const errorData = await formadorResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erro ${formadorResponse.status}: ${formadorResponse.statusText}`;
        console.error(`❌ [FRONTEND] Erro na busca do formador:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      const formadorData = await formadorResponse.json();
      console.log(`✅ [FRONTEND] Dados do formador recebidos:`, {
        id: formadorData.id_utilizador,
        nome: formadorData.nome,
        email: formadorData.email,
        cargo: formadorData.id_cargo,
        temCursosIncluidos: !!(formadorData.cursos_ministrados),
        cursosIncluidos: formadorData.cursos_ministrados || 'não incluídos',
        totalCursos: formadorData.total_cursos || 'não informado'
      });
      
      setFormador(formadorData);
      
      // Verifica se os cursos já vêm incluídos nos dados do formador
      if (formadorData.cursos_ministrados && Array.isArray(formadorData.cursos_ministrados)) {
        console.log(`📚 [FRONTEND] Cursos incluídos nos dados do formador:`, formadorData.cursos_ministrados.length);
        console.log(`📚 [FRONTEND] Primeiros cursos:`, formadorData.cursos_ministrados.slice(0, 3));
        setCursos(formadorData.cursos_ministrados);
      } else {
        console.log(`🔄 [FRONTEND] Cursos não incluídos, fazendo busca separada`);
        console.log(`🔄 [FRONTEND] URL para cursos: ${API_BASE}/formadores/${id}/cursos`);
        
        // Busca cursos em endpoint separado como fallback
        try {
          const cursosResponse = await fetch(`${API_BASE}/formadores/${id}/cursos`);
          
          console.log(`📡 [FRONTEND] Status da resposta dos cursos: ${cursosResponse.status}`);
          
          if (cursosResponse.ok) {
            const cursosData = await cursosResponse.json();
            console.log(`✅ [FRONTEND] Dados de cursos recebidos:`, {
              tipoDados: typeof cursosData,
              estrutura: Object.keys(cursosData),
              cursosData: cursosData
            });
            
            // Extrai array de cursos da resposta (pode vir em diferentes formatos)
            const cursosArray = cursosData.cursos || cursosData || [];
            console.log(`📚 [FRONTEND] Array de cursos extraído:`, {
              tipo: typeof cursosArray,
              length: Array.isArray(cursosArray) ? cursosArray.length : 'não é array',
              primeiros: Array.isArray(cursosArray) ? cursosArray.slice(0, 3) : cursosArray
            });
            
            setCursos(Array.isArray(cursosArray) ? cursosArray : []);
          } else {
            console.warn(`⚠️ [FRONTEND] Resposta não OK para cursos: ${cursosResponse.status}`);
            const errorText = await cursosResponse.text().catch(() => 'Erro desconhecido');
            console.warn(`⚠️ [FRONTEND] Texto do erro:`, errorText);
            setCursos([]);
          }
        } catch (cursosError) {
          console.error(`❌ [FRONTEND] Erro ao buscar cursos:`, cursosError);
          setCursos([]);
        }
      }
      
    } catch (error) {
      console.error(`❌ [FRONTEND] Erro geral no fetchFormador:`, error);
      setError(error.message || "Erro desconhecido ao carregar dados do formador.");
    } finally {
      setLoading(false);
      console.log(`🏁 [FRONTEND] Finalizada busca do formador`);
    }
  }, [id]);

  // Carrega dados quando o componente é montado ou o ID muda
  useEffect(() => {
    fetchFormador();
  }, [fetchFormador]);

  /**
   * Gera URL da imagem de perfil ou capa do formador
   * 
   * Implementa sistema de fallback robusto para imagens:
   * 1. Tenta usar foto_perfil se for URL válida
   * 2. Gera URL baseada no email usando funções de IMAGES
   * 3. Usa imagem placeholder como último recurso
   * 
   * @param {Object} formador - Dados do formador
   * @param {string} type - Tipo de imagem ('avatar' ou 'cover')
   * @returns {string} URL da imagem
   */
  const getImageUrl = (formador, type = 'avatar') => {
    if (!formador) {
      return type === 'avatar' ? '/placeholder-formador.jpg' : '/placeholder-cover.jpg';
    }
    
    if (type === 'avatar') {
      // Verifica se tem URL válida para foto de perfil
      if (formador.foto_perfil && (formador.foto_perfil.startsWith('http') || formador.foto_perfil.startsWith('/'))) {
        return formador.foto_perfil;
      }
      
      const email = formador.email;
      if (!email) return '/placeholder-formador.jpg';
      
      // Tenta usar funções do sistema de imagens
      if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
        return IMAGES.FORMADOR(email);
      } else if (IMAGES && typeof IMAGES.USER_AVATAR === 'function') {
        return IMAGES.USER_AVATAR(email);
      }
      
      return '/placeholder-formador.jpg';
    } else {
      // Gestão de imagem de capa
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
   * Gera URL da imagem de um curso específico
   * 
   * Tenta diferentes estratégias para obter a imagem do curso:
   * 1. Usa imagem_path se disponível
   * 2. Gera path baseado no nome do curso
   * 3. Usa imagem de fallback
   * 
   * @param {Object} curso - Dados do curso
   * @returns {string} URL da imagem do curso
   */
  const getCursoImageUrl = (curso) => {
    if (curso && curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }

    if (curso && curso.nome) {
      // Gera slug do nome do curso para path da imagem
      const nomeCursoSlug = curso.nome
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return `${API_BASE}/uploads/cursos/${nomeCursoSlug}/capa.png`;
    }

    return fallbackCurso;
  };

  /**
   * Determina a classe CSS apropriada para o estado do curso
   * 
   * Mapeia diferentes variações de estados para classes CSS consistentes.
   * Suporta múltiplas nomenclaturas para garantir compatibilidade.
   * 
   * @param {string} estado - Estado atual do curso
   * @returns {string} Classe CSS para o estado
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
   * Formata o nome do estado para apresentação ao utilizador
   * 
   * Converte códigos de estado internos em texto legível e consistente.
   * Normaliza diferentes variações para uma apresentação uniforme.
   * 
   * @param {string} estado - Estado interno do curso
   * @returns {string} Nome formatado para apresentação
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

  /**
   * Navega de volta para a página anterior
   */
  const handleVoltar = () => {
    navigate(-1);
  };

  /**
   * Verifica se o utilizador atual está inscrito num curso específico
   * 
   * Faz uma chamada à API para verificar o estado de inscrição.
   * Utiliza token de autenticação para identificar o utilizador.
   * 
   * @param {number} cursoId - ID do curso a verificar
   * @returns {Promise<boolean>} True se estiver inscrito
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
   * Verifica se um curso é publicamente acessível
   * 
   * Cursos agendados são geralmente acessíveis para visualização e inscrição.
   * Outros estados podem requerer inscrição prévia.
   * 
   * @param {Object} curso - Dados do curso
   * @returns {boolean} True se for publicamente acessível
   */
  const verificarAcessoCurso = (curso) => {
    const estado = curso.estado?.toLowerCase() || '';
    
    return estado.includes('planeado') || 
           estado.includes('planejado') || 
           estado.includes('agendado');
  };
  
  /**
   * Navega para a página de detalhes de um curso específico
   * 
   * Implementa lógica de controlo de acesso:
   * - Cursos agendados: acesso livre
   * - Outros cursos: requer inscrição
   * 
   * @param {Object} curso - Dados do curso
   */
  const irParaCurso = async (curso) => {
    console.log(`🎯 [FRONTEND] Navegando para curso:`, curso);
    
    // Utiliza ID do curso com fallback para compatibilidade
    const cursoId = curso.id || curso.id_curso;
    const estado = curso.estado?.toLowerCase() || '';
    
    console.log(`🎯 [FRONTEND] ID do curso: ${cursoId}, Estado: ${estado}`);
    
    // Permite acesso direto se o curso está agendado
    const ehAgendado = estado.includes('planeado') || 
                        estado.includes('planejado') || 
                        estado.includes('agendado');
    
    if (ehAgendado) {
      console.log(`✅ [FRONTEND] Curso agendado, navegando diretamente`);
      navigate(`/cursos/${cursoId}`);
      return;
    }
    
    // Para outros estados, verifica se o utilizador está inscrito
    console.log(`🔒 [FRONTEND] Verificando inscrição para curso ${cursoId}`);
    const inscrito = await verificarInscricao(cursoId);
    if (inscrito) {
      console.log(`✅ [FRONTEND] Utilizador inscrito, navegando para curso`);
      navigate(`/cursos/${cursoId}`);
    } else {
      console.log(`❌ [FRONTEND] Utilizador não inscrito, bloqueando acesso`);
      toast.warning("Acesso restrito: Não está inscrito neste curso.", {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  /**
   * Filtra a lista de cursos com base na tab ativa
   * 
   * - 'todos': apresenta todos os cursos
   * - 'ativos': apenas cursos em curso ou disponíveis
   */
  const filteredCursos = activeTab === 'ativos' 
    ? cursos.filter(curso => curso.estado === 'em_curso' || curso.estado === 'Disponível')
    : cursos;

  console.log(`📊 [FRONTEND] Estado atual:`, {
    formadorId: id,
    formadorCarregado: !!formador,
    totalCursos: cursos.length,
    cursosFiltered: filteredCursos.length,
    activeTab: activeTab,
    loading: loading,
    error: error
  });

  // Estado de carregamento
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

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={fetchFormador} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Tentar novamente
                </button>
                <button 
                  onClick={handleVoltar} 
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Voltar para a lista de formadores
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado quando formador não é encontrado
  if (!formador) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg">Formador não encontrado ou indisponível.</p>
              <button 
                onClick={handleVoltar} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
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
            
            {/* Seção de foto de capa e perfil */}
            <div className="cover-container">
              <img 
                src={coverImageUrl} 
                alt="Capa do perfil" 
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
                  alt={formador.nome || "Foto do formador"} 
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
            
            {/* Seção com informações principais do formador */}
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
              
              {/* Grelha com informações básicas */}
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
            
            {/* Seção de descrição/biografia */}
            <div className="content-section descricao-section">
              <h2 className="section-title">Descrição</h2>
              <div className="descricao-content">
                {formador.biografia || formador.descricao || "Nenhuma descrição disponível para este formador."}
              </div>
            </div>
            
            {/* Seção de cursos associados */}
            <div className="content-section">
              <div className="cursos-header">
                <h2 className="section-title">Cursos Associados</h2>
                <span className="cursos-count">{cursos.length}</span>
              </div>
              
              {/* Debug info para desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ 
                  background: '#f0f0f0', 
                  padding: '10px', 
                  margin: '10px 0', 
                  fontSize: '12px',
                  borderRadius: '4px'
                }}>
                  <strong>🐛 DEBUG INFO:</strong><br/>
                  Formador ID: {id}<br/>
                  Total Cursos: {cursos.length}<br/>
                  Cursos Array: {JSON.stringify(cursos.slice(0, 2), null, 2)}<br/>
                  Active Tab: {activeTab}
                </div>
              )}
              
              {/* Tabs para filtrar cursos */}
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
              
              {/* Contentor da lista de cursos */}
              <div className="cursos-container">
                {filteredCursos.length === 0 ? (
                  <div className="sem-cursos">
                    Este formador não possui cursos {activeTab === 'ativos' ? 'ativos' : ''}.
                  </div>
                ) : (
                  <div className="cursos-grid">
                    {filteredCursos.map((curso) => (
                      <div
                        key={curso.id || curso.id_curso} // Suporte para ambos os formatos de ID
                        className={`cartao-curso ${verificarAcessoCurso(curso) ? 'curso-acessivel' : 'curso-restrito'}`}
                        onClick={() => irParaCurso(curso)}
                      >
                        {/* Imagem do curso */}
                        <div className="curso-imagem-container">
                          <img
                            src={getCursoImageUrl(curso)}
                            alt={curso.nome || curso.titulo || "Imagem do curso"}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = fallbackCurso;
                            }}
                          />
                        </div>
                        
                        {/* Informações do curso */}
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