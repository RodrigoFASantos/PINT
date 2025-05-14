import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import './css/Editar_Curso_Modal.css';

const EditarCursoModal = ({ curso, onClose, onSuccess }) => {
  // Estado com nomes de campos atualizados para corresponder ao backend
  const [formData, setFormData] = useState({
    nome: curso.nome || '',
    descricao: curso.descricao || '',
    tipo: curso.tipo || 'sincrono',
    vagas: curso.vagas || '',
    data_inicio: curso.data_inicio ? new Date(curso.data_inicio).toISOString().split('T')[0] : '',
    data_fim: curso.data_fim ? new Date(curso.data_fim).toISOString().split('T')[0] : '',
    id_formador: curso.id_formador || '',
    id_area: curso.id_area || '',
    id_categoria: curso.id_categoria || '',
    id_topico: curso.id_topico_area || '', // Usando o campo correto do backend
    horasCurso: curso.horasCurso || '',
  });

  // Estado para o carregamento de dados
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [formadores, setFormadores] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [topicosFiltrados, setTopicosFiltrados] = useState([]);
  
  // Estados de loading e erro
  const [carregando, setCarregando] = useState(false);
  const [carregandoCategorias, setCarregandoCategorias] = useState(false);
  const [carregandoAreas, setCarregandoAreas] = useState(false);
  const [carregandoTopicos, setCarregandoTopicos] = useState(false);
  const [carregandoFormadores, setCarregandoFormadores] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Verificar se a data de início já passou
  const [dataInicioPassada, setDataInicioPassada] = useState(false);
  
  // Para criar novos tópicos
  const [novoTopico, setNovoTopico] = useState('');

  // Efeito inicial para carregar dados necessários
  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      await Promise.all([
        carregarCategorias(),
        carregarFormadores(),
        carregarTodasAreas()
      ]);
      setCarregando(false);
    };

    carregarDados();
    verificarDataInicio();
  }, []);

  // Verificar se a data de início já passou
  const verificarDataInicio = () => {
    if (formData.data_inicio) {
      const hoje = new Date();
      const inicioData = new Date(formData.data_inicio);
      setDataInicioPassada(inicioData <= hoje);
    }
  };

  // Carregar categorias
  const carregarCategorias = async () => {
    try {
      setCarregandoCategorias(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Categorias carregadas:", response.data);
      
      // Verificar formato de resposta
      let categoriasList = [];
      if (Array.isArray(response.data)) {
        categoriasList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriasList = response.data.data;
      }
      
      setCategorias(categoriasList);
      
      // Se já tem categoria selecionada, filtrar áreas
      if (formData.id_categoria) {
        filtrarAreas(formData.id_categoria);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setErro('Erro ao carregar categorias. Tente novamente mais tarde.');
    } finally {
      setCarregandoCategorias(false);
    }
  };

  // Carregar todas as áreas para depois filtrá-las
  const carregarTodasAreas = async () => {
    try {
      setCarregandoAreas(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Áreas carregadas:", response.data);
      
      // Verificar formato de resposta
      let areasList = [];
      if (Array.isArray(response.data)) {
        areasList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        areasList = response.data.data;
      }
      
      setAreas(areasList);
      
      // Se já tem categoria selecionada, filtrar áreas
      if (formData.id_categoria) {
        filtrarAreas(formData.id_categoria);
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      setErro('Erro ao carregar áreas. Tente novamente mais tarde.');
    } finally {
      setCarregandoAreas(false);
    }
  };

  // Filtrar áreas com base na categoria selecionada
  const filtrarAreas = (id_categoria) => {
    const areasCategoria = areas.filter(area => {
      // Tentativa de obter o id_categoria da área de várias formas possíveis
      const areaCategoriaId = 
        area.id_categoria || 
        area.categoria_id || 
        (area.categoria && area.categoria.id_categoria);
      
      return String(areaCategoriaId) === String(id_categoria);
    });
    
    console.log(`Áreas filtradas para categoria ${id_categoria}:`, areasCategoria);
    setAreasFiltradas(areasCategoria);
    
    // Resetar área selecionada se não existir na lista filtrada
    if (formData.id_area && !areasCategoria.some(a => String(a.id_area) === String(formData.id_area))) {
      setFormData(prev => ({ ...prev, id_area: '', id_topico: '' }));
    }
  };

  // Carregar formadores
  const carregarFormadores = async () => {
    try {
      setCarregandoFormadores(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/users/formadores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Formadores carregados:", response.data);
      
      let formadoresList = [];
      if (Array.isArray(response.data)) {
        formadoresList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        formadoresList = response.data.data;
      }
      
      setFormadores(formadoresList);
    } catch (error) {
      console.error('Erro ao carregar formadores:', error);
      setErro('Erro ao carregar formadores. Tente novamente mais tarde.');
    } finally {
      setCarregandoFormadores(false);
    }
  };

  // Carregar tópicos baseados na categoria e área selecionadas
  const carregarTopicos = async (id_categoria, id_area) => {
    if (!id_categoria || !id_area) return;
    
    try {
      setCarregandoTopicos(true);
      const token = localStorage.getItem('token');
      console.log(`Buscando tópicos para categoria=${id_categoria} e área=${id_area}`);
      
      let topicosList = [];
      
      // Primeira tentativa - buscar tópicos da área específica
      try {
        const response = await axios.get(`${API_BASE}/topicos-area`, {
          params: { id_categoria, id_area },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Resposta de tópicos (tentativa 1):", response.data);
        
        if (Array.isArray(response.data)) {
          topicosList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          topicosList = response.data.data;
        }
      } catch (err) {
        console.error("Erro na primeira tentativa de carregar tópicos:", err);
      }
      
      // Segunda tentativa - usar outro endpoint se o primeiro falhou
      if (topicosList.length === 0) {
        try {
          const response = await axios.get(`${API_BASE}/topicos`, {
            params: { id_categoria, id_area },
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("Resposta de tópicos (tentativa 2):", response.data);
          
          if (Array.isArray(response.data)) {
            topicosList = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            topicosList = response.data.data;
          }
        } catch (err) {
          console.error("Erro na segunda tentativa de carregar tópicos:", err);
        }
      }
      
      // Terceira tentativa - buscar todos os tópicos e filtrar manualmente
      if (topicosList.length === 0) {
        try {
          const response = await axios.get(`${API_BASE}/topicos-area/todos`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("Resposta de todos os tópicos (tentativa 3):", response.data);
          
          let todosTopicos = [];
          if (Array.isArray(response.data)) {
            todosTopicos = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            todosTopicos = response.data.data;
          }
          
          // Filtrar manualmente por categoria e área
          topicosList = todosTopicos.filter(topico => {
            const topicoCategoria = topico.id_categoria || (topico.categoria && topico.categoria.id_categoria);
            const topicoArea = topico.id_area || (topico.area && topico.area.id_area);
            
            return String(topicoCategoria) === String(id_categoria) && 
                   String(topicoArea) === String(id_area);
          });
          
          console.log("Tópicos filtrados manualmente:", topicosList);
        } catch (err) {
          console.error("Erro na terceira tentativa de carregar tópicos:", err);
        }
      }
      
      setTopicos(topicosList);
      setTopicosFiltrados(topicosList);
    } catch (error) {
      console.error("Erro geral ao carregar tópicos:", error);
      setErro('Erro ao carregar tópicos. Tente novamente mais tarde.');
    } finally {
      setCarregandoTopicos(false);
    }
  };

  // Efeito para carregar tópicos quando a categoria ou área mudarem
  useEffect(() => {
    if (formData.id_categoria && formData.id_area) {
      carregarTopicos(formData.id_categoria, formData.id_area);
    } else {
      setTopicos([]);
      setTopicosFiltrados([]);
    }
  }, [formData.id_categoria, formData.id_area]);

  // Handler para mudança de categoria
  const handleCategoriaChange = (e) => {
    const id_categoria = e.target.value;
    
    // Atualizar formData e resetar área e tópico
    setFormData(prev => ({
      ...prev,
      id_categoria,
      id_area: '',
      id_topico: ''
    }));
    
    // Filtrar áreas para a nova categoria
    if (id_categoria) {
      filtrarAreas(id_categoria);
    } else {
      setAreasFiltradas([]);
    }
  };

  // Handler para mudança de área
  const handleAreaChange = (e) => {
    const id_area = e.target.value;
    setFormData(prev => ({
      ...prev, 
      id_area,
      id_topico: ''
    }));
  };

  // Handler para mudança de tipo de curso
  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    setFormData(prev => ({
      ...prev,
      tipo,
      // Se for assíncrono, limpar formador e vagas
      id_formador: tipo === 'assincrono' ? '' : prev.id_formador,
      vagas: tipo === 'assincrono' ? '' : prev.vagas
    }));
  };

  // Handler para mudança no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Verificar data de início
    if (name === 'data_inicio') {
      const hoje = new Date();
      const inicioData = new Date(value);
      setDataInicioPassada(inicioData <= hoje);
    }
  };

  // Adicionar novo tópico (simulado - apenas para preenchimento UI)
  const adicionarNovoTopico = () => {
    if (!novoTopico.trim()) return;
    
    // Aqui simulamos adicionar um novo tópico à lista
    const novoTopicoObj = {
      id: `novo-${Date.now()}`,
      titulo: novoTopico,
      id_categoria: formData.id_categoria,
      id_area: formData.id_area,
      novo: true
    };
    
    setTopicos(prev => [...prev, novoTopicoObj]);
    setNovoTopico('');
  };

  // Validação do formulário
  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      setErro('O nome do curso é obrigatório.');
      return false;
    }
    
    if (!formData.id_categoria) {
      setErro('A categoria é obrigatória.');
      return false;
    }
    
    if (!formData.id_area) {
      setErro('A área é obrigatória.');
      return false;
    }
    
    if (!formData.id_topico) {
      setErro('O tópico é obrigatório.');
      return false;
    }
    
    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      setErro('O formador é obrigatório para cursos síncronos.');
      return false;
    }
    
    if (!formData.data_inicio) {
      setErro('A data de início é obrigatória.');
      return false;
    }
    
    if (!formData.data_fim) {
      setErro('A data de término é obrigatória.');
      return false;
    }
    
    if (new Date(formData.data_inicio) >= new Date(formData.data_fim)) {
      setErro('A data de término deve ser posterior à data de início.');
      return false;
    }
    
    if (formData.tipo === 'sincrono' && (!formData.vagas || isNaN(Number(formData.vagas)) || Number(formData.vagas) <= 0)) {
      setErro('O número de vagas deve ser um número positivo para cursos síncronos.');
      return false;
    }
    
    return true;
  };

  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Preparar dados para envio, mapeando para o formato esperado pelo backend
      const dadosAtualizados = {
        nome: formData.nome,
        descricao: formData.descricao,
        tipo: formData.tipo,
        vagas: formData.tipo === 'sincrono' ? Number(formData.vagas) : null,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        id_formador: formData.tipo === 'sincrono' ? formData.id_formador : null,
        id_area: formData.id_area,
        id_categoria: formData.id_categoria,
        id_topico_area: formData.id_topico  // Nome correto para o backend
      };
      
      console.log("Enviando dados atualizados:", dadosAtualizados);
      
      const response = await axios.put(
        `${API_BASE}/cursos/${curso.id_curso}`,
        dadosAtualizados,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Resposta de atualização:", response.data);
      onSuccess(response.data);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      setErro(error.response?.data?.message || 'Erro ao atualizar curso. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="editar-curso-overlay">
      <div className="editar-curso-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Editar Curso</h2>

        {dataInicioPassada && formData.tipo === 'sincrono' && (
          <div className="aviso-importante">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Aviso: O curso já iniciou. Algumas opções podem estar limitadas.</span>
          </div>
        )}

        {carregando ? (
          <div className="carregando-container">
            <div className="carregando-spinner"></div>
            <p>Carregando dados do curso...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome">Nome do Curso:</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição:</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="id_categoria">Categoria:</label>
                <select
                  id="id_categoria"
                  name="id_categoria"
                  value={formData.id_categoria}
                  onChange={handleCategoriaChange}
                  required
                  disabled={carregandoCategorias}
                >
                  <option value="">Selecione</option>
                  {carregandoCategorias ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="id_area">Área:</label>
                <select
                  id="id_area"
                  name="id_area"
                  value={formData.id_area}
                  onChange={handleAreaChange}
                  required
                  disabled={!formData.id_categoria || carregandoAreas}
                >
                  <option value="">Selecione</option>
                  {carregandoAreas ? (
                    <option value="" disabled>Carregando...</option>
                  ) : areasFiltradas.length > 0 ? (
                    areasFiltradas.map(area => (
                      <option key={area.id_area} value={area.id_area}>
                        {area.nome}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Selecione uma categoria primeiro</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="id_topico">Tópico:</label>
                <select
                  id="id_topico"
                  name="id_topico"
                  value={formData.id_topico}
                  onChange={handleChange}
                  required
                  disabled={!formData.id_area || carregandoTopicos}
                >
                  <option value="">Selecione</option>
                  {carregandoTopicos ? (
                    <option value="" disabled>Carregando tópicos...</option>
                  ) : topicosFiltrados.length > 0 ? (
                    topicosFiltrados.map(topico => {
                      // Suporte para diferentes formas de IDs e títulos
                      const id = topico.id || topico.id_topico;
                      const titulo = topico.titulo || topico.nome || topico.descricao;
                      return (
                        <option key={id} value={id}>
                          {titulo}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>
                      {!formData.id_area ? "Selecione uma área primeiro" : "Nenhum tópico disponível"}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de Curso:</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleTipoChange}
                required
              >
                <option value="sincrono">Síncrono (com formador)</option>
                <option value="assincrono">Assíncrono (sem formador)</option>
              </select>
            </div>

            {formData.tipo === 'sincrono' && (
              <div className="form-group">
                <label htmlFor="id_formador">Formador:</label>
                <select
                  id="id_formador"
                  name="id_formador"
                  value={formData.id_formador}
                  onChange={handleChange}
                  required
                  disabled={carregandoFormadores}
                >
                  <option value="">Selecione</option>
                  {carregandoFormadores ? (
                    <option value="" disabled>Carregando formadores...</option>
                  ) : (
                    formadores.map(f => {
                      // Suporte para diferentes formatos de ID
                      const id = f.id_utilizador || f.id;
                      return (
                        <option key={id} value={id}>
                          {f.nome}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data_inicio">Data de Início:</label>
                <input
                  type="date"
                  id="data_inicio"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="data_fim">Data de Término:</label>
                <input
                  type="date"
                  id="data_fim"
                  name="data_fim"
                  value={formData.data_fim}
                  onChange={handleChange}
                  required
                  min={formData.data_inicio}
                />
              </div>
            </div>

            {formData.tipo === 'sincrono' && (
              <div className="form-group">
                <label htmlFor="vagas">Vagas Disponíveis:</label>
                <input
                  type="number"
                  id="vagas"
                  name="vagas"
                  min="1"
                  step="1"
                  value={formData.vagas}
                  onChange={handleChange}
                  required
                  disabled={dataInicioPassada}
                  className={dataInicioPassada ? 'input-disabled' : ''}
                />
                {dataInicioPassada && (
                  <small className="campo-bloqueado-info">
                    Este campo está bloqueado pois o curso já iniciou.
                  </small>
                )}
              </div>
            )}

            {erro && <p className="erro-message">{erro}</p>}

            <div className="form-actions">
              <button
                type="button"
                className="cancelar-btn"
                onClick={onClose}
                disabled={enviando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="confirmar-btn"
                disabled={enviando}
              >
                {enviando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditarCursoModal;