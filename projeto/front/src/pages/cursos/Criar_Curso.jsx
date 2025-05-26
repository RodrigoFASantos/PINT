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

  // Estado do formulário com adição de id_topico
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
    id_topico: '', // Adicionado id_topico ao formData
    imagem: null,
  });

  const [modalAberto, setModalAberto] = useState(false);
  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAssociacaoAberto, setModalAssociacaoAberto] = useState(false);
  const [cursosAssociados, setCursosAssociados] = useState([]);

  // Estado para tópicos disponíveis
  const [topicosDisponiveis, setTopicosDisponiveis] = useState([]);
  const [topicosFetched, setTopicosFetched] = useState(false);

  const abrirModalAssociacao = () => {
    setModalAssociacaoAberto(true);
  };

  const handleAssociarCurso = (cursoSelecionado) => {
    // Verificar se o curso já está na lista
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

  // Carregar tópicos quando a categoria E a área são selecionadas
  useEffect(() => {
    if (formData.id_categoria && formData.id_area) {
      setIsLoading(true);
      setTopicosFetched(false);

      console.log(`Buscando tópicos para categoria=${formData.id_categoria} e área=${formData.id_area}`);

      // Usar a rota topicos-area (a rota correta com base nas definições do servidor)
      axios.get(`${API_BASE}/topicos-area/todos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => {
          console.log("Tópicos gerais carregados:", res.data);

          // Dados podem vir em diferentes formatos, então lidamos com todos
          let topicos = Array.isArray(res.data) ? res.data :
            (res.data.data ? res.data.data : []);

          // Filtrar os tópicos pela categoria e área selecionadas
          const topicosFiltrados = topicos.filter(topico => {
            const categoriaMatch = topico.id_categoria == formData.id_categoria;
            const areaMatch = topico.id_area == formData.id_area;
            return categoriaMatch && areaMatch;
          });

          console.log("Tópicos filtrados:", topicosFiltrados);

          if (topicosFiltrados.length > 0) {
            setTopicosDisponiveis(topicosFiltrados);
          } else {
            // Tentar buscar especificamente por categoria
            buscarTopicosCategoria();
          }

          setTopicosFetched(true);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Erro ao carregar tópicos gerais:", err);
          // Tentar buscar especificamente por categoria
          buscarTopicosCategoria();
        });
    } else {
      // Se não tiver categoria ou área selecionada, limpar tópicos
      setTopicosDisponiveis([]);
      setTopicosFetched(false);
      // Limpar o tópico selecionado
      setFormData(prev => ({ ...prev, id_topico: '' }));
    }
  }, [formData.id_categoria, formData.id_area]);

  // Buscar tópicos por categoria
  const buscarTopicosCategoria = () => {
    console.log(`Buscando tópicos para categoria específica: ${formData.id_categoria}`);

    axios.get(`${API_BASE}/topicos-area/categoria/${formData.id_categoria}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("Tópicos por categoria:", res.data);

        // Verificar formato dos dados
        let topicos = Array.isArray(res.data) ? res.data :
          (res.data.data ? res.data.data : []);

        // Filtrar adicionalmente por área
        const topicosFiltrados = topicos.filter(topico =>
          topico.id_area == formData.id_area || !topico.id_area
        );

        console.log("Tópicos filtrados por área:", topicosFiltrados);
        setTopicosDisponiveis(topicosFiltrados);
        setTopicosFetched(true);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar tópicos por categoria:", err);
        // Última tentativa: buscar do fórum
        buscarTopicosForum();
      });
  };

  // Buscar tópicos do fórum como último recurso
  const buscarTopicosForum = () => {
    console.log("Buscando tópicos do fórum como último recurso");

    axios.get(`${API_BASE}/forum`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("Tópicos do fórum:", res.data);

        let topicos = Array.isArray(res.data) ? res.data :
          (res.data.data ? res.data.data : []);

        // Filtrar por categoria e área
        const topicosFiltrados = topicos.filter(topico => {
          // Verificar diversas possibilidades de estrutura de dados
          const categoriaId = topico.id_categoria ||
            (topico.categoria && topico.categoria.id_categoria);
          const areaId = topico.id_area ||
            (topico.area && topico.area.id_area);

          return categoriaId == formData.id_categoria &&
            (areaId == formData.id_area || !areaId);
        });

        console.log("Tópicos do fórum filtrados:", topicosFiltrados);
        setTopicosDisponiveis(topicosFiltrados);
        setTopicosFetched(true);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar tópicos do fórum:", err);
        toast.error("Não foi possível carregar os tópicos. Verifique sua conexão ou tente novamente mais tarde.");
        setTopicosDisponiveis([]);
        setTopicosFetched(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    // Definir loading state
    setIsLoading(true);

    // Carregar formadores
    axios.get(`${API_BASE}/users/formadores`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("Formadores carregados:", res.data);
        setFormadores(res.data);
      })
      .catch(err => {
        console.error("Erro ao carregar formadores:", err);
        toast.error("Erro ao carregar formadores. Verifique o console para mais detalhes.");
      });

    // Carregar categorias
    axios.get(`${API_BASE}/categorias`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("Categorias carregadas:", res.data);
        setCategorias(res.data);
      })
      .catch(err => {
        console.error("Erro ao carregar categorias:", err);
        toast.error("Erro ao carregar categorias");
      });

    // Carregar todas as áreas
    axios.get(`${API_BASE}/areas`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        console.log("Áreas carregadas:", res.data);
        setAreas(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar áreas:", err);
        toast.error("Erro ao carregar áreas");
        setIsLoading(false);
      });
  }, []);

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

  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (formData.id_categoria) {
      // Converter para string para garantir comparação consistente
      const categoriaId = String(formData.id_categoria);

      // Filtragem mais flexível para lidar com diferentes estruturas de dados
      const areasFiltered = areas.filter(area => {
        const areaCategoriaId = getCategoriaId(area);
        return areaCategoriaId !== null && String(areaCategoriaId) === categoriaId;
      });

      console.log("Categoria selecionada:", categoriaId);
      console.log("Áreas filtradas:", areasFiltered);
      setAreasFiltradas(areasFiltered);

      // Limpar área selecionada se a categoria mudar
      setFormData(prev => ({ ...prev, id_area: '', id_topico: '' }));
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
      } else {
        setPreviewImage(null);
      }
    } else if (name === 'tipo') {
      // Se o curso mudar para assíncrono, limpar o formador
      if (value === 'assincrono') {
        setFormData({ ...formData, [name]: value, id_formador: '', vagas: '' });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'id_categoria') {
      // Quando a categoria muda, limpar o campo de área e tópico
      console.log("Categoria alterada para:", value);
      setFormData({ ...formData, [name]: value, id_area: '', id_topico: '' });
    } else if (name === 'id_area') {
      // Verificar se uma categoria foi selecionada antes
      if (!formData.id_categoria) {
        toast.error("É necessário selecionar uma categoria primeiro");
        return;
      }
      // Quando a área muda, limpar apenas o tópico
      setFormData({ ...formData, [name]: value, id_topico: '' });
    } else if (name === 'id_topico') {
      // Verificar se categoria e área foram selecionadas
      if (!formData.id_categoria) {
        toast.error("É necessário selecionar uma categoria primeiro");
        return;
      }
      if (!formData.id_area) {
        toast.error("É necessário selecionar uma área primeiro");
        return;
      }
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormadorSelection = (formadorId) => {
    // Se formadorId estiver vazio, isso significa que o usuário removeu a seleção
    setFormData({ ...formData, id_formador: formadorId });
    console.log(`Formador ${formadorId ? 'selecionado' : 'removido'}: ${formadorId}`);
  };

  const validateForm = () => {
    // Validar datas
    const dataInicio = new Date(formData.data_inicio);
    const dataFim = new Date(formData.data_fim);
    const hoje = new Date();

    if (dataInicio < hoje) {
      toast.error("A data de início não pode ser anterior à data atual");
      return false;
    }

    if (dataFim <= dataInicio) {
      toast.error("A data de fim deve ser posterior à data de início");
      return false;
    }

    // Validar formador para cursos síncronos
    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      toast.error("Selecione um formador para o curso síncrono");
      return false;
    }

    // Validar formador para cursos assíncronos (deve ser administrador)
    if (formData.tipo === 'assincrono') {
      if (!formData.id_formador) {
        toast.error("É obrigatório selecionar um formador administrador para cursos assíncronos");
        return false;
      }

      // Verificar se o formador selecionado é administrador
      const formadorSelecionado = formadores.find(f => {
        const formadorId = f.id_utilizador || f.id_user || f.id || f.idUser || f.userId;
        return String(formadorId) === String(formData.id_formador);
      });

      if (formadorSelecionado) {
        const cargoFormador = formadorSelecionado.cargo?.id_cargo || formadorSelecionado.id_cargo;
        if (cargoFormador !== 1) {
          toast.error("Para cursos assíncronos, o formador deve ser um administrador");
          return false;
        }
      }
    }

    // Validar número de vagas para cursos síncronos
    if (formData.tipo === 'sincrono' && (!formData.vagas || parseInt(formData.vagas) <= 0)) {
      toast.error("Defina um número válido de vagas para o curso síncrono");
      return false;
    }

    // Validar seleção de tópico
    if (!formData.id_topico) {
      toast.error("É necessário selecionar um tópico");
      return false;
    }

    // Validar duração
    if (!formData.duracao || parseInt(formData.duracao) <= 0) {
      toast.error("Defina uma duração válida para o curso em horas");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    }

    // Adicionar id_topico_categoria ao FormData
    if (formData.id_topico) {
      data.append('id_topico_categoria', formData.id_topico);
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/cursos`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      toast.success('Curso criado com sucesso!');

      // Se houver cursos a associar, criar as associações
      if (cursosAssociados.length > 0 && response.data.curso) {
        const novoCursoId = response.data.curso.id_curso;

        // Criar cada associação
        for (const cursoAssociado of cursosAssociados) {
          try {
            await axios.post(`${API_BASE}/associar-cursos`, {
              id_curso_origem: novoCursoId,
              id_curso_destino: cursoAssociado.id_curso
            }, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            console.log(`Associação criada: ${novoCursoId} -> ${cursoAssociado.id_curso}`);
          } catch (assocError) {
            console.error(`Erro ao criar associação com curso ${cursoAssociado.nome}:`, assocError);
            toast.error(`Não foi possível associar o curso "${cursoAssociado.nome}"`);
          }
        }

        toast.success(`${cursosAssociados.length} associações de cursos criadas com sucesso!`);
      }

      // Limpar o formulário após envio bem-sucedido
      setFormData({
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
      setPreviewImage(null);
      setCursosAssociados([]);

      // Redirecionar para a página do curso criado
      const novoCursoId = response.data.curso.id_curso;
      navigate(`/cursos/${novoCursoId}`);
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      const errorMessage = error.response?.data?.message || 'Erro desconhecido';
      toast.error('Erro ao criar curso: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Encontrar o formador atual pelos dados
  const getFormadorNome = () => {
    if (!formData.id_formador || !formadores.length) return null;

    const formador = formadores.find(f => {
      // Verificar diferentes propriedades possíveis para o ID
      const formadorId = f.id_utilizador || f.id_user || f.id || f.idUser || f.userId;
      return String(formadorId) === String(formData.id_formador);
    });

    // Verificar diferentes propriedades possíveis para o nome
    return formador ? (formador.nome || formador.name || formador.fullName || `ID: ${formData.id_formador}`) : `ID: ${formData.id_formador}`;
  };

  const formadorNome = getFormadorNome();

  // Determinar a data mínima para os campos de data (hoje)
  const getMinDate = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
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
              {!previewImage && <div className="upload-placeholder">Clique para adicionar imagem do curso</div>}
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
                <option value="">Selecione o Tipo</option>
                <option value="sincrono">Síncrono</option>
                <option value="assincrono">Assíncrono</option>
              </select>
            </div>

            {/* Categoria, Área e Tópico na mesma linha */}
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
                <option value="">Selecione a Área</option>
                {isLoading ? (
                  <option value="" disabled>A carregar áreas...</option>
                ) : areasFiltradas.length > 0 ? (
                  areasFiltradas.map(area => {
                    // Obter ID da área de maneira flexível
                    const areaId = area.id_area || area.id || area.idArea || area.area_id;
                    // Obter nome da área de maneira flexível
                    const areaNome = area.nome || area.name || area.descricao || area.description;

                    return (
                      <option key={areaId} value={areaId}>
                        {areaNome}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>Nenhuma área disponível para esta categoria</option>
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
                <option value="">Selecione o Tópico</option>
                {isLoading && !topicosFetched ? (
                  <option value="" disabled>A carregar tópicos...</option>
                ) : topicosDisponiveis.length > 0 ? (
                  topicosDisponiveis.map(topico => {
                    // Verificar diferentes formatos de ID
                    const topicoId = topico.id || topico.id_topico || topico.topico_id;
                    // Verificar diferentes formatos de título
                    const topicoTitulo = topico.titulo || topico.title || topico.nome || topico.name;

                    return (
                      <option key={topicoId} value={topicoId}>
                        {topicoTitulo}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>
                    {!formData.id_area
                      ? "Selecione uma área primeiro"
                      : (topicosFetched
                        ? "Nenhum tópico disponível para esta área"
                        : "A carregar tópicos...")}
                  </option>
                )}
              </select>
            </div>

            <div className="row">
              {formData.tipo === 'sincrono' && (
                <>
                  <button
                    type="button"
                    className="select-formador-button"
                    onClick={() => setModalAberto(true)}
                  >
                    <i className="fas fa-user-plus"></i>
                    {formData.id_formador
                      ? `Formador: ${formadorNome} (Clique para alterar)`
                      : "Selecionar Formador"}
                  </button>
                  <input
                    type="number"
                    name="vagas"
                    placeholder="Vagas"
                    value={formData.vagas}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </>
              )}<input
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

              {cursosAssociados.length > 0 ? (
                <div className="lista-cursos-associados">
                  {cursosAssociados.map(curso => (
                    <div key={curso.id_curso} className="curso-associado-item">
                      <span>{curso.nome}</span>
                      <button
                        type="button"
                        className="remover-associacao"
                        onClick={() => removerAssociacao(curso.id_curso)}
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
              {isLoading ? 'Criando...' : 'Criar'}
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

        <ToastContainer />
      </div>

      {/* Modal de associação de cursos */}
      <CursoAssociacaoModal
        isOpen={modalAssociacaoAberto}
        onClose={() => setModalAssociacaoAberto(false)}
        onSelectCurso={handleAssociarCurso}
        cursoAtualId={null}
      />
    </div>
  );
};

export default CriarCurso;