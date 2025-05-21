import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import './css/gerir_Denuncias.css';

const Gerir_Denuncias = () => {
    const navigate = useNavigate();
    const [denuncias, setDenuncias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('todas'); // 'todas', 'forum_tema', 'forum_comentario', 'chat'
    const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'pendentes', 'resolvidas'
    const [ordenacao, setOrdenacao] = useState('recentes'); // 'recentes', 'antigas'
    const [pesquisa, setPesquisa] = useState('');
    const [denunciaSelecionada, setDenunciaSelecionada] = useState(null);
    const [modalVisivel, setModalVisivel] = useState(false);
    const [acaoTomada, setAcaoTomada] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 15;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Função para log consistente
    const logInfo = (message, data) => {
        console.log(`[GerirDenuncias] ${message}`, data || '');
    };

    // Carregar todas as denúncias
    useEffect(() => {

        const carregarDenuncias = async () => {
            setLoading(true);
            try {
                logInfo('Carregando denúncias');
                const token = localStorage.getItem('token');

                // Array para armazenar todas as denúncias
                let todasDenuncias = [];

                // Função auxiliar para fazer solicitações seguras
                const fetchSafely = async (url) => {
                    try {
                        const response = await axios.get(url, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        return response.data.data || [];
                    } catch (error) {
                        console.error(`Erro ao buscar ${url}:`, error);
                        return []; // Retornar array vazio em caso de erro
                    }
                };

                // Buscar denúncias de tema
                const denunciasTema = await fetchSafely(`${API_BASE}/denuncias/denuncias/forum-tema`);
                const denunciasProcessadasTema = (denunciasTema || []).map(d => ({
                    ...d,
                    tipo: 'forum_tema',
                    titulo: d.tema?.titulo || 'Tema sem título',
                    conteudo: d.tema?.texto || 'Sem conteúdo',
                    data_criacao: d.tema?.data_criacao || d.data_denuncia
                }));
                todasDenuncias = [...todasDenuncias, ...denunciasProcessadasTema];

                // Buscar denúncias de comentário
                const denunciasComentario = await fetchSafely(`${API_BASE}/denuncias/denuncias/forum-comentario`);
                const denunciasProcessadasComentario = (denunciasComentario || []).map(d => ({
                    ...d,
                    tipo: 'forum_comentario',
                    titulo: `Comentário em: ${d.comentario?.tema?.titulo || 'Tema desconhecido'}`,
                    conteudo: d.comentario?.texto || 'Sem conteúdo',
                    data_criacao: d.comentario?.data_criacao || d.data_denuncia
                }));
                todasDenuncias = [...todasDenuncias, ...denunciasProcessadasComentario];

                // Buscar denúncias de chat
                const denunciasChat = await fetchSafely(`${API_BASE}/denuncias/denuncias/chat`);
                const denunciasProcessadasChat = (denunciasChat || []).map(d => ({
                    ...d,
                    tipo: 'chat',
                    titulo: `Mensagem em: ${d.mensagem?.topico?.titulo || 'Tópico desconhecido'}`,
                    conteudo: d.mensagem?.texto || 'Sem conteúdo',
                    data_criacao: d.mensagem?.data_criacao || d.data_denuncia
                }));
                todasDenuncias = [...todasDenuncias, ...denunciasProcessadasChat];

                // Ordenar por data
                todasDenuncias.sort((a, b) => new Date(b.data_denuncia) - new Date(a.data_denuncia));

                setDenuncias(todasDenuncias);
                logInfo(`Carregadas ${todasDenuncias.length} denúncias`, {
                    temas: denunciasProcessadasTema.length,
                    comentarios: denunciasProcessadasComentario.length,
                    chat: denunciasProcessadasChat.length
                });
            } catch (error) {
                logInfo('Erro ao carregar denúncias:', error.message);
                setErro(`Erro ao carregar denúncias: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };


        carregarDenuncias();
    }, []);

    // Resolver uma denúncia
    const resolverDenuncia = async (acaoTomada) => {
        if (!denunciaSelecionada) return;

        try {
            logInfo(`Resolvendo denúncia ID: ${denunciaSelecionada.id_denuncia}, tipo: ${denunciaSelecionada.tipo}`);
            const token = localStorage.getItem('token');

            let endpoint;
            if (denunciaSelecionada.tipo === 'forum_tema') {
                endpoint = `${API_BASE}/denuncias/denuncias/forum-tema/${denunciaSelecionada.id_denuncia}/resolver`;
            } else if (denunciaSelecionada.tipo === 'forum_comentario') {
                endpoint = `${API_BASE}/denuncias/denuncias/forum-comentario/${denunciaSelecionada.id_denuncia}/resolver`;
            } else if (denunciaSelecionada.tipo === 'chat') {
                endpoint = `${API_BASE}/denuncias/denuncias/chat/${denunciaSelecionada.id_denuncia}/resolver`;
            }

            await axios.post(endpoint, { acao_tomada: acaoTomada }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Atualizar denúncia na lista local
            setDenuncias(prev => prev.map(d => {
                if (d.tipo === denunciaSelecionada.tipo && d.id_denuncia === denunciaSelecionada.id_denuncia) {
                    return { ...d, resolvida: true, acao_tomada: acaoTomada };
                }
                return d;
            }));

            fecharModal();
            alert('Denúncia resolvida com sucesso!');
        } catch (error) {
            logInfo('Erro ao resolver denúncia:', error.message);
            alert(`Erro ao resolver denúncia: ${error.response?.data?.message || error.message}`);
        }
    };

    // Ocultar conteúdo denunciado
    const ocultarConteudo = async () => {
        if (!denunciaSelecionada) return;

        try {
            logInfo(`Ocultando conteúdo denunciado ID: ${denunciaSelecionada.id_denuncia}, tipo: ${denunciaSelecionada.tipo}`);
            const token = localStorage.getItem('token');

            let endpoint;
            let idConteudo;

            if (denunciaSelecionada.tipo === 'forum_tema') {
                endpoint = `${API_BASE}/denuncias/forum-tema/ocultar`;
                idConteudo = denunciaSelecionada.id_tema;
            } else if (denunciaSelecionada.tipo === 'forum_comentario') {
                endpoint = `${API_BASE}/denuncias/forum-comentario/ocultar`;
                idConteudo = denunciaSelecionada.id_comentario;
            } else if (denunciaSelecionada.tipo === 'chat') {
                endpoint = `${API_BASE}/denuncias/chat-mensagem/ocultar`;
                idConteudo = denunciaSelecionada.id_mensagem;
            }

            await axios.post(endpoint, { id: idConteudo }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Resolver a denúncia também
            await resolverDenuncia('Conteúdo ocultado');

            alert('Conteúdo ocultado com sucesso!');
        } catch (error) {
            logInfo('Erro ao ocultar conteúdo:', error.message);
            alert(`Erro ao ocultar conteúdo: ${error.response?.data?.message || error.message}`);
        }
    };

    // Aplicar filtros às denúncias
    const denunciasFiltradas = denuncias.filter(denuncia => {
        // Filtro por tipo
        if (filtroTipo !== 'todas' && denuncia.tipo !== filtroTipo) return false;

        // Filtro por status
        if (filtroStatus === 'pendentes' && denuncia.resolvida) return false;
        if (filtroStatus === 'resolvidas' && !denuncia.resolvida) return false;

        // Filtro por pesquisa (motivo, conteúdo ou nome do denunciante)
        if (pesquisa) {
            const termoPesquisa = pesquisa.toLowerCase();
            const motivo = denuncia.motivo?.toLowerCase() || '';
            const conteudo = denuncia.conteudo?.toLowerCase() || '';
            const denunciante = denuncia.denunciante?.nome?.toLowerCase() || '';

            return motivo.includes(termoPesquisa) ||
                conteudo.includes(termoPesquisa) ||
                denunciante.includes(termoPesquisa);
        }

        return true;
    });

    // Ordenar denúncias
    const denunciasOrdenadas = [...denunciasFiltradas].sort((a, b) => {
        if (ordenacao === 'recentes') {
            return new Date(b.data_denuncia) - new Date(a.data_denuncia);
        } else if (ordenacao === 'antigas') {
            return new Date(a.data_denuncia) - new Date(b.data_denuncia);
        }
        return 0;
    });

    // Paginação
    const indexUltimoDenuncia = paginaAtual * itensPorPagina;
    const indexPrimeiroDenuncia = indexUltimoDenuncia - itensPorPagina;
    const denunciasPaginadas = denunciasOrdenadas.slice(indexPrimeiroDenuncia, indexUltimoDenuncia);
    const totalPaginas = Math.ceil(denunciasOrdenadas.length / itensPorPagina);

    // Navegação entre páginas
    const mudarPagina = (numeroPagina) => {
        setPaginaAtual(numeroPagina);
    };

    // Funções modais
    const abrirModal = (denuncia) => {
        setDenunciaSelecionada(denuncia);
        setAcaoTomada('');
        setModalVisivel(true);
    };

    const fecharModal = () => {
        setModalVisivel(false);
        setDenunciaSelecionada(null);
        setAcaoTomada('');
    };

    // Formatar data
    const formatarData = (dataString) => {
        if (!dataString) return 'Data indisponível';

        try {
            const data = new Date(dataString);
            return data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Data inválida';
        }
    };

    // Obter tradução do tipo
    const traduzirTipo = (tipo) => {
        switch (tipo) {
            case 'forum_tema': return 'Tema do Fórum';
            case 'forum_comentario': return 'Comentário do Fórum';
            case 'chat': return 'Mensagem de Chat';
            default: return tipo;
        }
    };

    // Renderização do estado de erro
    if (erro && !loading) {
        return (
            <div className="gerenciar-denuncias-container">
                <div className="main-content">
                    <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    <div className="erro-container">
                        <h2>Ocorreu um erro</h2>
                        <p>{erro}</p>
                        <button className="btn-padrao" onClick={() => navigate('/admin')}>
                            <i className="fas fa-arrow-left"></i> Voltar ao Painel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Renderização do estado de carregamento
    if (loading) {
        return (
            <div className="gerenciar-denuncias-container">
                <div className="main-content">
                    <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    <div className="loading-container">
                        <div className="loading">Carregando denúncias...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="gerenciar-denuncias-container">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="main-content">
                <div className="pagina-header">
                    <h1>Gerenciar Denúncias</h1>
                    <button className="btn-voltar" onClick={() => navigate('/admin')}>
                        <i className="fas fa-arrow-left"></i> Voltar
                    </button>
                </div>

                <div className="filtros-container">
                    <div className="filtro-grupo">
                        <label>Tipo:</label>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="filtro-select"
                        >
                            <option value="todas">Todas</option>
                            <option value="forum_tema">Temas do Fórum</option>
                            <option value="forum_comentario">Comentários do Fórum</option>
                            <option value="chat">Mensagens de Chat</option>
                        </select>
                    </div>

                    <div className="filtro-grupo">
                        <label>Status:</label>
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="filtro-select"
                        >
                            <option value="todas">Todas</option>
                            <option value="pendentes">Pendentes</option>
                            <option value="resolvidas">Resolvidas</option>
                        </select>
                    </div>

                    <div className="filtro-grupo">
                        <label>Ordenar:</label>
                        <select
                            value={ordenacao}
                            onChange={(e) => setOrdenacao(e.target.value)}
                            className="filtro-select"
                        >
                            <option value="recentes">Mais recentes</option>
                            <option value="antigas">Mais antigas</option>
                        </select>
                    </div>

                    <div className="pesquisa-grupo">
                        <input
                            type="text"
                            placeholder="Pesquisar nas denúncias..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            className="pesquisa-input"
                        />
                        <button className="btn-pesquisa">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <div className="estatisticas-container">
                    <div className="estatistica-item">
                        <span className="estatistica-titulo">Total:</span>
                        <span className="estatistica-valor">{denuncias.length}</span>
                    </div>
                    <div className="estatistica-item">
                        <span className="estatistica-titulo">Pendentes:</span>
                        <span className="estatistica-valor">{denuncias.filter(d => !d.resolvida).length}</span>
                    </div>
                    <div className="estatistica-item">
                        <span className="estatistica-titulo">Resolvidas:</span>
                        <span className="estatistica-valor">{denuncias.filter(d => d.resolvida).length}</span>
                    </div>
                </div>

                {denunciasFiltradas.length === 0 ? (
                    <div className="sem-denuncias">
                        <p>Nenhuma denúncia encontrada para os filtros selecionados.</p>
                    </div>
                ) : (
                    <>
                        <div className="tabela-container">
                            <table className="tabela-denuncias">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tipo</th>
                                        <th>Motivo</th>
                                        <th>Denunciante</th>
                                        <th>Data</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {denunciasPaginadas.map((denuncia) => (
                                        <tr
                                            key={`${denuncia.tipo}-${denuncia.id_denuncia}`}
                                            className={denuncia.resolvida ? 'denuncia-resolvida' : 'denuncia-pendente'}
                                        >
                                            <td>{denuncia.id_denuncia}</td>
                                            <td>{traduzirTipo(denuncia.tipo)}</td>
                                            <td>{denuncia.motivo}</td>
                                            <td>{denuncia.denunciante?.nome || 'Usuário desconhecido'}</td>
                                            <td>{formatarData(denuncia.data_denuncia)}</td>
                                            <td>
                                                <span className={`status-badge ${denuncia.resolvida ? 'resolvida' : 'pendente'}`}>
                                                    {denuncia.resolvida ? 'Resolvida' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-acao"
                                                    onClick={() => abrirModal(denuncia)}
                                                >
                                                    <i className="fas fa-eye"></i> Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {totalPaginas > 1 && (
                            <div className="paginacao">
                                <button
                                    onClick={() => mudarPagina(1)}
                                    disabled={paginaAtual === 1}
                                    className="btn-pagina"
                                >
                                    <i className="fas fa-angle-double-left"></i>
                                </button>

                                <button
                                    onClick={() => mudarPagina(Math.max(1, paginaAtual - 1))}
                                    disabled={paginaAtual === 1}
                                    className="btn-pagina"
                                >
                                    <i className="fas fa-angle-left"></i>
                                </button>

                                <span className="pagina-info">
                                    Página {paginaAtual} de {totalPaginas}
                                </span>

                                <button
                                    onClick={() => mudarPagina(Math.min(totalPaginas, paginaAtual + 1))}
                                    disabled={paginaAtual === totalPaginas}
                                    className="btn-pagina"
                                >
                                    <i className="fas fa-angle-right"></i>
                                </button>

                                <button
                                    onClick={() => mudarPagina(totalPaginas)}
                                    disabled={paginaAtual === totalPaginas}
                                    className="btn-pagina"
                                >
                                    <i className="fas fa-angle-double-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de detalhes da denúncia */}
            {modalVisivel && denunciaSelecionada && (
                <div className="modal-backdrop">
                    <div className="modal-denuncia">
                        <div className="modal-header">
                            <h3>Detalhes da Denúncia</h3>
                            <button className="btn-fechar" onClick={fecharModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-conteudo">
                            <div className="denuncia-detalhes">
                                <p><strong>ID:</strong> {denunciaSelecionada.id_denuncia}</p>
                                <p><strong>Tipo:</strong> {traduzirTipo(denunciaSelecionada.tipo)}</p>
                                <p><strong>Data:</strong> {formatarData(denunciaSelecionada.data_denuncia)}</p>
                                <p><strong>Status:</strong> {denunciaSelecionada.resolvida ? 'Resolvida' : 'Pendente'}</p>
                                {denunciaSelecionada.resolvida && (
                                    <p><strong>Ação tomada:</strong> {denunciaSelecionada.acao_tomada || 'Não informada'}</p>
                                )}
                            </div>

                            <div className="denuncia-motivo">
                                <h4>Motivo da Denúncia</h4>
                                <p>{denunciaSelecionada.motivo}</p>
                                {denunciaSelecionada.descricao && (
                                    <>
                                        <h4>Descrição Adicional</h4>
                                        <p>{denunciaSelecionada.descricao}</p>
                                    </>
                                )}
                            </div>

                            <div className="denuncia-conteudo">
                                <h4>Conteúdo Denunciado</h4>
                                <div className="conteudo-preview">
                                    <p><strong>Título:</strong> {denunciaSelecionada.titulo}</p>
                                    <p><strong>Conteúdo:</strong> {denunciaSelecionada.conteudo}</p>
                                    <p><strong>Data de criação:</strong> {formatarData(denunciaSelecionada.data_criacao)}</p>
                                </div>
                            </div>

                            <div className="denuncia-denunciante">
                                <h4>Denunciante</h4>
                                <p><strong>Nome:</strong> {denunciaSelecionada.denunciante?.nome || 'Usuário desconhecido'}</p>
                                <p><strong>Email:</strong> {denunciaSelecionada.denunciante?.email || 'Email não disponível'}</p>
                            </div>
                        </div>

                        {!denunciaSelecionada.resolvida && (
                            <div className="modal-acoes">
                                <div className="acao-grupo">
                                    <h4>Resolver denúncia</h4>
                                    <div className="acao-input-grupo">
                                        <textarea
                                            placeholder="Informe a ação tomada..."
                                            value={acaoTomada}
                                            onChange={(e) => setAcaoTomada(e.target.value)}
                                            className="acao-input"
                                        />
                                    </div>
                                    <div className="acao-botoes">
                                        <button
                                            className="btn-resolver"
                                            onClick={() => resolverDenuncia(acaoTomada || 'Denúncia analisada e resolvida')}
                                        >
                                            <i className="fas fa-check"></i> Resolver
                                        </button>
                                        <button
                                            className="btn-ocultar"
                                            onClick={ocultarConteudo}
                                        >
                                            <i className="fas fa-eye-slash"></i> Ocultar Conteúdo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gerir_Denuncias;