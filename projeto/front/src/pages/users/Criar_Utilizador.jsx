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
    cargo: ''
  });

  // Definir a função carregarAreas com useCallback para evitar recriação em cada render
  const carregarAreas = useCallback(async () => {
    try {
      if (categoriasSelecionadas.length > 0) {
        setAreas([]); // Limpar áreas anteriores
        
        // Carregar áreas uma categoria de cada vez usando o endpoint existente
        let todasAreas = [];
        
        // Criar um array de promessas, uma para cada categoria
        const promises = categoriasSelecionadas.map(async (categoria) => {
          const categoriaId = categoria.id_categoria;
          console.log(`A carregar áreas para a categoria ID: ${categoriaId}`);
          
          try {
            // Usar o endpoint existente que funciona
            const response = await axios.get(`${API_BASE}/categorias/${categoriaId}/areas`);
            return response.data; // Retornar as áreas para esta categoria
          } catch (catError) {
            console.error(`Erro ao carregar áreas para categoria ${categoriaId}:`, catError);
            return []; // Retornar array vazio se houver erro
          }
        });
        
        // Aguardar que todos os pedidos sejam concluídos
        const resultados = await Promise.all(promises);
        
        // Combinar todas as áreas e remover duplicatas
        resultados.forEach(areasCategoria => {
          areasCategoria.forEach(area => {
            // Apenas adicionar se já não estiver no array (verificar por id_area)
            if (!todasAreas.some(a => a.id_area === area.id_area)) {
              todasAreas.push(area);
            }
          });
        });
        
        console.log(`Total de ${todasAreas.length} áreas carregadas de ${categoriasSelecionadas.length} categorias`);
        setAreas(todasAreas);
      }
    } catch (error) {
      console.error("Erro ao carregar áreas:", error);
      if (error.response) {
        console.error("Resposta do servidor:", error.response.status, error.response.data);
      }
      toast.error("Erro ao carregar áreas. Verifique a consola para mais detalhes.");
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
      toast.warning("Seleccione uma categoria primeiro");
      return;
    }
    setModalTipo('area');
    setModalAberto(true);
  };

  const abrirModalCurso = () => {
    if (categoriasSelecionadas.length === 0) {
      toast.warning("Seleccione uma categoria primeiro");
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
    // Restabelecer áreas e curso selecionado quando mudar as categorias
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
    const { name, value } = e.target;
    if (name === 'idade') {
      const idade = Math.min(99, Math.max(1, Number(value)));
      setFormData({ ...formData, idade });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let response;

      if (formData.cargo === 'formador') {
        // Para formadores, usar objecto simples (sem FormData)
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

        // Adicionar categorias, áreas e curso selecionados
        if (categoriasSelecionadas.length > 0) {
          formadorData.categorias = categoriasSelecionadas.map(cat => cat.id_categoria);
        }

        if (areasSelecionadas.length > 0) {
          formadorData.areas = areasSelecionadas.map(area => area.id_area);
        }

        if (cursoSelecionado) {
          formadorData.curso = cursoSelecionado;
        }

        // Importante: enviar como application/json, não como multipart/form-data
        response = await axios.post(`${API_BASE}/formadores/register`, formadorData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        toast.success('Formador registado com sucesso! Um email de confirmação foi enviado.');
      } else if (formData.cargo === 'formando'){
        // Para formandos, também usar objecto simples (sem FormData)
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

        // Enviar requisição para registar formando
        response = await axios.post(`${API_BASE}/users/register`, formandoData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        toast.success('Formando registado com sucesso! Um email de confirmação foi enviado.');
      } else if (formData.cargo === 'gestor') {
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

        // Enviar requisição para registar gestor
        response = await axios.post(`${API_BASE}/users/register`, gestorData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        toast.success('Gestor registado com sucesso! Um email de confirmação foi enviado.');
      } else {
        throw new Error("Tipo de cargo não reconhecido");
      }

      // Limpar o formulário após sucesso
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
      console.error("Erro ao criar utilizador:", error);

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
          areasSelecionadas={areasSelecionadas}
        />
      )}
    </div>
  );
}

export default CriarUser;