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

  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Estados para controlo de modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAssociacaoAberto, setModalAssociacaoAberto] = useState(false);

  // Estados para dados carregados do servidor
  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [topicosFiltrados, setTopicosFiltrados] = useState([]);

  // Estados para funcionalidades
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [formadorNome, setFormadorNome] = useState('');
  const [dataInicioUltrapassada, setDataInicioUltrapassada] = useState(false);
  const [erroDataFim, setErroDataFim] = useState('');

  // Novos estados para gestão de associações
  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [loadingAssociacoes, setLoadingAssociacoes] = useState(false);

  // Estado do formulário principal
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

  // Função para carregar cursos associados
  const carregarCursosAssociados = async () => {
    try {
      setLoadingAssociacoes(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/associar-cursos/curso/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setCursosAssociados(response.data);
        console.log('Cursos associados carregados:', response.data.length);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos associados:', error);
      setCursosAssociados([]);
    } finally {
      setLoadingAssociacoes(false);
    }
  };

  // Função para adicionar nova associação
  const handleAssociarCurso = async (cursoSelecionado) => {
    try {
      const token = localStorage.getItem('token');
      
      // Verificar se já existe associação
      const jaAssociado = cursosAssociados.some(assoc => {
        return (assoc.id_curso_origem === parseInt(id) && assoc.id_curso_destino === cursoSelecionado.id_curso) ||
               (assoc.id_curso_destino === parseInt(id) && assoc.id_curso_origem === cursoSelecionado.id_curso);
      });

      if (jaAssociado) {
        toast.info(`O curso "${cursoSelecionado.nome}" já está associado a este curso`);
        return;
      }

      // Criar a associação
      await axios.post(`${API_BASE}/associar-cursos`, {
        id_curso_origem: parseInt(id),
        id_curso_destino: cursoSelecionado.id_curso,
        descricao: `Associação criada durante a edição`
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Curso "${cursoSelecionado.nome}" associado com sucesso!`);
      
      // Recarregar associações
      await carregarCursosAssociados();
    } catch (error) {
      console.error('Erro ao associar curso:', error);
      toast.error(`Erro ao associar curso: ${error.response?.data?.message || error.message}`);
    }
  };

  // Função para remover associação
  const removerAssociacao = async (idAssociacao, nomeCurso) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/associar-cursos/${idAssociacao}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Associação com "${nomeCurso}" removida com sucesso!`);
      
      // Recarregar associações
      await carregarCursosAssociados();
    } catch (error) {
      console.error('Erro ao remover associação:', error);
      toast.error(`Erro ao remover associação: ${error.response?.data?.message || error.message}`);
    }
  };

  // Obter nome do curso associado para apresentação
  const obterCursoAssociado = (associacao) => {
    return associacao.id_curso_origem === parseInt(id) 
      ? associacao.cursoDestino 
      : associacao.cursoOrigem;
  };

  // Carregar dados do curso e recursos quando o componente é montado
  useEffect(() => {
    // Carregar detalhes do curso
    const fetchCursoDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Obter detalhes do curso
        const responseCurso = await axios.get(`${API_BASE}/cursos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const cursoData = responseCurso.data;

        // Formatar as datas para o formato YYYY-MM-DD para os campos de data
        const formatarData = (dataString) => {
          const data = new Date(dataString);
          return data.toISOString().split('T')[0];
        };

        // Verificar se a data de início já passou
        const dataAtual = new Date();
        const dataInicio = new Date(cursoData.data_inicio);
        const dataInicioPassou = dataInicio <= dataAtual;
        setDataInicioUltrapassada(dataInicioPassou);

        if (dataInicioPassou) {
          toast.info('A data limite de inscrição já passou. Não é possível alterar as vagas.', {
            containerId: "editar-curso-toast"
          });
        }

        // Preencher o formulário com os dados do curso
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
          imagem: null // A imagem não vem preenchida, apenas o utilizador pode escolher uma nova
        });

        // Se tiver imagem, mostrar a pré-visualização
        if (cursoData.imagem_path) {
          setPreviewImage(`${API_BASE}/${cursoData.imagem_path}`);
        }

        // Se tiver formador, guardar o nome para exibição
        if (cursoData.formador) {
          setFormadorNome(cursoData.formador.nome);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do curso:', error);
        toast.error('Erro ao carregar dados do curso. Tenta novamente mais tarde.', {
          containerId: "editar-curso-toast"
        });
        navigate('/admin/cursos');
      }
    };

    // Carregar recursos necessários
    const fetchResources = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setIsLoadingFilters(true);
        
        // Carregar formadores
        const responseFormadores = await axios.get(`${API_BASE}/users/formadores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFormadores(responseFormadores.data);

        // Carregar categorias
        const responseCategorias = await axios.get(`${API_BASE}/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCategorias(responseCategorias.data);

        // Carregar áreas
        const responseAreas = await axios.get(`${API_BASE}/areas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setAreas(responseAreas.data);

        // Carregar todos os tópicos
        const responseTopicos = await axios.get(`${API_BASE}/topicos-area`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Verificar se a resposta é um array
        const topicoData = responseTopicos.data;
        if (Array.isArray(topicoData)) {
          setTopicos(topicoData);
        } else if (topicoData && typeof topicoData === 'object') {
          // Se for um objeto com uma propriedade que é array comum em APIs
          // Tentar encontrar uma propriedade que seja array
          const possibleArrayProps = ['data', 'items', 'results', 'topicos'];
          for (const prop of possibleArrayProps) {
            if (Array.isArray(topicoData[prop])) {
              console.log(`A usar propriedade '${prop}' como array de tópicos`);
              setTopicos(topicoData[prop]);
              break;
            }
          }
        } else {
          console.error("Formato de dados inesperado para tópicos:", topicoData);
          setTopicos([]);
        }
      } catch (error) {
        console.error('Erro ao carregar recursos:', error);
        toast.error('Erro ao carregar dados. Verifica a tua ligação.', {
          containerId: "editar-curso-toast"
        });
      } finally {
        setIsLoadingFilters(false);
      }
    };

    fetchCursoDetails();
    fetchResources();
    carregarCursosAssociados(); // Carregar associações também
  }, [id, navigate]);

  // Função para validar as datas
  const validarDatas = (dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return true; // Se uma das datas estiver vazia, não validar ainda

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    return fim >= inicio;
  };

  // Carregar tópicos disponíveis quando a área é selecionada
  useEffect(() => {
    if (formData.id_area && Array.isArray(topicos)) {
      const areId = String(formData.id_area);
      // Usar o campo correto conforme definido no modelo Topico_Area
      const topicosFiltered = topicos.filter(topico => {
        return topico.id_area && String(topico.id_area) === areId;
      });
      setTopicosFiltrados(topicosFiltered);

      // Log para depuração
      if (topicos.length > 0) {
        console.log("Estrutura de um objeto tópico:", topicos[0]);
        console.log("Tópicos filtrados para área", areId, ":", topicosFiltered);
        console.log("Quantidade de tópicos filtrados:", topicosFiltered.length);
      }
    } else {
      setTopicosFiltrados([]);
    }
  }, [formData.id_area, topicos]);

  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (formData.id_categoria) {
      const catId = String(formData.id_categoria);
      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = area.id_categoria ?? area.categoria_id ?? area.idCategoria ?? area.categoriaId;
        return areaCategoriaId && String(areaCategoriaId) === catId;
      });
      setAreasFiltradas(areasFiltered);
    } else {
      setAreasFiltradas([]);
    }
  }, [formData.id_categoria, areas]);

  // Manipular mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'imagem') {
      const file = files[0];
      setFormData({ ...formData, imagem: file });

      // Criar uma prévia da imagem
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (name === 'tipo') {
      // Se o curso mudar para assíncrono, limpar o formador
      if (value === 'assincrono') {
        setFormData({ ...formData, [name]: value, id_formador: '', vagas: '' });
        setFormadorNome('');
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'id_categoria') {
      // Quando mudar a categoria, limpar a área e tópico selecionados
      setFormData({ ...formData, [name]: value, id_area: '', id_topico_area: '' });
    } else if (name === 'id_area') {
      // Quando mudar a área, limpar o tópico selecionado
      setFormData({ ...formData, [name]: value, id_topico_area: '' });
    } else if (name === 'vagas' && dataInicioUltrapassada) {
      // Não permitir alteração de vagas se a data de início já passou
      toast.warning('Não é possível alterar as vagas após a data limite de inscrição.', {
        containerId: "editar-curso-toast"
      });
      // Manter o valor antigo
    } else if (name === 'data_inicio' || name === 'data_fim') {
      // Validação especial para datas
      const novoFormData = { ...formData, [name]: value };

      // Validar as datas
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

  // Manipular submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Início da submissão do formulário");
    console.log("FormData atual:", formData);
    console.log("Imagem selecionada:", formData.imagem);

    // Validar formador para cursos síncronos
    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      toast.error('É necessário selecionar um formador para cursos síncronos', {
        containerId: "editar-curso-toast"
      });
      return;
    }

    // Validar datas
    if (!validarDatas(formData.data_inicio, formData.data_fim)) {
      toast.error('A data de fim deve ser posterior à data de início', {
        containerId: "editar-curso-toast"
      });
      setErroDataFim('A data de fim deve ser posterior à data de início');
      return;
    }

    // Validação adicional: verificar se as datas não estão no passado
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataInicio = new Date(formData.data_inicio);

    if (dataInicio < hoje && !dataInicioUltrapassada) {
      toast.error('A data de início não pode ser no passado', {
        containerId: "editar-curso-toast"
      });
      return;
    }

    // Criar FormData corretamente
    const data = new FormData();
    
    // Adicionar todos os campos exceto imagem_path que não deve ser enviado
    for (let key in formData) {
      if (key !== 'imagem_path' && formData[key] !== null && formData[key] !== '') {
        // Verificar se é o campo de imagem
        if (key === 'imagem' && formData[key]) {
          console.log("A adicionar imagem ao FormData:", formData[key]);
          console.log("Tipo de ficheiro:", formData[key].type);
          console.log("Tamanho:", formData[key].size);
          data.append(key, formData[key]);
        } else if (key !== 'imagem') {
          // Para outros campos, adicionar normalmente
          data.append(key, formData[key]);
        }
      }
    }

    // Verificar o que está no FormData
    console.log("Conteúdo do FormData:");
    for (let pair of data.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}:`, pair[1].name, pair[1].type, pair[1].size + " bytes");
      } else {
        console.log(`${pair[0]}:`, pair[1]);
      }
    }

    try {
      console.log("A enviar requisição PUT...");
      
      // Atualizar o curso
      const response = await axios.put(`${API_BASE}/cursos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      console.log("Resposta do servidor:", response.data);

      toast.success('Curso atualizado com sucesso!', {
        containerId: "editar-curso-toast"
      });

      // Verificar se a imagem foi atualizada na resposta
      if (response.data.imagemAtualizada) {
        console.log("Imagem foi atualizada com sucesso");
      }

      // Redirecionar para a página de detalhes depois de 2 segundos
      setTimeout(() => {
        navigate(`/cursos/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      console.error('Response data:', error.response?.data);
      
      toast.error('Erro ao atualizar curso: ' + (error.response?.data?.message || 'Erro desconhecido'), {
        containerId: "editar-curso-toast"
      });
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
              <img src={previewImage} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
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
                  : topicosFiltrados.length
                    ? topicosFiltrados.map(topico => {
                      const id = topico.id_topico;
                      const nome = topico.titulo;
                      return <option key={id} value={id}>{nome}</option>;
                    })
                    : <option disabled>Nenhum tópico disponível para esta área</option>
              }
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
          ></textarea>

          {/* gestão de associações */}
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

          <div className="buttons-row">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/cursos/${id}`)}
            >
              Cancelar
            </button>
            <button type="submit" className="submit-button">Guardar Alterações</button>
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
      />

      {/* Modal de associação de cursos */}
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