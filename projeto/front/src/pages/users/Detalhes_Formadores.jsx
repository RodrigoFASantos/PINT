import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import Sidebar from "../../components/Sidebar";
import "../users/css/Detalhes_Formadores.css";

/**
 * Componente para apresentação de detalhes de um formador específico
 * 
 * Este componente carrega e apresenta informações detalhadas sobre um formador,
 * incluindo dados pessoais e biografia.
 */
const DetalhesFormadores = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados principais para gestão de dados
  const [formador, setFormador] = useState(null);
  
  // Estados para controlo da interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Carrega os dados do formador
   * 
   * Obtém os dados do formador através do endpoint principal.
   */
  const fetchFormador = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Busca dados principais do formador
      const formadorResponse = await fetch(`${API_BASE}/formadores/${id}`);
      
      if (!formadorResponse.ok) {
        const errorData = await formadorResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erro ${formadorResponse.status}: ${formadorResponse.statusText}`;
        throw new Error(errorMessage);
      }
      
      const formadorData = await formadorResponse.json();
      setFormador(formadorData);
      
    } catch (error) {
      setError(error.message || "Erro desconhecido ao carregar dados do formador.");
    } finally {
      setLoading(false);
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
   * Navega de volta para a página anterior
   */
  const handleVoltar = () => {
    navigate(-1);
  };

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
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesFormadores;