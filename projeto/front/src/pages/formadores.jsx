import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import "./css/cursos.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function FormadoresPage() {
  const [formadores, setFormadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiTested, setApiTested] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const formadoresPerPage = 10;
  
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Dados de demonstração apenas para teste de renderização
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await fetch(`${API_BASE}/formadores?page=${currentPage}&limit=${formadoresPerPage}`);
        const data = await response.json();
        setFormadores(data.formadores || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Erro ao carregar formadores:", error);
      }
    };

    
    

    fetchCursos();
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

  useEffect(() => {
    const testarEndpoints = async () => {
      setLoading(true);
      setError(null);
      
      // Lista de endpoints possíveis para tentar
      const endpointsPossiveis = [
        "/formadores",
        "/utilizadores/formadores", 
        "/users/formadores",
        "/users?id_cargo=2",
        "/utilizadores?id_cargo=2"
      ];
      
      let formadoresEncontrados = false;
      
      for (const endpoint of endpointsPossiveis) {
        try {
          const url = `${API_BASE}${endpoint}`;
          console.log(`Tentando endpoint: ${url}`);
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Resposta de ${endpoint}:`, data);
            
            // Verificar se a resposta contém dados úteis
            const temDados = Array.isArray(data) ? data.length > 0 : 
                            Array.isArray(data.data) ? data.data.length > 0 :
                            Array.isArray(data.formadores) ? data.formadores.length > 0 :
                            Array.isArray(data.users) ? data.users.length > 0 : false;
            
            if (temDados) {
              console.log(`✅ Endpoint válido encontrado: ${endpoint}`);
              
              // Extrair os dados da resposta
              const formadoresData = Array.isArray(data) ? data : 
                                     Array.isArray(data.data) ? data.data :
                                     Array.isArray(data.formadores) ? data.formadores :
                                     data.users;
              
              setFormadores(formadoresData);
              
              break;
            } else {
              console.log(`⚠️ Endpoint respondeu, mas sem dados: ${endpoint}`);
            }
          } else {
            console.log(`❌ Endpoint não disponível (${response.status}): ${endpoint}`);
          }
        } catch (error) {
          console.error(`Erro ao acessar ${endpoint}:`, error);
        }
      }
      
     
      
      setLoading(false);
      setApiTested(true);
    };

    testarEndpoints();
  }, []);

  const handleFormadorClick = (formadorId) => {
    navigate(`/formadores/${formadorId}`);
  };

  // Função para obter o URL da imagem
  const getImageUrl = (formador) => {
    if (!formador || !formador.nome) return '/placeholder-formador.jpg';
    
    if (formador.foto_perfil) {
      return formador.foto_perfil;
    }
    
    const nomeFormadorSlug = formador.nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    // Usar a função de URLs de imagens, se disponível
    if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
      return IMAGES.FORMADOR(nomeFormadorSlug);
    }
    
    return '/placeholder-formador.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
        <Navbar toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-3 text-gray-600">Testando conexão com a API...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <Navbar toggleSidebar={toggleSidebar} />
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
          formadores.map((formador, index) => (
            <div
              key={formador.id_utilizador || formador.id || index}
              onClick={() => handleFormadorClick(formador.id_utilizador || formador.id)}
              className="cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105"
              style={{
                backgroundImage: `url(${getImageUrl(formador)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                <h3 className="text-white text-xl font-semibold text-center px-4">
                  {formador.nome || formador.name}
                </h3>
                <p className="text-white text-sm mt-2">
                  {formador.email}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-600 text-lg">Nenhum formador disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}