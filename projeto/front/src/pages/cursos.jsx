import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import "./css/cursos.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cursosPerPage = 10;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await fetch(`${API_BASE}/cursos?page=${currentPage}&limit=${cursosPerPage}`);
        const data = await response.json();
        setCursos(data.cursos || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
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

  const handleCursoClick = (cursoId) => {
    navigate(`/cursos/${cursoId}`);
  };

  // Função para obter o URL da imagem
  const getImageUrl = (curso) => {
    if (!curso || !curso.nome) return '/placeholder-curso.jpg';
    
    const nomeCursoSlug = curso.nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    // Usar a nova função de URLs de imagens
    return IMAGES.CURSO(nomeCursoSlug);
  };

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

      {/* Lista de cursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {cursos.map((curso) => (
          <div
            key={curso.id_curso}
            onClick={() => handleCursoClick(curso.id_curso)}
            className="cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105"
            style={{
              backgroundImage: `url(${getImageUrl(curso)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
              <h3 className="text-white text-xl font-semibold text-center px-4">{curso.nome}</h3>
              <p className="text-white text-sm mt-2">
                {curso.tipo === 'sincrono' ? `${curso.vagas || 0} vagas` : 'Auto-estudo'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem para quando não há cursos */}
      {cursos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-600 text-lg">Nenhum curso disponível no momento.</p>
        </div>
      )}
    </div>
  );
}