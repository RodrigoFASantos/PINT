import React, { useState, useEffect, useCallback } from "react";
import "./css/criarUtilizador.css";
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import imagePreview from '../images/user.png';
import API_BASE from "../api";

// Componentes de Modal
import CategoriaModal from '../components/categoriaModal'; // Corrigido para corresponder ao nome do arquivo no disco
import AreaModal from '../components/areaModal';
import CursosModal from '../components/CursosModal';

function CriarUser() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Estado para controlar qual modal está aberto
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTipo, setModalTipo] = useState(null); // 'categoria', 'area' ou 'curso'

  // Estados para categorias e áreas
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);

  // Estado de carregamento para o botão de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    idade: '',
    telefone: '',
    morada: '',
    codigo_postal: '',
    cargo: '',
    imagem: null,
  });

  // Definir a função carregarAreas com useCallback para evitar recriação em cada render
  const carregarAreas = useCallback(async () => {
    try {
      if (categoriasSelecionadas.length > 0) {
        const categoriaId = categoriasSelecionadas[0].id_categoria;
        console.log(`Carregando áreas para a categoria ID: ${categoriaId}`);

        const response = await axios.get(`${API_BASE}/categorias/${categoriaId}/areas`);
        console.log("Áreas carregadas com sucesso:", response.data);
        setAreas(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar áreas:", error);
      if (error.response) {
        console.error("Resposta do servidor:", error.response.status, error.response.data);
      }
      toast.error("Erro ao carregar áreas. Verifique o console para mais detalhes.");
    }
  }, [categoriasSelecionadas]);

  // Função para carregar categorias
  const carregarCategorias = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categorias`);
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    }
  };

  // Carregar categorias quando o componente for montado
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Carregar áreas quando uma categoria for selecionada
  useEffect(() => {
    if (categoriasSelecionadas.length > 0) {
      carregarAreas();
    } else {
      setAreas([]);
      setAreasSelecionadas([]);
    }
  }, [categoriasSelecionadas, carregarAreas]);

  // Funções para abrir modais específicos
  const abrirModalCategoria = () => {
    setModalTipo('categoria');
    setModalAberto(true);
  };

  const abrirModalArea = () => {
    if (categoriasSelecionadas.length === 0) {
      toast.warning("Selecione uma categoria primeiro");
      return;
    }
    setModalTipo('area');
    setModalAberto(true);
  };

  const abrirModalCurso = () => {
    if (categoriasSelecionadas.length === 0) {
      toast.warning("Selecione uma categoria primeiro");
      return;
    }
    setModalTipo('curso');
    setModalAberto(true);
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
    setModalTipo(null);
  };

  // Funções para lidar com seleções dos modais
  const handleCategoriaSelecionada = (categorias) => {
    setCategoriasSelecionadas(categorias);
    // Resetar áreas e curso selecionado quando mudar as categorias
    setAreasSelecionadas([]);
    setCursoSelecionado(null);
    fecharModal();
  };

  const handleAreaSelecionada = (areas) => {
    setAreasSelecionadas(areas);
    fecharModal();
  };

  const handleCursoSelecionado = (cursoId) => {
    setCursoSelecionado(cursoId);
    fecharModal();
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'idade') {
      const idade = Math.min(99, Math.max(1, Number(value)));
      setFormData({ ...formData, idade });
      return;
    }

    if (name === 'imagem') {
      setFormData({ ...formData, imagem: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    try {
      const data = new FormData();
  
      // Adicionar todos os campos, exceto imagem para formadores
      for (let key in formData) {
        if (key !== 'imagem' || formData.cargo !== 'formador') {
          if (formData[key] !== null && formData[key] !== undefined) {
            data.append(key, formData[key]);
          }
        }
      }
      
      // Adicionar imagem apenas para formandos
      if (formData.cargo !== 'formador' && formData.imagem) {
        data.append('imagem', formData.imagem);
      }
  
      let userId = null;
  
      if (formData.cargo === 'formador') {
        // Para formadores, usar application/json em vez de multipart/form-data
        const formadorData = {
          nome: formData.nome,
          email: formData.email,
          password: formData.password,
          idade: formData.idade,
          telefone: formData.telefone,
          morada: formData.morada,
          codigo_postal: formData.codigo_postal,
          cargo: formData.cargo
        };
        
        const response = await axios.post(`${API_BASE}/formadores`, formadorData);
  
        toast.success('Formador criado com sucesso!');
        userId = response.data.formador.id_utilizador || response.data.formador.id;
  
        // Rest of your code for associating categories, areas, etc.
      } else {
        // Para formandos, continuar usando multipart/form-data
        const response = await axios.post(`${API_BASE}/auth/register`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
  
        toast.success('Utilizador criado com sucesso!');
      }
  
      // Limpar o formulário
      setFormData({
        nome: '',
        email: '',
        password: '',
        idade: '',
        telefone: '',
        morada: '',
        codigo_postal: '',
        cargo: '',
        imagem: null,
      });
      setCategoriasSelecionadas([]);
      setAreasSelecionadas([]);
      setCursoSelecionado(null);
  
    } catch (error) {
      // Error handling code...
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ToastContainer />

      <form className='form-register' onSubmit={handleSubmit} encType="multipart/form-data">
        <label className="custom-file-upload">
          <input
            type="file"
            name="imagem"
            accept="image/*"
            onChange={handleChange}
          />
          <img className="image" src={formData.imagem ? URL.createObjectURL(formData.imagem) : imagePreview} alt="Pré-visualização" style={{
            animation: "float 2.5s infinite ease-in-out",
            transition: "transform 0.3s ease"
          }} />
        </label>

        <div className="inputs">
          <div className="row">
            <input type="text" name="nome" placeholder="Nome do Utilizador" value={formData.nome} onChange={handleChange} required />
            <select name="cargo" value={formData.cargo} onChange={handleChange} required>
              <option disabled value="">Cargo do Utilizador</option>
              <option value="formador">Formador</option>
              <option value="formando">Formando</option>
            </select>
            <input type="number" name="idade" placeholder="Idade" value={formData.idade} onChange={handleChange} required min="1" max="99" />
            <input type="number" name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} required />
          </div>
          <div className="row">
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="row">
            <input type="text" name="morada" placeholder="Morada" value={formData.morada} onChange={handleChange} required />
            <input type="text" name="codigo_postal" placeholder="Codigo Postal" value={formData.codigo_postal} onChange={handleChange} required />
          </div>

          {formData.cargo === "formador" && (
            <div className="row">
              <button
                type="button"
                className="select-categoria-button"
                onClick={abrirModalCategoria}
              >
                Categorias {categoriasSelecionadas.length > 0 && `(${categoriasSelecionadas.length} selecionadas)`}
              </button>
              <button
                type="button"
                className="select-area-button"
                onClick={abrirModalArea}
                disabled={categoriasSelecionadas.length === 0}
              >
                Áreas {areasSelecionadas.length > 0 && `(${areasSelecionadas.length} selecionadas)`}
              </button>
              <button
                type="button"
                className="select-cursos-button"
                onClick={abrirModalCurso}
                disabled={categoriasSelecionadas.length === 0}
              >
                Cursos {cursoSelecionado && `(ID: ${cursoSelecionado})`}
              </button>
            </div>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Conta'}
          </button>
        </div>
      </form>

      {/* Renderizar o modal apropriado com base no modalTipo */}
      {modalAberto && modalTipo === 'categoria' && (
        <CategoriaModal
          isOpen={modalAberto}
          onClose={fecharModal}
          categorias={categorias}
          categoriasSelecionadas={categoriasSelecionadas}
          onSelect={handleCategoriaSelecionada}
        />
      )}

      {modalAberto && modalTipo === 'area' && (
        <AreaModal
          isOpen={modalAberto}
          onClose={fecharModal}
          areas={areas}
          areasSelecionadas={areasSelecionadas}
          onSelect={handleAreaSelecionada}
        />
      )}

      {modalAberto && modalTipo === 'curso' && (
        <CursosModal
          isOpen={modalAberto}
          onClose={fecharModal}
          onSelect={handleCursoSelecionado}
          categoriasSelecionadas={categoriasSelecionadas}
        />
      )}
    </div>
  );
}

export default CriarUser;