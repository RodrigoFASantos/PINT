import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import "./css/cursos.css";
import Sidebar from "../components/Sidebar";

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

  useEffect(() => {
    const fetchFormadores = async () => {
      try {
        setLoading(true);
        console.log(`Buscando formadores - Página ${currentPage}`);
        const response = await fetch(`${API_BASE}/formadores?page=${currentPage}&limit=${formadoresPerPage}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ao carregar formadores: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Dados de formadores recebidos:", data);
        
        if (data.formadores && data.formadores.length > 0) {
          console.log("IDs dos formadores disponíveis:", data.formadores.map(f => f.id || f.id_utilizador));
        }
        
        setFormadores(data.formadores || []);
        setTotalPages(data.totalPages || 1);
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

  // Função para obter o URL da imagem
  const getImageUrl = (formador) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
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
      <div className="min-h-screen flex flex-col bg-white p-6">
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


      {/* Barra de paginação */}
      <div className="flex justify-center items-center my-6">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 ${currentPage === 1 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="mx-4 text-lg font-medium">{currentPage}/{totalPages}</span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 ${currentPage === totalPages ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Lista de formadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {formadores.length > 0 ? (
          formadores.map((formador, index) => {
            // Obter o ID do formador de forma segura
            const formadorId = formador.id || formador.id_utilizador;
            
            return (
              <div
                key={formadorId || index}
                onClick={() => formadorId && handleFormadorClick(formadorId)}
                className="cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105"
                style={{
                  backgroundImage: `url(${getImageUrl(formador)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                  <h3 className="text-white text-xl font-semibold text-center px-4">
                    {formador.nome || formador.name || "Nome não disponível"}
                  </h3>
                  <p className="text-white text-sm mt-2">
                    {formador.email || "Email não disponível"}
                  </p>
                  {formador.area_especializacao && (
                    <p className="text-white text-sm mt-1">
                      {formador.area_especializacao}
                    </p>
                  )}
                  {formadorId && (
                    <p className="text-white text-xs mt-1 bg-blue-600 px-2 py-1 rounded">
                      ID: {formadorId}
                    </p>
                  )}
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
    </div>
  );
}