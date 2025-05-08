import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from "../../components/Sidebar";
import "./css/Lista_Cursos.css";

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCursos, setTotalCursos] = useState(0);
  const cursosPerPage = 12;

  // Estados para a barra de pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para os filtros
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // 'todos', 'sincrono', 'assincrono'
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Função para verificar os diferentes campos possíveis de id_categoria
  const getCategoriaId = (area) => {
    if (area.id_categoria !== undefined) return area.id_categoria;
    if (area.categoria_id !== undefined) return area.categoria_id;
    if (area.idCategoria !== undefined) return area.idCategoria;
    if (area.categoriaId !== undefined) return area.categoriaId;
    
    const categoriaKey = Object.keys(area).find(k => 
      k.toLowerCase().includes('categoria') && k.toLowerCase().includes('id')
    );
    
    return categoriaKey ? area[categoriaKey] : null;
  };

  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (categoriaId) {
      const catId = String(categoriaId);
      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = getCategoriaId(area);
        return areaCategoriaId !== null && String(areaCategoriaId) === catId;
      });
      setAreasFiltradas(areasFiltered);
      setAreaId('');
    } else {
      setAreasFiltradas([]);
      setAreaId('');
    }
  }, [categoriaId, areas]);

  // Função para buscar cursos com filtros
  const fetchCursos = async () => {
    try {
      setIsLoading(true);
      
      // Construir parâmetros da query
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: cursosPerPage.toString()
      });

      // Adicionar filtros se estiverem ativos
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (categoriaId) {
        params.append('categoria', categoriaId);
      }
      if (areaId) {
        params.append('area', areaId);
      }
      if (tipoFiltro !== 'todos') {
        params.append('tipo', tipoFiltro);
      }

      const url = `${API_BASE}/cursos?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      setCursos(data.cursos || []);
      setTotalPages(data.totalPages || 1);
      setTotalCursos(data.totalCursos || 0);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setIsLoading(false);
    }
  };

  // Buscar cursos sempre que a página ou filtros mudarem
  useEffect(() => {
    fetchCursos();
  }, [currentPage, searchTerm, categoriaId, areaId, tipoFiltro]);

  // Resetar para primeira página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoriaId, areaId, tipoFiltro]);

  // Carregar categorias e áreas
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categorias`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setCategorias(response.data);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    };

    const fetchAreas = async () => {
      try {
        const response = await axios.get(`${API_BASE}/areas`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAreas(response.data);
      } catch (error) {
        console.error("Erro ao carregar áreas:", error);
      }
    };

    fetchCategorias();
    fetchAreas();
  }, []);

  // Funções para navegação de páginas
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

  const handleCursoClick = async (cursoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cursoData = response.data;
      const dataAtual = new Date();
      const dataFimCurso = new Date(cursoData.data_fim);
      const cursoTerminado = dataFimCurso < dataAtual;
      
      // Verificar acesso
      if (cursoTerminado && !cursoData.acessoPermitido) {
        toast.error(
          "Este curso já terminou e só está disponível para alunos inscritos.", 
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        );
        return; // Impede a navegação
      }
      
      // Se passou pela verificação, navega para a página
      navigate(`/cursos/${cursoId}`);
    } catch (error) {
      console.error('Erro ao verificar acesso ao curso:', error);
      toast.error("Erro ao verificar acesso ao curso. Tente novamente mais tarde.");
    }
  };

  // Funções para manipular os filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleCategoriaChange = (e) => {
    const id = e.target.value;
    setCategoriaId(id);
  };

  const handleAreaChange = (e) => {
    const id = e.target.value;
    setAreaId(id);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getImageUrl = (curso) => {
    if (curso && curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }
    
    if (curso && curso.nome) {
      const nomeCursoSlug = curso.nome
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return IMAGES.CURSO(nomeCursoSlug);
    }
    
    return '/placeholder-curso.jpg';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoriaId('');
    setAreaId('');
    setTipoFiltro('todos');
  };
  
  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Título da página Cursos */}
      <h1 className="page-title">Cursos</h1>
      
      {/* Barra de pesquisa e filtros */}
      <div className="cursos-search-container">
        <div className="cursos-search-input-container">
          <i className="fas fa-search cursos-search-icon"></i>
          <input
            type="text"
            placeholder="Pesquisar cursos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="cursos-search-input"
          />
        </div>
        
        <button 
          className="cursos-filter-button"
          onClick={toggleFilters}
        >
          <i className="fas fa-filter cursos-filter-icon"></i>
          <span>Filtros</span>
        </button>
      </div>
      
      {/* Área de filtros expandida */}
      {showFilters && (
        <div className="cursos-filter-options">
          <div className="cursos-filter-group">
            {/* Select para categoria */}
            <div className="custom-select-wrapper">
              <select
                className="custom-select-button select-categoria"
                value={categoriaId}
                onChange={handleCategoriaChange}
              >
                <option value="">Selecionar Categoria</option>
                {categorias.map(categoria => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
              <i className="fas fa-folder custom-select-icon"></i>
            </div>
            
            {/* Select para área */}
            {categoriaId && (
              <div className="custom-select-wrapper">
                <select
                  className="custom-select-button select-area"
                  value={areaId}
                  onChange={handleAreaChange}
                  disabled={!categoriaId || isLoading}
                >
                  <option value="">Selecionar Área</option>
                  {isLoading ? (
                    <option value="" disabled>A carregar áreas...</option>
                  ) : areasFiltradas.length > 0 ? (
                    areasFiltradas.map(area => {
                      const areaIdValue = area.id_area || area.id || area.idArea || area.area_id;
                      const areaNomeValue = area.nome || area.name || area.descricao || area.description;
                      
                      return (
                        <option key={areaIdValue} value={areaIdValue}>
                          {areaNomeValue}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>Nenhuma área disponível</option>
                  )}
                </select>
                <i className="fas fa-bookmark custom-select-icon"></i>
              </div>
            )}
            
            {/* Botões para filtrar por tipo de curso */}
            <div className="cursos-filter-tipo">
              <button 
                className={`cursos-filter-tipo-button ${tipoFiltro === 'todos' ? 'cursos-filter-tipo-active' : ''}`}
                onClick={() => setTipoFiltro('todos')}
              >
                <i className="fas fa-th-list cursos-filter-button-icon"></i>
                <span>Todos</span>
              </button>
              
              <button 
                className={`cursos-filter-tipo-button ${tipoFiltro === 'sincrono' ? 'cursos-filter-tipo-active' : ''}`}
                onClick={() => setTipoFiltro('sincrono')}
              >
                <i className="fas fa-users cursos-filter-button-icon"></i>
                <span>Síncronos</span>
              </button>
              
              <button 
                className={`cursos-filter-tipo-button ${tipoFiltro === 'assincrono' ? 'cursos-filter-tipo-active' : ''}`}
                onClick={() => setTipoFiltro('assincrono')}
              >
                <i className="fas fa-book cursos-filter-button-icon"></i>
                <span>Assíncronos</span>
              </button>
            </div>
            
            {/* Botão para limpar todos os filtros */}
            {(searchTerm || categoriaId || areaId || tipoFiltro !== 'todos') && (
              <button 
                className="cursos-filter-clear-button"
                onClick={clearFilters}
              >
                <i className="fas fa-times cursos-filter-button-icon"></i>
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Indicador de carregamento */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="loading-spinner"></div>
          <p className="text-gray-600 mt-4">A carregar cursos...</p>
        </div>
      )}

      {/* Lista de cursos */}
      {!isLoading && (
        <div className="grid">
          {cursos.map((curso) => (
            <div
              key={curso.id_curso}
              onClick={() => handleCursoClick(curso.id_curso)}
              className="curso-card cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105"
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
          ))}
        </div>
      )}

      {/* Mensagem para quando não há cursos */}
      {!isLoading && cursos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-600 text-lg">Nenhum curso encontrado com os filtros selecionados.</p>
        </div>
      )}

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
    </div>
  );
}