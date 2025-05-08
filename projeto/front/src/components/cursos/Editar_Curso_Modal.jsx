import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Editar_Curso_Modal.css';

const EditarCursoModal = ({ curso, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState(curso.titulo || '');
  const [descricao, setDescricao] = useState(curso.descricao || '');
  const [categoria, setCategoria] = useState(curso.categoria || '');
  const [area, setArea] = useState(curso.area || '');
  const [tipo, setTipo] = useState(curso.formador ? 'sincrono' : 'assincrono');
  const [formador, setFormador] = useState(curso.formador?.id || '');
  const [dataInicio, setDataInicio] = useState(
    curso.dataInicio ? new Date(curso.dataInicio).toISOString().split('T')[0] : ''
  );
  const [dataFim, setDataFim] = useState(
    curso.dataFim ? new Date(curso.dataFim).toISOString().split('T')[0] : ''
  );
  const [horasCurso, setHorasCurso] = useState(curso.horasCurso || '');
  const [vagasTotal, setVagasTotal] = useState(curso.vagasTotal || '');

  // Novo estado para verificar se a data de início já passou
  const [dataInicioPassada, setDataInicioPassada] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [formadores, setFormadores] = useState([]);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {

    // Verificar se a data de início já passou
    const verificarDataInicio = () => {
      if (dataInicio) {
        const hoje = new Date();
        const inicioData = new Date(dataInicio);
        setDataInicioPassada(inicioData <= hoje);
      }
    };

    verificarDataInicio();

    const fetchDados = async () => {
      try {
        const token = localStorage.getItem('token');

        // Obter categorias
        const categoriasResponse = await axios.get('/api/categorias', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCategorias(categoriasResponse.data);

        // Se já temos uma categoria selecionada, carregamos as áreas
        if (categoria) {
          const categoriaSelecionada = categoriasResponse.data.find(
            cat => cat.nome === categoria
          );

          if (categoriaSelecionada) {
            setAreas(categoriaSelecionada.areas);
          }
        }

        // Obter formadores
        const formadoresResponse = await axios.get('/api/admin/formadores', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setFormadores(formadoresResponse.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setErro('Erro ao carregar dados necessários. Tente novamente mais tarde.');
      }
    };

    fetchDados();
  }, [categoria]);

  const handleCategoriaChange = (e) => {
    const novaCategoria = e.target.value;
    setCategoria(novaCategoria);
    setArea(''); // Resetar área ao mudar categoria

    // Atualizar áreas com base na categoria selecionada
    const categoriaSelecionada = categorias.find(cat => cat.nome === novaCategoria);
    if (categoriaSelecionada) {
      setAreas(categoriaSelecionada.areas);
    } else {
      setAreas([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações básicas
    if (!titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }

    if (!categoria) {
      setErro('A categoria é obrigatória.');
      return;
    }

    if (!area) {
      setErro('A área é obrigatória.');
      return;
    }

    if (tipo === 'sincrono' && !formador) {
      setErro('O formador é obrigatório para cursos síncronos.');
      return;
    }

    if (!dataInicio) {
      setErro('A data de início é obrigatória.');
      return;
    }

    if (!dataFim) {
      setErro('A data de término é obrigatória.');
      return;
    }

    if (new Date(dataInicio) >= new Date(dataFim)) {
      setErro('A data de término deve ser posterior à data de início.');
      return;
    }

    if (!horasCurso || isNaN(Number(horasCurso)) || Number(horasCurso) <= 0) {
      setErro('A carga horária deve ser um número positivo.');
      return;
    }

    if (tipo === 'sincrono' && (!vagasTotal || isNaN(Number(vagasTotal)) || Number(vagasTotal) <= 0)) {
      setErro('O número de vagas deve ser um número positivo para cursos síncronos.');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/admin/cursos/${curso.id}`,
        {
          titulo,
          descricao,
          categoria,
          area,
          tipo,
          formadorId: tipo === 'sincrono' ? formador : null,
          dataInicio,
          dataFim,
          horasCurso: Number(horasCurso),
          vagasTotal: tipo === 'sincrono' ? Number(vagasTotal) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess(response.data);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      setErro(error.response?.data?.message || 'Erro ao atualizar curso. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="editar-curso-overlay">
      <div className="editar-curso-modal">
        <button className="close-btn" onClick={onClose}>×</button>

        <h2>Editar Curso</h2>

        {dataInicioPassada && tipo === 'sincrono' && (
          <div className="aviso-importante">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Aviso: O curso já iniciou. Não é possível alterar o número de vagas.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="titulo">Título:</label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição:</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categoria">Categoria:</label>
              <select
                id="categoria"
                value={categoria}
                onChange={handleCategoriaChange}
                required
              >
                <option value="">Selecione</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="area">Área:</label>
              <select
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                disabled={!categoria}
              >
                <option value="">Selecione</option>
                {areas.map(a => (
                  <option key={a.id} value={a.nome}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tipo">Tipo de Curso:</label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="sincrono">Síncrono (com formador)</option>
              <option value="assincrono">Assíncrono (sem formador)</option>
            </select>
          </div>

          {tipo === 'sincrono' && (
            <div className="form-group">
              <label htmlFor="formador">Formador:</label>
              <select
                id="formador"
                value={formador}
                onChange={(e) => setFormador(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {formadores.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataInicio">Data de Início:</label>
              <input
                type="date"
                id="dataInicio"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataFim">Data de Término:</label>
              <input
                type="date"
                id="dataFim"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
                min={dataInicio}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="horasCurso">Carga Horária (horas):</label>
              <input
                type="number"
                id="horasCurso"
                min="1"
                step="0.5"
                value={horasCurso}
                onChange={(e) => setHorasCurso(e.target.value)}
                required
              />
            </div>

            {tipo === 'sincrono' && (
              <div className="form-group">
                <label htmlFor="vagasTotal">Vagas Disponíveis:</label>
                <input
                  type="number"
                  id="vagasTotal"
                  min="1"
                  step="1"
                  value={vagasTotal}
                  onChange={(e) => setVagasTotal(e.target.value)}
                  required
                  disabled={dataInicioPassada} // Desativar o curso se a data de início já passou
                  className={dataInicioPassada ? 'input-disabled' : ''}
                />
                {dataInicioPassada && (
                  <small className="campo-bloqueado-info">
                    Este campo está bloqueado pois o curso já iniciou.
                  </small>
                )}
              </div>
            )}
          </div>

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
      </div>
    </div>
  );
};

export default EditarCursoModal;