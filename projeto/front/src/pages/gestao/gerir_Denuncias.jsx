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
    const [filtroTipo, setFiltroTipo] = useState('todas');
    const [filtroStatus, setFiltroStatus] = useState('todas');
    const [ordenacao, setOrdenacao] = useState('recentes');
    const [pesquisa, setPesquisa] = useState('');
    const [denunciaSelecionada, setDenunciaSelecionada] = useState(null);
    const [modalVisivel, setModalVisivel] = useState(false);
    const [acaoTomada, setAcaoTomada] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [processando, setProcessando] = useState(false);
    const itensPorPagina = 15;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Função para log consistente
    const logInfo = (message, data) => {
        console.log(`🔍 [GerirDenuncias] ${message}`, data || '');
    };

    // Função para mostrar notificações
    const mostrarNotificacao = (tipo, mensagem) => {
        // Implementar sistema de notificações se disponível
        if (tipo === 'sucesso') {
            console.log(`✅ ${mensagem}`);
        } else if (tipo === 'erro') {
            console.error(`❌ ${mensagem}`);
        } else {
            console.log(`ℹ️ ${mensagem}`);
        }
        
        // Temporário: usar alert (substituir por toast/notification system)
        alert(mensagem);
    };

    // Função auxiliar para fazer solicitações seguras
    const fetchSafely = async (url, descricao) => {
        try {
            logInfo(`Carregando ${descricao}...`);
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }

            const response = await axios.get(url, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos timeout
            });

            if (response.data && response.data.success) {
                logInfo(`✅ ${descricao} carregado com sucesso:`, response.data.data.length);
                return response.data.data || [];
            } else {
                logInfo(`⚠️ ${descricao} retornou dados inválidos:`, response.data);
                return [];
            }
        } catch (error) {
            if (error.response?.status === 401) {
                logInfo(`❌ Erro de autenticação ao carregar ${descricao}`);
                // Redirecionar para login se token inválido
                localStorage.removeItem('token');
                navigate('/login');
                return [];
            } else if (error.response?.status === 403) {
                logInfo(`❌ Sem permissão para carregar ${descricao}`);
                setErro(`Sem permissão para aceder a ${descricao}`);
                return [];
            } else {
                logInfo(`❌ Erro ao buscar ${descricao}:`, error.message);
                console.error(`Erro completo ao carregar ${descricao}:`, error);
                return []; // Retornar array vazio em caso de erro
            }
        }
    };

    // Carregar todas as denúncias
    useEffect(() => {
        const carregarDenuncias = async () => {
            setLoading(true);
            setErro(null);
            
            try {
                logInfo('Iniciando carregamento de denúncias...');
                
                // Array para armazenar todas as denúncias
                let todasDenuncias = [];

                // Buscar denúncias de tema
                const denunciasTema = await fetchSafely(
                    `${API_BASE}/denuncias/denuncias/forum-tema`, 
                    'denúncias de temas'
                );
                
                const denunciasProcessadasTema = denunciasTema.map(d => ({
                    ...d,
                    tipo: 'forum_tema',
                    titulo: d.tema?.titulo || 'Tema removido ou indisponível',
                    conteudo: d.tema?.texto || 'Conteúdo não disponível',
                    data_criacao: d.tema?.data_criacao || d.data_denuncia,
                    // Garantir que denunciante existe
                    denunciante: d.denunciante || { 
                        nome: 'Utilizador removido', 
                        email: 'N/A' 
                    }
                }));
                todasDenuncias = [...todasDenuncias, ...denunciasProcessadasTema];

                // Buscar denúncias de comentário
                const denunciasComentario = await fetchSafely(
                    `${API_BASE}/denuncias/denuncias/forum-comentario`, 
                    'denúncias de comentários'
                );
                
                const denunciasProcessadasComentario = denunciasComentario.map(d => ({
                    ...d,
                    tipo: 'forum_comentario',
                    titulo: `Comentário em: ${d.comentario?.tema?.titulo || 'Tema removido'}`,
                    conteudo: d.comentario?.texto || 'Conteúdo não disponível',
                    data_criacao: d.comentario?.data_criacao || d.data_denuncia,
                    // Garantir que denunciante existe
                    denunciante: d.denunciante || { 
                        nome: 'Utilizador removido', 
                        email: 'N/A' 
                    }
                }));
                todasDenuncias = [...todasDenuncias, ...denunciasProcessadasComentario];

                // Buscar denúncias de chat
                const denunciasChat = await fetchSafely(
                    `${API_BASE}/denuncias/denuncias/chat`, 
                    'denúncias de chat'
                );
                
                const denunciasProcessadasChat = denunciasChat.map(d => ({
                    ...d,
                    tipo: 'chat',
                    titulo: `Mensagem em: ${d.mensagem?.topico?.titulo || 'Tópico removido'}`,
                    conteudo: d.mensagem?.texto || 'Conteúdo não disponível',
                    data_criacao: d.mensagem?.data_criacao || d.data_denuncia,
                    // Garantir que denunciante existe
                    denunciante: d.denunciante || { 
                        nome: 'Utilizador removido', 
                        email: 'N/A' 
                    }
                }));
                todasDenuncias = [...todasDenuncias, ...denunciasProcessadasChat];

                // Ordenar por data de denúncia (mais recentes primeiro)
                todasDenuncias.sort((a, b) => {
                    const dataA = new Date(a.data_denuncia);
                    const dataB = new Date(b.data_denuncia);
                    return dataB - dataA;
                });

                setDenuncias(todasDenuncias);
                
                logInfo(`Carregamento concluído com sucesso!`, {
                    total: todasDenuncias.length,
                    temas: denunciasProcessadasTema.length,
                    comentarios: denunciasProcessadasComentario.length,
                    chat: denunciasProcessadasChat.length
                });

            } catch (error) {
                logInfo('Erro crítico ao carregar denúncias:', error.message);
                setErro(`Erro ao carregar denúncias: ${error.message}`);
                mostrarNotificacao('erro', 'Erro ao carregar as denúncias. Tente recarregar a página.');
            } finally {
                setLoading(false);
            }
        };

        carregarDenuncias();
    }, [navigate]); // Adicionar navigate como dependência

    // Resolver uma denúncia
    const resolverDenuncia = async (acaoTomadaParam) => {
        if (!denunciaSelecionada) {
            mostrarNotificacao('erro', 'Nenhuma denúncia selecionada');
            return;
        }

        const acaoFinal = acaoTomadaParam || acaoTomada;
        
        if (!acaoFinal || acaoFinal.trim() === '') {
            mostrarNotificacao('erro', 'É necessário informar a ação tomada');
            return;
        }

        setProcessando(true);
        
        try {
            logInfo(`Resolvendo denúncia:`, {
                id: denunciaSelecionada.id_denuncia,
                tipo: denunciaSelecionada.tipo,
                acao: acaoFinal
            });
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }

            // Determinar endpoint dinamicamente baseado no tipo
            let endpoint;
            switch (denunciaSelecionada.tipo) {
                case 'forum_tema':
                    endpoint = `${API_BASE}/denuncias/denuncias/forum-tema/${denunciaSelecionada.id_denuncia}/resolver`;
                    break;
                case 'forum_comentario':
                    endpoint = `${API_BASE}/denuncias/denuncias/forum-comentario/${denunciaSelecionada.id_denuncia}/resolver`;
                    break;
                case 'chat':
                    endpoint = `${API_BASE}/denuncias/denuncias/chat/${denunciaSelecionada.id_denuncia}/resolver`;
                    break;
                default:
                    throw new Error(`Tipo de denúncia desconhecido: ${denunciaSelecionada.tipo}`);
            }

            const response = await axios.post(endpoint, { 
                acao_tomada: acaoFinal.trim() 
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && response.data.success) {
                // Atualizar denúncia na lista local
                setDenuncias(prev => prev.map(d => {
                    if (d.tipo === denunciaSelecionada.tipo && 
                        d.id_denuncia === denunciaSelecionada.id_denuncia) {
                        return { 
                            ...d, 
                            resolvida: true, 
                            acao_tomada: acaoFinal.trim(),
                            data_resolucao: new Date().toISOString()
                        };
                    }
                    return d;
                }));

                fecharModal();
                mostrarNotificacao('sucesso', 'Denúncia resolvida com sucesso!');
                logInfo('✅ Denúncia resolvida com sucesso');
            } else {
                throw new Error(response.data?.message || 'Resposta inválida do servidor');
            }

        } catch (error) {
            logInfo('❌ Erro ao resolver denúncia:', error.message);
            console.error('Erro completo:', error);
            
            const mensagemErro = error.response?.data?.message || error.message || 'Erro desconhecido';
            mostrarNotificacao('erro', `Erro ao resolver denúncia: ${mensagemErro}`);
        } finally {
            setProcessando(false);
        }
    };

    // Ocultar conteúdo denunciado
    const ocultarConteudo = async () => {
        if (!denunciaSelecionada) {
            mostrarNotificacao('erro', 'Nenhuma denúncia selecionada');
            return;
        }

        setProcessando(true);

        try {
            logInfo(`Ocultando conteúdo:`, {
                id: denunciaSelecionada.id_denuncia,
                tipo: denunciaSelecionada.tipo
            });
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }

            // Determinar endpoint e ID do conteúdo dinamicamente
            let endpoint, idConteudo;
            
            switch (denunciaSelecionada.tipo) {
                case 'forum_tema':
                    endpoint = `${API_BASE}/denuncias/forum-tema/ocultar`;
                    idConteudo = denunciaSelecionada.id_tema;
                    break;
                case 'forum_comentario':
                    endpoint = `${API_BASE}/denuncias/forum-comentario/ocultar`;
                    idConteudo = denunciaSelecionada.id_comentario;
                    break;
                case 'chat':
                    endpoint = `${API_BASE}/denuncias/chat-mensagem/ocultar`;
                    idConteudo = denunciaSelecionada.id_mensagem;
                    break;
                default:
                    throw new Error(`Tipo de denúncia desconhecido: ${denunciaSelecionada.tipo}`);
            }

            if (!idConteudo) {
                throw new Error('ID do conteúdo não encontrado na denúncia');
            }

            const response = await axios.post(endpoint, { 
                id: idConteudo 
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.data && response.data.success) {
                // Atualizar denúncia como resolvida automaticamente
                setDenuncias(prev => prev.map(d => {
                    if (d.tipo === denunciaSelecionada.tipo && 
                        d.id_denuncia === denunciaSelecionada.id_denuncia) {
                        return { 
                            ...d, 
                            resolvida: true, 
                            acao_tomada: 'Conteúdo ocultado pelo administrador',
                            data_resolucao: new Date().toISOString()
                        };
                    }
                    return d;
                }));

                fecharModal();
                mostrarNotificacao('sucesso', 'Conteúdo ocultado com sucesso!');
                logInfo('✅ Conteúdo ocultado com sucesso');
            } else {
                throw new Error(response.data?.message || 'Resposta inválida do servidor');
            }

        } catch (error) {
            logInfo('❌ Erro ao ocultar conteúdo:', error.message);
            console.error('Erro completo:', error);
            
            const mensagemErro = error.response?.data?.message || error.message || 'Erro desconhecido';
            mostrarNotificacao('erro', `Erro ao ocultar conteúdo: ${mensagemErro}`);
        } finally {
            setProcessando(false);
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
        if (pesquisa && pesquisa.trim() !== '') {
            const termoPesquisa = pesquisa.toLowerCase().trim();
            const motivo = (denuncia.motivo || '').toLowerCase();
            const conteudo = (denuncia.conteudo || '').toLowerCase();
            const denunciante = (denuncia.denunciante?.nome || '').toLowerCase();
            const titulo = (denuncia.titulo || '').toLowerCase();

            return motivo.includes(termoPesquisa) ||
                   conteudo.includes(termoPesquisa) ||
                   denunciante.includes(termoPesquisa) ||
                   titulo.includes(termoPesquisa);
        }

        return true;
    });

    // Ordenar denúncias
    const denunciasOrdenadas = [...denunciasFiltradas].sort((a, b) => {
        const dataA = new Date(a.data_denuncia);
        const dataB = new Date(b.data_denuncia);
        
        if (ordenacao === 'recentes') {
            return dataB - dataA;
        } else if (ordenacao === 'antigas') {
            return dataA - dataB;
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
        if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
            setPaginaAtual(numeroPagina);
        }
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
        setProcessando(false);
    };

    // Formatar data de forma segura
    const formatarData = (dataString) => {
        if (!dataString) return 'Data indisponível';

        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) {
                return 'Data inválida';
            }
            
            return data.toLocaleString('pt-PT', {
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

    // Obter tradução do tipo de forma dinâmica
    const traduzirTipo = (tipo) => {
        const traducoes = {
            'forum_tema': 'Tema do Fórum',
            'forum_comentario': 'Comentário do Fórum',
            'chat': 'Mensagem de Chat'
        };
        
        return traducoes[tipo] || tipo || 'Tipo desconhecido';
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
                        <div className="erro-acoes">
                            <button 
                                className="btn-padrao" 
                                onClick={() => window.location.reload()}
                            >
                                <i className="fas fa-redo"></i> Recarregar Página
                            </button>
                            <button 
                                className="btn-padrao" 
                                onClick={() => navigate('/admin/dashboard')}
                            >
                                <i className="fas fa-arrow-left"></i> Voltar ao Painel
                            </button>
                        </div>
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
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>A carregar denúncias...</p>
                            <p className="loading-subtitle">Isto pode demorar alguns segundos</p>
                        </div>
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
                    <h1>Gerir Denúncias</h1>
                    <button className="btn-voltar" onClick={() => navigate('/admin/dashboard')}>
                        <i className="fas fa-arrow-left"></i> Voltar
                    </button>
                </div>

                <div className="filtros-container">
                    <div className="filtro-grupo">
                        <label>Tipo:</label>
                        <select
                            value={filtroTipo}
                            onChange={(e) => {
                                setFiltroTipo(e.target.value);
                                setPaginaAtual(1); // Reset pagination
                            }}
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
                            onChange={(e) => {
                                setFiltroStatus(e.target.value);
                                setPaginaAtual(1); // Reset pagination
                            }}
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
                            onChange={(e) => {
                                setPesquisa(e.target.value);
                                setPaginaAtual(1); // Reset pagination
                            }}
                            className="pesquisa-input"
                        />
                        <button className="btn-pesquisa" disabled>
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
                        <span className="estatistica-valor">
                            {denuncias.filter(d => !d.resolvida).length}
                        </span>
                    </div>
                    <div className="estatistica-item">
                        <span className="estatistica-titulo">Resolvidas:</span>
                        <span className="estatistica-valor">
                            {denuncias.filter(d => d.resolvida).length}
                        </span>
                    </div>
                    <div className="estatistica-item">
                        <span className="estatistica-titulo">Filtradas:</span>
                        <span className="estatistica-valor">{denunciasFiltradas.length}</span>
                    </div>
                </div>

                {denunciasFiltradas.length === 0 ? (
                    <div className="sem-denuncias">
                        <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                        <p>Nenhuma denúncia encontrada para os filtros selecionados.</p>
                        {denuncias.length === 0 && (
                            <p className="sem-denuncias-subtitle">Não há denúncias no sistema.</p>
                        )}
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
                                    {denunciasPaginadas.map((denuncia, index) => (
                                        <tr
                                            key={`${denuncia.tipo}-${denuncia.id_denuncia}-${index}`}
                                            className={denuncia.resolvida ? 'denuncia-resolvida' : 'denuncia-pendente'}
                                        >
                                            <td>{denuncia.id_denuncia || 'N/A'}</td>
                                            <td>{traduzirTipo(denuncia.tipo)}</td>
                                            <td>
                                                <span title={denuncia.motivo || 'Motivo não especificado'}>
                                                    {(denuncia.motivo || 'Motivo não especificado').length > 30 
                                                        ? `${denuncia.motivo.substring(0, 30)}...` 
                                                        : denuncia.motivo || 'Motivo não especificado'}
                                                </span>
                                            </td>
                                            <td>{denuncia.denunciante?.nome || 'Utilizador removido'}</td>
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
                                                    disabled={processando}
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
                                    title="Primeira página"
                                >
                                    <i className="fas fa-angle-double-left"></i>
                                </button>

                                <button
                                    onClick={() => mudarPagina(paginaAtual - 1)}
                                    disabled={paginaAtual === 1}
                                    className="btn-pagina"
                                    title="Página anterior"
                                >
                                    <i className="fas fa-angle-left"></i>
                                </button>

                                <span className="pagina-info">
                                    Página {paginaAtual} de {totalPaginas}
                                </span>

                                <button
                                    onClick={() => mudarPagina(paginaAtual + 1)}
                                    disabled={paginaAtual === totalPaginas}
                                    className="btn-pagina"
                                    title="Próxima página"
                                >
                                    <i className="fas fa-angle-right"></i>
                                </button>

                                <button
                                    onClick={() => mudarPagina(totalPaginas)}
                                    disabled={paginaAtual === totalPaginas}
                                    className="btn-pagina"
                                    title="Última página"
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
                <div className="modal-backdrop" onClick={fecharModal}>
                    <div className="modal-denuncia" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalhes da Denúncia</h3>
                            <button 
                                className="btn-fechar" 
                                onClick={fecharModal}
                                disabled={processando}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-conteudo">
                            <div className="denuncia-detalhes">
                                <p><strong>ID:</strong> {denunciaSelecionada.id_denuncia || 'N/A'}</p>
                                <p><strong>Tipo:</strong> {traduzirTipo(denunciaSelecionada.tipo)}</p>
                                <p><strong>Data:</strong> {formatarData(denunciaSelecionada.data_denuncia)}</p>
                                <p><strong>Status:</strong>
                                    <span className={`status-badge ${denunciaSelecionada.resolvida ? 'resolvida' : 'pendente'}`}>
                                        {denunciaSelecionada.resolvida ? 'Resolvida' : 'Pendente'}
                                    </span>
                                </p>

                                {/* Destaque especial para a ação tomada quando resolvida */}
                                {denunciaSelecionada.resolvida && (
                                    <div className="acao-tomada">
                                        <p><strong>Ação tomada:</strong></p>
                                        <p className="acao-tomada-texto">
                                            {denunciaSelecionada.acao_tomada || 'Não informada'}
                                        </p>
                                        {denunciaSelecionada.data_resolucao && (
                                            <p><strong>Data de resolução:</strong> {formatarData(denunciaSelecionada.data_resolucao)}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="denuncia-motivo">
                                <h4>Motivo da Denúncia</h4>
                                <p>{denunciaSelecionada.motivo || 'Motivo não especificado'}</p>
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
                                    <p><strong>Título:</strong> {denunciaSelecionada.titulo || 'Título não disponível'}</p>
                                    <p><strong>Conteúdo:</strong></p>
                                    <div className="conteudo-texto">
                                        {denunciaSelecionada.conteudo || 'Conteúdo não disponível'}
                                    </div>
                                    <p><strong>Data de criação:</strong> {formatarData(denunciaSelecionada.data_criacao)}</p>
                                </div>
                            </div>

                            <div className="denuncia-denunciante">
                                <h4>Denunciante</h4>
                                <p><strong>Nome:</strong> {denunciaSelecionada.denunciante?.nome || 'Utilizador removido'}</p>
                                <p><strong>Email:</strong> {denunciaSelecionada.denunciante?.email || 'N/A'}</p>
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
                                                disabled={processando}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="acao-botoes">
                                            <button
                                                className="btn-resolver"
                                                onClick={() => resolverDenuncia(acaoTomada || 'Denúncia analisada e resolvida')}
                                                disabled={processando}
                                            >
                                                {processando ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin"></i> A resolver...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-check"></i> Resolver
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn-ocultar"
                                                onClick={ocultarConteudo}
                                                disabled={processando}
                                            >
                                                {processando ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin"></i> A ocultar...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-eye-slash"></i> Ocultar Conteúdo
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gerir_Denuncias;