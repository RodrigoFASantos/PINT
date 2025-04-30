import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import "./css/cursos.css";
import Sidebar from "../components/Sidebar";
import axios from 'axios';

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [filteredCursos, setFilteredCursos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    // Tentar diferentes formatos de propriedade
    if (area.id_categoria !== undefined) return area.id_categoria;
    if (area.categoria_id !== undefined) return area.categoria_id;
    if (area.idCategoria !== undefined) return area.idCategoria;
    if (area.categoriaId !== undefined) return area.categoriaId;
    
    // Se não encontrar, procurar qualquer chave que contenha "categoria" e "id"
    const categoriaKey = Object.keys(area).find(k => 
      k.toLowerCase().includes('categoria') && k.toLowerCase().includes('id')
    );
    
    return categoriaKey ? area[categoriaKey] : null;
  };

  // Função similar para encontrar o ID da área de forma flexível
  const getAreaId = (curso) => {
    // Verificar diferentes formatos de id_area
    if (curso.id_area !== undefined) return curso.id_area;
    if (curso.area_id !== undefined) return curso.area_id;
    if (curso.idArea !== undefined) return curso.idArea;
    if (curso.areaId !== undefined) return curso.areaId;
    
    // Verificar estrutura aninhada
    if (curso.area && curso.area.id !== undefined) return curso.area.id;
    
    // Se não encontrar, procurar qualquer chave que contenha "area" e "id"
    const areaKey = Object.keys(curso).find(k => 
      k.toLowerCase().includes('area') && k.toLowerCase().includes('id')
    );
    
    return areaKey ? curso[areaKey] : null;
  };

  // Função para obter o ID da categoria de um curso de forma flexível
  const getCursoCategoria = (curso) => {
    // Verificar diferentes formatos de id_categoria
    if (curso.id_categoria !== undefined) return curso.id_categoria;
    if (curso.categoria_id !== undefined) return curso.categoria_id;
    if (curso.idCategoria !== undefined) return curso.idCategoria;
    if (curso.categoriaId !== undefined) return curso.categoriaId;
    
    // Verificar estrutura aninhada
    if (curso.categoria && curso.categoria.id !== undefined) return curso.categoria.id;
    
    // Se não encontrar, procurar qualquer chave que contenha "categoria" e "id"
    const categoriaKey = Object.keys(curso).find(k => 
      k.toLowerCase().includes('categoria') && k.toLowerCase().includes('id')
    );
    
    return categoriaKey ? curso[categoriaKey] : null;
  };

  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (categoriaId) {
      // Converter para string para garantir comparação consistente
      const catId = String(categoriaId);
      
      // Filtragem mais flexível para lidar com diferentes estruturas de dados
      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = getCategoriaId(area);
        return areaCategoriaId !== null && String(areaCategoriaId) === catId;
      });
      
      console.log("Categoria selecionada:", catId);
      console.log("Áreas filtradas:", areasFiltered);
      setAreasFiltradas(areasFiltered);
      
      // Limpar área selecionada se a categoria mudar
      setAreaId('');
    } else {
      setAreasFiltradas([]);
      setAreaId('');
    }
  }, [categoriaId, areas]);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/cursos?page=${currentPage}&limit=${cursosPerPage}`);
        const data = await response.json();
        const cursosList = data.cursos || [];
        
        // Logging para debug
        console.log("Cursos carregados:", cursosList);
        if (cursosList.length > 0) {
          console.log("Primeiro curso estrutura:", Object.keys(cursosList[0]));
        }
        
        setCursos(cursosList);
        setFilteredCursos(cursosList);
        setTotalPages(data.totalPages || 1);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        setIsLoading(false);
      }
    };

    fetchCursos();
  }, [currentPage]);

  // Carregar categorias e áreas
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categorias`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log("Categorias carregadas:", response.data);
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
        console.log("Áreas carregadas:", response.data);
        setAreas(response.data);
      } catch (error) {
        console.error("Erro ao carregar áreas:", error);
      }
    };

    fetchCategorias();
    fetchAreas();
  }, []);

  // Efeito para aplicar filtros quando qualquer critério de filtro mudar
  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoriaId, areaId, tipoFiltro, cursos]);

  // Função para aplicar todos os filtros com melhor suporte para diferentes estruturas de dados
  const applyFilters = () => {
    let filtered = [...cursos];
    
    // Filtrar por termo de pesquisa
    if (searchTerm) {
      filtered = filtered.filter(curso => 
        curso.nome && curso.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por categoria com suporte flexível para diferentes estruturas
    if (categoriaId) {
      const catId = String(categoriaId);
      filtered = filtered.filter(curso => {
        const cursoCategoriaId = getCursoCategoria(curso);
        return cursoCategoriaId !== null && String(cursoCategoriaId) === catId;
      });
      
      // Debug log para verificar a filtragem
      console.log(`Cursos filtrados por categoria ${catId}:`, filtered.length);
    }
    
    // Filtrar por área com suporte flexível para diferentes estruturas
    if (areaId) {
      const areIdStr = String(areaId);
      filtered = filtered.filter(curso => {
        const cursoAreaId = getAreaId(curso);
        return cursoAreaId !== null && String(cursoAreaId) === areIdStr;
      });
    }
    
    // Filtrar por tipo
    if (tipoFiltro !== 'todos') {
      filtered = filtered.filter(curso => curso.tipo === tipoFiltro);
    }
    
    setFilteredCursos(filtered);
  };

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

  const handleCursoClick = (cursoId) => {
    navigate(`/cursos/${cursoId}`);
  };

  // Funções para manipular os filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleCategoriaChange = (e) => {
    const id = e.target.value;
    setCategoriaId(id);
    
    // Debug para verificar mudança de categoria
    console.log(`Categoria alterada para: ${id}`);
  };

  const handleAreaChange = (e) => {
    const id = e.target.value;
    setAreaId(id);
    
    // Debug para verificar mudança de área
    console.log(`Área alterada para: ${id}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
            {/* Select para categoria usando as classes CSS */}
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
            
            {/* Select para área (somente visível quando categoria estiver selecionada) */}
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
                    <option value="" disabled>Carregando áreas...</option>
                  ) : areasFiltradas.length > 0 ? (
                    areasFiltradas.map(area => {
                      // Obter ID da área de maneira flexível
                      const areaIdValue = area.id_area || area.id || area.idArea || area.area_id;
                      // Obter nome da área de maneira flexível
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
                onClick={() => {
                  setSearchTerm('');
                  setCategoriaId('');
                  setAreaId('');
                  setTipoFiltro('todos');
                }}
              >
                <i className="fas fa-times cursos-filter-button-icon"></i>
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
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

      {/* Debug info - removido para produção */}
      {/* <div className="bg-gray-100 p-3 rounded mb-4">
        <p>Categoria selecionada: {categoriaId || 'Nenhuma'}</p>
        <p>Área selecionada: {areaId || 'Nenhuma'}</p>
        <p>Tipo selecionado: {tipoFiltro}</p>
        <p>Total de cursos: {cursos.length}</p>
        <p>Cursos filtrados: {filteredCursos.length}</p>
      </div> */}

      {/* Indicador de carregamento */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="loading-spinner"></div>
          <p className="text-gray-600 mt-4">Carregando cursos...</p>
        </div>
      )}

      {/* Lista de cursos filtrados */}
      {!isLoading && (
        <div className="grid">
          {filteredCursos.map((curso) => {
            return (
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
            );
          })}
        </div>
      )}

      {/* Mensagem para quando não há cursos */}
      {!isLoading && filteredCursos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-600 text-lg">Nenhum curso encontrado com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}