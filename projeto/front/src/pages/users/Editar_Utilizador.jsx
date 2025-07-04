import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE from "../../api";
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CategoriaModal from '../../components/categoriaModal';
import AreaModal from '../../components/areaModal';
import CursosModal from '../../components/cursos/Cursos_Modal';
import "./css/Criar_Utilizador.css";

/**
 * Componente para editar dados de utilizadores existentes
 * Permite alterar informações pessoais e, no caso de formadores,
 * gerir associações com categorias, áreas e cursos
 */
function EditarUtilizador() {
    const { id } = useParams(); // ID do utilizador a editar
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    /**
     * Alterna o estado da barra lateral
     */
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Estados para controlar os modais de seleção
    const [modalAberto, setModalAberto] = useState(false);
    const [modalTipo, setModalTipo] = useState(null); // 'categoria', 'area' ou 'curso'

    // Estados para gerir categorias, áreas e cursos
    const [categorias, setCategorias] = useState([]);
    const [areas, setAreas] = useState([]);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
    const [areasSelecionadas, setAreasSelecionadas] = useState([]);
    const [cursoSelecionado, setCursoSelecionado] = useState(null);

    // Estados de controlo da interface e carregamento
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Estado para armazenar os dados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
        idade: '',
        telefone: '',
        morada: '',
        cidade: '',
        distrito: '',
        freguesia: '',
        codigo_postal: '',
        descricao: '',
        cargo: ''
    });

    /**
     * Carrega os dados completos do utilizador desde a API
     * Também carrega associações específicas se for formador
     */
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE}/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const userData = response.data;
                
                // Preenche o formulário com os dados existentes
                setFormData({
                    nome: userData.nome || '',
                    email: userData.email || '',
                    password: '', // Mantém vazio por segurança
                    idade: userData.idade || '',
                    telefone: userData.telefone || '',
                    morada: userData.morada || '',
                    cidade: userData.cidade || '',
                    distrito: userData.distrito || '',
                    freguesia: userData.freguesia || '',
                    codigo_postal: userData.codigo_postal || '',
                    descricao: userData.descricao || '',
                    cargo: userData.id_cargo === 2 ? 'formador' : 'formando'
                });

                // Se for formador, carrega as suas associações atuais
                if (userData.id_cargo === 2) {
                    try {
                        // Carrega categorias associadas ao formador
                        const catResponse = await axios.get(`${API_BASE}/formadores/${id}/categorias`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (catResponse.data && catResponse.data.length > 0) {
                            setCategoriasSelecionadas(catResponse.data);

                            // Carrega áreas associadas ao formador
                            const areasResponse = await axios.get(`${API_BASE}/formadores/${id}/areas`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            if (areasResponse.data && areasResponse.data.length > 0) {
                                setAreasSelecionadas(areasResponse.data);
                            }
                        }
                    } catch (formadorError) {
                        console.error("Erro ao carregar dados do formador:", formadorError);
                    }
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Erro ao carregar dados do utilizador:", error);
                toast.error(`Erro ao carregar dados do utilizador: ${error.response?.data?.message || error.message}`);
                setIsLoading(false);
            }
        };
        
        fetchUserData();
    }, [id]);

    /**
     * Carrega as áreas disponíveis baseadas nas categorias selecionadas
     * Utiliza useCallback para evitar loops infinitos no useEffect
     */
    const carregarAreas = useCallback(async () => {
        try {
            if (categoriasSelecionadas.length > 0) {
                const categoriaId = categoriasSelecionadas[0].id_categoria;
                const response = await axios.get(`${API_BASE}/categorias/${categoriaId}/areas`);
                setAreas(response.data);
            }
        } catch (error) {
            console.error("Erro ao carregar áreas:", error);
            toast.error("Erro ao carregar áreas");
        }
    }, [categoriasSelecionadas]);

    /**
     * Carrega todas as categorias disponíveis desde a API
     */
    const carregarCategorias = async () => {
        try {
            const response = await axios.get(`${API_BASE}/categorias`);
            setCategorias(response.data);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
            toast.error("Erro ao carregar categorias");
        }
    };

    // Carrega categorias quando o componente é montado
    useEffect(() => {
        carregarCategorias();
    }, []);

    // Carrega áreas sempre que as categorias selecionadas mudam
    useEffect(() => {
        if (categoriasSelecionadas.length > 0) {
            carregarAreas();
        } else {
            setAreas([]);
            setAreasSelecionadas([]);
        }
    }, [categoriasSelecionadas, carregarAreas]);

    /**
     * Abre o modal de seleção de categorias
     */
    const abrirModalCategoria = () => {
        setModalTipo('categoria');
        setModalAberto(true);
    };

    /**
     * Abre o modal de seleção de áreas
     * Requer que pelo menos uma categoria esteja selecionada
     */
    const abrirModalArea = () => {
        if (categoriasSelecionadas.length === 0) {
            toast.warning("Seleciona uma categoria primeiro");
            return;
        }
        setModalTipo('area');
        setModalAberto(true);
    };

    /**
     * Abre o modal de seleção de cursos
     * Requer que pelo menos uma categoria esteja selecionada
     */
    const abrirModalCurso = () => {
        if (categoriasSelecionadas.length === 0) {
            toast.warning("Seleciona uma categoria primeiro");
            return;
        }
        setModalTipo('curso');
        setModalAberto(true);
    };

    /**
     * Fecha qualquer modal que esteja aberto
     */
    const fecharModal = () => {
        setModalAberto(false);
        setModalTipo(null);
    };

    /**
     * Gere a seleção de categorias vinda do modal
     * @param {Array} categorias - Array de categorias selecionadas
     */
    const handleCategoriaSelecionada = (categorias) => {
        setCategoriasSelecionadas(categorias);
        setAreasSelecionadas([]); // Limpa áreas quando muda categorias
        fecharModal();
    };

    /**
     * Gere a seleção de áreas vinda do modal
     * @param {Array} areas - Array de áreas selecionadas
     */
    const handleAreaSelecionada = (areas) => {
        setAreasSelecionadas(areas);
        fecharModal();
    };

    /**
     * Gere a seleção de curso vinda do modal
     * @param {number} cursoId - ID do curso selecionado
     */
    const handleCursoSelecionado = (cursoId) => {
        setCursoSelecionado(cursoId);
        fecharModal();
    };

    /**
     * Gere mudanças nos campos do formulário
     * Inclui validação especial para o campo idade
     * @param {Event} e - Evento de mudança do input
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validação especial para idade (limita entre 1 e 99)
        if (name === 'idade') {
            const idade = Math.min(99, Math.max(1, Number(value)));
            setFormData({ ...formData, idade });
            return;
        }

        // Se mudar cargo para formando, limpa todas as associações de formador
        if (name === 'cargo' && value === 'formando') {
            setCategoriasSelecionadas([]);
            setAreasSelecionadas([]);
            setCursoSelecionado(null);
        }

        setFormData({ ...formData, [name]: value });
    };

    /**
     * Processa o envio do formulário e atualiza o utilizador
     * Gere tanto dados básicos como associações específicas de formadores
     * @param {Event} e - Evento de submissão do formulário
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');

            // Prepara dados básicos para atualização
            const basicData = {
                nome: formData.nome,
                email: formData.email,
                idade: formData.idade,
                telefone: formData.telefone,
                morada: formData.morada,
                cidade: formData.cidade,
                distrito: formData.distrito,
                freguesia: formData.freguesia,
                codigo_postal: formData.codigo_postal,
                descricao: formData.descricao,
                id_cargo: formData.cargo === 'formador' ? 2 : 3
            };

            // Inclui nova password se foi fornecida
            if (formData.password) {
                basicData.password = formData.password;
            }

            // Atualiza dados básicos do utilizador
            await axios.put(`${API_BASE}/users/${id}`, basicData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Gere associações específicas de formadores
            if (formData.cargo === 'formador') {
                // Remove todas as associações existentes antes de adicionar novas
                try {
                    // Remove categorias existentes
                    const categoriesResponse = await axios.get(`${API_BASE}/formadores/${id}/categorias`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (categoriesResponse.data && categoriesResponse.data.length > 0) {
                        for (const categoria of categoriesResponse.data) {
                            try {
                                await axios.delete(`${API_BASE}/formadores/${id}/categorias/${categoria.id_categoria}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                            } catch (err) {
                                // Log silencioso - não é crítico se já foi removida
                            }
                        }
                    }

                    // Remove áreas existentes
                    const areasResponse = await axios.get(`${API_BASE}/formadores/${id}/areas`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (areasResponse.data && areasResponse.data.length > 0) {
                        for (const area of areasResponse.data) {
                            try {
                                await axios.delete(`${API_BASE}/formadores/${id}/areas/${area.id_area}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                            } catch (err) {
                                // Log silencioso - não é crítico se já foi removida
                            }
                        }
                    }
                } catch (cleanupError) {
                    // Erro na limpeza não é crítico, continua com as novas associações
                }

                // Adiciona novas categorias selecionadas
                if (categoriasSelecionadas.length > 0) {
                    await axios.post(`${API_BASE}/formadores/${id}/categorias`, {
                        categorias: categoriasSelecionadas.map(cat => cat.id_categoria)
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }

                // Adiciona novas áreas selecionadas
                if (areasSelecionadas.length > 0) {
                    await axios.post(`${API_BASE}/formadores/${id}/areas`, {
                        areas: areasSelecionadas.map(area => area.id_area)
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } else {
                // Se mudou para formando, remove todas as associações
                try {
                    // Remove todas as categorias
                    const categoriesResponse = await axios.get(`${API_BASE}/formadores/${id}/categorias`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (categoriesResponse.data && categoriesResponse.data.length > 0) {
                        for (const categoria of categoriesResponse.data) {
                            try {
                                await axios.delete(`${API_BASE}/formadores/${id}/categorias/${categoria.id_categoria}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                            } catch (err) {
                                // Log silencioso - não é crítico
                            }
                        }
                    }

                    // Remove todas as áreas
                    const areasResponse = await axios.get(`${API_BASE}/formadores/${id}/areas`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (areasResponse.data && areasResponse.data.length > 0) {
                        for (const area of areasResponse.data) {
                            try {
                                await axios.delete(`${API_BASE}/formadores/${id}/areas/${area.id_area}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                            } catch (err) {
                                // Log silencioso - não é crítico
                            }
                        }
                    }
                } catch (cleanupError) {
                    // Erro na limpeza não impede o sucesso da operação principal
                }
            }

            toast.success('Utilizador atualizado com sucesso!');
            navigate('/admin/usuarios');

        } catch (error) {
            console.error("Erro ao atualizar utilizador:", error);
            let mensagem = "Erro ao atualizar utilizador. Tenta novamente.";
            if (error.response?.data?.message) {
                mensagem = error.response.data.message;
            }
            toast.error(mensagem);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Ecrã de carregamento enquanto busca dados do utilizador
    if (isLoading) {
        return (
            <div className="register-container">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>A carregar dados do utilizador...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <ToastContainer />

            <form className='form-register' onSubmit={handleSubmit}>
                <div className="inputs">
                    {/* Primeira linha: dados básicos */}
                    <div className="row">
                        <input 
                            type="text" 
                            name="nome" 
                            placeholder="Nome do Utilizador" 
                            value={formData.nome} 
                            onChange={handleChange} 
                            required 
                        />
                        <select name="cargo" value={formData.cargo} onChange={handleChange} required>
                            <option disabled value="">Cargo do Utilizador</option>
                            <option value="formador">Formador</option>
                            <option value="formando">Formando</option>
                        </select>
                        <input 
                            type="number" 
                            name="idade" 
                            placeholder="Idade" 
                            value={formData.idade} 
                            onChange={handleChange} 
                            required 
                            min="1" 
                            max="99" 
                        />
                        <input 
                            type="number" 
                            name="telefone" 
                            placeholder="Telefone" 
                            value={formData.telefone} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    
                    {/* Segunda linha: credenciais */}
                    <div className="row">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Nova Password (deixa em branco para manter a atual)" 
                            value={formData.password} 
                            onChange={handleChange} 
                        />
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    
                    {/* Terceira linha: morada */}
                    <div className="row">
                        <input 
                            type="text" 
                            name="morada" 
                            placeholder="Morada" 
                            value={formData.morada} 
                            onChange={handleChange} 
                        />
                        <input 
                            type="text" 
                            name="codigo_postal" 
                            placeholder="Código Postal" 
                            value={formData.codigo_postal} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    {/* Quarta linha: localização */}
                    <div className="row">
                        <input 
                            type="text" 
                            name="cidade" 
                            placeholder="Cidade" 
                            value={formData.cidade} 
                            onChange={handleChange} 
                        />
                        <input 
                            type="text" 
                            name="distrito" 
                            placeholder="Distrito" 
                            value={formData.distrito} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    {/* Quinta linha: dados adicionais */}
                    <div className="row">
                        <input 
                            type="text" 
                            name="freguesia" 
                            placeholder="Freguesia" 
                            value={formData.freguesia} 
                            onChange={handleChange} 
                        />
                        <textarea 
                            name="descricao" 
                            placeholder="Descrição" 
                            value={formData.descricao} 
                            onChange={handleChange} 
                        />
                    </div>

                    {/* Controlos específicos para formadores */}
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
                        {isSubmitting ? 'A atualizar...' : 'Atualizar Utilizador'}
                    </button>
                </div>
            </form>

            {/* Modais para seleção de categorias, áreas e cursos */}
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

export default EditarUtilizador;