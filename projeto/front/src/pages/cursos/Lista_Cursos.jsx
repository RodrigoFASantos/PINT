import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import "./css/Lista_Cursos.css";
import fallbackCurso from '../../images/default_image.png';

export default function CursosPage() {
  const [cursos, setCursos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCursos, setTotalCursos] = useState(0);
  const cursosPerPage = 12;
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);


  useEffect(() => {
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
    }
  }, [currentUser]);

  useEffect(() => {
    // Verificar se não há cursos carregados e recarregar
    if (cursos.length === 0 && !isLoading) {
      console.log("Não há cursos carregados, tentando recarregar...");
      fetchCursos();
    }
  }, [cursos.length]);

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
  const [topicos, setTopicos] = useState([]);
  const [topicosFiltrados, setTopicosFiltrados] = useState([]);
  const [topicoId, setTopicoId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Carregar categorias e áreas
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categorias`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setCategorias(response.data);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    };

    const fetchAreas = async () => {
      try {
        const response = await axios.get(`${API_BASE}/areas`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setAreas(response.data);
      } catch (error) {
        console.error("Erro ao carregar áreas:", error);
      }
    };

    fetchCategorias();
    fetchAreas();
  }, []);

  // Carregar todos os tópicos
useEffect(() => {
  const fetchAllTopicos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/topicos-area`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Verificar se a resposta é um array
      const topicoData = response.data;
      if (Array.isArray(topicoData)) {
        setTopicos(topicoData);
      } else if (topicoData && typeof topicoData === 'object') {
        // Se for um objeto com uma propriedade que é array (comum em APIs)
        // Tentar encontrar uma propriedade que seja array
        const possibleArrayProps = ['data', 'items', 'results', 'topicos'];
        for (const prop of possibleArrayProps) {
          if (Array.isArray(topicoData[prop])) {
            console.log(`Usando propriedade '${prop}' como array de tópicos`);
            setTopicos(topicoData[prop]);
            break;
          }
        }
      } else {
        console.error("Formato de dados inesperado para tópicos:", topicoData);
        setTopicos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar tópicos:", error);
      setTopicos([]);
    }
  };

  fetchAllTopicos();
}, []);

