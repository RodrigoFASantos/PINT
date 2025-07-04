import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormadorModal from '../../components/users/Formador_Modal';
import CursoAssociacaoModal from '../../components/cursos/Associar_Curso_Modal';
import API_BASE, { IMAGES } from "../../api";
import './css/Criar_Curso.css';

/**
 * Configuração personalizada do ToastContainer para notificações
 * 
 * Define configurações específicas para as notificações da página de edição,
 * evitando conflitos com outras notificações na aplicação.
 */
const ToastContainerConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  limit: 3,
  toastClassName: "custom-toast",
  containerId: "editar-curso-toast"
};

/**
 * Componente principal para edição de cursos existentes
 * 
 * Este componente fornece uma interface completa para editar cursos com
 * funcionalidades avançadas de gestão:
 * - Carregamento e pré-preenchimento dos dados existentes
 * - Upload de nova imagem de capa
 * - Alteração de formador com validações
 * - Gestão de associações bidirecionais entre cursos
 * - Validações específicas para datas e tipos de curso
 * - Proteção contra alterações em cursos já iniciados
 * - Sistema integrado de notificações automáticas
 */
const EditarCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // === ESTADOS DE INTERFACE ===
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // === ESTADOS DE MODAIS ===
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAssociacaoAberto, setModalAssociacaoAberto] = useState(false);

  // === ESTADOS PARA DADOS DO SERVIDOR ===
  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [topicosFiltrados, setTopicosFiltrados] = useState([]);

  // === ESTADOS FUNCIONAIS ===
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [formadorNome, setFormadorNome] = useState('');
  const [dataInicioUltrapassada, setDataInicioUltrapassada] = useState(false);
  const [erroDataFim, setErroDataFim] = useState('');

  // === ESTADOS PARA GESTÃO DE ASSOCIAÇÕES ===
  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [loadingAssociacoes, setLoadingAssociacoes] = useState(false);

  // === ESTADO PRINCIPAL DO FORMULÁRIO ===
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    vagas: '',
    data_inicio: '',
    data_fim: '',
    id_formador: '',
    id_area: '',
    id_categoria: '',
    id_topico_area: '',
    duracao: '',
    imagem: null,
  });

  /**
   * Carrega lista de cursos associados ao curso atual
   * 
   * Mostra associações bidirecionais existentes, permitindo visualizar
   * e gerir relações entre cursos. As associações ajudam na descoberta
   * de conteúdo relacionado pelos utilizadores.
   */
  const carregarCursosAssociados = async () => {
    try {
      setLoadingAssociacoes(true);
      const token = localStorage.getItem('token');
      
      console.log(`🔗 [EDITAR] A carregar associações para curso ${id}`);
      
      const response = await axios.get(`${API_BASE}/associar-cursos/curso/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setCursosAssociados(response.data);
        console.log(`✅ [EDITAR] ${response.data.length} cursos associados carregados`);
      }
    } catch (error) {
      console.error('❌ [EDITAR] Erro ao carregar cursos associados:', error);
      setCursosAssociados([]);
      
      // Mostrar erro apenas se não for 404 (curso sem associações)
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar associações de cursos', {
          containerId: "editar-curso-toast"
        });
      }
    } finally {
      setLoadingAssociacoes(false);
    }
  };

  /**
   * Cria nova associação entre o curso atual e um curso selecionado
   * 
   * Verifica duplicatas e atualiza a lista automaticamente após criação.
   * As associações são bidirecionais, permitindo navegação em ambas as direções.
   * 
   * @param {Object} cursoSelecionado - Dados do curso a associar
   */
  const handleAssociarCurso = async (cursoSelecionado) => {
    try {
      const token = localStorage.getItem('token');

      console.log(`🔗 [EDITAR] A criar associação com curso: ${cursoSelecionado.nome}`);

      // Verificar se já existe associação (bidirecional)
      const jaAssociado = cursosAssociados.some(assoc => {
        return (assoc.id_curso_origem === parseInt(id) && assoc.id_curso_destino === cursoSelecionado.id_curso) ||
          (assoc.id_curso_destino === parseInt(id) && assoc.id_curso_origem === cursoSelecionado.id_curso);
      });

      if (jaAssociado) {
        toast.info(`O curso "${cursoSelecionado.nome}" já está associado a este curso`, {
          containerId: "editar-curso-toast"
        });
        return;
      }

      // Criar nova associação
      await axios.post(`${API_BASE}/associar-cursos`, {
        id_curso_origem: parseInt(id),
        id_curso_destino: cursoSelecionado.id_curso,
        descricao: `Associação criada durante a edição`
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Curso "${cursoSelecionado.nome}" associado com sucesso!`, {
        containerId: "editar-curso-toast"
      });

      // Recarregar lista de associações para refletir a mudança
      await carregarCursosAssociados();
    } catch (error) {
      console.error('❌ [EDITAR] Erro ao associar curso:', error);
      toast.error(`Erro ao associar curso: ${error.response?.data?.message || error.message}`, {
        containerId: "editar-curso-toast"
      });
    }
  };

  /**
   * Remove associação existente entre cursos
   * 
   * @param {number} idAssociacao - ID da associação a remover
   * @param {string} nomeCurso - Nome do curso para feedback
   */
  const removerAssociacao = async (idAssociacao, nomeCurso) => {
    try {
      const token = localStorage.getItem('token');

      console.log(`🗑️ [EDITAR] A remover associação ${idAssociacao}`);

      await axios.delete(`${API_BASE}/associar-cursos/${idAssociacao}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Associação com "${nomeCurso}" removida com sucesso!`, {
        containerId: "editar-curso-toast"
      });

      // Recarregar associações após remoção
      await carregarCursosAssociados();
    } catch (error) {
      console.error('❌ [EDITAR] Erro ao remover associação:', error);
      toast.error(`Erro ao remover associação: ${error.response?.data?.message || error.message}`, {
        containerId: "editar-curso-toast"
      });
    }
  };

  /**
   * Determina qual curso está associado baseado na direção da associação
   * 
   * Como as associações são bidirecionais, precisa identificar o "outro" curso
   * que não é o curso atual a ser editado.
   * 
   * @param {Object} associacao - Dados da associação
   * @returns {Object} Dados do curso associado
   */
  const obterCursoAssociado = (associacao) => {
    return associacao.id_curso_origem === parseInt(id)
      ? associacao.cursoDestino
      : associacao.cursoOrigem;
  };

  /**
   * Carrega dados do curso e recursos necessários quando o componente monta
   * 
   * Executa carregamento paralelo de:
   * 1. Dados completos do curso a ser editado
   * 2. Recursos do sistema (formadores, categorias, áreas, tópicos)
   * 3. Lista de cursos associados
   */
  useEffect(() => {
    /**
     * Carrega detalhes completos do curso a ser editado
     * 
     * Inclui validação de permissões, verificação de datas e
     * configuração do estado inicial do formulário.
     */
    const fetchCursoDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.warn('⚠️ [EDITAR] Token não encontrado - a redirecionar para login');
          navigate('/login');
          return;
        }

        console.log(`📖 [EDITAR] A carregar detalhes do curso ${id}`);

        // Obter dados completos do curso com relações
        const responseCurso = await axios.get(`${API_BASE}/cursos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const cursoData = responseCurso.data;
        console.log('✅ [EDITAR] Dados do curso carregados:', cursoData);

        /**
         * Formata data do formato ISO para o formato HTML date input (YYYY-MM-DD)
         * 
         * @param {string} dataString - Data em formato ISO
         * @returns {string} Data formatada para input HTML
         */
        const formatarData = (dataString) => {
          const data = new Date(dataString);
          return data.toISOString().split('T')[0];
        };

        // === VERIFICAÇÃO DE PROTEÇÕES TEMPORAIS ===
        // Verificar se a data de início já passou (proteção contra alterações)
        const dataAtual = new Date();
        const dataInicio = new Date(cursoData.data_inicio);
        const dataInicioPassou = dataInicio <= dataAtual;
        setDataInicioUltrapassada(dataInicioPassou);

        if (dataInicioPassou) {
          toast.info('A data limite de inscrição já passou. Algumas alterações podem estar limitadas.', {
            containerId: "editar-curso-toast"
          });
        }

        // === PREENCHIMENTO DO FORMULÁRIO ===
        setFormData({
          nome: cursoData.nome || '',
          descricao: cursoData.descricao || '',
          tipo: cursoData.tipo || '',
          vagas: cursoData.vagas || '',
          data_inicio: formatarData(cursoData.data_inicio) || '',
          data_fim: formatarData(cursoData.data_fim) || '',
          id_formador: cursoData.id_formador || '',
          id_area: cursoData.id_area || '',
          id_categoria: cursoData.id_categoria || '',
          id_topico_area: cursoData.id_topico_area || '',
          duracao: cursoData.duracao || '',
          imagem: null // Sempre null para novo upload
        });

        // === CONFIGURAÇÃO DE PREVIEW DE IMAGEM EXISTENTE ===
        if (cursoData.imagem_path) {
          const imagemUrl = `${API_BASE}/${cursoData.imagem_path}`;
          setPreviewImage(imagemUrl);
          console.log(`🖼️ [EDITAR] Preview de imagem configurado: ${imagemUrl}`);
        }

        // === GUARDAR NOME DO FORMADOR ATUAL ===
        if (cursoData.formador) {
          setFormadorNome(cursoData.formador.nome);
          console.log(`👨‍🏫 [EDITAR] Formador atual: ${cursoData.formador.nome}`);
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ [EDITAR] Erro ao carregar dados do curso:', error);
        
        if (error.response?.status === 404) {
          toast.error('Curso não encontrado.', { containerId: "editar-curso-toast" });
        } else if (error.response?.status === 403) {
          toast.error('Não tens permissão para editar este curso.', { containerId: "editar-curso-toast" });
        } else {
          toast.error('Erro ao carregar dados do curso. Tenta novamente mais tarde.', {
            containerId: "editar-curso-toast"
          });
        }
        
        // Redirecionar para lista de cursos em caso de erro
        setTimeout(() => navigate('/admin/cursos'), 3000);
      }
    };

    /**
     * Carrega recursos necessários do sistema
     * 
     * Carrega formadores, categorias, áreas e tópicos disponíveis
     * para preencher os dropdowns do formulário.
     */
    const fetchResources = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setIsLoadingFilters(true);
        console.log('📊 [EDITAR] A carregar recursos do sistema...');

        // === CARREGAR FORMADORES DISPONÍVEIS ===
        const responseFormadores = await axios.get(`${API_BASE}/users/formadores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFormadores(responseFormadores.data);
        console.log(`✅ [EDITAR] ${responseFormadores.data.length} formadores carregados`);

        // === CARREGAR CATEGORIAS ===
        const responseCategorias = await axios.get(`${API_BASE}/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCategorias(responseCategorias.data);
        console.log(`✅ [EDITAR] ${responseCategorias.data.length} categorias carregadas`);

        // === CARREGAR ÁREAS ===
        const responseAreas = await axios.get(`${API_BASE}/areas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setAreas(responseAreas.data);
        console.log(`✅ [EDITAR] ${responseAreas.data.length} áreas carregadas`);

        // === CARREGAR TÓPICOS DISPONÍVEIS ===
        const responseTopicos = await axios.get(`${API_BASE}/topicos-area`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("📋 [EDITAR] Resposta completa da API de tópicos:", responseTopicos.data);

        // Processar estrutura da resposta da API (pode variar)
        if (responseTopicos.data.success && Array.isArray(responseTopicos.data.data)) {
          const topicoData = responseTopicos.data.data;
          console.log(`✅ [EDITAR] ${topicoData.length} tópicos carregados`);
          
          if (topicoData[0]) {
            console.log("📋 [EDITAR] Estrutura do primeiro tópico:", topicoData[0]);
          }
          
          setTopicos(topicoData);
        } else {
          console.error("❌ [EDITAR] Formato de dados inesperado para tópicos:", responseTopicos.data);
          setTopicos([]);
          toast.warning('Formato de resposta inesperado para tópicos', {
            containerId: "editar-curso-toast"
          });
        }

      } catch (error) {
        console.error('❌ [EDITAR] Erro ao carregar recursos:', error);
        toast.error('Erro ao carregar dados. Verifica a tua ligação.', {
          containerId: "editar-curso-toast"
        });
        
        // Definir arrays vazios em caso de erro para evitar crashes
        setFormadores([]);
        setCategorias([]);
        setAreas([]);
        setTopicos([]);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    // Executar carregamentos em paralelo
    fetchCursoDetails();
    fetchResources();
    carregarCursosAssociados();
  }, [id, navigate]);

  /**
   * Valida se as datas são consistentes (data fim >= data início)
   * 
   * @param {string} dataInicio - Data de início no formato YYYY-MM-DD
   * @param {string} dataFim - Data de fim no formato YYYY-MM-DD
   * @returns {boolean} true se as datas são válidas
   */
  const validarDatas = (dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return true;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    return fim >= inicio;
  };

  /**
   * Filtra tópicos disponíveis baseado na área selecionada
   * 
   * Atualiza lista sempre que a área ou conjunto de tópicos muda.
   * Implementa lógica robusta para lidar com diferentes estruturas de dados.
   */
  useEffect(() => {
    if (formData.id_area && Array.isArray(topicos) && topicos.length > 0) {
      const areId = String(formData.id_area);

      console.log(`🔍 [EDITAR] A filtrar tópicos para área: ${areId}`);
      console.log(`📊 [EDITAR] Total de tópicos disponíveis: ${topicos.length}`);

      // Filtrar tópicos que pertencem à área selecionada
      const topicosFiltered = topicos.filter(topico => {
        const topicoAreaId = topico.id_area;
        const match = topicoAreaId && String(topicoAreaId) === areId;

        if (match) {
          console.log(`✓ [EDITAR] Tópico corresponde: ${topico.titulo} (área: ${topicoAreaId})`);
        }

        return match;
      });

      console.log(`✅ [EDITAR] ${topicosFiltered.length} tópicos filtrados para área ${areId}`);
      setTopicosFiltrados(topicosFiltered);

      // Debug se não houver tópicos filtrados
      if (topicosFiltered.length === 0) {
        console.log(`⚠️ [EDITAR] Nenhum tópico encontrado para área ${areId}`);
        const areasDisponiveis = [...new Set(topicos.map(t => t.id_area).filter(id => id))];
        console.log("📋 [EDITAR] Áreas disponíveis nos tópicos:", areasDisponiveis);
      }
    } else {
      console.log('🔄 [EDITAR] A limpar tópicos filtrados - condições não cumpridas');
      setTopicosFiltrados([]);
    }
  }, [formData.id_area, topicos]);

  /**
   * Filtra áreas baseado na categoria selecionada
   * 
   * Atualiza automaticamente quando a categoria muda, limpando
   * seleções dependentes para manter consistência.
   */
  useEffect(() => {
    if (formData.id_categoria) {
      const catId = String(formData.id_categoria);
      
      console.log(`🏷️ [EDITAR] A filtrar áreas para categoria: ${catId}`);
      
      const areasFiltered = areas.filter(area => {
        // Suportar diferentes formatos de ID de categoria
        const areaCategoriaId = area.id_categoria ?? area.categoria_id ?? area.idCategoria ?? area.categoriaId;
        return areaCategoriaId && String(areaCategoriaId) === catId;
      });
      
      console.log(`✅ [EDITAR] ${areasFiltered.length} áreas filtradas para categoria ${catId}`);
      setAreasFiltradas(areasFiltered);
    } else {
      setAreasFiltradas([]);
    }
  }, [formData.id_categoria, areas]);

  /**
   * Processa alterações nos campos do formulário
   * 
   * Inclui validações específicas e lógica de dependências entre campos.
   * Implementa proteções especiais para cursos que já iniciaram.
   * 
   * @param {Event} e - Evento de mudança do campo
   */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    console.log(`🔍 [EDITAR] Campo alterado: ${name} = ${name === 'imagem' ? 'FILE_OBJECT' : value}`);

    if (name === 'imagem') {
      // === PROCESSAMENTO DE NOVA IMAGEM ===
      const file = files[0];
      setFormData({ ...formData, imagem: file });

      // Criar preview da nova imagem
      if (file) {
        console.log(`📁 [EDITAR] Nova imagem selecionada: ${file.name} (${file.size} bytes)`);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
          toast.success('Nova imagem carregada!', { containerId: "editar-curso-toast" });
        };
        reader.onerror = () => {
          toast.error('Erro ao processar imagem.', { containerId: "editar-curso-toast" });
        };
        reader.readAsDataURL(file);
      }
      
    } else if (name === 'tipo') {
      // === LÓGICA ESPECÍFICA PARA MUDANÇA DE TIPO DE CURSO ===
      if (value === 'assincrono') {
        // Cursos assíncronos não precisam de vagas
        setFormData({ ...formData, [name]: value, vagas: '' });
        toast.info('Curso assíncrono selecionado. Vagas foram limpos.', {
          containerId: "editar-curso-toast"
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
      
    } else if (name === 'id_categoria') {
      // === LIMPAR CAMPOS DEPENDENTES AO MUDAR CATEGORIA ===
      setFormData({ ...formData, [name]: value, id_area: '', id_topico_area: '' });
      
    } else if (name === 'id_area') {
      // === LIMPAR TÓPICO AO MUDAR ÁREA ===
      setFormData({ ...formData, [name]: value, id_topico_area: '' });
      
    } else if (name === 'vagas' && dataInicioUltrapassada) {
      // === PROTEÇÃO: NÃO PERMITIR ALTERAÇÃO DE VAGAS APÓS DATA DE INÍCIO ===
      toast.warning('Não é possível alterar as vagas após a data limite de inscrição.', {
        containerId: "editar-curso-toast"
      });
      return;
      
    } else if (name === 'data_inicio' || name === 'data_fim') {
      // === VALIDAÇÃO ESPECIAL PARA DATAS ===
      const novoFormData = { ...formData, [name]: value };

      if (name === 'data_fim') {
        if (!validarDatas(novoFormData.data_inicio, value)) {
          setErroDataFim('A data de fim deve ser superior à data de início');
        } else {
          setErroDataFim('');
        }
      } else if (name === 'data_inicio') {
        if (!validarDatas(value, novoFormData.data_fim)) {
          setErroDataFim('A data de fim deve ser superior à data de início');
        } else {
          setErroDataFim('');
        }
      }

      setFormData(novoFormData);
      
    } else {
      // === CAMPOS GENÉRICOS ===
      setFormData({ ...formData, [name]: value });
    }
  };

  /**
   * Processa submissão do formulário para atualizar o curso
   * 
   * Inclui validação completa, criação de FormData, processamento de alterações
   * e tratamento de erros específicos. Integra com sistema de notificações automáticas.
   * 
   * @param {Event} e - Evento de submissão do formulário
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 [EDITAR] A iniciar submissão do formulário de edição");
    console.log("📊 [EDITAR] FormData atual:", formData);
    console.log("🖼️ [EDITAR] Nova imagem selecionada:", !!formData.imagem);

    // === VALIDAÇÕES OBRIGATÓRIAS ===
    
    // Validação para cursos síncronos
    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      toast.error('É necessário selecionar um formador para cursos síncronos', {
        containerId: "editar-curso-toast"
      });
      return;
    }

    // Validação de datas
    if (!validarDatas(formData.data_inicio, formData.data_fim)) {
      toast.error('A data de fim deve ser posterior à data de início', {
        containerId: "editar-curso-toast"
      });
      setErroDataFim('A data de fim deve ser posterior à data de início');
      return;
    }

    // === VALIDAÇÃO ADICIONAL: DATAS NÃO PODEM ESTAR NO PASSADO ===
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataInicio = new Date(formData.data_inicio);

    if (dataInicio < hoje && !dataInicioUltrapassada) {
      toast.error('A data de início não pode ser no passado', {
        containerId: "editar-curso-toast"
      });
      return;
    }

    // === CRIAR FORMDATA PARA ENVIO ===
    const data = new FormData();

    // Adicionar todos os campos relevantes ao FormData
    for (let key in formData) {
      if (key !== 'imagem_path' && formData[key] !== null && formData[key] !== '') {
        if (key === 'imagem' && formData[key]) {
          console.log(`📎 [EDITAR] A adicionar nova imagem ao FormData: ${formData[key].name}`);
          console.log(`📊 [EDITAR] Tipo: ${formData[key].type}, Tamanho: ${formData[key].size} bytes`);
          data.append(key, formData[key]);
        } else if (key !== 'imagem') {
          data.append(key, formData[key]);
        }
      }
    }

    // === DEBUG: VERIFICAR CONTEÚDO DO FORMDATA ===
    console.log("📋 [EDITAR] Conteúdo do FormData para envio:");
    for (let pair of data.entries()) {
      if (pair[1] instanceof File) {
        console.log(`📎 ${pair[0]}: ${pair[1].name} (${pair[1].type}, ${pair[1].size} bytes)`);
      } else {
        console.log(`📝 ${pair[0]}: ${pair[1]}`);
      }
    }

    try {
      console.log("📡 [EDITAR] A enviar requisição PUT para o servidor...");

      // === ENVIAR ATUALIZAÇÃO PARA O BACKEND ===
      const response = await axios.put(`${API_BASE}/cursos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 60000, // Timeout de 1 minuto para uploads grandes
      });

      console.log("✅ [EDITAR] Resposta do servidor:", response.data);

      // === FEEDBACK PRINCIPAL DE SUCESSO ===
      toast.success('Curso atualizado com sucesso!', {
        containerId: "editar-curso-toast"
      });

      // === MOSTRAR INFORMAÇÕES SOBRE NOTIFICAÇÕES ENVIADAS ===
      if (response.data.alteracoesNotificadas > 0) {
        setTimeout(() => {
          toast.info(
            `${response.data.alteracoesNotificadas} alteração${response.data.alteracoesNotificadas > 1 ? 'ões' : ''} notificada${response.data.alteracoesNotificadas > 1 ? 's' : ''} aos alunos inscritos`,
            {
              containerId: "editar-curso-toast",
              autoClose: 7000
            }
          );
        }, 1000);

        // Log das alterações para debug
        if (response.data.alteracoes && response.data.alteracoes.length > 0) {
          console.log("📋 [EDITAR] Alterações que foram notificadas:", response.data.alteracoes);

          // Para muitas alterações, mostrar detalhes no console
          if (response.data.alteracoes.length > 3) {
            setTimeout(() => {
              const alteracoesTexto = response.data.alteracoes
                .map(alt => `${alt.campo}: ${alt.valor_antigo} → ${alt.valor_novo}`)
                .join('\n');

              console.log("📊 [EDITAR] Detalhes das alterações:\n" + alteracoesTexto);
            }, 2000);
          }
        }
      }

      // === FEEDBACK SOBRE ATUALIZAÇÕES ESPECÍFICAS ===
      
      // Feedback sobre atualização de imagem
      if (response.data.imagemAtualizada) {
        console.log("🖼️ [EDITAR] Imagem foi atualizada com sucesso");
        setTimeout(() => {
          toast.info('Imagem do curso atualizada', {
            containerId: "editar-curso-toast"
          });
        }, 1500);
      }

      // Feedback sobre renomeação de pasta
      if (response.data.nomeMudou && response.data.pastaRenomeada) {
        console.log("📁 [EDITAR] Pasta do curso foi renomeada devido à alteração do nome");
      }

      // === REDIRECIONAR PARA PÁGINA DE DETALHES DO CURSO ===
      setTimeout(() => {
        navigate(`/cursos/${id}`);
      }, 3000);

    } catch (error) {
      console.error('❌ [EDITAR] Erro ao atualizar curso:', error);
      console.error('📋 [EDITAR] Response data:', error.response?.data);

      // === DETERMINAR MENSAGEM DE ERRO ESPECÍFICA ===
      let mensagemErro = 'Erro desconhecido';

      if (error.response?.data?.message) {
        mensagemErro = error.response.data.message;
      } else if (error.message) {
        mensagemErro = error.message;
      }

      toast.error(`Erro ao atualizar curso: ${mensagemErro}`, {
        containerId: "editar-curso-toast",
        autoClose: 8000
      });

      // === FEEDBACK ADICIONAL PARA ERROS DE VALIDAÇÃO ===
      if (error.response?.status === 400) {
        setTimeout(() => {
          toast.warning('Verifica se todos os campos obrigatórios estão preenchidos corretamente', {
            containerId: "editar-curso-toast"
          });
        }, 1000);
      } else if (error.response?.status === 403) {
        toast.error('Não tens permissão para editar este curso', {
          containerId: "editar-curso-toast"
        });
      } else if (error.response?.status === 404) {
        toast.error('Curso não encontrado', {
          containerId: "editar-curso-toast"
        });
        setTimeout(() => navigate('/admin/cursos'), 3000);
      }
    }
  };

  // === MOSTRAR SPINNER DE CARREGAMENTO ===
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex justify-center items-center">
            <div className="loading-spinner"></div>
            <p className="ml-3 text-gray-600">A carregar dados do curso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <form className='form' onSubmit={handleSubmit} encType="multipart/form-data">
        <h2>Editar Curso</h2>

        {/* === ÁREA DE UPLOAD/ALTERAÇÃO DE IMAGEM === */}
        <div className="image-upload-container">
          <label className="custom-file-upload">
            <input
              type="file"
              name="imagem"
              accept="image/*"
              onChange={handleChange}
            />
            <div className="folder">
              <div className="top"></div>
              <div className="bottom"></div>
            </div>
            <span>Alterar Imagem</span>
          </label>

          {previewImage && (
            <div className="image-preview">
              <img 
                src={previewImage} 
                alt="Preview" 
                style={{ 
                  width: '100%', 
                  maxHeight: '200px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }} 
              />
            </div>
          )}
        </div>

        {/* === CAMPOS DO FORMULÁRIO === */}
        <div className="inputs">
          {/* Linha 1: Nome e Tipo */}
          <div className="row">
            <input
              type="text"
              name="nome"
              placeholder="Nome do Curso"
              value={formData.nome}
              onChange={handleChange}
              required
              maxLength={100}
            />
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              <option value="">Seleciona o Tipo</option>
              <option value="sincrono">Síncrono</option>
              <option value="assincrono">Assíncrono</option>
            </select>
          </div>

          {/* Linha 2: Categoria, Área e Tópico */}
          <div className="row">
            <select
              name="id_categoria"
              value={formData.id_categoria}
              onChange={handleChange}
              required
            >
              <option value="">Seleciona a Categoria</option>
              {categorias.map(categoria => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            <select
              name="id_area"
              value={formData.id_area}
              onChange={handleChange}
              required
              disabled={!formData.id_categoria || isLoadingFilters}
            >
              <option value="">Seleciona a Área</option>
              {isLoadingFilters
                ? <option disabled>A carregar áreas...</option>
                : areasFiltradas.length
                  ? areasFiltradas.map(area => (
                    <option key={area.id_area} value={area.id_area}>
                      {area.nome}
                    </option>
                  ))
                  : <option disabled>Seleciona uma categoria primeiro</option>
              }
            </select>

            <select
              name="id_topico_area"
              value={formData.id_topico_area}
              onChange={handleChange}
              required
              disabled={!formData.id_area || isLoadingFilters}
            >
              <option value="">Seleciona o Tópico</option>
              {isLoadingFilters
                ? <option disabled>A carregar tópicos...</option>
                : !formData.id_area
                  ? <option disabled>Seleciona uma área primeiro</option>
                  : topicosFiltrados.length > 0
                    ? topicosFiltrados.map(topico => {
                      const id = topico.id_topico;
                      const nome = topico.titulo;
                      return (
                        <option key={id} value={id}>
                          {nome}
                          {topico.area && ` (${topico.area.nome})`}
                        </option>
                      );
                    })
                    : <option disabled>Nenhum tópico disponível para esta área</option>
              }
            </select>
          </div>

          {/* Linha 3: Formador e Vagas (condicional por tipo) */}
          <div className="row">
            {formData.tipo === 'sincrono' && (
              <button
                type="button"
                className="select-formador-button"
                onClick={() => setModalAberto(true)}
              >
                {formData.id_formador && formadorNome
                  ? `Formador: ${formadorNome}`
                  : "Selecionar Formador"}
              </button>
            )}

            {formData.tipo === 'assincrono' && (
              <div className="info-box">
                <i className="fas fa-info-circle"></i>
                Cursos assíncronos não precisam de formador
              </div>
            )}

            <input
              type="number"
              name="vagas"
              placeholder="Vagas"
              value={formData.vagas}
              onChange={handleChange}
              disabled={formData.tipo === 'assincrono' || dataInicioUltrapassada}
              required={formData.tipo === 'sincrono'}
              title={dataInicioUltrapassada ? "Não é possível alterar vagas após a data limite de inscrição" : ""}
            />
            
            {dataInicioUltrapassada && formData.tipo === 'sincrono' && (
              <div className="info-warning">
                <i className="fas fa-exclamation-triangle"></i>
                A data limite de inscrição já passou. As vagas não podem ser alteradas.
              </div>
            )}
          </div>

          {/* Linha 4: Duração e Datas */}
          <div className="row">
            <div className="input-group">
              <label>Duração</label>
              <input
                type="number"
                name="duracao"
                placeholder="Duração"
                value={formData.duracao}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="input-group">
              <label>Data de Início</label>
              <input
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Data de Término</label>
              <input
                type="date"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
                required
                className={erroDataFim ? 'input-error' : ''}
              />
              {erroDataFim && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {erroDataFim}
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          <textarea
            name="descricao"
            placeholder="Descrição do curso"
            value={formData.descricao}
            onChange={handleChange}
            rows="4"
            maxLength={500}
            required
          ></textarea>

          {/* === GESTÃO DE ASSOCIAÇÕES === */}
          <div className="associacoes-container">
            <h3 className="associacoes-titulo">Cursos Associados</h3>

            <button
              type="button"
              className="associar-curso-button"
              onClick={() => setModalAssociacaoAberto(true)}
            >
              <i className="fas fa-link"></i> Associar Novo Curso
            </button>

            {loadingAssociacoes ? (
              <div className="loading-associacoes">
                <div className="spinner-pequeno"></div>
                <span>A carregar associações...</span>
              </div>
            ) : cursosAssociados.length > 0 ? (
              <div className="lista-cursos-associados">
                {cursosAssociados.map(associacao => {
                  const cursoAssociado = obterCursoAssociado(associacao);

                  if (!cursoAssociado) return null;

                  return (
                    <div key={associacao.id_associacao} className="curso-associado-item">
                      <div className="curso-associado-info">
                        <span className="curso-nome">{cursoAssociado.nome}</span>
                        <span className="curso-tipo">{cursoAssociado.tipo}</span>
                      </div>
                      <button
                        type="button"
                        className="remover-associacao"
                        onClick={() => removerAssociacao(associacao.id_associacao, cursoAssociado.nome)}
                        title="Remover associação"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="sem-associacoes">Nenhum curso associado</p>
            )}
          </div>

          {/* === BOTÕES DE AÇÃO === */}
          <div className="buttons-row">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/cursos/${id}`)}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || isLoadingFilters}
            >
              Guardar Alterações
            </button>
          </div>
        </div>
      </form>

      {/* === MODAIS === */}
      <FormadorModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        setFormador={(id, nome) => {
          setFormData({ ...formData, id_formador: id });
          setFormadorNome(nome);
        }}
        users={formadores}
        currentFormadorId={formData.id_formador}
      />

      <CursoAssociacaoModal
        isOpen={modalAssociacaoAberto}
        onClose={() => setModalAssociacaoAberto(false)}
        onSelectCurso={handleAssociarCurso}
        cursoAtualId={parseInt(id)}
      />

      <ToastContainer
        {...ToastContainerConfig}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999
        }}
      />
    </div>
  );
};

export default EditarCurso;