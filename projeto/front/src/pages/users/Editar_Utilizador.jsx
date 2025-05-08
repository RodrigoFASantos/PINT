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

function EditarUtilizador() {
    const { id } = useParams();
    const navigate = useNavigate();
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
    const [isLoading, setIsLoading] = useState(true);

    // Estado do formulário
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

    // Carregar dados do usuário
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log("[DEBUG] ID recebido:", id);
                console.log("[DEBUG] API_BASE:", API_BASE);
                console.log("[DEBUG] URL construída:", `${API_BASE}/users/${id}`);

                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE}/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const userData = response.data;
                setFormData({
                    nome: userData.nome || '',
                    email: userData.email || '',
                    password: '', // Sempre vazio por segurança
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

                // Se for formador, carregar suas categorias e áreas atuais
                if (userData.id_cargo === 2) {
                    try {
                        // Carregar categorias do formador
                        const catResponse = await axios.get(`${API_BASE}/formadores/${id}/categorias`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (catResponse.data && catResponse.data.length > 0) {
                            setCategoriasSelecionadas(catResponse.data);

                            // Carregar áreas do formador
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
                console.error("ERRO COMPLETO:", error);
                console.error("Status do erro:", error.response?.status);
                console.error("Dados do erro:", error.response?.data);
                console.error("Mensagem do erro:", error.message);

                toast.error(`Erro ao carregar dados do usuário: ${error.response?.data?.message || error.message}`);
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    // Definir a função carregarAreas com useCallback
    const carregarAreas = useCallback(async () => {
        try {
            if (categoriasSelecionadas.length > 0) {
                const categoriaId = categoriasSelecionadas[0].id_categoria;
                console.log(`A carregar áreas para a categoria ID: ${categoriaId}`);

                const response = await axios.get(`${API_BASE}/categorias/${categoriaId}/areas`);
                console.log("Áreas carregadas com sucesso:", response.data);
                setAreas(response.data);
            }
        } catch (error) {
            console.error("Erro ao carregar áreas:", error);
            toast.error("Erro ao carregar áreas");
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
        // Resetar áreas quando mudar as categorias
        setAreasSelecionadas([]);
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

        // Se mudar o cargo para formando, limpar categorias, áreas e curso
        if (name === 'cargo' && value === 'formando') {
            setCategoriasSelecionadas([]);
            setAreasSelecionadas([]);
            setCursoSelecionado(null);
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');

            console.log("[DEBUG] A atualizar utilizador:", id);
            console.log("[DEBUG] URL para PUT:", `${API_BASE}/users/${id}`);

            // Atualizar informações básicas do usuário
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

            // Se uma nova senha foi fornecida, incluí-la
            if (formData.password) {
                basicData.password = formData.password;
            }

            // Atualizar dados básicos
            await axios.put(`${API_BASE}/users/${id}`, basicData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Se for formador, atualizar suas associações
            if (formData.cargo === 'formador') {
                // Primeiro remover todas as associações existentes
                try {
                    // Remover todas as categorias do formador
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
                                console.log(`Erro ao remover categoria ${categoria.id_categoria}:`, err);
                            }
                        }
                    }

                    // Remover todas as áreas do formador
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
                                console.log(`Erro ao remover área ${area.id_area}:`, err);
                            }
                        }
                    }
                } catch (cleanupError) {
                    console.log("Erro ao limpar associações anteriores:", cleanupError);
                }

                // Adicionar novas categorias
                if (categoriasSelecionadas.length > 0) {
                    await axios.post(`${API_BASE}/formadores/${id}/categorias`, {
                        categorias: categoriasSelecionadas.map(cat => cat.id_categoria)
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }

                // Adicionar novas áreas
                if (areasSelecionadas.length > 0) {
                    await axios.post(`${API_BASE}/formadores/${id}/areas`, {
                        areas: areasSelecionadas.map(area => area.id_area)
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } else {
                // Se mudou para formando, remover todas as associações
                try {
                    // Remover todas as categorias
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
                                console.log(`Erro ao remover categoria ${categoria.id_categoria}:`, err);
                            }
                        }
                    }

                    // Remover todas as áreas
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
                                console.log(`Erro ao remover área ${area.id_area}:`, err);
                            }
                        }
                    }
                } catch (cleanupError) {
                    console.log("Erro ao remover associações ao mudar para formando:", cleanupError);
                }
            }

            toast.success('Utilizador atualizado com sucesso!');
            navigate('/admin/usuarios');

        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            let mensagem = "Erro ao atualizar usuário. Por favor, tente novamente.";
            if (error.response?.data?.message) {
                mensagem = error.response.data.message;
            }
            toast.error(mensagem);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <input type="password" name="password" placeholder="Nova Password (deixe em branco para manter a atual)" value={formData.password} onChange={handleChange} />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="row">
                        <input type="text" name="morada" placeholder="Morada" value={formData.morada} onChange={handleChange} />
                        <input type="text" name="codigo_postal" placeholder="Código Postal" value={formData.codigo_postal} onChange={handleChange} />
                    </div>
                    <div className="row">
                        <input type="text" name="cidade" placeholder="Cidade" value={formData.cidade} onChange={handleChange} />
                        <input type="text" name="distrito" placeholder="Distrito" value={formData.distrito} onChange={handleChange} />
                    </div>
                    <div className="row">
                        <input type="text" name="freguesia" placeholder="Freguesia" value={formData.freguesia} onChange={handleChange} />
                        <textarea name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleChange} />
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
                        {isSubmitting ? 'A atualizar...' : 'Atualizar Utilizador'}
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

export default EditarUtilizador;