useEffect(() => {
  if (areaId && Array.isArray(topicos)) {
    const areId = String(areaId);
    // Use o campo correto conforme definido no modelo Topico_Area
    const topicosFiltered = topicos.filter(topico => {
      return topico.id_area && String(topico.id_area) === areId;
    });
    setTopicosFiltrados(topicosFiltered);
    setTopicoId('');

    // Log para depuração
    if (topicos.length > 0) {
      console.log("Estrutura de um objeto tópico:", topicos[0]);
      console.log("Tópicos filtrados para área", areId, ":", topicosFiltered);
      console.log("Quantidade de tópicos filtrados:", topicosFiltered.length);
    }
  } else {
    setTopicosFiltrados([]);
    setTopicoId('');
  }
}, [areaId, topicos]);


  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (categoriaId) {
      const catId = String(categoriaId);
      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = area.id_categoria ?? area.categoria_id ?? area.idCategoria ?? area.categoriaId;
        return areaCategoriaId && String(areaCategoriaId) === catId;
      });
      setAreasFiltradas(areasFiltered);
      setAreaId('');
      setTopicoId('');
    } else {
      setAreasFiltradas([]);
      setAreaId('');
      setTopicoId('');
    }
  }, [categoriaId, areas]);

  // Filtrar tópicos com base na área selecionada
  useEffect(() => {
    if (areaId) {
      const areId = String(areaId);
      // Use o campo correto conforme definido no modelo Topico_Area
      const topicosFiltered = topicos.filter(topico => {
        return topico.id_area && String(topico.id_area) === areId;
      });
      setTopicosFiltrados(topicosFiltered);
      setTopicoId('');

      // Log para depuração
      if (topicos.length > 0) {
        console.log("Estrutura de um objeto tópico:", topicos[0]);
        console.log("Tópicos filtrados para área", areId, ":", topicosFiltered);
        console.log("Quantidade de tópicos filtrados:", topicosFiltered.length);
      }
    } else {
      setTopicosFiltrados([]);
      setTopicoId('');
    }
  }, [areaId, topicos]);

  // Função para buscar cursos com filtros
  const fetchCursos = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: cursosPerPage.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (categoriaId) params.append('categoria', categoriaId);
      if (areaId) params.append('area', areaId);
      if (topicoId) params.append('topico', topicoId);
      if (tipoFiltro !== 'todos') params.append('tipo', tipoFiltro);

      const url = `${API_BASE}/cursos?${params.toString()}`;
      console.log("Buscando cursos na URL:", url);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        console.log("Resposta da API:", data);
        setCursos(data.cursos || []);
        setTotalPages(data.totalPages || 1);
        setTotalCursos(data.total || 0);
      } catch (fetchError) {
        console.error("Erro na requisição:", fetchError);
        toast.error("Erro ao carregar cursos. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao processar requisição:", error);
      setIsLoading(false);
      toast.error("Erro ao processar dados. Por favor, tente novamente.");
    }
  };

  // Função para verificar se o utilizador pode aceder ao curso
  const podeAcederCurso = (cursoData, inscrito) => {
    // Se é admin, sempre pode aceder
    if (userRole === 1) return true;
    
    // Verificar se o curso terminou
    const dataAtual = new Date();
    const dataFimCurso = new Date(cursoData.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;
    
    // Se o curso não terminou, pode aceder normalmente
    if (!cursoTerminado) return true;
    
    // Se o curso terminou e é assíncrono, apenas admin pode aceder
    if (cursoData.tipo === 'assincrono') return false;
    
    // Se o curso terminou e é síncrono, pode aceder se estava inscrito
    if (cursoData.tipo === 'sincrono' && inscrito) return true;
    
    return false;
  };

  // Função para obter mensagem de bloqueio apropriada
  const getMensagemBloqueio = (cursoData, inscrito) => {
    const dataAtual = new Date();
    const dataFimCurso = new Date(cursoData.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;
    
    if (!cursoTerminado) {
      return "Este curso ainda não iniciou ou não tem permissão de acesso.";
    }
    
    if (cursoData.tipo === 'assincrono') {
      return "Este curso assíncrono já terminou e não está mais disponível.";
    }
    
    if (cursoData.tipo === 'sincrono' && !inscrito) {
      return "Este curso síncrono já terminou e só está disponível para alunos que estavam inscritos.";
    }
    
    return "Não tem permissão para aceder a este curso.";
  };

  // Ação ao clicar no curso 
  const handleCursoClick = async (cursoId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/login');
        return;
      }

      // Obter dados do curso
      const cursoResponse = await axios.get(`${API_BASE}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cursoData = cursoResponse.data;

      // Verificar se o utilizador está inscrito no curso
      let inscrito = false;
      try {
        const inscricaoResponse = await axios.get(`${API_BASE}/inscricoes/verificar/${cursoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        inscrito = inscricaoResponse.data.inscrito;
      } catch (inscricaoError) {
        console.log("Erro ao verificar inscrição (utilizador pode não estar inscrito):", inscricaoError);
        inscrito = false;
      }

      // Verificar se pode aceder ao curso
      if (!podeAcederCurso(cursoData, inscrito)) {
        toast.error(getMensagemBloqueio(cursoData, inscrito), { 
          position: "top-center",
          autoClose: 5000
        });
        return;
      }

      // Se chegou até aqui, pode aceder ao curso
      navigate(`/cursos/${cursoId}`);

    } catch (error) {
      console.error('Erro ao verificar acesso ao curso:', error);
      
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast.error("Curso não encontrado.");
      } else {
        toast.error("Erro ao verificar acesso ao curso. Tente novamente mais tarde.");
      }
    }
  };

  // Buscar cursos sempre que a página ou filtros mudarem
  useEffect(() => {
    fetchCursos();
  }, [currentPage, searchTerm, categoriaId, areaId, tipoFiltro, topicoId]);

  // Resetar para primeira página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoriaId, areaId, tipoFiltro, topicoId]);

  // Funções para navegação de páginas
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Funções para manipular os filtros
  const toggleFilters = () => setShowFilters(!showFilters);

  const handleCategoriaChange = e => setCategoriaId(e.target.value);

  const handleAreaChange = e => {
    if (!categoriaId) {
      toast.warning("Por favor, selecione uma Categoria primeiro!", { position: "top-center" });
      return;
    }
    setAreaId(e.target.value);
  };

  const handleTopicoChange = e => {
    if (!areaId) {
      toast.warning("Por favor, selecione uma Área primeiro!", { position: "top-center" });
      return;
    }
    setTopicoId(e.target.value);
  };

  const handleSearchChange = e => setSearchTerm(e.target.value);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoriaId('');
    setAreaId('');
    setTopicoId('');
    setTipoFiltro('todos');
  };

  const getImageUrl = curso => curso?.imagem_path ? `${API_BASE}/${curso.imagem_path}` :
    curso?.nome
      ? IMAGES.CURSO(curso.nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""))
      : fallbackCurso;

  return (
    <div className="p-6-lc min-h-screen-lc flex flex-col bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <h1 className="page-title-lc">Cursos</h1>

      {/* Busca e filtros */}
      <div className="cursos-search-container-lc">
        <div className="cursos-search-input-container-lc">
          <i className="fas fa-search cursos-search-icon-lc"></i>
          <input type="text" placeholder="Pesquisar cursos..." value={searchTerm} onChange={handleSearchChange} className="cursos-search-input-lc" />
        </div>
        <button className="cursos-filter-button-lc" onClick={toggleFilters}>
          <i className="fas fa-filter cursos-filter-icon-lc"></i><span>Filtros</span>
        </button>
      </div>

      {showFilters && (
        <div className="cursos-filter-options-lc">
          <div className="cursos-filter-group-lc">
            {/* Categoria - Sempre visível */}
            <div className="custom-select-wrapper-lc">
              <select className="custom-select-button-lc select-categoria-lc" value={categoriaId} onChange={handleCategoriaChange}>
                <option value="">Selecionar Categoria</option>
                {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome}</option>)}
              </select>
              <i className="fas fa-folder custom-select-icon-lc"></i>
            </div>

            {/* Área - Sempre visível */}
            <div className="custom-select-wrapper-lc">
              <select className="custom-select-button-lc select-area-lc" value={areaId} onChange={handleAreaChange} disabled={isLoading}>
                <option value="">Selecionar Área</option>
                {isLoading
                  ? <option disabled>A carregar áreas...</option>
                  : areasFiltradas.length
                    ? areasFiltradas.map(area => <option key={area.id_area} value={area.id_area}>{area.nome}</option>)
                    : <option disabled>Selecione uma categoria primeiro</option>
                }
              </select>
              <i className="fas fa-bookmark custom-select-icon-lc"></i>
            </div>

            {/* Tópico - Sempre visível */}
            <div className="custom-select-wrapper-lc">
              <select className="custom-select-button-lc select-topico-lc" value={topicoId} onChange={handleTopicoChange} disabled={isLoading || !areaId}>
                <option value="">Selecionar Tópico</option>
                {isLoading
                  ? <option disabled>A carregar tópicos...</option>
                  : !areaId
                    ? <option disabled>Selecione uma área primeiro</option>
                    : topicosFiltrados.length
                      ? topicosFiltrados.map(top => {
                        const id = top.id_topico;
                        const nome = top.titulo;
                        return <option key={id} value={id}>{nome}</option>;
                      })
                      : <option disabled>Nenhum tópico disponível para esta área</option>
                }
              </select>
              <i className="fas fa-tag custom-select-icon-lc"></i>
            </div>

            {/* Tipo */}
            <div className="cursos-filter-tipo-lc">
              {['todos', 'sincrono', 'assincrono'].map(tipo => (
                <button key={tipo} className={`cursos-filter-tipo-button-lc ${tipoFiltro === tipo ? 'cursos-filter-tipo-active-lc' : ''}`} onClick={() => setTipoFiltro(tipo)}>
                  <i className={`fas ${tipo === 'sincrono' ? 'fa-users' : tipo === 'assincrono' ? 'fa-book' : 'fa-th-list'} cursos-filter-button-icon-lc`}></i>
                  <span>{tipo === 'todos' ? 'Todos' : tipo === 'sincrono' ? 'Síncronos' : 'Assíncronos'}</span>
                </button>
              ))}
            </div>

            {/* Limpar */}
            {(searchTerm || categoriaId || areaId || topicoId || tipoFiltro !== 'todos') && (
              <button className="cursos-filter-clear-button-lc" onClick={clearFilters}>
                <i className="fas fa-times cursos-filter-button-icon-lc"></i><span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Carregamento */}
      {isLoading && <div className="text-center-lc py-8"><div className="loading-spinner-lc"></div><p className="text-gray-600 mt-4">A carregar cursos...</p></div>}

      {/* Lista de cursos */}
      {!isLoading && <div className="grid-lc">{cursos.map(curso => <div key={curso.id_curso} onClick={() => handleCursoClick(curso.id_curso)} className="curso-card-lc cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105" style={{ backgroundImage: `url(${getImageUrl(curso)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><div className="curso-card-overlay-lc"><span className="curso-overlay-title-lc">{curso.nome}</span><span className="curso-overlay-dates-lc">{new Date(curso.data_inicio).toLocaleDateString('pt-PT')} - {new Date(curso.data_fim).toLocaleDateString('pt-PT')}</span><span className="curso-overlay-vagas-lc">{curso.tipo === 'sincrono' ? `${curso.vagas || 0} vagas` : 'Auto-estudo'}</span></div></div>)}</div>}

      {/* Sem resultados */}
      {!isLoading && cursos.length === 0 && <div className="text-center-lc py-10"><p className="text-gray-600 text-lg">Nenhum curso encontrado com os filtros selecionados.</p></div>}

      {/* Paginação */}
      <div className="flex justify-center items-center my-6 pagination-container-lc">
        <button onClick={goToPreviousPage} disabled={currentPage === 1} className={`px-4 py-2 pagination-button-lc ${currentPage === 1 ? 'pagination-disabled-lc' : 'pagination-active-lc'}`} aria-label="Página anterior"><span className="pagination-icon">&#10094;</span></button>
        <span className="mx-4 text-lg font-medium pagination-info-lc">{currentPage}/{totalPages}</span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`px-4 py-2 pagination-button-lc ${currentPage === totalPages ? 'pagination-disabled-lc' : 'pagination-active-lc'}`} aria-label="Próxima página"><span className="pagination-icon">&#10095;</span></button>
      </div>
    </div>
  );
}