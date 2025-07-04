import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import Sidebar from "../../components/Sidebar";
import "./css/Detalhes_Formadores.css";

/**
 * Componente para exibir detalhes de um utilizador específico
 * Mostra informações pessoais do utilizador
 */
const DetalhesUtilizador = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [utilizador, setUtilizador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Carregar dados do utilizador
   */
  const fetchUtilizador = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const userData = await response.json();
      setUtilizador(userData);
      
    } catch (error) {
      setError(error.message || "Erro desconhecido ao carregar dados do utilizador.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUtilizador();
  }, [fetchUtilizador]);

  /**
   * Obter URL da imagem do utilizador
   */
  const getImageUrl = (utilizador, type = 'avatar') => {
    if (!utilizador) return type === 'avatar' ? '/placeholder-formador.jpg' : '/placeholder-cover.jpg';
    
    if (type === 'avatar') {
      if (utilizador.foto_perfil && (utilizador.foto_perfil.startsWith('http') || utilizador.foto_perfil.startsWith('/'))) {
        return utilizador.foto_perfil;
      }
      
      const email = utilizador.email;
      if (!email) return '/placeholder-formador.jpg';
      
      if (IMAGES && typeof IMAGES.USER_AVATAR === 'function') {
        return IMAGES.USER_AVATAR(email);
      }
      
      return '/placeholder-formador.jpg';
    } else {
      if (utilizador.foto_capa && (utilizador.foto_capa.startsWith('http') || utilizador.foto_capa.startsWith('/'))) {
        return utilizador.foto_capa;
      }
      
      const email = utilizador.email;
      if (!email) return '/placeholder-cover.jpg';
      
      if (IMAGES && typeof IMAGES.USER_CAPA === 'function') {
        return IMAGES.USER_CAPA(email);
      } else if (IMAGES && IMAGES.DEFAULT_CAPA) {
        return IMAGES.DEFAULT_CAPA;
      }
      
      return '/placeholder-cover.jpg';
    }
  };

  const handleVoltar = () => {
    navigate('/admin/usuarios');
  };

  /**
   * Obter nome do cargo baseado no ID
   */
  const getCargoNome = (idCargo) => {
    switch (parseInt(idCargo)) {
      case 1: return 'Gestor';
      case 2: return 'Formador';
      case 3: return 'Formando';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">A carregar detalhes do utilizador...</p>
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
                <button onClick={fetchUtilizador} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Tentar novamente
                </button>
                <button onClick={handleVoltar} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                  Voltar para lista de utilizadores
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!utilizador) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg">Utilizador não encontrado ou indisponível.</p>
              <button onClick={handleVoltar} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Voltar para lista de utilizadores
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coverImageUrl = getImageUrl(utilizador, 'cover');
  
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
              Voltar para a lista de utilizadores
            </button>
            
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
                  src={getImageUrl(utilizador, 'avatar')} 
                  alt={utilizador.nome || "Utilizador"} 
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
            
            <div className="content-section">
              <div className="formador-header">
                <h1 className="formador-name">{utilizador.nome || "Utilizador"}</h1>
                <span className="formador-badge">{getCargoNome(utilizador.id_cargo)}</span>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{utilizador.email || "Email não disponível"}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Idade</span>
                  <span className="info-value">
                    {utilizador.idade ? `${utilizador.idade} anos` : "Não disponível"}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Telefone</span>
                  <span className="info-value">{utilizador.telefone || "Não disponível"}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Morada</span>
                  <span className="info-value">{utilizador.morada || "Não disponível"}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Código Postal</span>
                  <span className="info-value">{utilizador.codigo_postal || "Não disponível"}</span>
                </div>
              </div>
            </div>
            
            <div className="content-section descricao-section">
              <h2 className="section-title">Descrição</h2>
              <div className="descricao-content">
                {utilizador.biografia || "Nenhuma descrição disponível para este utilizador."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesUtilizador;