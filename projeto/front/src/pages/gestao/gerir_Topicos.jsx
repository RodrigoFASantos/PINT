import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import API_BASE from "../../api";
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import './css/gerir_Topicos.css';

// Modal para criar/editar tópicos
const TopicoModal = ({ isOpen, onClose, topico, categorias, areas, onSave }) => {
    const [formData, setFormData] = useState({
        id_categoria: '',
        id_area: '',
        titulo: '',
        descricao: ''
    });
    const [areasFiltradas, setAreasFiltradas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Limpar formulário quando o modal abre/fecha ou recebe novo tópico
    useEffect(() => {
        if (isOpen) {
            if (topico) {
                // Modo edição - preencher com dados do tópico
                setFormData({
                    id_categoria: topico.id_categoria || '',
                    id_area: topico.id_area || '',
                    titulo: topico.titulo || '',
                    descricao: topico.descricao || ''
                });

                // Filtrar áreas baseadas na categoria do tópico
                if (topico.id_categoria && categorias.length > 0) {
                    const areasFiltered = areas.filter(area =>
                        area.id_categoria === parseInt(topico.id_categoria)
                    );
                    setAreasFiltradas(areasFiltered);
                }
            } else {
                // Modo criação - formulário em branco
                setFormData({
                    id_categoria: '',
                    id_area: '',
                    titulo: '',
                    descricao: ''
                });
                setAreasFiltradas([]);
            }
        }
    }, [isOpen, topico, areas, categorias]);

    // Filtrar áreas quando a categoria muda
    useEffect(() => {
        if (formData.id_categoria) {
            const areasFiltered = areas.filter(area =>
                area.id_categoria === parseInt(formData.id_categoria)
            );
            setAreasFiltradas(areasFiltered);

            // Limpar área selecionada se a categoria mudou
            if (topico?.id_categoria !== formData.id_categoria) {
                setFormData(prev => ({ ...prev, id_area: '' }));
            }
        } else {
            setAreasFiltradas([]);
        }
    }, [formData.id_categoria, areas, topico]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação básica
        if (!formData.id_categoria || !formData.id_area || !formData.titulo) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsLoading(true);

        try {
            // Construir objeto para enviar
            const topicoData = {
                id_categoria: formData.id_categoria,
                id_area: formData.id_area,
                titulo: formData.titulo,
                descricao: formData.descricao || ''
            };

            // Salvar tópico (criar novo ou atualizar existente)
            if (topico && topico.id) {
                // Modo edição
                await onSave({ ...topicoData, id: topico.id });
            } else {
                // Modo criação
                await onSave(topicoData);
            }

            // Limpar formulário
            setFormData({
                id_categoria: '',
                id_area: '',
                titulo: '',
                descricao: ''
            });

            // Fechar modal
            onClose();
        } catch (error) {
            console.error('Erro ao salvar tópico:', error);
            toast.error(error.message || 'Erro ao salvar tópico');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-background">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>{topico ? 'Editar Tópico' : 'Novo Tópico'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Categoria:</label>
                            <select
                                name="id_categoria"
                                value={formData.id_categoria}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione uma categoria</option>
                                {categorias.map(categoria => (
                                    <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Área:</label>

                            <select
                                name="id_area"
                                value={formData.id_area}
                                onMouseDown={e => {
                                    if (!formData.id_categoria) {
                                        e.preventDefault();
                                        toast.error('Selecione uma categoria primeiro');
                                    }
                                }}
                                onChange={e => {
                                    if (!formData.id_categoria) {
                                        toast.error('Selecione uma categoria primeiro');
                                        return;
                                    }
                                    handleChange(e);
                                }}
                                required
                            >

                                <option value="">
                                    {!formData.id_categoria
                                        ? "Selecione uma categoria primeiro"
                                        : "Selecione uma área"}
                                </option>
                                {areasFiltradas.map(area => (
                                    <option key={area.id_area} value={area.id_area}>
                                        {area.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Título:</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                placeholder="Digite o título do tópico"
                            />
                        </div>

                        <div className="form-group">
                            <label>Descrição:</label>
                            <textarea
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleChange}
                                rows="4"
                                maxLength={500}
                                placeholder="Digite uma descrição para o tópico (opcional)"
                            />
                        </div>
                    </div>

                    {/* Modificado o estilo do footer e garantindo que os botões sejam exibidos */}
                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px', gap: '10px' }}>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                            disabled={isLoading}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ddd'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="save-button"
                            disabled={isLoading}
                            style={{
                                display: 'inline-block',
                                visibility: 'visible',
                                opacity: 1,
                                backgroundColor: '#4b6ba5',
                                color: 'white',
                                padding: '0.6rem 1.2rem',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                minWidth: '120px',
                                position: 'relative',
                                zIndex: 10 // Garantir que o botão fique acima de outros elementos
                            }}
                        >
                            {isLoading ? 'A guardar...' : topico ? 'Guardar alterações' : 'Criar tópico'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal de confirmação para eliminar tópicos
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, topico }) => {
    if (!isOpen || !topico) return null;

    // Obter o ID correto do tópico, tentando diferentes propriedades possíveis
    const topicoId = topico.id_topico || topico.id || topico.id_categoria_topico;

    console.log('Objeto tópico na modal de confirmação:', topico);
    console.log('ID identificado para exclusão:', topicoId);

    return (
        <div className="modal-background">
            <div className="modal-container confirm-delete">
                <div className="modal-header">
                    <h2>Confirmar Eliminação</h2>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <p>Tem a certeza que deseja eliminar o tópico <strong>"{topico?.titulo}"</strong>?</p>
                    <p className="warning">Esta ação não pode ser desfeita.</p>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="delete-button"
                        onClick={() => {
                            // Captura e log explícito do ID antes da ação
                            const idToDelete = topico.id_topico || topico.id || topico.id_categoria_topico;
                            console.log('Detalhes completos do tópico para exclusão:', topico);
                            console.log('ID identificado para exclusão:', idToDelete);

                            if (idToDelete) {
                                onConfirm(idToDelete);
                                onClose();
                            } else {
                                console.error('Detalhes do objeto tópico:', JSON.stringify(topico));
                                toast.error('Não foi possível identificar o ID do tópico para exclusão');
                            }
                        }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente principal
const Gerir_Topicos = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const [topicos, setTopicos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [areas, setAreas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para filtros
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroArea, setFiltroArea] = useState('');
    const [filtroPesquisa, setFiltroPesquisa] = useState('');

    // Estados para modais
    const [modalAberto, setModalAberto] = useState(false);
    const [topicoEditando, setTopicoEditando] = useState(null);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
    const [topicoParaExcluir, setTopicoParaExcluir] = useState(null);

    const [areasFiltradas, setAreasFiltradas] = useState([]);
    // Carregar dados iniciais: tópicos, categorias e áreas
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Carregar categorias
                const categoriasRes = await axios.get(`${API_BASE}/categorias`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                // Carregar áreas
                const areasRes = await axios.get(`${API_BASE}/areas`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                // Carregar tópicos
                const topicosRes = await axios.get(`${API_BASE}/topicos-area/todos`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });



                console.log('Tópicos carregados com sucesso:', topicosRes.data.length);
                setCategorias(Array.isArray(categoriasRes.data) ? categoriasRes.data : []);
                setAreas(Array.isArray(areasRes.data) ? areasRes.data : []);
                setTopicos(topicosRes.data);


            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                console.error('Detalhes do erro:', error.response?.data || error.message);
                toast.error('Erro ao carregar dados. Por favor, tenta novamente.');

                // Definir arrays vazios para evitar erros de nulo
                setCategorias([]);
                setAreas([]);
                setTopicos([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (filtroCategoria) {
            // Filtrar áreas que pertencem à categoria selecionada
            const areasFiltered = areas.filter(area =>
                area.id_categoria === parseInt(filtroCategoria)
            );
            setAreasFiltradas(areasFiltered);
            console.log(`Categoria ${filtroCategoria} selecionada: ${areasFiltered.length} áreas disponíveis`);

            // Limpar filtro de área somente se a categoria mudou e não há correspondência
            if (filtroArea && !areasFiltered.some(a => a.id_area === parseInt(filtroArea))) {
                setFiltroArea('');
            }
        } else {
            // Se nenhuma categoria estiver selecionada, não mostrar áreas
            setAreasFiltradas([]);
            setFiltroArea('');
        }
    }, [filtroCategoria, areas, filtroArea]);

    // Função para filtrar tópicos com base nos filtros atuais
    const filtrarTopicos = () => {
        return topicos.filter(topico => {
            // Filtro por categoria
            if (filtroCategoria && topico.id_categoria !== parseInt(filtroCategoria)) {
                return false;
            }

            // Filtro por área
            if (filtroArea && topico.id_area !== parseInt(filtroArea)) {
                return false;
            }

            // Filtro por pesquisa de texto
            if (filtroPesquisa) {
                const termoPesquisa = filtroPesquisa.toLowerCase();
                return (
                    topico.titulo?.toLowerCase().includes(termoPesquisa) ||
                    topico.descricao?.toLowerCase().includes(termoPesquisa)
                );
            }

            return true;
        });
    };

    // Obter tópicos filtrados
    const topicosFiltrados = filtrarTopicos();

    // Funções para modais
    const abrirModalCriar = () => {
        setTopicoEditando(null);
        setModalAberto(true);
    };

    const abrirModalEditar = (topico) => {
        setTopicoEditando(topico);
        setModalAberto(true);
    };

    const abrirModalExcluir = (topico) => {
        setTopicoParaExcluir(topico);
        setConfirmDeleteModal(true);
    };

    // Funções CRUD
    const salvarTopico = async (topicoData) => {
        try {
            if (topicoData.id) {
                // Modo edição
                const response = await axios.put(`${API_BASE}/topicos-area/${topicoData.id}`, topicoData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                console.log('Resposta da API (edição):', response.data);

                // Extrair os dados atualizados do tópico
                const topicoAtualizado = response.data.data || response.data;

                // Atualizar lista de tópicos localmente
                setTopicos(prevTopicos =>
                    prevTopicos.map(t =>
                        t.id === topicoData.id ? { ...t, ...topicoAtualizado } : t
                    )
                );

                toast.success('Tópico atualizado com sucesso!');
            } else {
                // Modo criação
                const response = await axios.post(`${API_BASE}/topicos-area`, topicoData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                console.log('Resposta da API (criação):', response.data);

                // Extrair dados do novo tópico
                const novoTopico = response.data.data || response.data;

                // Se o retorno não tiver um ID explícito, pode ser necessário fazer outra requisição
                // para obter a lista atualizada de tópicos
                if (!novoTopico.id) {
                    const topicosAtualizados = await axios.get(`${API_BASE}/topicos-area/todos`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    setTopicos(Array.isArray(topicosAtualizados.data)
                        ? topicosAtualizados.data
                        : (topicosAtualizados.data.data || []));
                } else {
                    // Adicionar novo tópico à lista
                    setTopicos(prevTopicos => [...prevTopicos, novoTopico]);
                }

                toast.success('Tópico criado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao salvar tópico:', error);
            toast.error(error.response?.data?.message || 'Erro ao salvar tópico');
            throw new Error(error.response?.data?.message || 'Erro ao salvar tópico');
        }
    };

    // Encontrar nome da categoria ou área pelo ID
    const getCategoriaName = (id) => {
        if (!id) return 'N/A';
        const categoria = categorias.find(c => c.id_categoria === id || c.id === id);
        return categoria ? categoria.nome : 'N/A';
    };

    const getAreaName = (id) => {
        if (!id) return 'N/A';
        const area = areas.find(a => a.id_area === id || a.id === id);
        return area ? area.nome : 'N/A';
    };

    // Função para excluir tópico mais robusta
    // Modificar a função excluirTopico para ser mais robusta:
    const excluirTopico = async (id) => {
        try {
            setIsLoading(true);

            // Verificação mais rigorosa do ID
            if (!id) {
                console.error('ID do tópico é inválido ou nulo');
                toast.error('Erro ao eliminar tópico: ID inválido');
                setIsLoading(false);
                return;
            }

            // Mostrar toast informativo antes da operação
            toast.info('A eliminar tópico...');

            console.log('Tentando eliminar tópico com ID:', id);

            // Verificar se o token está disponível
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Autenticação expirada. Por favor, faça login novamente.');
                setIsLoading(false);
                return;
            }

            // Realizar a chamada à API com tratamento de erros mais detalhado
            const response = await axios.delete(`${API_BASE}/topicos-area/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Resposta da API (eliminação):', response.data);

            // Atualizar lista de tópicos localmente de forma mais segura
            setTopicos(prevTopicos => prevTopicos.filter(t => {
                // Verificar todas as propriedades possíveis de ID
                const topicoId = t.id_topico || t.id || t.id_categoria_topico;
                console.log(`Comparando IDs: ${topicoId} vs ${id}`);
                return String(topicoId) !== String(id); // Converter para string para comparação segura
            }));

            toast.success('Tópico eliminado com sucesso!');
        } catch (error) {
            console.error('Erro detalhado ao eliminar tópico:', error.response || error);

            // Mensagens de erro mais informativas
            if (error.response) {
                if (error.response.status === 403) {
                    toast.error('Permissão negada para eliminar este tópico');
                } else if (error.response.status === 404) {
                    toast.error('Tópico não encontrado ou já foi removido');
                    // Atualizar a lista mesmo assim, assumindo que o tópico não existe mais
                    setTopicos(prev => prev.filter(t => (t.id_topico || t.id) !== id));
                } else {
                    toast.error(`Erro ao eliminar tópico: ${error.response.data?.message || error.message}`);
                }
            } else {
                toast.error(`Erro ao eliminar tópico: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
            setConfirmDeleteModal(false);
            setTopicoParaExcluir(null);
        }
    };





    // Formatar data para exibição
    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';

        const data = new Date(dataString);
        return data.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="gerir-topicos-container">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="content-container">
                <h1>Gestão de Tópicos</h1>

                {/* Filtros e botão de criar */}
                <div className="filters-container">
                    <div className="filter-group">
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todas as categorias</option>
                            {categorias.map(categoria => (
                                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                    {categoria.nome}
                                </option>
                            ))}
                        </select>

                        {/* Filtrar por área */}
                        <select
                            value={filtroArea}
                            onMouseDown={e => {
                                if (!filtroCategoria) {
                                    e.preventDefault();
                                    toast.error('Selecione uma categoria primeiro');
                                }
                            }}
                            onChange={e => {
                                if (!filtroCategoria) {
                                    toast.error('Selecione uma categoria primeiro');
                                    return;
                                }
                                setFiltroArea(e.target.value);
                            }}
                            className="filter-select"
                        >
                            <option value="">
                                {areasFiltradas.length === 0
                                    ? "Sem áreas disponíveis"
                                    : "Todas as áreas"}
                            </option>
                            {areasFiltradas.map(area => (
                                <option key={area.id_area} value={area.id_area}>
                                    {area.nome}
                                </option>
                            ))}
                        </select>

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Pesquisar por título ou descrição..."
                                value={filtroPesquisa}
                                onChange={(e) => setFiltroPesquisa(e.target.value)}
                                className="search-input"
                            />
                            <button className="search-btn">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </div>

                    <button
                        className="create-btn"
                        onClick={abrirModalCriar}
                        disabled={isLoading}
                    >
                        <i className="fas fa-plus"></i> Novo Tópico
                    </button>
                </div>

                {/* Tabela de tópicos */}
                {isLoading ? (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i> A carregar tópicos...
                    </div>
                ) : topicosFiltrados.length > 0 ? (
                    <div className="table-responsive">
                        <table className="topicos-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Categoria</th>
                                    <th>Área</th>
                                    <th>Data de Criação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topicosFiltrados.map(topico => {
                                    // Identificar o ID correto do tópico
                                    const topicoId = topico.id_topico || topico.id || topico.id_categoria_topico;

                                    return (
                                        <tr key={topicoId}>
                                            <td className="titulo-cell">{topico.titulo}</td>
                                            <td>{getCategoriaName(topico.id_categoria)}</td>
                                            <td>{getAreaName(topico.id_area)}</td>
                                            <td>{formatarData(topico.data_criacao || topico.dataCriacao)}</td>
                                            <td className="acoes">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => abrirModalEditar(topico)}
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => {
                                                        console.log('Abrindo modal para excluir tópico:', topico);
                                                        abrirModalExcluir(topico);
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-results">
                        <i className="fas fa-info-circle"></i>
                        {filtroPesquisa || filtroCategoria ? (
                            <p>Nenhum tópico corresponde aos filtros atuais. Tente outros critérios de pesquisa.</p>
                        ) : (
                            <p>Nenhum tópico encontrado. Clique em "Novo Tópico" para criar um.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Modais */}
            <TopicoModal
                isOpen={modalAberto}
                onClose={() => setModalAberto(false)}
                topico={topicoEditando}
                categorias={categorias}
                areas={areas}
                onSave={salvarTopico}
            />

            <ConfirmDeleteModal
                isOpen={confirmDeleteModal}
                onClose={() => setConfirmDeleteModal(false)}
                onConfirm={excluirTopico}
                topico={topicoParaExcluir}
            />

            <ToastContainer />
        </div>
    );
};

export default Gerir_Topicos;