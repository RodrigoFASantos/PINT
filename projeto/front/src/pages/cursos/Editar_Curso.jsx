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

const EditarCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalAssociacaoAberto, setModalAssociacaoAberto] = useState(false);

  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [topicosFiltrados, setTopicosFiltrados] = useState([]);

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [formadorNome, setFormadorNome] = useState('');
  const [dataInicioUltrapassada, setDataInicioUltrapassada] = useState(false);
  const [erroDataFim, setErroDataFim] = useState('');

  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [loadingAssociacoes, setLoadingAssociacoes] = useState(false);

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

  const carregarCursosAssociados = async () => {
    try {
      setLoadingAssociacoes(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/associar-cursos/curso/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setCursosAssociados(response.data);
      } else {
        setCursosAssociados([]);
      }
    } catch (error) {
      setCursosAssociados([]);
      
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar associações de cursos', {
          containerId: "editar-curso-toast"
        });
      }
    } finally {
      setLoadingAssociacoes(false);
    }
  };

  const handleAssociarCurso = async (cursoSelecionado) => {
    try {
      const token = localStorage.getItem('token');

      const jaAssociado = Array.isArray(cursosAssociados) && cursosAssociados.some(assoc => {
        return (assoc.id_curso_origem === parseInt(id) && assoc.id_curso_destino === cursoSelecionado.id_curso) ||
          (assoc.id_curso_destino === parseInt(id) && assoc.id_curso_origem === cursoSelecionado.id_curso);
      });

      if (jaAssociado) {
        toast.info(`O curso "${cursoSelecionado.nome}" já está associado a este curso`, {
          containerId: "editar-curso-toast"
        });
        return;
      }

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

      await carregarCursosAssociados();
    } catch (error) {
      toast.error(`Erro ao associar curso: ${error.response?.data?.message || error.message}`, {
        containerId: "editar-curso-toast"
      });
    }
  };

  const removerAssociacao = async (idAssociacao, nomeCurso) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/associar-cursos/${idAssociacao}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Associação com "${nomeCurso}" removida com sucesso!`, {
        containerId: "editar-curso-toast"
      });

      await carregarCursosAssociados();
    } catch (error) {
      toast.error(`Erro ao remover associação: ${error.response?.data?.message || error.message}`, {
        containerId: "editar-curso-toast"
      });
    }
  };

  const obterCursoAssociado = (associacao) => {
    return associacao.id_curso_origem === parseInt(id)
      ? associacao.cursoDestino
      : associacao.cursoOrigem;
  };

  useEffect(() => {
    const fetchCursoDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const responseCurso = await axios.get(`${API_BASE}/cursos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const cursoData = responseCurso.data;

        const formatarData = (dataString) => {
          const data = new Date(dataString);
          return data.toISOString().split('T')[0];
        };

        const dataAtual = new Date();
        const dataInicio = new Date(cursoData.data_inicio);
        const dataInicioPassou = dataInicio <= dataAtual;
        setDataInicioUltrapassada(dataInicioPassou);

        if (dataInicioPassou) {
          toast.info('A data limite de inscrição já passou. Algumas alterações podem estar limitadas.', {
            containerId: "editar-curso-toast"
          });
        }

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
          imagem: null
        });

        if (cursoData.imagem_path) {
          const imagemUrl = `${API_BASE}/${cursoData.imagem_path}`;
          setPreviewImage(imagemUrl);
        }

        if (cursoData.formador) {
          setFormadorNome(cursoData.formador.nome);
        }

        if (cursoData.inconsistencia_area) {
          console.warn('⚠️ [EDITAR] INCONSISTÊNCIA DETECTADA:', cursoData.inconsistencia_area);
          
          toast.warning(
            `Inconsistência detectada: O tópico "${cursoData.inconsistencia_area.topico_titulo}" pertence a uma área diferente. A corrigir automaticamente...`,
            { containerId: "editar-curso-toast", autoClose: 8000 }
          );
          
          setTimeout(() => {
            setFormData(prevData => ({
              ...prevData,
              id_area: cursoData.inconsistencia_area.topico_area
            }));
            
            toast.success(
              `Área corrigida automaticamente para coincidir com o tópico selecionado.`,
              { containerId: "editar-curso-toast" }
            );
          }, 2000);
        }

        setLoading(false);
      } catch (error) {
        if (error.response?.status === 404) {
          toast.error('Curso não encontrado.', { containerId: "editar-curso-toast" });
        } else if (error.response?.status === 403) {
          toast.error('Não tens permissão para editar este curso.', { containerId: "editar-curso-toast" });
        } else {
          toast.error('Erro ao carregar dados do curso. Tenta novamente mais tarde.', {
            containerId: "editar-curso-toast"
          });
        }
        
        setTimeout(() => navigate('/admin/cursos'), 3000);
      }
    };

    const fetchResources = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setIsLoadingFilters(true);

        const responseFormadores = await axios.get(`${API_BASE}/users/formadores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFormadores(Array.isArray(responseFormadores.data) ? responseFormadores.data : []);

        const responseCategorias = await axios.get(`${API_BASE}/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCategorias(Array.isArray(responseCategorias.data) ? responseCategorias.data : []);

        const responseAreas = await axios.get(`${API_BASE}/areas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let areasData = responseAreas.data;
        if (areasData && areasData.areas) {
          areasData = areasData.areas;
        }
        
        const finalAreas = Array.isArray(areasData) ? areasData : [];
        console.log("🔧 [EDITAR] Áreas processadas:", finalAreas.length);
        setAreas(finalAreas);

        const responseTopicos = await axios.get(`${API_BASE}/topicos-area`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (responseTopicos.data.success && Array.isArray(responseTopicos.data.data)) {
          const topicoData = responseTopicos.data.data;
          setTopicos(topicoData);
        } else if (Array.isArray(responseTopicos.data)) {
          setTopicos(responseTopicos.data);
        } else {
          setTopicos([]);
          toast.warning('Formato de resposta inesperado para tópicos', {
            containerId: "editar-curso-toast"
          });
        }

      } catch (error) {
        toast.error('Erro ao carregar dados. Verifica a tua ligação.', {
          containerId: "editar-curso-toast"
        });
        
        setFormadores([]);
        setCategorias([]);
        setAreas([]);
        setTopicos([]);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    fetchCursoDetails();
    fetchResources();
    carregarCursosAssociados();
  }, [id, navigate]);

  const validarDatas = (dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return true;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    return fim >= inicio;
  };

  useEffect(() => {
    console.log("🔄 [EDITAR] Effect filtrar tópicos executado");
    console.log("📊 [EDITAR] formData.id_area:", formData.id_area);
    console.log("📊 [EDITAR] topicos:", topicos);
    console.log("📊 [EDITAR] Array.isArray(topicos):", Array.isArray(topicos));

    if (formData.id_area && Array.isArray(topicos) && topicos.length > 0) {
      const areId = String(formData.id_area);

      console.log(`🔍 [EDITAR] A filtrar tópicos para área: ${areId}`);
      console.log(`📊 [EDITAR] Total de tópicos disponíveis:`, topicos.length);

      const topicosFiltered = topicos.filter(topico => {
        const topicoAreaId = topico.id_area;
        const match = topicoAreaId && String(topicoAreaId) === areId;
        
        console.log(`🔍 [EDITAR] Tópico "${topico.titulo}" - área: ${topicoAreaId}, match: ${match}`);
        return match;
      });

      console.log(`✅ [EDITAR] ${topicosFiltered.length} tópicos filtrados para área ${areId}`);
      setTopicosFiltrados(topicosFiltered);

      if (topicosFiltered.length === 0 && formData.id_topico_area) {
        console.log(`⚠️ [EDITAR] Nenhum tópico encontrado para área ${areId}, mas há tópico selecionado (${formData.id_topico_area})`);
        console.log(`🔄 [EDITAR] A mostrar TODOS os tópicos para permitir correção`);
        
        setTopicosFiltrados(topicos);
        
        toast.warning(
          'O tópico selecionado não pertence à área atual. Podes ver todos os tópicos para escolher o correto ou a área será corrigida automaticamente.',
          { containerId: "editar-curso-toast", autoClose: 10000 }
        );
      } else if (topicosFiltered.length === 0) {
        console.log(`⚠️ [EDITAR] Nenhum tópico encontrado para área ${areId}`);
        const areasDisponiveis = [...new Set(topicos.map(t => t.id_area).filter(id => id))];
        console.log("📋 [EDITAR] Áreas disponíveis nos tópicos:", areasDisponiveis);
      }
    } else {
      console.log('🔄 [EDITAR] A limpar tópicos filtrados - condições não cumpridas');
      setTopicosFiltrados([]);
    }
  }, [formData.id_area, topicos, formData.id_topico_area]);

  useEffect(() => {
    console.log("🔄 [EDITAR] Effect filtrar áreas executado");
    console.log("📊 [EDITAR] formData.id_categoria:", formData.id_categoria);
    console.log("📊 [EDITAR] areas:", areas);
    console.log("📊 [EDITAR] Array.isArray(areas):", Array.isArray(areas));

    if (formData.id_categoria && Array.isArray(areas) && areas.length > 0) {
      const catId = String(formData.id_categoria);
      console.log("🔍 [EDITAR] A filtrar por categoria:", catId);
      
      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = area.id_categoria ?? area.categoria_id ?? area.idCategoria ?? area.categoriaId;
        const match = areaCategoriaId && String(areaCategoriaId) === catId;
        console.log(`🔍 [EDITAR] Área ${area.nome} (ID: ${area.id_area}) - categoria: ${areaCategoriaId}, match: ${match}`);
        return match;
      });
      
      console.log(`🏷️ [EDITAR] Categoria ${catId} selecionada - ${areasFiltered.length} áreas disponíveis`);
      setAreasFiltradas(areasFiltered);
    } else {
      console.log("🔄 [EDITAR] A limpar áreas filtradas");
      setAreasFiltradas([]);
    }
  }, [formData.id_categoria, areas]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'imagem') {
      const file = files[0];
      setFormData({ ...formData, imagem: file });

      if (file) {
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
      if (value === 'assincrono') {
        setFormData({ ...formData, [name]: value, vagas: '' });
        toast.info('Curso assíncrono selecionado. Vagas foram limpos.', {
          containerId: "editar-curso-toast"
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
      
    } else if (name === 'id_categoria') {
      setFormData({ ...formData, [name]: value, id_area: '', id_topico_area: '' });
      
    } else if (name === 'id_area') {
      setFormData({ ...formData, [name]: value, id_topico_area: '' });
      
    } else if (name === 'vagas' && dataInicioUltrapassada) {
      toast.warning('Não é possível alterar as vagas após a data limite de inscrição.', {
        containerId: "editar-curso-toast"
      });
      return;
      
    } else if (name === 'data_inicio' || name === 'data_fim') {
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
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      toast.error('É necessário selecionar um formador para cursos síncronos', {
        containerId: "editar-curso-toast"
      });
      return;
    }

    if (!validarDatas(formData.data_inicio, formData.data_fim)) {
      toast.error('A data de fim deve ser posterior à data de início', {
        containerId: "editar-curso-toast"
      });
      setErroDataFim('A data de fim deve ser posterior à data de início');
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataInicio = new Date(formData.data_inicio);

    if (dataInicio < hoje && !dataInicioUltrapassada) {
      toast.error('A data de início não pode ser no passado', {
        containerId: "editar-curso-toast"
      });
      return;
    }

    const data = new FormData();

    for (let key in formData) {
      if (key !== 'imagem_path' && formData[key] !== null && formData[key] !== '') {
        if (key === 'imagem' && formData[key]) {
          data.append(key, formData[key]);
        } else if (key !== 'imagem') {
          data.append(key, formData[key]);
        }
      }
    }

    try {
      const response = await axios.put(`${API_BASE}/cursos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 60000,
      });

      toast.success('Curso atualizado com sucesso!', {
        containerId: "editar-curso-toast"
      });

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
      }

      if (response.data.imagemAtualizada) {
        setTimeout(() => {
          toast.info('Imagem do curso atualizada', {
            containerId: "editar-curso-toast"
          });
        }, 1500);
      }

      setTimeout(() => {
        navigate(`/cursos/${id}`);
      }, 3000);

    } catch (error) {
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
              value={formData.id_area}
              onChange={handleChange}
              required
              disabled={!formData.id_categoria || isLoadingFilters}
            >
              <option value="">Seleciona a Área</option>
              {isLoadingFilters ? (
                <option disabled>A carregar áreas...</option>
              ) : (!Array.isArray(areasFiltradas) || areasFiltradas.length === 0) ? (
                <option disabled>
                  {!formData.id_categoria 
                    ? "Seleciona uma categoria primeiro" 
                    : "Nenhuma área disponível para esta categoria"}
                </option>
              ) : (
                areasFiltradas.map(area => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nome}
                  </option>
                ))
              )}
            </select>

            <select
              name="id_topico_area"
              value={formData.id_topico_area}
              onChange={handleChange}
              required
              disabled={!formData.id_area || isLoadingFilters}
            >
              <option value="">Seleciona o Tópico</option>
              {isLoadingFilters ? (
                <option disabled>A carregar tópicos...</option>
              ) : !formData.id_area ? (
                <option disabled>Seleciona uma área primeiro</option>
              ) : (!Array.isArray(topicosFiltrados) || topicosFiltrados.length === 0) ? (
                <option disabled>Nenhum tópico disponível para esta área</option>
              ) : (
                topicosFiltrados.map(topico => {
                  const id = topico.id_topico;
                  const nome = topico.titulo;
                  return (
                    <option key={id} value={id}>
                      {nome}
                      {topico.area && ` (${topico.area.nome})`}
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
              onClick={() => setModalAssociacaoAberto(true)}
            >
              <i className="fas fa-link"></i> Associar Novo Curso
            </button>

            {loadingAssociacoes ? (
              <div className="loading-associacoes">
                <div className="spinner-pequeno"></div>
                <span>A carregar associações...</span>
              </div>
            ) : (Array.isArray(cursosAssociados) && cursosAssociados.length > 0) ? (
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