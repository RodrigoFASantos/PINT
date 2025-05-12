import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import './css/Criar_Curso.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormadorModal from '../../components/users/Formador_Modal';
import API_BASE, { IMAGES } from "../../api";

const EditarCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [modalAberto, setModalAberto] = useState(false);
  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formadorNome, setFormadorNome] = useState('');
  const [dataInicioUltrapassada, setDataInicioUltrapassada] = useState(false);
  const [topicos, setTopicos] = useState([]);
  const [topicosDisponiveis, setTopicosDisponiveis] = useState([]);
  const [topicosCurso, setTopicosCurso] = useState([]);
  const [novoTopico, setNovoTopico] = useState('');

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
    imagem: null,
  });
  useEffect(() => {
    // Carregar dados do curso
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
            autoClose: 5000
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
        toast.error('Erro ao carregar dados do curso. Tente novamente mais tarde.');
        navigate('/admin/cursos');
      }
    };

    // Carregar tópicos do curso
    const fetchTopicosCurso = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_BASE}/cursos/${id}/topicos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setTopicosCurso(response.data);
      } catch (error) {
        console.error('Erro ao carregar tópicos do curso:', error);
        toast.error('Não foi possível carregar os tópicos do curso.');
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
      } catch (error) {
        console.error('Erro ao carregar recursos:', error);
        toast.error('Erro ao carregar dados. Verifique sua conexão.');
      }
    };

    fetchCursoDetails();
    fetchResources();
    fetchTopicosCurso();
  }, [id, navigate]);




  // Adicionar useEffect para carregar tópicos disponíveis quando a área é selecionada
  useEffect(() => {
    const carregarTopicosArea = async () => {
      if (!formData.id_area) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/topicos-curso/area/${formData.id_area}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Filtrar tópicos já adicionados
        const topicosNaoAdicionados = response.data.filter(topico =>
          !topicosCurso.some(t => t.id_topico === topico.id_topico)
        );

        setTopicosDisponiveis(topicosNaoAdicionados);
      } catch (error) {
        console.error('Erro ao carregar tópicos disponíveis:', error);
      }
    };

    carregarTopicosArea();
  }, [formData.id_area, topicosCurso]);


  // Adicionar funções para manipular tópicos
  const adicionarTopico = (id_topico) => {
    if (!id_topico) return;

    const topicoSelecionado = topicosDisponiveis.find(t => t.id_topico === parseInt(id_topico));
    if (topicoSelecionado && !topicosCurso.some(t => t.id_topico === topicoSelecionado.id_topico)) {
      setTopicosCurso([...topicosCurso, topicoSelecionado]);
    }
  };

  const adicionarNovoTopico = () => {
    if (novoTopico.trim() === '') return;

    setTopicosCurso([...topicosCurso, {
      nome: novoTopico,
      novo: true
    }]);
    setNovoTopico('');
  };

  const removerTopico = (index) => {
    const novosTopicos = [...topicosCurso];
    novosTopicos.splice(index, 1);
    setTopicosCurso(novosTopicos);
  };




  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (formData.id_categoria) {
      const areasFiltered = areas.filter(area => area.id_categoria == formData.id_categoria);
      setAreasFiltradas(areasFiltered);
    } else {
      setAreasFiltradas([]);
    }
  }, [formData.id_categoria, areas]);

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
      // Quando mudar a categoria, limpar a área selecionada
      setFormData({ ...formData, [name]: value, id_area: '' });
    } else if (name === 'vagas' && dataInicioUltrapassada) {
      // Não permitir alteração de vagas se a data de início já passou
      toast.warning('Não é possível alterar as vagas após a data limite de inscrição.');
      // Manter o valor antigo
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formador para cursos síncronos
    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      toast.error('É necessário selecionar um formador para cursos síncronos');
      return;
    }

    const data = new FormData();
    for (let key in formData) {
      // Não enviar vagas atualizadas se a data de início já passou
      if (key === 'vagas' && dataInicioUltrapassada) {
        data.append(key, formData.vagas);
      } else if (formData[key] !== null && formData[key] !== '' && key !== 'imagem_path') {
        data.append(key, formData[key]);
      }
    }

    if (topicosCurso.length > 0) {
      data.append('topicos', JSON.stringify(topicosCurso));
    }

    try {
      // Atualizar o curso
      await axios.put(`${API_BASE}/cursos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      toast.success('Curso atualizado com sucesso!');

      // Redirecionar para a página de detalhes depois de 2 segundos
      setTimeout(() => {
        navigate(`/cursos/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast.error('Erro ao atualizar curso: ' + (error.response?.data?.message || 'Erro desconhecido'));
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
              <option value="">Selecione o Tipo</option>
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
              <option value="">Selecione a Categoria</option>
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
              disabled={!formData.id_categoria}
            >
              <option value="">Selecione a Área</option>
              {areasFiltradas.map(area => (
                <option key={area.id_area} value={area.id_area}>
                  {area.nome}
                </option>
              ))}
            </select>

            {formData.id_area && (
              <div className="topicos-section">
                <h3>Tópicos do Curso</h3>

                <div className="row">
                  <select
                    onChange={(e) => adicionarTopico(e.target.value)}
                    value=""
                  >
                    <option value="">Selecionar tópico existente</option>
                    {topicosDisponiveis.map(topico => (
                      <option
                        key={topico.id_topico}
                        value={topico.id_topico}
                      >
                        {topico.nome}
                      </option>
                    ))}
                  </select>

                  <div className="novo-topico-input">
                    <input
                      type="text"
                      placeholder="Adicionar novo tópico"
                      value={novoTopico}
                      onChange={(e) => setNovoTopico(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={adicionarNovoTopico}
                      disabled={!novoTopico.trim()}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                {topicosCurso.length > 0 ? (
                  <ul className="topicos-adicionados">
                    {topicosCurso.map((topico, index) => (
                      <li key={index} className="topico-item">
                        <span>{topico.nome}</span>
                        <button type="button" onClick={() => removerTopico(index)}>
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sem-topicos">Nenhum tópico adicionado</p>
                )}
              </div>
            )}
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
              />
            </div>
          </div>

          <textarea
            name="descricao"
            placeholder="Descrição do curso"
            value={formData.descricao}
            onChange={handleChange}
            rows="4"
          ></textarea>

          <div className="buttons-row">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/cursos/${id}`)}
            >
              Cancelar
            </button>
            <button type="submit" className="submit-button">Salvar Alterações</button>
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

      <ToastContainer />
    </div>
  );
};

export default EditarCurso;