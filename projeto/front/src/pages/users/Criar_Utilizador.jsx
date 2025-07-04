import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from "../../api";
import Sidebar from '../../components/Sidebar';
import CategoriaModal from '../../components/categoriaModal';
import AreaModal from '../../components/areaModal';
import CursosModal from '../../components/cursos/Cursos_Modal';
import "../users/css/Criar_Utilizador.css";

/**
 * Componente para criação de novos utilizadores
 * Suporta criação de formadores, formandos e gestores
 */
function CriarUser() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Estados para controlo de modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTipo, setModalTipo] = useState(null);

  // Estados para categorias e áreas (formadores)
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);

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
    cargo: ''
  });

  /**
   * Carregar áreas baseadas nas categorias selecionadas
   */
  const carregarAreas = useCallback(async () => {
    try {
      if (categoriasSelecionadas.length > 0) {
        setAreas([]);
        
        let todasAreas = [];
        
        // Carregar áreas para cada categoria selecionada
        const promises = categoriasSelecionadas.map(async (categoria) => {
          const categoriaId = categoria.id_categoria;
          
          try {
            const response = await axios.get(`${API_BASE}/categorias/${categoriaId}/areas`);
            return response.data;
          } catch (catError) {
            return [];
          }
        });
        
        const resultados = await Promise.all(promises);
        
        // Combinar áreas e remover duplicatas
        resultados.forEach(areasCategoria => {
          areasCategoria.forEach(area => {
            if (!todasAreas.some(a => a.id_area === area.id_area)) {
              todasAreas.push(area);
            }
          });
        });
        
        setAreas(todasAreas);
      }
    } catch (error) {
      toast.error("Erro ao carregar áreas. Verifique a consola para mais detalhes.");
    }
  }, [categoriasSelecionadas]);

  /**
   * Carregar lista de categorias disponíveis
   */
  const carregarCategorias = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categorias`);
      setCategorias(response.data);
    } catch (error) {
      toast.error("Erro ao carregar categorias");
    }
  };

  // Carregar categorias na inicialização
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Carregar áreas quando categorias mudam
  useEffect(() => {
    if (categoriasSelecionadas.length > 0) {
      carregarAreas();
    } else {
      setAreas([]);
      setAreasSelecionadas([]);
    }
  }, [categoriasSelecionadas, carregarAreas]);

  /**
   * Abrir modal para seleção de categorias
   */
  const abrirModalCategoria = () => {
    setModalTipo('categoria');
    setModalAberto(true);
  };

  /**
   * Abrir modal para seleção de áreas
   */
  const abrirModalArea = () => {
    if (categoriasSelecionadas.length === 0) {
      toast.warning("Seleccione uma categoria primeiro");
      return;
    }
    setModalTipo('area');
    setModalAberto(true);
  };

  /**
   * Abrir modal para seleção de cursos
   */
  const abrirModalCurso = () => {
    if (categoriasSelecionadas.length === 0) {
      toast.warning("Seleccione uma categoria primeiro");
      return;
    }
    setModalTipo('curso');
    setModalAberto(true);
  };

  /**
   * Fechar modal activo
   */
  const fecharModal = () => {
    setModalAberto(false);
    setModalTipo(null);
  };

  /**
   * Processar seleção de categorias
   */
  const handleCategoriaSelecionada = (categorias) => {
    setCategoriasSelecionadas(categorias);
    setAreasSelecionadas([]);
    setCursoSelecionado(null);
    fecharModal();
  };

  /**
   * Processar seleção de áreas
   */
  const handleAreaSelecionada = (areas) => {
    setAreasSelecionadas(areas);
    fecharModal();
  };

  /**
   * Processar seleção de curso
   */
  const handleCursoSelecionado = (cursoId) => {
    setCursoSelecionado(cursoId);
    fecharModal();
  };

  /**
   * Processar mudanças no formulário
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'idade') {
      const idade = Math.min(99, Math.max(1, Number(value)));
      setFormData({ ...formData, idade });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  /**
   * Submeter formulário para criação de utilizador
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let response;

      if (formData.cargo === 'formador') {
        // Criar formador
        const formadorData = {
          nome: formData.nome,
          email: formData.email,
          password: formData.password,
          idade: formData.idade,
          telefone: formData.telefone,
          morada: formData.morada,
          codigo_postal: formData.codigo_postal,
          cargo: 'formador'
        };

        // Adicionar categorias, áreas e curso se selecionados
        if (categoriasSelecionadas.length > 0) {
          formadorData.categorias = categoriasSelecionadas.map(cat => cat.id_categoria);
        }

        if (areasSelecionadas.length > 0) {
          formadorData.areas = areasSelecionadas.map(area => area.id_area);
        }

        if (cursoSelecionado) {
          formadorData.curso = cursoSelecionado;
        }

        response = await axios.post(`${API_BASE}/formadores/register`, formadorData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        toast.success('Formador registado com sucesso! Um email de confirmação foi enviado.');
      } else if (formData.cargo === 'formando'){
        // Criar formando
        const formandoData = {
          nome: formData.nome,
          email: formData.email,
          password: formData.password,
          idade: formData.idade,
          telefone: formData.telefone,
          morada: formData.morada,
          codigo_postal: formData.codigo_postal,
          cargo: 'formando'
        };

        response = await axios.post(`${API_BASE}/users/register`, formandoData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        toast.success('Formando registado com sucesso! Um email de confirmação foi enviado.');
      } else if (formData.cargo === 'gestor') {
        // Criar gestor
        const gestorData = {
          nome: formData.nome,
          email: formData.email,
          password: formData.password,
          idade: formData.idade,
          telefone: formData.telefone,
          morada: formData.morada,
          codigo_postal: formData.codigo_postal,
          cargo: 'gestor'
        };

        response = await axios.post(`${API_BASE}/users/register`, gestorData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        toast.success('Gestor registado com sucesso! Um email de confirmação foi enviado.');
      } else {
        throw new Error("Tipo de cargo não reconhecido");
      }

      // Limpar formulário após sucesso
      setFormData({
        nome: '',
        email: '',
        password: '',
        idade: '',
        telefone: '',
        morada: '',
        codigo_postal: '',
        cargo: ''
      });
      setCategoriasSelecionadas([]);
      setAreasSelecionadas([]);
      setCursoSelecionado(null);

    } catch (error) {
      let mensagem = "Erro ao criar utilizador. Por favor, tente novamente.";

      if (error.response && error.response.data && error.response.data.message) {
        mensagem = error.response.data.message;
      }

      toast.error(mensagem);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ToastContainer />

      <form className='form-register' onSubmit={handleSubmit}>
        <div className="inputs">
          <div className="row">
            <input type="text" name="nome" placeholder="Nome do Utilizador" value={formData.nome} onChange={handleChange} required />
            <select name="cargo" value={formData.cargo} onChange={handleChange} required>
              <option disabled value="">Cargo do Utilizador</option>
              <option value="formador">Formador</option>
              <option value="formando">Formando</option>
              <option value="gestor">Gestor</option>
            </select>
            <input type="number" name="idade" placeholder="Idade" value={formData.idade} onChange={handleChange} required min="1" max="99" />
            <input type="number" name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} required />
          </div>
          <div className="row">
            <input type="password" name="password" placeholder="Palavra-passe" value={formData.password} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="row">
            <input type="text" name="morada" placeholder="Morada" value={formData.morada} onChange={handleChange} required />
            <input type="text" name="codigo_postal" placeholder="Código Postal" value={formData.codigo_postal} onChange={handleChange} required />
          </div>

          {/* Campos específicos para formadores */}
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
            {isSubmitting ? 'A registar...' : 'Criar'}
          </button>
        </div>
      </form>

      {/* Modais para seleção */}
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
          areasSelecionadas={areasSelecionadas}
        />
      )}
    </div>
  );
}

export default CriarUser;