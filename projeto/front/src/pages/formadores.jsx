import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import Sidebar from "../components/Sidebar";
import "./css/formadores.css";

export default function FormadoresPage() {
  const [formadores, setFormadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const formadoresPerPage = 10;

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Função para obter o URL da imagem de perfil do formador
  const getProfileImageUrl = (formador) => {
    if (!formador) return '/placeholder-formador.jpg';

    // Se o formador já tiver uma URL de foto de perfil completa, use-a
    if (formador.foto_perfil && (formador.foto_perfil.startsWith('http') || formador.foto_perfil.startsWith('/'))) {
      return formador.foto_perfil;
    }

    // Obter o email do formador para buscar sua imagem
    const email = formador.email;
    if (!email) return '/placeholder-formador.jpg';

    // Usar a função de URLs de imagens com o email, se disponível
    if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
      return IMAGES.FORMADOR(email);
    } else if (IMAGES && typeof IMAGES.USER_AVATAR === 'function') {
      return IMAGES.USER_AVATAR(email);
    }

    return '/placeholder-formador.jpg';
  };

  // Função para obter o URL da imagem de capa do formador
  const getCoverImageUrl = (formador) => {
    if (!formador) return '/placeholder-cover.jpg';

    // Se o formador já tiver uma URL de foto de capa completa, use-a
    if (formador.foto_capa && (formador.foto_capa.startsWith('http') || formador.foto_capa.startsWith('/'))) {
      return formador.foto_capa;
    }

    // Obter o email do formador para buscar sua imagem de capa
    const email = formador.email;
    if (!email) return '/placeholder-cover.jpg';

    // Usar a função de URLs de imagens com o email, se disponível
    if (IMAGES && typeof IMAGES.USER_CAPA === 'function') {
      return IMAGES.USER_CAPA(email);
    } else if (IMAGES && IMAGES.DEFAULT_CAPA) {
      return IMAGES.DEFAULT_CAPA;
    }

    return '/placeholder-cover.jpg';
  };

  useEffect(() => {
    const fetchFormadores = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/formadores?page=${currentPage}&limit=${formadoresPerPage}`);
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ao carregar formadores: ${response.status}`);
        }
  
        const data = await response.json();
        const total = Math.max(1, data.totalPages || 1); // força mínimo de 1
  
        // Corrigir se a página atual for maior do que a última página válida
        if (currentPage > total) {
          setCurrentPage(1);
          return;
        }
  
        setFormadores(data.formadores || []);
        setTotalPages(total);
        setError(null);
      } catch (error) {
        console.error("Erro ao carregar formadores:", error);
        setError("Não foi possível carregar a lista de formadores. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchFormadores();
  }, [currentPage]);
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFormadorClick = (formadorId) => {
    if (!formadorId) {
      console.error("Tentativa de navegar para formador sem ID");
      return;
    }

    console.log(`Navegando para detalhes do formador ID: ${formadorId}`);
    navigate(`/formadores/${formadorId}`);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex flex-col bg-white">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-3 text-gray-600">Carregando formadores...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen flex flex-col bg-white">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <h1 className="page-title">Formadores</h1>

      {/* Lista de formadores com o novo design */}
      <div className="formadores-grid">
        {formadores.length > 0 ? (
          formadores.map((formador, index) => {
            // Obter o ID do formador de forma segura
            const formadorId = formador.id || formador.id_utilizador;

            return (
              <div
                key={formadorId || index}
                onClick={() => formadorId && handleFormadorClick(formadorId)}
                className="formador-card"
                style={{
                  backgroundImage: `url(${getCoverImageUrl(formador)})`
                }}
              >
                <div className="formador-info">
                  <img 
                    src={getProfileImageUrl(formador)} 
                    alt={formador.nome || "Formador"} 
                    className="formador-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-formador.jpg';
                    }}
                  />
                  <h3 className="formador-name">
                    {formador.nome || formador.name || "Nome não disponível"}
                  </h3>
                  <p className="formador-email">
                    {formador.email || "Email não disponível"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-600 text-lg">Nenhum formador disponível no momento.</p>
          </div>
        )}
      </div>

      {/* Paginação - Cópia exata da página de cursos.jsx */}
      <div className="flex justify-center items-center my-6 pagination-container">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 pagination-button ${currentPage === 1 ? 'pagination-disabled' : 'pagination-active'}`}
          aria-label="Página anterior"
        >
          <span className="pagination-icon">&#10094;</span>
        </button>

        <span className="mx-4 text-lg font-medium pagination-info">{currentPage}/{totalPages}</span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 pagination-button ${currentPage === totalPages ? 'pagination-disabled' : 'pagination-active'}`}
          aria-label="Próxima página"
        >
          <span className="pagination-icon">&#10095;</span>
        </button>
      </div>
    </div>
  );
}