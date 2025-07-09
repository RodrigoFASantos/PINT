import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../contexts/AuthContext";
import "./css/Lista_Cursos.css";
import fallbackCurso from '../../images/default_image.png';

/**
 * Componente principal para listagem e gestão de cursos da plataforma
 * Permite pesquisar, filtrar por categoria/área/tópico/tipo/estado e navegar pelos cursos disponíveis
 * Implementa sistema de paginação, validação de acesso aos cursos e persistência de filtros
 * Os filtros são mantidos quando o utilizador navega para outras páginas e volta
 */
export default function CursosPage() {
  // Chave para guardar filtros no localStorage de forma única para este componente
  const FILTROS_STORAGE_KEY = 'cursos_filtros_persistentes';
  
  // Estados principais para gestão de cursos e paginação
  const [cursos, setCursos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCursos, setTotalCursos] = useState(0);
  const cursosPerPage = 12;
  
  // Estados de autenticação e permissões do utilizador
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);

  // Estados para sistema de pesquisa - separamos valor da input do filtro ativo
  const [searchInput, setSearchInput] = useState(''); // Valor atual na caixa de texto
  const [searchFilter, setSearchFilter] = useState(''); // Valor usado para filtrar (só atualizado com Enter ou clique)
  const [showFilters, setShowFilters] = useState(false);

  // Estados para filtros hierárquicos (categoria > área > tópico)
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [topicos, setTopicos] = useState([]);
  const [topicosFiltrados, setTopicosFiltrados] = useState([]);
  const [topicoId, setTopicoId] = useState('');

  // Estados para filtros adicionais
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  // Estados de controlo da interface
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filtrosCarregados, setFiltrosCarregados] = useState(false); // Marca quando os filtros foram carregados do localStorage
  
  const navigate = useNavigate();

  /**
   * Verifica se um valor está realmente vazio (null, undefined ou string vazia)
   */
  const isValueEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 'undefined';
  };

  /**
   * Alterna o estado da sidebar entre aberta e fechada
   */
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Guarda os filtros atuais no localStorage para persistência entre navegações
   * Apenas guarda se os dados base (categorias, areas, tópicos) já foram carregados
   */
  const guardarFiltrosNoStorage = () => {
    // Só guarda filtros se os dados base já foram carregados para evitar guardar estados vazios
    if (!filtrosCarregados) return;
    
    const filtrosParaGuardar = {
      searchFilter,
      categoriaId,
      areaId,
      topicoId,
      tipoFiltro,
      estadoFiltro,
      timestamp: Date.now() // Para controlar idade dos filtros guardados
    };
    
    try {
      localStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify(filtrosParaGuardar));
      console.log('Filtros guardados no localStorage:', filtrosParaGuardar);
    } catch (error) {
      console.warn('Erro ao guardar filtros no localStorage:', error);
    }
  };

  /**
   * Carrega os filtros guardados do localStorage e aplica-os ao estado do componente
   * Valida se os filtros não são muito antigos (máximo 24 horas) para evitar filtros obsoletos
   * Também atualiza o campo de pesquisa visual para corresponder ao filtro guardado
   */
  const carregarFiltrosDoStorage = () => {
    try {
      const filtrosGuardados = localStorage.getItem(FILTROS_STORAGE_KEY);
      if (!filtrosGuardados) return false;

      const filtros = JSON.parse(filtrosGuardados);
      
      // Verifica se os filtros não são muito antigos (24 horas)
      const idadeMaxima = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
      const idadeFiltros = Date.now() - (filtros.timestamp || 0);
      
      if (idadeFiltros > idadeMaxima) {
        console.log('Filtros guardados são muito antigos, a ignorar');
        localStorage.removeItem(FILTROS_STORAGE_KEY);
        return false;
      }

      // Aplica os filtros guardados ao estado do componente
      if (filtros.searchFilter) {
        setSearchFilter(filtros.searchFilter);
        setSearchInput(filtros.searchFilter); // Sincroniza o campo visual
      }
      if (filtros.categoriaId) setCategoriaId(filtros.categoriaId);
      if (filtros.areaId) setAreaId(filtros.areaId);
      if (filtros.topicoId) setTopicoId(filtros.topicoId);
      if (filtros.tipoFiltro) setTipoFiltro(filtros.tipoFiltro);
      if (filtros.estadoFiltro) setEstadoFiltro(filtros.estadoFiltro);

      console.log('Filtros carregados do localStorage:', filtros);
      return true;
    } catch (error) {
      console.warn('Erro ao carregar filtros do localStorage:', error);
      // Remove dados corrompidos do localStorage
      localStorage.removeItem(FILTROS_STORAGE_KEY);
      return false;
    }
  };

  /**
   * Remove os filtros guardados do localStorage
   * Chamado quando o utilizador explicitamente limpa os filtros
   */
  const limparFiltrosDoStorage = () => {
    try {
      localStorage.removeItem(FILTROS_STORAGE_KEY);
      console.log('Filtros removidos do localStorage');
    } catch (error) {
      console.warn('Erro ao remover filtros do localStorage:', error);
    }
  };

  /**
   * Carrega o role/cargo do utilizador atual quando os dados ficam disponíveis
   * Necessário para determinar permissões de acesso aos cursos
   */
  useEffect(() => {
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
    }
  }, [currentUser]);

  /**
   * Carrega as categorias e áreas disponíveis na plataforma
   * Estes dados são necessários para popular os dropdowns de filtros
   * Após carregar, tenta restaurar filtros guardados no localStorage
   */
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categorias`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setCategorias(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        setCategorias([]);
      }
    };

    const fetchAreas = async () => {
      try {
        const response = await axios.get(`${API_BASE}/areas`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setAreas(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao carregar áreas:", error);
        setAreas([]);
      }
    };

    // Carrega dados base e depois tenta restaurar filtros
    const inicializarDados = async () => {
      await Promise.all([fetchCategorias(), fetchAreas()]);
      
      // Marca que os dados base foram carregados e tenta restaurar filtros
      setFiltrosCarregados(true);
      carregarFiltrosDoStorage();
    };

    inicializarDados();
  }, []);

  /**
   * Carrega todos os tópicos disponíveis na plataforma
   * Implementa estratégia robusta para lidar com diferentes formatos de resposta da API
   * Procura o array de tópicos em várias propriedades possíveis da resposta
   */
  useEffect(() => {
    const fetchAllTopicos = async () => {
      try {
        const response = await axios.get(`${API_BASE}/topicos-area`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const topicoData = response.data;
        
        // Verifica se a resposta é diretamente um array
        if (Array.isArray(topicoData)) {
          setTopicos(topicoData);
        } else if (topicoData && typeof topicoData === 'object') {
          // Procura propriedades que possam conter o array de tópicos
          const possibleArrayProps = ['data', 'items', 'results', 'topicos'];
          let found = false;
          
          for (const prop of possibleArrayProps) {
            if (Array.isArray(topicoData[prop])) {
              console.log(`A usar propriedade '${prop}' como array de tópicos`);
              setTopicos(topicoData[prop]);
              found = true;
              break;
            }
          }
          
          if (!found) {
            console.error("Formato de dados inesperado para tópicos:", topicoData);
            setTopicos([]);
          }
        } else {
          console.error("Resposta inválida para tópicos:", topicoData);
          setTopicos([]);
        }
      } catch (error) {
        console.error("Erro ao carregar tópicos:", error);
        setTopicos([]);
      }
    };

    fetchAllTopicos();
  }, []);

  /**
   * Filtra as áreas disponíveis baseado na categoria selecionada
   * Implementa a cascata hierárquica: categoria > área > tópico
   * Quando muda a categoria, limpa automaticamente área e tópico selecionados se não forem válidos
   */
  useEffect(() => {
    console.log('🔍 [FILTROS] A processar categoria:', categoriaId, 'Vazia?', isValueEmpty(categoriaId));
    
    if (!isValueEmpty(categoriaId) && Array.isArray(areas)) {
      const catId = String(categoriaId);
      const areasFiltered = areas.filter(area => {
        // Suporta diferentes nomes de campos para ID da categoria na resposta da API
        const areaCategoriaId = area.id_categoria ?? area.categoria_id ?? area.idCategoria ?? area.categoriaId;
        return areaCategoriaId && String(areaCategoriaId) === catId;
      });
      
      console.log('🏷️ [FILTROS] Áreas filtradas para categoria', catId, ':', areasFiltered.length, 'áreas');
      setAreasFiltradas(areasFiltered);
      
      // Apenas limpa dependentes se não estamos a restaurar filtros guardados
      if (filtrosCarregados) {
        // Verifica se a área atual ainda é válida para esta categoria
        if (!isValueEmpty(areaId)) {
          const areaValida = areasFiltered.some(area => String(area.id_area) === String(areaId));
          if (!areaValida) {
            console.log('⚠️ [FILTROS] Área atual não é válida para a categoria, a limpar');
            setAreaId('');
            setTopicoId('');
          }
        }
      }
    } else {
      console.log('🧹 [FILTROS] A limpar áreas filtradas');
      setAreasFiltradas([]);
      if (filtrosCarregados) {
        setAreaId('');
        setTopicoId('');
      }
    }
  }, [categoriaId, areas, filtrosCarregados]);

  /**
   * Filtra os tópicos disponíveis baseado na área selecionada
   * Quando muda a área, limpa automaticamente o tópico selecionado se não for válido
   */
  useEffect(() => {
    console.log('🔍 [FILTROS] A processar área:', areaId, 'Vazia?', isValueEmpty(areaId));
    
    if (!isValueEmpty(areaId) && Array.isArray(topicos)) {
      const areId = String(areaId);
      const topicosFiltered = topicos.filter(topico => {
        return topico.id_area && String(topico.id_area) === areId;
      });
      
      console.log('🏷️ [FILTROS] Tópicos filtrados para área', areId, ':', topicosFiltered.length, 'tópicos');
      setTopicosFiltrados(topicosFiltered);
      
      // Apenas limpa tópico se não estamos a restaurar filtros e o tópico atual não é válido
      if (filtrosCarregados && !isValueEmpty(topicoId)) {
        const topicoValido = topicosFiltered.some(topico => String(topico.id_topico) === String(topicoId));
        if (!topicoValido) {
          console.log('⚠️ [FILTROS] Tópico atual não é válido para a área, a limpar');
          setTopicoId('');
        }
      }

      // Debug da filtragem de tópicos para ajudar no desenvolvimento
      if (topicos.length > 0) {
        console.log("Estrutura de um tópico:", topicos[0]);
        console.log("Tópicos filtrados para área", areId, ":", topicosFiltered);
        console.log("Quantidade de tópicos filtrados:", topicosFiltered.length);
      }
    } else {
      console.log('🧹 [FILTROS] A limpar tópicos filtrados');
      setTopicosFiltrados([]);
      if (filtrosCarregados) {
        setTopicoId('');
      }
    }
  }, [areaId, topicos, filtrosCarregados]);

  /**
   * Guarda os filtros no localStorage sempre que algum filtro muda
   * Só executa após os filtros terem sido carregados inicialmente para evitar sobrescrever com valores vazios
   */
  useEffect(() => {
    if (filtrosCarregados) {
      guardarFiltrosNoStorage();
    }
  }, [searchFilter, categoriaId, areaId, topicoId, tipoFiltro, estadoFiltro, filtrosCarregados]);

  /**
   * Busca os cursos em que o utilizador está inscrito
   * Utiliza API específica para inscrições e converte os dados para o formato esperado
   * Esta função é chamada quando o filtro de estado está definido como "inscrito"
   */
  const fetchCursosInscritos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      };

      console.log("A buscar cursos inscritos...");
      const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
      
      // Processa os dados da resposta que podem vir em diferentes formatos
      let inscricoesData = [];
      
      if (Array.isArray(response.data)) {
        inscricoesData = response.data;
      } else if (response.data && response.data.inscricoes) {
        inscricoesData = response.data.inscricoes;
      } else if (response.data && typeof response.data === 'object') {
        const possibleKeys = ['data', 'items', 'results', 'cursos'];
        for (const key of possibleKeys) {
          if (response.data[key] && Array.isArray(response.data[key])) {
            inscricoesData = response.data[key];
            break;
          }
        }
      }

      // Converte as inscrições para o formato de cursos esperado pelo componente
      const cursosInscritos = inscricoesData.map(inscricao => {
        const cursoId = inscricao.cursoId || inscricao.id_curso || inscricao.id;
        const nomeCurso = inscricao.nomeCurso || inscricao.curso?.nome || 'Curso sem nome';
        
        return {
          id_curso: cursoId,
          nome: nomeCurso,
          data_inicio: inscricao.data_inicio || inscricao.curso?.data_inicio || new Date(),
          data_fim: inscricao.data_fim || inscricao.curso?.data_fim || new Date(),
          tipo: inscricao.tipo || inscricao.curso?.tipo || 'sincrono',
          vagas: inscricao.vagas || inscricao.curso?.vagas || 0,
          imagem_path: inscricao.imagem_path || inscricao.curso?.imagem_path || null,
          estado: inscricao.status || inscricao.estado_inscricao || 'inscrito'
        };
      });

      console.log(`Cursos inscritos processados: ${cursosInscritos.length}`);
      return cursosInscritos;

    } catch (error) {
      console.error("Erro ao buscar cursos inscritos:", error);
      throw error;
    }
  };

  /**
   * Função principal para buscar cursos da API com todos os filtros aplicados
   * Implementa controlo de estado para evitar chamadas simultâneas à API
   * Distingue entre busca de cursos normais e cursos inscritos
   */
  const fetchCursos = async () => {
    // Evita múltiplas chamadas simultâneas à API
    if (isLoading) {
      console.log("Busca já em curso, a ignorar nova requisição");
      return;
    }

    try {
      setIsLoading(true);
      console.log("A iniciar busca de cursos...");
      
      // Se o filtro é "inscrito", usa a API específica de inscrições
      if (estadoFiltro === 'inscrito') {
        console.log("Filtro 'inscrito' detectado, a usar API de inscrições");
        const cursosInscritos = await fetchCursosInscritos();
        
        // Aplica os filtros restantes aos cursos inscritos
        let cursosFiltrados = cursosInscritos;
        
        // Aplica filtro de pesquisa por nome do curso
        if (searchFilter) {
          cursosFiltrados = cursosFiltrados.filter(curso => 
            curso.nome.toLowerCase().includes(searchFilter.toLowerCase())
          );
        }
        
        // Aplica filtro de tipo de curso (síncrono/assíncrono)
        if (tipoFiltro !== 'todos') {
          cursosFiltrados = cursosFiltrados.filter(curso => curso.tipo === tipoFiltro);
        }
        
        // Implementa paginação manual para cursos inscritos
        const startIndex = (currentPage - 1) * cursosPerPage;
        const endIndex = startIndex + cursosPerPage;
        const cursosPaginados = cursosFiltrados.slice(startIndex, endIndex);
        
        setCursos(cursosPaginados);
        setTotalPages(Math.ceil(cursosFiltrados.length / cursosPerPage));
        setTotalCursos(cursosFiltrados.length);
        
        console.log(`Cursos inscritos carregados: ${cursosPaginados.length} de ${cursosFiltrados.length}`);
        
      } else {
        // Usa a API normal de cursos para outros filtros
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: cursosPerPage.toString()
        });

        // Adiciona filtros aos parâmetros da URL apenas se estiverem definidos
        if (searchFilter) params.append('search', searchFilter);
        if (!isValueEmpty(categoriaId)) params.append('categoria', categoriaId);
        if (!isValueEmpty(areaId)) params.append('area', areaId);
        if (!isValueEmpty(topicoId)) params.append('topico', topicoId);
        if (tipoFiltro !== 'todos') params.append('tipo', tipoFiltro);
        if (estadoFiltro !== 'todos') params.append('estado', estadoFiltro);

        const url = `${API_BASE}/cursos?${params.toString()}`;
        console.log("A buscar cursos na URL:", url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        console.log("Resposta da API recebida:", data);
        setCursos(data.cursos || []);
        setTotalPages(data.totalPages || 1);
        setTotalCursos(data.total || 0);
      }
      
      // Marca o carregamento inicial como concluído
      if (initialLoad) {
        setInitialLoad(false);
      }
      
    } catch (fetchError) {
      console.error("Erro na requisição:", fetchError);
      toast.error("Erro ao carregar cursos. Por favor, tenta novamente.");
      setCursos([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifica se o utilizador atual pode aceder a um curso específico
   * Implementa as regras de negócio para diferentes tipos e estados de curso
   * - Administradores têm acesso total
   * - Cursos em curso são acessíveis a todos
   * - Cursos assíncronos terminados ficam bloqueados
   * - Cursos síncronos terminados só são acessíveis a quem estava inscrito
   */
  const podeAcederCurso = (cursoData, inscrito) => {
    // Administradores (role 1) têm acesso total a todos os cursos
    if (userRole === 1) return true;
    
    const dataAtual = new Date();
    const dataFimCurso = new Date(cursoData.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;
    
    // Se o curso ainda não terminou, permite acesso a todos
    if (!cursoTerminado) return true;
    
    // Para cursos assíncronos terminados, nega acesso completamente
    if (cursoData.tipo === 'assincrono') return false;
    
    // Para cursos síncronos terminados, só permite se o utilizador estiver inscrito
    if (cursoData.tipo === 'sincrono' && inscrito) return true;
    
    return false;
  };

  /**
   * Gera uma mensagem de bloqueio apropriada baseada no estado do curso e inscrição
   * Fornece feedback claro ao utilizador sobre porque não pode aceder ao curso
   */
  const getMensagemBloqueio = (cursoData, inscrito) => {
    const dataAtual = new Date();
    const dataFimCurso = new Date(cursoData.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;
    
    if (!cursoTerminado) {
      return "Este curso ainda não iniciou ou não tens permissão de acesso.";
    }
    
    if (cursoData.tipo === 'assincrono') {
      return "Este curso assíncrono já terminou e não está mais disponível.";
    }
    
    if (cursoData.tipo === 'sincrono' && !inscrito) {
      return "Este curso síncrono já terminou e só está disponível para alunos que estavam inscritos.";
    }
    
    return "Não tens permissão para aceder a este curso.";
  };

  /**
   * Gere o clique num cartão de curso
   * Verifica permissões de acesso antes de navegar para a página do curso
   * Implementa verificação de autenticação e estado de inscrição
   */
  const handleCursoClick = async (cursoId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Sessão expirada. Faz login novamente.");
        navigate('/login');
        return;
      }

      // Busca os dados completos do curso
      const cursoResponse = await axios.get(`${API_BASE}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cursoData = cursoResponse.data;

      // Verifica se o utilizador está inscrito no curso
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

      // Aplica as regras de acesso ao curso
      if (!podeAcederCurso(cursoData, inscrito)) {
        toast.error(getMensagemBloqueio(cursoData, inscrito), { 
          position: "top-center",
          autoClose: 5000
        });
        return;
      }

      // Se todas as verificações passaram, navega para a página do curso
      navigate(`/cursos/${cursoId}`);

    } catch (error) {
      console.error('Erro ao verificar acesso ao curso:', error);
      
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faz login novamente.");
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast.error("Curso não encontrado.");
      } else {
        toast.error("Erro ao verificar acesso ao curso. Tenta novamente mais tarde.");
      }
    }
  };

  /**
   * Executa a busca de cursos quando os filtros ativos ou a página mudam
   * Só executa se os filtros já foram carregados do localStorage para evitar buscas desnecessárias
   */
  useEffect(() => {
    if (filtrosCarregados && !isLoading) {
      fetchCursos();
    }
  }, [currentPage, searchFilter, categoriaId, areaId, tipoFiltro, topicoId, estadoFiltro, filtrosCarregados]);

  /**
   * Executa o carregamento inicial da página apenas uma vez
   * Só executa após os filtros terem sido carregados e processados
   */
  useEffect(() => {
    if (initialLoad && filtrosCarregados && !isLoading) {
      console.log("A executar carregamento inicial da página");
      fetchCursos();
    }
  }, [initialLoad, filtrosCarregados]);

  /**
   * Volta para a página 1 quando qualquer filtro ativo muda
   * Isto garante que não ficamos numa página que não existe após filtrar
   */
  useEffect(() => {
    if (filtrosCarregados) {
      setCurrentPage(1);
    }
  }, [searchFilter, categoriaId, areaId, tipoFiltro, topicoId, estadoFiltro]);

  // Funções de navegação entre páginas
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Função para mostrar/esconder o painel de filtros
  const toggleFilters = () => setShowFilters(!showFilters);

  /**
   * Gere a mudança de categoria no dropdown
   * Quando muda categoria, as áreas e tópicos são automaticamente filtrados
   */
  const handleCategoriaChange = e => {
    const novaCategoria = e.target.value;
    console.log('🔄 [FILTROS] Categoria alterada para:', novaCategoria);
    setCategoriaId(novaCategoria);
  };

  /**
   * Gere a mudança de área no dropdown
   * Valida se há uma categoria selecionada primeiro
   */
  const handleAreaChange = e => {
    console.log('🔄 [FILTROS] Tentativa de alterar área. Categoria atual:', categoriaId);
    
    if (isValueEmpty(categoriaId)) {
      toast.warning("Por favor, seleciona uma Categoria primeiro!", { position: "top-center" });
      return;
    }
    
    const novaArea = e.target.value;
    console.log('🔄 [FILTROS] Área alterada para:', novaArea);
    setAreaId(novaArea);
  };

  /**
   * Gere o clique no dropdown de área quando está inativo
   * Mostra aviso ao utilizador se não selecionou categoria primeiro
   */
  const handleAreaClick = () => {
    console.log('🖱️ [FILTROS] Clique na área. Categoria atual:', categoriaId);
    
    if (isValueEmpty(categoriaId)) {
      toast.warning("Deves selecionar uma categoria primeiro!", { position: "top-center" });
    }
  };

  /**
   * Gere a mudança de tópico no dropdown
   * Valida se há uma área selecionada primeiro
   */
  const handleTopicoChange = e => {
    console.log('🔄 [FILTROS] Tentativa de alterar tópico. Área atual:', areaId);
    
    if (isValueEmpty(areaId)) {
      toast.warning("Por favor, seleciona uma Área primeiro!", { position: "top-center" });
      return;
    }
    
    const novoTopico = e.target.value;
    console.log('🔄 [FILTROS] Tópico alterado para:', novoTopico);
    setTopicoId(novoTopico);
  };

  /**
   * Gere o clique no dropdown de tópico quando está inativo
   * Mostra aviso ao utilizador se não selecionou área primeiro
   */
  const handleTopicoClick = () => {
    console.log('🖱️ [FILTROS] Clique no tópico. Área atual:', areaId);
    
    if (isValueEmpty(areaId)) {
      toast.warning("Deves selecionar uma área primeiro!", { position: "top-center" });
    }
  };

  /**
   * Gere mudanças na caixa de texto de pesquisa
   * Atualiza apenas o valor visual, não dispara filtros
   */
  const handleSearchInputChange = e => setSearchInput(e.target.value);

  /**
   * Ativa a pesquisa baseada no valor atual da caixa de texto
   * Esta função é chamada quando se clica no ícone da lupa ou pressiona Enter
   */
  const handleSearchSubmit = () => {
    setSearchFilter(searchInput.trim());
  };

  /**
   * Gere a tecla pressionada na caixa de pesquisa
   * Ativa pesquisa quando pressiona Enter
   */
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  /**
   * Limpa todos os filtros aplicados e volta ao estado inicial
   * Remove também os filtros guardados no localStorage para não os restaurar na próxima visita
   */
  const clearFilters = () => {
    setSearchInput('');
    setSearchFilter('');
    setCategoriaId('');
    setAreaId('');
    setTopicoId('');
    setTipoFiltro('todos');
    setEstadoFiltro('todos');
    
    // Remove filtros guardados do localStorage
    limparFiltrosDoStorage();
  };

  /**
   * Gere a mudança do filtro de estado do curso
   * Quando muda para "inscrito", limpa filtros hierarchicos que não se aplicam
   */
  const handleEstadoChange = (valor) => {
    setEstadoFiltro(valor);
    
    // Quando muda para "inscrito", limpa filtros que não se aplicam
    if (valor === 'inscrito') {
      setCategoriaId('');
      setAreaId('');
      setTopicoId('');
    }
  };

  /**
   * Constrói a URL da imagem do curso com fallback
   * Tenta usar a imagem específica do curso, depois uma imagem gerada, e por fim a imagem padrão
   */
  const getImageUrl = curso => curso?.imagem_path ? `${API_BASE}/${curso.imagem_path}` :
    curso?.nome
      ? IMAGES.CURSO(curso.nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""))
      : fallbackCurso;

  // Determina se deve mostrar o indicador de carregamento
  const showLoading = isLoading || initialLoad || !filtrosCarregados;

  return (
    <div className="p-6-lc min-h-screen-lc flex flex-col bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <h1 className="page-title-lc">Cursos</h1>

      {/* Sistema de pesquisa e filtros */}
      <div className="cursos-search-container-lc">
        <div className="cursos-search-input-container-lc">
          <i 
            className="fas fa-search cursos-search-icon-lc" 
            onClick={handleSearchSubmit}
            style={{ cursor: 'pointer' }}
          ></i>
          <input 
            type="text" 
            placeholder="Nome do curso" 
            value={searchInput} 
            onChange={handleSearchInputChange}
            onKeyPress={handleSearchKeyPress}
            className="cursos-search-input-lc" 
            disabled={showLoading}
          />
        </div>
        <button 
          className="cursos-filter-button-lc" 
          onClick={toggleFilters}
          disabled={showLoading}
        >
          <i className="fas fa-filter cursos-filter-icon-lc"></i><span>Filtros</span>
        </button>
      </div>

      {/* Painel de filtros expansível */}
      {showFilters && (
        <div className="cursos-filter-options-lc">          
          <div className="cursos-filter-group-lc">
            {/* Filtro de Categoria - sempre ativo mas desabilitado se inscrito */}
            <div className="custom-select-wrapper-lc">
              <select 
                className="custom-select-button-lc select-categoria-lc" 
                value={categoriaId} 
                onChange={handleCategoriaChange}
                disabled={showLoading || estadoFiltro === 'inscrito'}
                style={estadoFiltro === 'inscrito' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <option value="">Selecionar Categoria</option>
                {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome}</option>)}
              </select>
              <i className="fas fa-folder custom-select-icon-lc"></i>
            </div>

            {/* Filtro de Área - inativo se não há categoria ou se inscrito */}
            <div className="custom-select-wrapper-lc">
              <select 
                className="custom-select-button-lc select-area-lc" 
                value={areaId} 
                onChange={handleAreaChange}
                onClick={handleAreaClick}
                disabled={isValueEmpty(categoriaId) || showLoading || estadoFiltro === 'inscrito'}
                style={estadoFiltro === 'inscrito' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <option value="">Selecionar Área</option>
                {showLoading
                  ? <option disabled>A carregar áreas...</option>
                  : areasFiltradas.length
                    ? areasFiltradas.map(area => <option key={area.id_area} value={area.id_area}>{area.nome}</option>)
                    : <option disabled>Seleciona uma categoria primeiro</option>
                }
              </select>
              <i className="fas fa-bookmark custom-select-icon-lc"></i>
            </div>

            {/* Filtro de Tópico - inativo se não há área ou se inscrito */}
            <div className="custom-select-wrapper-lc">
              <select 
                className="custom-select-button-lc select-topico-lc" 
                value={topicoId} 
                onChange={handleTopicoChange}
                onClick={handleTopicoClick}
                disabled={showLoading || isValueEmpty(areaId) || estadoFiltro === 'inscrito'}
                style={estadoFiltro === 'inscrito' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <option value="">Selecionar Tópico</option>
                {showLoading
                  ? <option disabled>A carregar tópicos...</option>
                  : isValueEmpty(areaId)
                    ? <option disabled>Seleciona uma área primeiro</option>
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

            {/* Filtro de Tipo de Curso - agora como dropdown */}
            <div className="custom-select-wrapper-lc">
              <select 
                className="custom-select-button-lc select-tipo-lc" 
                value={tipoFiltro} 
                onChange={(e) => setTipoFiltro(e.target.value)}
                disabled={showLoading}
              >
                <option value="todos">Tipos</option>
                <option value="sincrono">Síncronos</option>
                <option value="assincrono">Assíncronos</option>
              </select>
              <i className="fas fa-graduation-cap custom-select-icon-lc"></i>
            </div>

            {/* Filtro de Estado do Curso */}
            <div className="custom-select-wrapper-lc">
              <select 
                className="custom-select-button-lc select-estado-lc" 
                value={estadoFiltro} 
                onChange={(e) => handleEstadoChange(e.target.value)}
                disabled={showLoading}
              >
                <option value="todos">Estados</option>
                <option value="planeado">Planeado</option>
                <option value="em_curso">Em Curso</option>
                <option value="terminado">Terminado</option>
                <option value="inscrito">Inscrito</option>
              </select>
              <i className="fas fa-clock custom-select-icon-lc"></i>
            </div>

            {/* Botão para limpar todos os filtros */}
            {(searchFilter || !isValueEmpty(categoriaId) || !isValueEmpty(areaId) || !isValueEmpty(topicoId) || tipoFiltro !== 'todos' || estadoFiltro !== 'todos') && (
              <button 
                className="cursos-filter-clear-button-lc" 
                onClick={clearFilters}
                disabled={showLoading}
              >
                <i className="fas fa-times cursos-filter-button-icon-lc"></i><span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Indicador de carregamento */}
      {showLoading && (
        <div className="text-center-lc py-8">
          <div className="loading-spinner-lc"></div>
          <p className="text-gray-600 mt-4">
            {initialLoad 
              ? 'A carregar cursos pela primeira vez...' 
              : !filtrosCarregados
                ? 'A restaurar filtros guardados...'
                : 'A carregar cursos...'
            }
          </p>
        </div>
      )}

      {/* Grelha de cartões de cursos */}
      {!showLoading && (
        <div className="grid-lc">
          {cursos.map(curso => (
            <div 
              key={curso.id_curso} 
              onClick={() => handleCursoClick(curso.id_curso)} 
              className="curso-card-lc cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105" 
              style={{ 
                backgroundImage: `url(${getImageUrl(curso)})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              }}
            >
              <div className="curso-card-overlay-lc">
                <span className="curso-overlay-title-lc">{curso.nome}</span>
                <span className="curso-overlay-dates-lc">
                  {new Date(curso.data_inicio).toLocaleDateString('pt-PT')} - {new Date(curso.data_fim).toLocaleDateString('pt-PT')}
                </span>
                <span className="curso-overlay-vagas-lc">
                  {curso.tipo === 'sincrono' ? `${curso.vagas || 0} vagas` : 'Auto-estudo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {!showLoading && cursos.length === 0 && (
        <div className="text-center-lc py-10">
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
          <p className="text-gray-600 text-lg">
            {initialLoad 
              ? 'Nenhum curso disponível no momento.' 
              : estadoFiltro === 'inscrito'
                ? 'Não estás inscrito em nenhum curso.'
                : 'Nenhum curso encontrado com os filtros selecionados.'
            }
          </p>
          {!initialLoad && (
            <button 
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {estadoFiltro === 'inscrito' 
                ? '🔍 Ver todos os cursos disponíveis' 
                : 'Limpar filtros e ver todos'
              }
            </button>
          )}
        </div>
      )}

      {/* Sistema de paginação */}
      {!showLoading && cursos.length > 0 && (
        <div className="flex justify-center items-center my-6 pagination-container-lc">
          <button 
            onClick={goToPreviousPage} 
            disabled={currentPage === 1} 
            className={`px-4 py-2 pagination-button-lc ${currentPage === 1 ? 'pagination-disabled-lc' : 'pagination-active-lc'}`} 
            aria-label="Página anterior"
          >
            <span className="pagination-icon">&#10094;</span>
          </button>
          <span className="mx-4 text-lg font-medium pagination-info-lc">{currentPage}/{totalPages}</span>
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages} 
            className={`px-4 py-2 pagination-button-lc ${currentPage === totalPages ? 'pagination-disabled-lc' : 'pagination-active-lc'}`} 
            aria-label="Próxima página"
          >
            <span className="pagination-icon">&#10095;</span>
          </button>
        </div>
      )}
    </div>
  );
}