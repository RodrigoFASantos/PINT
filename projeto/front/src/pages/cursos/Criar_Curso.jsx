import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import API_BASE from "../../api";
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import FormadorModal from '../../components/users/Formador_Modal';
import './css/Criar_Curso.css';
import CursoAssociacaoModal from '../../components/cursos/Associar_Curso_Modal';

const CriarCurso = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    vagas: '',
    duracao: '',
    data_inicio: '',
    data_fim: '',
    id_formador: '',
    id_area: '',
    id_categoria: '',
    id_topico: '',
    imagem: null,
  });

  const [modalAberto, setModalAberto] = useState(false);
  const [modalAssociacaoAberto, setModalAssociacaoAberto] = useState(false);

  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [topicosDisponiveis, setTopicosDisponiveis] = useState([]);

  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [topicosFetched, setTopicosFetched] = useState(false);

  const abrirModalAssociacao = () => {
    setModalAssociacaoAberto(true);
  };

  const handleAssociarCurso = (cursoSelecionado) => {
    if (!cursosAssociados.some(c => c.id_curso === cursoSelecionado.id_curso)) {
      setCursosAssociados([...cursosAssociados, cursoSelecionado]);
      toast.success(`Curso "${cursoSelecionado.nome}" adicionado à lista de associações`);
    } else {
      toast.info(`Curso "${cursoSelecionado.nome}" já está na lista de associações`);
    }
  };

  const removerAssociacao = (cursoId) => {
    setCursosAssociados(cursosAssociados.filter(c => c.id_curso !== cursoId));
    toast.info("Curso removido da lista de associações");
  };

  useEffect(() => {
    if (formData.id_categoria && formData.id_area) {
      setIsLoading(true);
      setTopicosFetched(false);

      console.log(`🔍 [CRIAR] A procurar tópicos para categoria=${formData.id_categoria} e área=${formData.id_area}`);

      axios.get(`${API_BASE}/topicos-area/todos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => {
          console.log("✅ [CRIAR] Tópicos gerais carregados:", res.data);

          let topicos = Array.isArray(res.data) ? res.data :
            (res.data.data ? res.data.data : []);

          const topicosFiltrados = topicos.filter(topico => {
            const categoriaMatch = topico.id_categoria == formData.id_categoria;
            const areaMatch = topico.id_area == formData.id_area;
            return categoriaMatch && areaMatch;
          });

          console.log(`📊 [CRIAR] ${topicosFiltrados.length} tópicos filtrados encontrados`);

          if (topicosFiltrados.length > 0) {
            setTopicosDisponiveis(topicosFiltrados);
          } else {
            buscarTopicosCategoria();
          }

          setTopicosFetched(true);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("❌ [CRIAR] Erro ao carregar tópicos gerais:", err);
          buscarTopicosCategoria();
        });
    } else {
      setTopicosDisponiveis([]);
      setTopicosFetched(false);
      setFormData(prev => ({ ...prev, id_topico: '' }));
    }
  }, [formData.id_categoria, formData.id_area]);

  const buscarTopicosCategoria = () => {
    console.log(`🔍 [CRIAR] Fallback: A procurar tópicos para categoria ${formData.id_categoria}`);

    axios.get(`${API_BASE}/topicos-area/categoria/${formData.id_categoria}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("✅ [CRIAR] Tópicos por categoria:", res.data);

        let topicos = Array.isArray(res.data) ? res.data :
          (res.data.data ? res.data.data : []);

        const topicosFiltrados = topicos.filter(topico =>
          topico.id_area == formData.id_area || !topico.id_area
        );

        console.log(`📊 [CRIAR] ${topicosFiltrados.length} tópicos filtrados por categoria/área`);
        setTopicosDisponiveis(topicosFiltrados);
        setTopicosFetched(true);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("❌ [CRIAR] Erro ao procurar tópicos por categoria:", err);
        buscarTopicosForum();
      });
  };

  const buscarTopicosForum = () => {
    console.log("🔍 [CRIAR] Último recurso: A procurar tópicos do fórum");

    axios.get(`${API_BASE}/forum`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("✅ [CRIAR] Tópicos do fórum:", res.data);

        let topicos = Array.isArray(res.data) ? res.data :
          (res.data.data ? res.data.data : []);

        const topicosFiltrados = topicos.filter(topico => {
          const categoriaId = topico.id_categoria ||
            (topico.categoria && topico.categoria.id_categoria);
          const areaId = topico.id_area ||
            (topico.area && topico.area.id_area);

          return categoriaId == formData.id_categoria &&
            (areaId == formData.id_area || !areaId);
        });

        console.log(`📊 [CRIAR] ${topicosFiltrados.length} tópicos do fórum filtrados`);
        setTopicosDisponiveis(topicosFiltrados);
        setTopicosFetched(true);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("❌ [CRIAR] Erro ao procurar tópicos do fórum:", err);
        toast.error("Não foi possível carregar os tópicos. Verifica a tua ligação ou tenta novamente mais tarde.");
        setTopicosDisponiveis([]);
        setTopicosFetched(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    setIsLoading(true);

    axios.get(`${API_BASE}/users/formadores`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("✅ [CRIAR] Formadores carregados:", res.data);
        setFormadores(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error("❌ [CRIAR] Erro ao carregar formadores:", err);
        toast.error("Erro ao carregar formadores. Verifica a consola para mais detalhes.");
        setFormadores([]);
      });

    axios.get(`${API_BASE}/categorias`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("✅ [CRIAR] Categorias carregadas:", res.data);
        setCategorias(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error("❌ [CRIAR] Erro ao carregar categorias:", err);
        toast.error("Erro ao carregar categorias");
        setCategorias([]);
      });

    axios.get(`${API_BASE}/areas`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("✅ [CRIAR] Áreas carregadas:", res.data);
        
        let areasData = res.data;
        if (areasData && areasData.areas) {
          areasData = areasData.areas;
        }
        
        const finalAreas = Array.isArray(areasData) ? areasData : [];
        console.log("🔧 [CRIAR] Áreas processadas:", finalAreas.length);
        
        setAreas(finalAreas);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("❌ [CRIAR] Erro ao carregar áreas:", err);
        toast.error("Erro ao carregar áreas");
        setAreas([]);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log("🔄 [CRIAR] Effect filtrar áreas executado");
    console.log("📊 [CRIAR] formData.id_categoria:", formData.id_categoria);
    console.log("📊 [CRIAR] areas:", areas);
    console.log("📊 [CRIAR] areas.length:", areas?.length);
    console.log("📊 [CRIAR] Array.isArray(areas):", Array.isArray(areas));

    if (formData.id_categoria && Array.isArray(areas) && areas.length > 0) {
      const categoriaId = String(formData.id_categoria);
      console.log("🔍 [CRIAR] A filtrar por categoria:", categoriaId);

      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = area.id_categoria || area.categoria_id || area.idCategoria || area.categoriaId;
        const match = areaCategoriaId !== null && String(areaCategoriaId) === categoriaId;
        console.log(`🔍 [CRIAR] Área ${area.nome} (ID: ${area.id_area}) - categoria: ${areaCategoriaId}, match: ${match}`);
        return match;
      });

      console.log(`🏷️ [CRIAR] Categoria ${categoriaId} selecionada - ${areasFiltered.length} áreas disponíveis`);
      setAreasFiltradas(areasFiltered);
      setFormData(prev => ({ ...prev, id_area: '', id_topico: '' }));
    } else {
      console.log("🔄 [CRIAR] A limpar áreas filtradas");
      setAreasFiltradas([]);
    }
  }, [formData.id_categoria, areas]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    console.log(`🔍 [CRIAR] Campo alterado: ${name} = ${name === 'imagem' ? 'FILE_OBJECT' : value}`);

    if (name === 'imagem') {
      const file = files[0];

      if (file) {
        console.log(`📁 [CRIAR] Ficheiro selecionado: ${file.name} (${file.type}, ${file.size} bytes)`);

        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
          console.error(`❌ [CRIAR] Ficheiro demasiado grande: ${file.size} bytes`);
          toast.error(`Ficheiro demasiado grande. Máximo 15MB permitido. O teu ficheiro tem ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
          e.target.value = '';
          return;
        }

        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
          'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
        ];

        if (!allowedTypes.includes(file.type)) {
          const fileName = file.name.toLowerCase();
          const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
          const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

          if (!hasValidExtension) {
            console.error(`❌ [CRIAR] Tipo de ficheiro não permitido: ${file.type}`);
            toast.error(`Tipo de ficheiro não permitido: "${file.type}". Usa imagens nos formatos: JPEG, PNG, GIF, WebP, SVG, BMP ou TIFF.`);
            e.target.value = '';
            return;
          } else {
            toast.warning('Tipo de ficheiro não reconhecido, mas a extensão parece válida. Se houver problemas, tenta converter para JPEG ou PNG.');
          }
        }

        if (file.size < 100) {
          console.error(`❌ [CRIAR] Ficheiro muito pequeno (possivelmente corrompido): ${file.size} bytes`);
          toast.error('O ficheiro parece estar corrompido ou é demasiado pequeno.');
          e.target.value = '';
          return;
        }

        setFormData({ ...formData, imagem: file });

        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
          toast.success('Imagem carregada com sucesso!');
        };
        reader.onerror = () => {
          console.error('❌ [CRIAR] Erro ao criar preview da imagem');
          toast.error('Erro ao processar a imagem. Tenta novamente.');
          setFormData({ ...formData, imagem: null });
        };
        reader.readAsDataURL(file);
      } else {
        setFormData({ ...formData, imagem: null });
        setPreviewImage(null);
      }

    } else if (name === 'tipo') {
      if (value === 'assincrono') {
        setFormData({ ...formData, [name]: value, vagas: '', id_formador: '' });
        toast.info('Curso assíncrono selecionado. Formador e vagas foram limpos automaticamente.');
      } else if (value === 'sincrono') {
        setFormData({ ...formData, [name]: value });
        toast.info('Curso síncrono selecionado. Lembra-te de definir um formador e número de vagas.');
      } else {
        setFormData({ ...formData, [name]: value });
      }

    } else if (name === 'id_categoria') {
      setFormData({ ...formData, [name]: value, id_area: '', id_topico: '' });
      if (value) {
        toast.info('Categoria selecionada. Por favor, seleciona uma área.');
      }

    } else if (name === 'id_area') {
      if (!formData.id_categoria) {
        toast.error("É necessário selecionar uma categoria primeiro");
        return;
      }
      setFormData({ ...formData, [name]: value, id_topico: '' });
      if (value) {
        toast.info('Área selecionada. Por favor, seleciona um tópico.');
      }

    } else if (name === 'id_topico') {
      if (!formData.id_categoria) {
        toast.error("É necessário selecionar uma categoria primeiro");
        return;
      }
      if (!formData.id_area) {
        toast.error("É necessário selecionar uma área primeiro");
        return;
      }
      setFormData({ ...formData, [name]: value });
      if (value) {
        toast.success('Tópico selecionado com sucesso!');
      }

    } else if (name === 'nome') {
      if (value.length > 100) {
        toast.warning('Nome do curso muito longo. Máximo 100 caracteres.');
        return;
      }

      const invalidChars = /[<>:"\/\\|?*]/g;
      if (invalidChars.test(value)) {
        toast.warning('Nome contém caracteres não recomendados para nomes de ficheiros.');
      }
      setFormData({ ...formData, [name]: value });

    } else if (name === 'duracao') {
      const duracao = parseInt(value);
      if (value && (isNaN(duracao) || duracao <= 0)) {
        toast.error('A duração deve ser um número positivo');
        return;
      }
      if (duracao > 1000) {
        toast.warning('Duração muito longa. Verifica se está correta.');
      }
      setFormData({ ...formData, [name]: value });

    } else if (name === 'vagas') {
      const vagas = parseInt(value);
      if (value && (isNaN(vagas) || vagas <= 0)) {
        toast.error('O número de vagas deve ser um número positivo');
        return;
      }
      if (vagas > 1000) {
        toast.warning('Número de vagas muito alto. Verifica se está correto.');
      }
      setFormData({ ...formData, [name]: value });

    } else if (name === 'data_inicio' || name === 'data_fim') {
      if (value) {
        const dataAtual = new Date();
        const dataSelecionada = new Date(value);

        dataAtual.setHours(0, 0, 0, 0);
        dataSelecionada.setHours(0, 0, 0, 0);

        if (name === 'data_inicio' && dataSelecionada < dataAtual) {
          toast.error('A data de início não pode ser anterior à data atual');
          return;
        }

        if (name === 'data_fim') {
          const dataInicio = formData.data_inicio ? new Date(formData.data_inicio) : dataAtual;
          dataInicio.setHours(0, 0, 0, 0);

          if (dataSelecionada <= dataInicio) {
            toast.error('A data de fim deve ser posterior à data de início');
            return;
          }
        }
      }
      setFormData({ ...formData, [name]: value });

    } else if (name === 'descricao') {
      if (value.length > 500) {
        toast.warning('Descrição muito longa. Máximo 500 caracteres.');
        return;
      }
      setFormData({ ...formData, [name]: value });

    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormadorSelection = (formadorId) => {
    setFormData({ ...formData, id_formador: formadorId });
    console.log(`👨‍🏫 [CRIAR] Formador ${formadorId ? 'selecionado' : 'removido'}: ${formadorId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 [CRIAR] A iniciar submissão do formulário');
    console.log('📊 [CRIAR] Estado atual do formData:', formData);

    if (!validateForm()) {
      toast.error('Por favor, corrige os erros no formulário antes de continuar');
      return;
    }

    const data = new FormData();

    for (let key in formData) {
      if (key === 'id_topico') {
        continue;
      }

      if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
        if (key === 'imagem' && formData[key]) {
          if (formData[key].size === 0) {
            toast.error('A imagem parece estar corrompida. Tenta selecionar outra imagem.');
            return;
          }
          data.append(key, formData[key]);
        } else if (key !== 'imagem') {
          data.append(key, formData[key]);
        }
      }
    }

    if (formData.id_topico) {
      data.append('id_topico_categoria', formData.id_topico);
    } else {
      toast.error('Erro interno: tópico não selecionado corretamente');
      return;
    }

    if (!navigator.onLine) {
      toast.error('Sem conexão à internet. Verifica a tua ligação e tenta novamente.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sessão expirada. Por favor, faz login novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const uploadStartTime = Date.now();
      console.log('📡 [CRIAR] A enviar para o servidor...');

      const response = await axios.post(`${API_BASE}/cursos`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000,
        
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📈 [CRIAR] Progresso do upload: ${percentCompleted}%`);

            if (progressEvent.total > 1024 * 1024) {
              toast.info(`A enviar... ${percentCompleted}%`, { 
                autoClose: false, 
                toastId: 'upload-progress' 
              });
            }
          }
        }
      });

      const uploadDuration = (Date.now() - uploadStartTime) / 1000;
      console.log(`✅ [CRIAR] Upload concluído em ${uploadDuration.toFixed(2)} segundos`);

      toast.dismiss('upload-progress');
      toast.success('🎉 Curso criado com sucesso!');

      if (cursosAssociados.length > 0 && response.data.curso) {
        const novoCursoId = response.data.curso.id_curso;
        console.log(`🔗 [CRIAR] A processar ${cursosAssociados.length} associações`);

        let associacoesCreated = 0;
        let associacoesFailed = 0;

        for (const [index, cursoAssociado] of cursosAssociados.entries()) {
          try {
            await axios.post(`${API_BASE}/associar-cursos`, {
              id_curso_origem: novoCursoId,
              id_curso_destino: cursoAssociado.id_curso,
              descricao: `Curso associado durante a criação de ${formData.nome}`
            }, {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 30000
            });

            associacoesCreated++;
            console.log(`✅ [CRIAR] Associação ${index + 1} criada com sucesso`);
          } catch (assocError) {
            associacoesFailed++;
            console.error(`❌ [CRIAR] Erro ao criar associação ${index + 1}:`, assocError);
            toast.error(`Não foi possível associar o curso "${cursoAssociado.nome}"`);
          }
        }

        if (associacoesCreated > 0) {
          toast.success(`🔗 ${associacoesCreated} associações de cursos criadas com sucesso!`);
        }
        if (associacoesFailed > 0) {
          toast.warning(`⚠️ ${associacoesFailed} associações falharam. Podes tentar novamente mais tarde.`);
        }
      }

      setFormData({
        nome: '', descricao: '', tipo: '', vagas: '', duracao: '',
        data_inicio: '', data_fim: '', id_formador: '', id_area: '',
        id_categoria: '', id_topico: '', imagem: null,
      });
      setPreviewImage(null);
      setCursosAssociados([]);

      const novoCursoId = response.data.curso.id_curso;
      setTimeout(() => {
        navigate(`/cursos/${novoCursoId}`);
      }, 1500);

    } catch (error) {
      console.error('💥 [CRIAR] Erro durante o upload:', error);
      toast.dismiss('upload-progress');

      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            if (data?.error === 'NOME_DUPLICADO') {
              toast.error('❌ Já existe um curso com este nome. Escolhe um nome diferente.');
            } else if (data?.error === 'INVALID_FILE_TYPE') {
              toast.error('❌ Tipo de ficheiro inválido. Usa uma imagem nos formatos: JPEG, PNG, GIF ou WebP.');
            } else if (data?.error === 'LIMIT_FILE_SIZE') {
              toast.error('❌ Ficheiro demasiado grande. Máximo 15MB permitido.');
            } else {
              toast.error(`❌ Dados inválidos: ${data?.message || 'Erro desconhecido'}`);
            }
            break;
            
          case 401:
            toast.error('❌ Sessão expirada. Faz login novamente.');
            localStorage.removeItem('token');
            setTimeout(() => navigate('/login'), 2000);
            break;
            
          case 403:
            toast.error('❌ Não tens permissão para criar cursos. Contacta o administrador.');
            break;
            
          case 413:
            toast.error('❌ Ficheiro demasiado grande para o servidor. Reduz o tamanho da imagem.');
            break;
            
          case 500:
            toast.error('❌ Erro interno do servidor. Tenta novamente em alguns minutos.');
            break;
            
          default:
            toast.error(`❌ Erro do servidor (${status}): ${data?.message || 'Erro desconhecido'}`);
        }
      } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
          toast.error('❌ Timeout: O servidor demorou muito a responder. Tenta novamente.');
        } else {
          toast.error('❌ Erro de rede. Verifica a tua ligação à internet.');
        }
      } else {
        toast.error('❌ Erro inesperado. Tenta recarregar a página.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    console.log('🔍 [CRIAR] A validar formulário...');

    if (!formData.nome || formData.nome.trim() === '') {
      toast.error("O nome do curso é obrigatório");
      return false;
    }

    if (!formData.tipo) {
      toast.error("É necessário selecionar o tipo de curso (Síncrono ou Assíncrono)");
      return false;
    }

    if (!formData.duracao || parseInt(formData.duracao) <= 0) {
      toast.error("É necessário definir uma duração válida para o curso em horas");
      return false;
    }

    if (!formData.id_categoria) {
      toast.error("É necessário selecionar uma categoria");
      return false;
    }

    if (!formData.id_area) {
      toast.error("É necessário selecionar uma área");
      return false;
    }

    if (!formData.id_topico) {
      toast.error("É necessário selecionar um tópico");
      return false;
    }

    if (!formData.descricao || formData.descricao.trim() === '') {
      toast.error("A descrição do curso é obrigatória");
      return false;
    }

    if (!formData.data_inicio) {
      toast.error("É necessário definir a data de início do curso");
      return false;
    }

    if (!formData.data_fim) {
      toast.error("É necessário definir a data de fim do curso");
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataInicio = new Date(formData.data_inicio);
    dataInicio.setHours(0, 0, 0, 0);

    const dataFim = new Date(formData.data_fim);
    dataFim.setHours(0, 0, 0, 0);

    if (dataInicio < hoje) {
      toast.error("A data de início não pode ser anterior à data atual");
      return false;
    }

    if (dataFim <= dataInicio) {
      toast.error("A data de fim deve ser posterior à data de início");
      return false;
    }

    if (formData.tipo === 'sincrono') {
      if (!formData.id_formador) {
        toast.error("É obrigatório selecionar um formador para cursos síncronos");
        return false;
      }

      if (!formData.vagas || parseInt(formData.vagas) <= 0) {
        toast.error("É necessário definir um número válido de vagas para cursos síncronos");
        return false;
      }
    }

    if (formData.nome.length > 100) {
      toast.error("O nome do curso não pode ter mais de 100 caracteres");
      return false;
    }

    if (formData.descricao.length > 500) {
      toast.error("A descrição não pode ter mais de 500 caracteres");
      return false;
    }

    if (formData.imagem) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(formData.imagem.type)) {
        const fileName = formData.imagem.name.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
          toast.error("Tipo de imagem inválido. Usa JPEG, PNG, GIF, WebP ou SVG");
          return false;
        }
      }

      const maxSize = 15 * 1024 * 1024;
      if (formData.imagem.size > maxSize) {
        toast.error(`Imagem demasiado grande. Máximo 15MB permitido. A tua imagem tem ${(formData.imagem.size / 1024 / 1024).toFixed(2)}MB`);
        return false;
      }
    }

    console.log('✅ [CRIAR] Formulário validado com sucesso');
    return true;
  };

  const getFormadorNome = () => {
    if (!formData.id_formador || !Array.isArray(formadores) || formadores.length === 0) return null;

    const formador = formadores.find(f => {
      const formadorId = f.id_utilizador || f.id_user || f.id || f.idUser || f.userId;
      return String(formadorId) === String(formData.id_formador);
    });

    return formador ? (formador.nome || formador.name || formador.fullName || `ID: ${formData.id_formador}`) : `ID: ${formData.id_formador}`;
  };

  const formadorNome = getFormadorNome();

  const getMinDate = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };

  return (
    <div className="criar-curso-container">
      <div className="form-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <form className='form' onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="course-image-container">
            <div
              className="course-image-upload"
              style={{ backgroundImage: previewImage ? `url('${previewImage}')` : 'none' }}
              onClick={() => document.querySelector('input[type="file"][name="imagem"]').click()}
            >
              {!previewImage && <div className="upload-placeholder">Clica para adicionar imagem do curso</div>}
              <input
                type="file"
                name="imagem"
                accept="image/*"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
              {isLoading && <div className="uploading-overlay">A carregar imagem...</div>}
            </div>
          </div>

          <div className="inputs">
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

            <div className="row">
              <select
                name="id_categoria"
                value={formData.id_categoria}
                onChange={handleChange}
                required
              >
                <option value="">Seleciona a Categoria</option>
                {Array.isArray(categorias) && categorias.map(categoria => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <select
                name="id_area"
                onMouseDown={e => {
                  if (!formData.id_categoria) {
                    e.preventDefault();
                    toast.error('É necessário selecionar uma categoria primeiro');
                  }
                }}
                value={formData.id_area}
                onChange={e => {
                  if (!formData.id_categoria) {
                    toast.error('É necessário selecionar uma categoria primeiro');
                    return;
                  }
                  handleChange(e);
                }}
                required
              >
                <option value="">Seleciona a Área</option>
                {isLoading ? (
                  <option value="" disabled>A carregar áreas...</option>
                ) : (!Array.isArray(areasFiltradas) || areasFiltradas.length === 0) ? (
                  <option value="" disabled>
                    {!formData.id_categoria 
                      ? "Seleciona uma categoria primeiro"
                      : "Nenhuma área disponível para esta categoria"}
                  </option>
                ) : (
                  areasFiltradas.map(area => {
                    const areaId = area.id_area || area.id || area.idArea || area.area_id;
                    const areaNome = area.nome || area.name || area.descricao || area.description;

                    return (
                      <option key={areaId} value={areaId}>
                        {areaNome}
                      </option>
                    );
                  })
                )}
              </select>

              <select
                name="id_topico"
                value={formData.id_topico}
                onMouseDown={e => {
                  if (!formData.id_area) {
                    e.preventDefault();
                    toast.error('É necessário selecionar uma área primeiro');
                  }
                }}
                onChange={e => {
                  if (!formData.id_area) {
                    toast.error('É necessário selecionar uma área primeiro');
                    return;
                  }
                  handleChange(e);
                }}
                required
              >
                <option value="">Seleciona o Tópico</option>
                {isLoading && !topicosFetched ? (
                  <option value="" disabled>A carregar tópicos...</option>
                ) : (!Array.isArray(topicosDisponiveis) || topicosDisponiveis.length === 0) ? (
                  <option value="" disabled>
                    {!formData.id_area
                      ? "Seleciona uma área primeiro"
                      : (topicosFetched
                        ? "Nenhum tópico disponível para esta área"
                        : "A carregar tópicos...")}
                  </option>
                ) : (
                  topicosDisponiveis.map(topico => {
                    const topicoId = topico.id || topico.id_topico || topico.topico_id;
                    const topicoTitulo = topico.titulo || topico.title || topico.nome || topico.name;

                    return (
                      <option key={topicoId} value={topicoId}>
                        {topicoTitulo}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="row">
              {formData.tipo === 'sincrono' && (
                <button
                  type="button"
                  className="select-formador-button"
                  onClick={() => setModalAberto(true)}
                >
                  <i className="fas fa-user-plus"></i>
                  {formData.id_formador
                    ? `Formador: ${formadorNome} (Clica para alterar)`
                    : `Selecionar Formador`}
                </button>
              )}

              {formData.tipo === 'sincrono' && (
                <input
                  type="number"
                  name="vagas"
                  placeholder="Vagas"
                  value={formData.vagas}
                  onChange={handleChange}
                  min="1"
                  required
                />
              )}

              {formData.tipo === 'assincrono' && (
                <div className="info-box" style={{
                  background: '#e8f4f8',
                  border: '1px solid #bee5eb',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#0c5460'
                }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                  Cursos assíncronos não requerem formador e não têm limite de vagas
                </div>
              )}

              <input
                type="number"
                name="duracao"
                placeholder="Duração (horas)"
                value={formData.duracao}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="row">
              <div className="input-group">
                <label>Data de Início</label>
                <input
                  type="date"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  min={getMinDate()}
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
                  min={formData.data_inicio || getMinDate()}
                  required
                />
              </div>
            </div>

            <textarea
              name="descricao"
              placeholder="Descrição do curso"
              value={formData.descricao}
              onChange={handleChange}
              rows="4"
              maxLength={500}
              required
            ></textarea>

            <div className="associacoes-container">
              <h3 className="associacoes-titulo">Cursos Associados</h3>

              <button
                type="button"
                className="associar-curso-button"
                onClick={abrirModalAssociacao}
              >
                <i className="fas fa-link"></i> Associar Curso
              </button>

              {Array.isArray(cursosAssociados) && cursosAssociados.length > 0 ? (
                <div className="lista-cursos-associados">
                  {cursosAssociados.map(curso => (
                    <div key={curso.id_curso} className="curso-associado-item">
                      <span>{curso.nome}</span>
                      <button
                        type="button"
                        className="remover-associacao"
                        onClick={() => removerAssociacao(curso.id_curso)}
                        title="Remover associação"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sem-associacoes">Nenhum curso associado</p>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'A criar...' : 'Criar Curso'}
            </button>
          </div>
        </form>

        <FormadorModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          setFormador={handleFormadorSelection}
          users={formadores}
          currentFormadorId={formData.id_formador}
        />

        <CursoAssociacaoModal
          isOpen={modalAssociacaoAberto}
          onClose={() => setModalAssociacaoAberto(false)}
          onSelectCurso={handleAssociarCurso}
          cursoAtualId={null}
        />

        <ToastContainer />
      </div>
    </div>
  );
};

export default CriarCurso;