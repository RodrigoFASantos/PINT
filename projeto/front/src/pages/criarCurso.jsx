import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './css/criarCurso.css';
// Importar FontAwesome para o ícone de informação
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormadorModal from '../components/formadorModal';
import API_BASE from "../api";
import { useNavigate } from "react-router-dom";

const CriarCurso = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [modalAberto, setModalAberto] = useState(false);
  const [formadores, setFormadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    vagas: '',
    data_inicio: '',
    data_fim: '',
    id_formador: '', // Mudado para id_formador para corresponder ao backend
    id_area: '',
    id_categoria: '',
    imagem: null,
  });

  useEffect(() => {
    // Carregar formadores - usar rota correta
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
      })
      .catch(err => {
        console.error("Erro ao carregar áreas:", err);
        toast.error("Erro ao carregar áreas");
      });
  }, []);

  // Filtrar áreas com base na categoria selecionada
  useEffect(() => {
    if (formData.id_categoria) {
      const areasFiltered = areas.filter(area => area.id_categoria == formData.id_categoria);
      setAreasFiltradas(areasFiltered);
      // Limpar área selecionada se a categoria mudar
      setFormData(prev => ({ ...prev, id_area: '' }));
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
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormadorSelection = (formadorId) => {
    // Se formadorId estiver vazio, isso significa que o usuário removeu a seleção
    setFormData({ ...formData, id_formador: formadorId });
    console.log(`Formador ${formadorId ? 'selecionado' : 'removido'}: ${formadorId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formador para cursos síncronos
    if (formData.tipo === 'sincrono' && !formData.id_formador) {
      toast.error("Selecione um formador para o curso síncrono");
      return;
    }

    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    }

    try {
      // Usar a variável API_BASE em vez de hardcoded URL
      await axios.post(`${API_BASE}/cursos`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      toast.success('Curso criado com sucesso!');
      // Limpar o formulário após envio bem-sucedido
      setFormData({
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
      setPreviewImage(null);
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast.error('Erro ao criar curso: ' + (error.response?.data?.message || 'Erro desconhecido'));
    }
  };

  // Encontrar o formador atual pelos dados
  const getFormadorNome = () => {
    if (!formData.id_formador || !formadores.length) return null;
    
    const formador = formadores.find(f => 
      f.id_utilizador == formData.id_formador || f.id_user == formData.id_formador
    );
    
    return formador ? formador.nome : `ID: ${formData.id_formador}`;
  };

  

  const formadorNome = getFormadorNome();

  return (
    <div className="form-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <form className='form' onSubmit={handleSubmit} encType="multipart/form-data">
        <h2>Criar Novo Curso</h2>

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
            <span>Selecionar Imagem</span>
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
                  ? `Formador: ${formadorNome} (Clique para alterar)`
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
              disabled={formData.tipo === 'assincrono'}
              required={formData.tipo === 'sincrono'}
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

          <button type="submit" className="submit-button">Criar Curso</button>
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
  );
};

export default CriarCurso;