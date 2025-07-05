import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import API_BASE from "../../api";
import "./css/PresencasCurso.css";

/**
 * Componente principal para gestão completa de presenças num curso
 * 
 * REGRA FUNDAMENTAL: Apenas o formador específico do curso pode gerir presenças
 * Gestores/admins podem marcar presença se estiverem inscritos, mas NÃO podem gerir presenças de outros
 * 
 * Funcionalidades principais:
 * - Formador do curso: Criar presenças, visualizar estatísticas, editar presenças ativas
 * - Utilizadores inscritos: Marcar presenças com códigos, visualizar histórico pessoal
 * - Verificação automática de presenças ativas e expiradas
 * - Controlo rigoroso de horas disponíveis vs utilizadas
 * 
 * @param {number} cursoId - Identificador único do curso
 * @param {number} userRole - Papel do utilizador (1=admin, 2=formador, 3=formando)
 * @param {number} formadorId - ID do formador responsável pelo curso
 */
export default function PresencasCurso({ cursoId, userRole, formadorId }) {
    const { currentUser } = useAuth();
    
    // Estados para controlo da interface do utilizador
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [validationError, setValidationError] = useState(null);
    
    // Estados para sistema de notificações toast
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    
    // Estados para dados das presenças do curso
    const [presencas, setPresencas] = useState([]);
    const [minhasPresencas, setMinhasPresencas] = useState({});
    const [temPresencaAtiva, setTemPresencaAtiva] = useState(false);
    
    // Estados para gestão de horas do curso - controlo rigoroso da duração
    const [horasDisponiveis, setHorasDisponiveis] = useState(0);
    const [duracaoCurso, setDuracaoCurso] = useState(0);
    const [horasUtilizadas, setHorasUtilizadas] = useState(0);
    const [horasNovaPresenca, setHorasNovaPresenca] = useState(0);
    
    // Estados para criação de nova presença - apenas formador do curso
    const [codigo, setCodigo] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    
    // Estados para edição de presença existente - apenas formador do curso
    const [editandoPresenca, setEditandoPresenca] = useState(null);
    const [editandoCodigo, setEditandoCodigo] = useState("");
    const [editandoDataInicio, setEditandoDataInicio] = useState("");
    const [editandoHoraInicio, setEditandoHoraInicio] = useState("");
    const [editandoDataFim, setEditandoDataFim] = useState("");
    const [editandoHoraFim, setEditandoHoraFim] = useState("");
    
    // Estados para modal de lista de formandos - visão exclusiva do formador do curso
    const [showListaFormandosModal, setShowListaFormandosModal] = useState(false);
    const [formandosLista, setFormandosLista] = useState([]);
    const [presencaSelecionada, setPresencaSelecionada] = useState(null);
    const [loadingFormandos, setLoadingFormandos] = useState(false);
    
    // Estado para marcar presença específica - utilizadores inscritos
    const [presencaParaMarcar, setPresencaParaMarcar] = useState(null);
    
    // Estados para verificação de inscrição no curso
    const [estouInscrito, setEstouInscrito] = useState(false);
    const [verificacaoInscricaoCompleta, setVerificacaoInscricaoCompleta] = useState(false);

    /**
     * Verifica se o utilizador atual é o formador específico deste curso
     * Esta verificação é crucial para determinar permissões de gestão
     * APENAS o formador do curso pode gerir presenças - gestores/admins NÃO podem
     * 
     * @returns {boolean} - True apenas se é o formador deste curso específico
     */
    const isFormadorDoCurso = () => {
        if (!currentUser || !formadorId) return false;
        return currentUser.id_utilizador === formadorId;
    };

    // Definição de permissões baseadas estritamente no formador do curso
    const isFormador = isFormadorDoCurso();
    // Qualquer utilizador inscrito no curso pode marcar presença (incluindo gestores inscritos)
    const podeMarcarPresenca = estouInscrito && !isFormador;

    /**
     * Exibe uma mensagem toast temporária para feedback do utilizador
     * O toast desaparece automaticamente após 3 segundos
     * 
     * @param {string} message - Mensagem a exibir no toast
     */
    const mostrarToast = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
            setToastMessage("");
        }, 3000);
    };

    /**
     * Carrega todos os dados necessários quando o componente é inicializado
     * ou quando há mudanças significativas no curso ou utilizador atual
     */
    useEffect(() => {
        refreshData();
    }, [cursoId, currentUser]);

    /**
     * Sistema de verificação automática para utilizadores inscritos
     * Verifica a cada minuto se há novas presenças disponíveis para marcar
     * Isto permite atualização em tempo real quando o formador cria uma presença
     */
    useEffect(() => {
        if (!estouInscrito) return;

        const verificarPresencasDisponiveis = () => {
            refreshData();
        };

        const intervalId = setInterval(verificarPresencasDisponiveis, 60000);
        return () => clearInterval(intervalId);
    }, [estouInscrito, cursoId]);

    /**
     * Verifica se existe alguma presença ainda ativa (não expirou)
     * Uma presença está ativa quando a data/hora de fim for posterior ao momento atual
     * Esta verificação é fundamental para controlar a criação de novas presenças
     * 
     * @param {Array} lista - Lista de presenças do curso
     * @returns {boolean} - True se existe pelo menos uma presença ativa
     */
    const verificarPresencaAtiva = (lista) => {
        const agora = new Date();
        
        const presencaAtiva = lista.some(presenca => {
            const dataHoraFim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
            return dataHoraFim > agora;
        });

        setTemPresencaAtiva(presencaAtiva);
        return presencaAtiva;
    };

    /**
     * Verifica se o utilizador atual está inscrito no curso
     * Esta verificação é essencial para determinar se pode marcar presenças
     * Apenas utilizadores inscritos têm acesso às funcionalidades de presença
     * 
     * @returns {boolean} - True se o utilizador está inscrito
     */
    const verificarInscricaoCurso = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !currentUser?.id_utilizador) {
                setEstouInscrito(false);
                setVerificacaoInscricaoCompleta(true);
                return false;
            }

            const response = await axios.get(`${API_BASE}/inscricoes/verificar/${cursoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const inscrito = response.data.inscrito;
            
            setEstouInscrito(inscrito);
            setVerificacaoInscricaoCompleta(true);
            return inscrito;
        } catch (error) {
            setEstouInscrito(false);
            setVerificacaoInscricaoCompleta(true);
            return false;
        }
    };

    /**
     * Busca informações detalhadas sobre as horas do curso
     * Inclui horas disponíveis, utilizadas e duração total do curso
     * Esta informação é crucial para controlar se o formador pode criar mais presenças
     * Apenas o formador do curso pode aceder a estas informações sensíveis
     * 
     * @returns {Object|null} - Dados das horas ou null em caso de erro
     */
    const fetchHorasDisponiveis = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/presencas/horas-disponiveis/${cursoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHorasDisponiveis(response.data.horasDisponiveis);
            setDuracaoCurso(response.data.duracaoCurso);
            setHorasUtilizadas(response.data.horasUtilizadas);
            return response.data;
        } catch (error) {
            setError("Falha ao carregar informações das horas do curso");
            return null;
        }
    };

    /**
     * Busca a lista detalhada de formandos inscritos e o respetivo estado de presença
     * para uma presença específica - funcionalidade exclusiva do formador do curso
     * Permite ao formador ver quem esteve presente e quem faltou
     * 
     * @param {number} presencaId - ID da presença para consultar
     */
    const fetchFormandosPresenca = async (presencaId) => {
        try {
            setLoadingFormandos(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_BASE}/presencas/formandos/${presencaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFormandosLista(response.data);
            setLoadingFormandos(false);
        } catch (error) {
            setError("Falha ao carregar lista de formandos");
            setLoadingFormandos(false);
        }
    };

    /**
     * Abre o modal para visualizar todos os formandos e o respetivo estado
     * numa presença específica (presente/ausente)
     * Apenas o formador do curso pode aceder a esta funcionalidade
     * 
     * @param {Object} presenca - Objeto da presença selecionada
     */
    const abrirModalListaFormandos = (presenca) => {
        setPresencaSelecionada(presenca);
        fetchFormandosPresenca(presenca.id_curso_presenca);
        setShowListaFormandosModal(true);
    };

    /**
     * Verifica se uma presença ainda pode ser editada
     * Uma presença só pode ser editada se ainda não tiver terminado (hora de fim não passou)
     * Esta restrição protege a integridade dos dados após o fim das sessões
     * 
     * @param {Object} presenca - Objeto da presença a verificar
     * @returns {boolean} - True se a presença ainda pode ser editada
     */
    const podeEditarPresenca = (presenca) => {
        const agora = new Date();
        const dataHoraFim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
        return dataHoraFim > agora;
    };

    /**
     * Abre o modal de edição para uma presença existente
     * Apenas o formador do curso pode editar presenças
     * Só permite edição se a presença ainda não tiver terminado
     * Se a presença já expirou, mostra um toast de aviso
     * 
     * @param {Object} presenca - Objeto da presença a editar
     */
    const abrirModalEdicao = (presenca) => {
        if (!podeEditarPresenca(presenca)) {
            mostrarToast("A presença já expirou e não pode ser alterada!");
            return;
        }

        setEditandoPresenca(presenca);
        setEditandoCodigo(presenca.codigo);
        setEditandoDataInicio(presenca.data_inicio);
        setEditandoHoraInicio(presenca.hora_inicio.substring(0, 5));
        setEditandoDataFim(presenca.data_fim);
        setEditandoHoraFim(presenca.hora_fim.substring(0, 5));
        setShowModal(true);
        setError(null);
        setValidationError(null);
    };

    /**
     * Abre o modal para marcar presença numa presença específica
     * Usado quando o utilizador inscrito clica no botão "Marcar" de uma presença
     * 
     * @param {Object} presenca - Objeto da presença para marcar
     */
    const abrirModalMarcarPresenca = (presenca) => {
        setPresencaParaMarcar(presenca);
        setShowModal(true);
        setEditandoPresenca(null);
        setError(null);
        setValidationError(null);
        setCodigo("");
    };

    /**
     * Abre o modal para criar uma nova presença
     * Apenas o formador do curso pode criar presenças
     * Limpa todos os estados e prepara o formulário para nova entrada
     */
    const abrirModalCriarPresenca = () => {
        setShowModal(true);
        setEditandoPresenca(null);
        setPresencaParaMarcar(null);
        setError(null);
        setValidationError(null);
    };

    /**
     * Valida se as datas e horas de início e fim formam um período válido
     * A data/hora de fim deve ser obrigatoriamente posterior à data/hora de início
     * Esta validação previne erros de dados e garante períodos lógicos
     * 
     * @param {string} dataInicio - Data de início no formato YYYY-MM-DD
     * @param {string} horaInicio - Hora de início no formato HH:mm
     * @param {string} dataFim - Data de fim no formato YYYY-MM-DD
     * @param {string} horaFim - Hora de fim no formato HH:mm
     * @returns {boolean} - True se os horários são válidos
     */
    const validarHorarios = (dataInicio, horaInicio, dataFim, horaFim) => {
        const inicio = new Date(`${dataInicio}T${horaInicio}`);
        const fim = new Date(`${dataFim}T${horaFim}`);
        return fim > inicio;
    };

    /**
     * Atualiza uma presença existente com novos dados fornecidos pelo formador
     * Apenas o formador do curso tem permissão para esta operação
     * Inclui validação completa dos dados antes da submissão
     */
    const atualizarPresenca = async () => {
        if (!editandoCodigo || !editandoDataInicio || !editandoHoraInicio || !editandoDataFim || !editandoHoraFim) {
            setError("Preenche todos os campos obrigatórios");
            return;
        }

        if (!validarHorarios(editandoDataInicio, editandoHoraInicio, editandoDataFim, editandoHoraFim)) {
            setValidationError("A data/hora de fim não pode ser anterior ou igual à data/hora de início");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            await axios.put(`${API_BASE}/presencas/atualizar/${editandoPresenca.id_curso_presenca}`, {
                codigo: editandoCodigo,
                data_inicio: editandoDataInicio,
                hora_inicio: editandoHoraInicio,
                data_fim: editandoDataFim,
                hora_fim: editandoHoraFim
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setEditandoPresenca(null);
            setValidationError(null);
            await refreshData();

        } catch (error) {
            setError("Não foi possível atualizar a presença");
            setLoading(false);
        }
    };

    /**
     * Calcula automaticamente as horas da nova presença sempre que
     * o utilizador altera os campos de data/hora no formulário
     * Também executa validação em tempo real do período
     */
    useEffect(() => {
        if (dataInicio && horaInicio && dataFim && horaFim) {
            try {
                const inicio = new Date(`${dataInicio}T${horaInicio}`);
                const fim = new Date(`${dataFim}T${horaFim}`);

                if (fim <= inicio) {
                    setValidationError("A data/hora de fim não pode ser anterior ou igual à data/hora de início");
                    setHorasNovaPresenca(0);
                } else {
                    setValidationError(null);
                    const diferencaMs = fim - inicio;
                    const diferencaHoras = diferencaMs / (1000 * 60 * 60);
                    setHorasNovaPresenca(diferencaHoras > 0 ? diferencaHoras : 0);
                }
            } catch (error) {
                setHorasNovaPresenca(0);
            }
        }
    }, [dataInicio, horaInicio, dataFim, horaFim]);

    /**
     * Função principal para atualizar todos os dados do componente
     * Carrega presenças, verifica inscrições, busca horas disponíveis
     * É o ponto central de sincronização de dados com o servidor
     */
    const refreshData = async () => {
        if (!cursoId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Primeira etapa: verificar se o utilizador está inscrito no curso
            const inscrito = await verificarInscricaoCurso();

            // Segunda etapa: buscar todas as presenças do curso
            const response = await axios.get(`${API_BASE}/presencas/curso/${cursoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const allPresencas = response.data;

            // Para utilizadores inscritos que não são formadores: mostrar apenas presenças que já começaram
            // Para o formador do curso: mostrar todas as presenças (incluindo futuras)
            if (inscrito && !isFormador) {
                const agora = new Date();
                const presencasFiltradas = allPresencas.filter(presenca => {
                    const dataHoraInicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
                    return dataHoraInicio <= agora;
                });
                setPresencas(presencasFiltradas);
            } else {
                setPresencas(allPresencas);
            }

            // Terceira etapa: verificar se existe alguma presença ainda ativa
            verificarPresencaAtiva(allPresencas);

            // Quarta etapa: se for o formador do curso, buscar informações sobre horas disponíveis
            if (isFormador) {
                await fetchHorasDisponiveis();
            }

            // Quinta etapa: se estiver inscrito, buscar as presenças já marcadas pelo utilizador
            if (inscrito && currentUser?.id_utilizador) {
                const formandoResponse = await axios.get(
                    `${API_BASE}/presencas/formando/${cursoId}/${currentUser.id_utilizador}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Criar mapeamento de presenças por ID para acesso rápido e eficiente
                const presencasMap = {};
                formandoResponse.data.forEach(p => {
                    presencasMap[p.id_curso_presenca] = p.presenca;
                });

                setMinhasPresencas(presencasMap);
            }

            setLastRefresh(new Date());
            setError(null);
            setLoading(false);
        } catch (error) {
            setError("Falha ao atualizar dados das presenças");
            setLoading(false);
        }
    };

    /**
     * Alterna entre expandir e colapsar a secção de presenças
     * Permite ao utilizador organizar melhor o espaço do ecrã
     */
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    /**
     * Gera um código aleatório de 6 caracteres alfanuméricos
     * para ser usado como código único de presença
     * Utiliza base 36 para incluir números e letras
     */
    const gerarCodigo = () => {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (editandoPresenca) {
            setEditandoCodigo(codigo);
        } else {
            setCodigo(codigo);
        }
    };

    /**
     * Define valores padrão inteligentes quando se abre o modal de criação
     * Define a data atual, hora atual como início e hora atual + 2h como fim
     * Só é executado para o formador do curso e apenas para criação de novas presenças
     */
    useEffect(() => {
        if (showModal && isFormador && !editandoPresenca && !presencaParaMarcar) {
            fetchHorasDisponiveis();

            const agora = new Date();
            
            // Definir data atual para início e fim
            const dataAtualFormatada = agora.toISOString().split('T')[0];
            setDataInicio(dataAtualFormatada);
            setDataFim(dataAtualFormatada);

            // Definir hora atual como início
            const horaInicioAtual = agora.toTimeString().split(' ')[0].substring(0, 5);
            setHoraInicio(horaInicioAtual);

            // Definir hora atual + 2 horas como fim
            const horaFimPadrao = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
            
            // Se a hora final passar para o dia seguinte, ajustar a data de fim
            if (horaFimPadrao.getDate() !== agora.getDate()) {
                const dataFimNova = horaFimPadrao.toISOString().split('T')[0];
                setDataFim(dataFimNova);
            }
            
            const horaFormatada = horaFimPadrao.toTimeString().split(' ')[0].substring(0, 5);
            setHoraFim(horaFormatada);

            gerarCodigo();
            setValidationError(null);
        }
    }, [showModal, isFormador, editandoPresenca, presencaParaMarcar]);

    /**
     * Cria uma nova presença no sistema
     * Apenas o formador do curso pode criar presenças
     * Valida todos os campos e verifica se não excede as horas disponíveis do curso
     */
    const criarPresenca = async () => {
        if (!codigo || !dataInicio || !horaInicio || !dataFim || !horaFim) {
            setError("Preenche todos os campos obrigatórios");
            return;
        }

        if (!validarHorarios(dataInicio, horaInicio, dataFim, horaFim)) {
            setValidationError("A data/hora de fim não pode ser anterior ou igual à data/hora de início");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Verificar se a nova presença excede as horas disponíveis do curso
            if (horasNovaPresenca > horasDisponiveis) {
                setError(`A presença excede as horas disponíveis (${horasDisponiveis.toFixed(2)}h restantes)`);
                setLoading(false);
                return;
            }

            await axios.post(`${API_BASE}/presencas/criar`, {
                id_curso: cursoId,
                data_inicio: dataInicio,
                hora_inicio: horaInicio,
                data_fim: dataFim,
                hora_fim: horaFim,
                codigo: codigo
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setValidationError(null);
            await refreshData();

        } catch (error) {
            if (error.response && error.response.status === 400) {
                setError(error.response.data.message || "Não foi possível criar a presença");
            } else {
                setError("Não foi possível criar a presença");
            }
            setLoading(false);
        }
    };

    /**
     * Marca presença para o utilizador atual numa presença específica
     * Requer o código correto da presença e que ainda esteja dentro do prazo válido
     * Apenas utilizadores inscritos podem marcar presença
     */
    const marcarPresenca = async () => {
        if (!codigo) {
            setError("Preenche o código de presença");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            await axios.post(`${API_BASE}/presencas/marcar`, {
                id_curso: cursoId,
                id_utilizador: currentUser.id_utilizador,
                codigo: codigo
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setPresencaParaMarcar(null);
            await refreshData();

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError("Código de presença inválido ou expirado");
            }
            setLoading(false);
        }
    };

    /**
     * Formata uma data ISO para o formato português (DD/MM/AAAA)
     * Utiliza a localização portuguesa para formatação consistente
     * 
     * @param {string} dataString - Data no formato ISO (YYYY-MM-DD)
     * @returns {string} - Data formatada em português
     */
    const formatarData = (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-PT');
    };

    // Aguarda pela verificação completa de inscrição antes de renderizar o componente
    if (!verificacaoInscricaoCompleta) {
        return (
            <div className="presencas-container">
                <div className="loading-indicator"></div>
            </div>
        );
    }

    return (
        <div className="presencas-container">
            {/* Sistema de notificações toast para feedback visual */}
            {showToast && (
                <div className="toast-notification">
                    {toastMessage}
                </div>
            )}

            {/* Cabeçalho da secção de presenças com botões de ação contextuais */}
            <div className="presencas-header" onClick={toggleExpand}>
                <h2>Presenças</h2>
                <div className="presencas-actions">
                    {/* Botão para atualização manual dos dados - disponível para todos */}
                    <button
                        className="btn-refresh-presencas"
                        onClick={(e) => {
                            e.stopPropagation();
                            refreshData();
                        }}
                        disabled={loading}
                        title="Atualizar dados das presenças"
                    >
                        {loading ? "..." : "↻"}
                    </button>

                    {/* Botão para criar nova presença - APENAS formador do curso */}
                    {isFormador && (
                        <button
                            className="btn-criar-presenca"
                            onClick={(e) => {
                                e.stopPropagation();
                                abrirModalCriarPresenca();
                            }}
                            disabled={temPresencaAtiva}
                            title={temPresencaAtiva ? "Já existe uma presença ativa" : "Criar nova presença"}
                        >
                            Criar presença
                        </button>
                    )}

                    {/* Botão para marcar presença - utilizadores inscritos (exceto formador) */}
                    {podeMarcarPresenca && (
                        <button
                            className="btn-marcar-presenca-geral"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowModal(true);
                                setEditandoPresenca(null);
                                setPresencaParaMarcar(null);
                                setError(null);
                                setValidationError(null);
                                setCodigo("");
                            }}
                        >
                            Marcar presença
                        </button>
                    )}
                    
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        {isExpanded ? '▼' : '►'}
                    </span>
                </div>
            </div>

            {/* Conteúdo expandível da secção de presenças */}
            {isExpanded && (
                <div className="presencas-content">
                    {loading ? (
                        <div className="loading-indicator"></div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : presencas.length === 0 ? (
                        <div className="empty-message">Nenhuma presença registada para este curso.</div>
                    ) : (
                        <div className="table-presencas-container">
                            {/* Tabela principal de presenças com informações contextuais */}
                            <table className="presencas-table">
                                <thead>
                                    <tr>
                                        <th>Data Início</th>
                                        <th>Hora Início</th>
                                        <th>Data Fim</th>
                                        <th>Hora Fim</th>
                                        {/* Código apenas visível para o formador do curso */}
                                        {isFormador && <th>Código</th>}
                                        <th>Status</th>
                                        {podeMarcarPresenca && <th>Marcar</th>}
                                        {/* Gestão apenas para o formador do curso */}
                                        {isFormador && <th>Gerir</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {presencas.map((presenca) => {
                                        const agora = new Date();
                                        const inicioPresenca = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
                                        const fimPresenca = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
                                        const podeEditarAgora = podeEditarPresenca(presenca);

                                        return (
                                            <tr
                                                key={presenca.id_curso_presenca}
                                                className={
                                                    podeMarcarPresenca ?
                                                        (minhasPresencas[presenca.id_curso_presenca] ? "presenca-marcada" : "presenca-ausente") :
                                                        ""
                                                }
                                            >
                                            <td>{formatarData(presenca.data_inicio)}</td>
                                            <td>{presenca.hora_inicio}</td>
                                            <td>{formatarData(presenca.data_fim)}</td>
                                            <td>{presenca.hora_fim}</td>
                                            {/* Código apenas para o formador do curso */}
                                            {isFormador && <td>{presenca.codigo}</td>}
                                            <td>
                                                {podeMarcarPresenca ? (
                                                    minhasPresencas[presenca.id_curso_presenca] ?
                                                        "Presente" :
                                                        "Ausente"
                                                ) : (
                                                    // Para o formador do curso: mostrar estatísticas de participação
                                                    <div>
                                                        <div>{presenca.presentes || 0} presentes / {presenca.total || 0} inscritos</div>
                                                    </div>
                                                )}
                                            </td>
                                            {/* Coluna de ação para utilizadores inscritos (exceto formador) */}
                                            {podeMarcarPresenca && (
                                                <td className="acoes-column">
                                                    {presenca.disponivel && !minhasPresencas[presenca.id_curso_presenca] && (
                                                        <button
                                                            className="btn-marcar-presenca-inline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                abrirModalMarcarPresenca(presenca);
                                                            }}
                                                            title="Marcar presença nesta sessão"
                                                        >
                                                            Marcar
                                                        </button>
                                                    )}
                                                    {minhasPresencas[presenca.id_curso_presenca] && (
                                                        <span className="presenca-marcada-indicator">✓ Marcada</span>
                                                    )}
                                                    {!presenca.disponivel && !minhasPresencas[presenca.id_curso_presenca] && (
                                                        <span className="presenca-expirada-indicator">Expirou</span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Coluna de ações APENAS para o formador do curso */}
                                            {isFormador && (
                                                <td className="acoes-column">
                                                    <div className="gerir-acoes">
                                                        {/* Botão para ver lista de formandos */}
                                                        <button
                                                            className="btn-listar-formandos"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                abrirModalListaFormandos(presenca);
                                                            }}
                                                            title="Ver lista completa de formandos"
                                                        >
                                                            👥
                                                        </button>

                                                        {/* Botão de edição - sempre visível mas com feedback de estado */}
                                                        <button
                                                            className={`btn-editar ${!podeEditarAgora ? 'disabled' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                abrirModalEdicao(presenca);
                                                            }}
                                                            title={podeEditarAgora ? "Editar presença" : "Presença expirada - clique para mais detalhes"}
                                                        >
                                                            ✏️
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal multifunções para criar/marcar/editar presenças */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="presenca-modal">
                        <div className="modal-header">
                            <h3>
                                {editandoPresenca
                                    ? "Editar Presença"
                                    : presencaParaMarcar
                                    ? "Marcar Presença"
                                    : isFormador
                                    ? "Criar Nova Presença"
                                    : "Marcar Presença"}
                            </h3>
                            <button className="close-modal" onClick={() => {
                                setShowModal(false);
                                setEditandoPresenca(null);
                                setPresencaParaMarcar(null);
                                setValidationError(null);
                            }}>×</button>
                        </div>

                        <div className="modal-body">
                            {error && <div className="error-message">{error}</div>}
                            {validationError && <div className="error-message validation-error">{validationError}</div>}

                            {/* Informações da presença selecionada para marcar */}
                            {presencaParaMarcar && (
                                <div className="presenca-info">
                                    <h4>Presença selecionada:</h4>
                                    <p><strong>Data:</strong> {formatarData(presencaParaMarcar.data_inicio)} às {presencaParaMarcar.hora_inicio} - {formatarData(presencaParaMarcar.data_fim)} às {presencaParaMarcar.hora_fim}</p>
                                    <p><strong>Tempo restante:</strong> {presencaParaMarcar.minutos_restantes || 0} minutos</p>
                                </div>
                            )}

                            {/* Formulário para criar nova presença - APENAS formador do curso */}
                            {isFormador && !editandoPresenca && !presencaParaMarcar && (
                                <>
                                    {/* Painel informativo sobre horas do curso */}
                                    <div className="horas-info">
                                        <div className="horas-info-item">
                                            <span className="horas-label">Duração do curso:</span>
                                            <span className="horas-value">{duracaoCurso}h</span>
                                        </div>
                                        <div className="horas-info-item">
                                            <span className="horas-label">Horas utilizadas:</span>
                                            <span className="horas-value">{horasUtilizadas.toFixed(2)}h</span>
                                        </div>
                                        <div className="horas-info-item horas-disponiveis">
                                            <span className="horas-label">Horas disponíveis:</span>
                                            <span className="horas-value">{horasDisponiveis.toFixed(2)}h</span>
                                        </div>
                                        {horasNovaPresenca > 0 && (
                                            <div className="horas-info-item nova-presenca">
                                                <span className="horas-label">Esta presença:</span>
                                                <span className={`horas-value ${horasNovaPresenca > horasDisponiveis ? 'excesso' : ''}`}>
                                                    {horasNovaPresenca.toFixed(2)}h
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Campos do formulário de criação */}
                                    <div className="form-group">
                                        <label>Código:</label>
                                        <div className="codigo-field">
                                            <input
                                                type="text"
                                                value={codigo}
                                                onChange={(e) => setCodigo(e.target.value)}
                                                maxLength="20"
                                                placeholder="Código único da presença"
                                            />
                                            <button className="btn-gerar" onClick={gerarCodigo}>Gerar</button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Data de Início:</label>
                                        <input
                                            type="date"
                                            value={dataInicio}
                                            onChange={(e) => setDataInicio(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Hora de Início:</label>
                                        <input
                                            type="time"
                                            value={horaInicio}
                                            onChange={(e) => setHoraInicio(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Data de Fim:</label>
                                        <input
                                            type="date"
                                            value={dataFim}
                                            onChange={(e) => setDataFim(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Hora de Fim:</label>
                                        <input
                                            type="time"
                                            value={horaFim}
                                            onChange={(e) => setHoraFim(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Campo para inserir código de presença - utilizadores inscritos */}
                            {((podeMarcarPresenca && !isFormador) || presencaParaMarcar) && !editandoPresenca && (
                                <div className="form-group">
                                    <label>Código:</label>
                                    <input
                                        type="text"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        maxLength="20"
                                        placeholder="Digite o código fornecido pelo formador"
                                    />
                                </div>
                            )}

                            {/* Formulário para editar presença - APENAS formador do curso */}
                            {editandoPresenca && (
                                <>
                                    <div className="form-group">
                                        <label>Código:</label>
                                        <div className="codigo-field">
                                            <input
                                                type="text"
                                                value={editandoCodigo}
                                                onChange={(e) => setEditandoCodigo(e.target.value)}
                                                maxLength="20"
                                                placeholder="Código único da presença"
                                            />
                                            <button className="btn-gerar" onClick={gerarCodigo}>Gerar</button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Data de Início:</label>
                                        <input
                                            type="date"
                                            value={editandoDataInicio}
                                            onChange={(e) => setEditandoDataInicio(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Hora de Início:</label>
                                        <input
                                            type="time"
                                            value={editandoHoraInicio}
                                            onChange={(e) => setEditandoHoraInicio(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Data de Fim:</label>
                                        <input
                                            type="date"
                                            value={editandoDataFim}
                                            onChange={(e) => setEditandoDataFim(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Hora de Fim:</label>
                                        <input
                                            type="time"
                                            value={editandoHoraFim}
                                            onChange={(e) => setEditandoHoraFim(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Botões de ação do modal */}
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditandoPresenca(null);
                                    setPresencaParaMarcar(null);
                                    setValidationError(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-submit"
                                onClick={editandoPresenca ? atualizarPresenca : (presencaParaMarcar ? marcarPresenca : (isFormador && !presencaParaMarcar ? criarPresenca : marcarPresenca))}
                                disabled={loading || validationError || (isFormador && !editandoPresenca && !presencaParaMarcar && horasNovaPresenca > horasDisponiveis)}
                            >
                                {loading ? "A processar..." : (editandoPresenca ? "Atualizar" : (presencaParaMarcar ? "Marcar" : (isFormador && !presencaParaMarcar ? "Criar" : "Marcar")))}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para listar formandos - APENAS formador do curso */}
            {showListaFormandosModal && presencaSelecionada && (
                <div className="modal-overlay">
                    <div className="presenca-modal lista-formandos-modal">
                        <div className="modal-header">
                            <h3>
                                Formandos - 
                                {formatarData(presencaSelecionada.data_inicio)} {presencaSelecionada.hora_inicio} até {formatarData(presencaSelecionada.data_fim)} {presencaSelecionada.hora_fim}
                            </h3>
                            <button
                                className="close-modal"
                                onClick={() => {
                                    setShowListaFormandosModal(false);
                                    setPresencaSelecionada(null);
                                    setFormandosLista([]);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {loadingFormandos ? (
                                <div className="loading-indicator"></div>
                            ) : formandosLista.length === 0 ? (
                                <div className="empty-message">Nenhum formando inscrito neste curso.</div>
                            ) : (
                                <div className="formandos-lista-container">
                                    <table className="formandos-table">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>E-mail</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formandosLista.map((formando) => (
                                                <tr
                                                    key={formando.id_utilizador}
                                                    className={formando.presenca ? "formando-presente" : "formando-ausente"}
                                                >
                                                    <td>{formando.nome}</td>
                                                    <td>{formando.email}</td>
                                                    <td>{formando.presenca ? "Presente" : "Ausente"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-fechar"
                                onClick={() => {
                                    setShowListaFormandosModal(false);
                                    setPresencaSelecionada(null);
                                    setFormandosLista([]);
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}