import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import "./css/cursos.css";
import Sidebar from "../components/Sidebar";

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cursosPerPage = 12;

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

  const getImageUrl = (curso) => {
    // Se o curso tiver um caminho de imagem definido, usá-lo diretamente
    if (curso && curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }
    
    // Se não tiver imagem_path mas tiver nome, criar um slug do nome (compatibilidade)
    if (curso && curso.nome) {
      const nomeCursoSlug = curso.nome
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return IMAGES.CURSO(nomeCursoSlug);
    }
    
    // Fallback para imagem padrão
    return '/placeholder-curso.jpg';
  };
  
  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Paginação */}
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

      {/* Lista de cursos */}
      <div className="grid">
        {cursos.map((curso) => {
          return (
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
              <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <h3 className="text-white text-xl font-semibold text-center px-4">{curso.nome}</h3>
                <p className="text-white text-sm mt-2">
                  {curso.tipo === 'sincrono' ? `${curso.vagas || 0} vagas` : 'Auto-estudo'}
                </p>
              </div>
            </div>
          );
        })}
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