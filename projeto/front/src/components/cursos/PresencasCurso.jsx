import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import API_BASE from "../../api";
import "./css/PresencasCurso.css";

export default function PresencasCurso({ cursoId, userRole }) {
    const { currentUser } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    const [presencas, setPresencas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [codigo, setCodigo] = useState("");
    // Novos estados para datas completas
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [minhasPresencas, setMinhasPresencas] = useState({});
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [temPresencaAtiva, setTemPresencaAtiva] = useState(false);
    // Novos estados para horas disponíveis
    const [horasDisponiveis, setHorasDisponiveis] = useState(0);
    const [duracaoCurso, setDuracaoCurso] = useState(0);
    const [horasUtilizadas, setHorasUtilizadas] = useState(0);
    // Estado para a nova presença
    const [horasNovaPresenca, setHorasNovaPresenca] = useState(0);
    // Novos estados para edição
    const [editandoPresenca, setEditandoPresenca] = useState(null);
    const [editandoCodigo, setEditandoCodigo] = useState("");
    const [editandoDataInicio, setEditandoDataInicio] = useState("");
    const [editandoHoraInicio, setEditandoHoraInicio] = useState("");
    const [editandoDataFim, setEditandoDataFim] = useState("");
    const [editandoHoraFim, setEditandoHoraFim] = useState("");
    // Estado para o erro de validação
    const [validationError, setValidationError] = useState(null);
    // Novo estado para o modal de lista de formandos
    const [showListaFormandosModal, setShowListaFormandosModal] = useState(false);
    const [formandosLista, setFormandosLista] = useState([]);
    const [presencaSelecionada, setPresencaSelecionada] = useState(null);
    const [loadingFormandos, setLoadingFormandos] = useState(false);

    // Verificar se é formador (cargos 1=admin ou 2=formador) ou formando (cargo 3)
    const isFormador = userRole === 1 || userRole === 2;
    const isFormando = userRole === 3;

    // Carregar presenças ao montar o componente ou quando cursoId mudar
    useEffect(() => {
        refreshData();
    }, [cursoId, currentUser, isFormando]);

    // Verificar se a hora atual atingiu a hora de início de alguma presença (verificação a cada minuto)
    useEffect(() => {
        if (!isFormando) return; // Só é relevante para formandos

        // Função para verificar novas presenças disponíveis
        const checkForNewAvailableAttendances = () => {
            refreshData();
        };

        // Configurar um intervalo para verificar a cada minuto
        const intervalId = setInterval(checkForNewAvailableAttendances, 60000); // 60 segundos

        // Limpar o intervalo quando o componente for desmontado
        return () => clearInterval(intervalId);
    }, [isFormando, cursoId]);

    // Função para verificar se há presença ativa
    const verificarPresencaAtiva = (lista) => {
        const agora = new Date();
        
        // Verifica se há alguma presença que ainda não expirou
        const presencaAtiva = lista.some(presenca => {
            const dataHoraFim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
            return dataHoraFim > agora;
        });

        setTemPresencaAtiva(presencaAtiva);
        return presencaAtiva;
    };

    // Buscar horas disponíveis
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
            console.error("Erro ao buscar horas disponíveis:", error);
            setError("Falha ao carregar horas disponíveis");
            return null;
        }
    };

    // NOVA FUNÇÃO: Buscar lista de formandos para uma presença específica
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
            console.error("Erro ao buscar lista de formandos:", error);
            setError("Falha ao carregar lista de formandos");
            setLoadingFormandos(false);
        }
    };

    // NOVA FUNÇÃO: Abrir modal com lista de formandos
    const abrirModalListaFormandos = (presenca) => {
        setPresencaSelecionada(presenca);
        fetchFormandosPresenca(presenca.id_curso_presenca);
        setShowListaFormandosModal(true);
    };

    // Função para abrir o modal de edição
    const abrirModalEdicao = (presenca) => {
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

    // Função para validar horários
    const validarHorarios = (dataInicio, horaInicio, dataFim, horaFim) => {
        const inicio = new Date(`${dataInicio}T${horaInicio}`);
        const fim = new Date(`${dataFim}T${horaFim}`);

        if (fim <= inicio) {
            return false;
        }
        return true;
    };

    // Função para atualizar presença
    const atualizarPresenca = async () => {
        if (!editandoCodigo || !editandoDataInicio || !editandoHoraInicio || !editandoDataFim || !editandoHoraFim) {
            setError("Preencha todos os campos");
            return;
        }

        // Validar que data/hora fim > data/hora início
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

            // Fechar modal e atualizar dados
            setShowModal(false);
            setEditandoPresenca(null);
            setValidationError(null);
            await refreshData();

        } catch (error) {
            console.error("Erro ao atualizar presença:", error);
            setError("Não foi possível atualizar a presença");
            setLoading(false);
        }
    };

    // Calcular horas da nova presença quando os horários mudam
    useEffect(() => {
        if (dataInicio && horaInicio && dataFim && horaFim) {
            try {
                const inicio = new Date(`${dataInicio}T${horaInicio}`);
                const fim = new Date(`${dataFim}T${horaFim}`);

                // Validar que fim > início
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
                console.error("Erro ao calcular horas da nova presença:", error);
                setHorasNovaPresenca(0);
            }
        }
    }, [dataInicio, horaInicio, dataFim, horaFim]);

    // Função de refresh
    const refreshData = async () => {
        if (!cursoId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Buscar presenças do curso
            const response = await axios.get(`${API_BASE}/presencas/curso/${cursoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const allPresencas = response.data;

            // Filtrar presenças para formandos - só mostrar aquelas cuja data/hora de início já passou
            if (isFormando) {
                const agora = new Date();

                // Filtrar presenças para mostrar apenas:
                // Presenças cuja data e hora de início já tenha passado
                const presencasFiltradas = allPresencas.filter(presenca => {
                    const dataHoraInicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
                    return dataHoraInicio <= agora;
                });

                setPresencas(presencasFiltradas);
            } else {
                // Para formadores, mostrar todas as presenças
                setPresencas(allPresencas);
            }

            // Verificar se existe presença ativa
            verificarPresencaAtiva(allPresencas);

            // Se for formador, buscar também as horas disponíveis
            if (isFormador) {
                await fetchHorasDisponiveis();
            }

            // Se for formando, atualizar também suas presenças
            if (isFormando && currentUser?.id_utilizador) {
                const formandoResponse = await axios.get(
                    `${API_BASE}/presencas/formando/${cursoId}/${currentUser.id_utilizador}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Criar mapa de presenças por id_curso_presenca
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
            console.error("Erro ao atualizar presenças:", error);
            setError("Falha ao atualizar presenças");
            setLoading(false);
        }
    };

    // Alternar expansão da seção
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    // Gerar código aleatório
    const gerarCodigo = () => {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (editandoPresenca) {
            setEditandoCodigo(codigo);
        } else {
            setCodigo(codigo);
        }
    };

    // Definir data e hora atual como padrão ao abrir o modal
    useEffect(() => {
        if (showModal && isFormador && !editandoPresenca) {
            // Buscar horas disponíveis ao abrir o modal
            fetchHorasDisponiveis();

            const agora = new Date();
            
            // Definir data atual para data de início e fim
            const dataAtualFormatada = agora.toISOString().split('T')[0];
            setDataInicio(dataAtualFormatada);
            setDataFim(dataAtualFormatada);

            // Definir hora atual como hora de início
            const horaInicioAtual = agora.toTimeString().split(' ')[0].substring(0, 5);
            setHoraInicio(horaInicioAtual);

            // Definir hora atual + 2 horas como hora de fim
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
    }, [showModal, isFormador, editandoPresenca]);

    // Criar nova presença (formador)
    const criarPresenca = async () => {
        if (!codigo || !dataInicio || !horaInicio || !dataFim || !horaFim) {
            setError("Preencha todos os campos");
            return;
        }

        // Validar que data/hora fim > data/hora início
        if (!validarHorarios(dataInicio, horaInicio, dataFim, horaFim)) {
            setValidationError("A data/hora de fim não pode ser anterior ou igual à data/hora de início");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Verificar se a nova presença excede as horas disponíveis
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

            // Fechar modal primeiro
            setShowModal(false);
            setValidationError(null);

            // Atualizar dados completos em vez de apenas fazer requisição específica
            await refreshData();

        } catch (error) {
            console.error("Erro ao criar presença:", error);
            if (error.response && error.response.status === 400) {
                // Exibir mensagem específica do servidor
                setError(error.response.data.message || "Não foi possível criar a presença");
            } else {
                setError("Não foi possível criar a presença");
            }
            setLoading(false);
        }
    };

    // Marcar presença (formando)
    const marcarPresenca = async () => {
        if (!codigo) {
            setError("Preencha o código de presença");
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

            // Fechar modal primeiro
            setShowModal(false);

            // Atualizar dados completos
            await refreshData();

        } catch (error) {
            console.error("Erro ao marcar presença:", error);
            setError("Código de presença inválido ou expirado");
            setLoading(false);
        }
    };

    // Formatação de data
    const formatarData = (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-PT');
    };

    return (
        <div className="presencas-container">
            <div className="presencas-header" onClick={toggleExpand}>
                <h2>Presenças</h2>
                <div className="presencas-actions">
                    {/* Botão de atualização manual adicionado */}
                    <button
                        className="btn-refresh-presencas"
                        onClick={(e) => {
                            e.stopPropagation();
                            refreshData();
                        }}
                        disabled={loading}
                    >
                        {loading ? "..." : "↻"}
                    </button>

                    {isFormador && (
                        <button
                            className="btn-criar-presenca"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowModal(true);
                                setEditandoPresenca(null);
                                setError(null);
                                setValidationError(null);
                            }}
                            disabled={temPresencaAtiva}
                            title={temPresencaAtiva ? "Já existe uma presença ativa" : "Criar nova presença"}
                        >
                            Criar presença
                        </button>
                    )}
                    {isFormando && (
                        <button
                            className="btn-marcar-presenca"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowModal(true);
                                setEditandoPresenca(null);
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

            {isExpanded && (
                <div className="presencas-content">
                    {loading ? (
                        <div className="loading-indicator"></div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : presencas.length === 0 ? (
                        <div className="empty-message">Nenhuma presença registrada para este curso.</div>
                    ) : (
                        <div className="table-presencas-container">
                            <table className="presencas-table">
                                <thead>
                                    <tr>
                                        <th>Data Início</th>
                                        <th>Hora Início</th>
                                        <th>Data Fim</th>
                                        <th>Hora Fim</th>
                                        {isFormador && <th>Código</th>}
                                        <th>Status</th>
                                        {/* Nova coluna para ações, agora para todos os formadores */}
                                        {isFormador && <th>Presenças</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {presencas.map((presenca) => (
                                        <tr
                                            key={presenca.id_curso_presenca}
                                            className={
                                                isFormando ?
                                                    (minhasPresencas[presenca.id_curso_presenca] ? "presenca-marcada" : "presenca-ausente") :
                                                    ""
                                            }
                                        >
                                            <td>{formatarData(presenca.data_inicio)}</td>
                                            <td>{presenca.hora_inicio}</td>
                                            <td>{formatarData(presenca.data_fim)}</td>
                                            <td>{presenca.hora_fim}</td>
                                            {isFormador && <td>{presenca.codigo}</td>}
                                            <td>
                                                {isFormando ? (
                                                    minhasPresencas[presenca.id_curso_presenca] ?
                                                        "Presente" :
                                                        "Ausente"
                                                ) : (
                                                    // Para formadores, mostrar estatísticas
                                                    `${presenca.presentes || 0} presentes / ${presenca.total || 0} inscritos`
                                                )}
                                            </td>
                                            {isFormador && (
                                                <td className="acoes-column">
                                                    {/* Botão para ver lista de formandos (todos os formadores) */}
                                                    <button
                                                        className="btn-listar-formandos"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            abrirModalListaFormandos(presenca);
                                                        }}
                                                        title="Ver formandos"
                                                    >
                                                        👥
                                                    </button>

                                                    {/* Botão de edição (apenas admin) */}
                                                    {userRole === 1 && (
                                                        <button
                                                            className="btn-editar"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                abrirModalEdicao(presenca);
                                                            }}
                                                            title="Editar presença"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal para criar/marcar/editar presença */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="presenca-modal">
                        <div className="modal-header">
                            <h3>
                                {editandoPresenca
                                    ? "Editar Presença"
                                    : (isFormador ? "Criar Nova Presença" : "Marcar Presença")}
                            </h3>
                            <button className="close-modal" onClick={() => {
                                setShowModal(false);
                                setEditandoPresenca(null);
                                setValidationError(null);
                            }}>×</button>
                        </div>

                        <div className="modal-body">
                            {error && <div className="error-message">{error}</div>}
                            {validationError && <div className="error-message validation-error">{validationError}</div>}

                            {isFormador && !editandoPresenca && (
                                <>
                                    {/* Mostrar informações de horas disponíveis */}
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

                                    <div className="form-group">
                                        <label>Código:</label>
                                        <div className="codigo-field">
                                            <input
                                                type="text"
                                                value={codigo}
                                                onChange={(e) => setCodigo(e.target.value)}
                                                maxLength="20"
                                            />
                                            <button className="btn-gerar" onClick={gerarCodigo}>Gerar</button>
                                        </div>
                                    </div>

                                    {/* Novos campos para data de início */}
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

                                    {/* Novos campos para data de fim */}
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

                            {isFormando && !editandoPresenca && (
                                <div className="form-group">
                                    <label>Código:</label>
                                    <input
                                        type="text"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        maxLength="20"
                                    />
                                </div>
                            )}

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
                                            />
                                            <button className="btn-gerar" onClick={gerarCodigo}>Gerar</button>
                                        </div>
                                    </div>

                                    {/* Novos campos para edição de data de início */}
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

                                    {/* Novos campos para edição de data de fim */}
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

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditandoPresenca(null);
                                    setValidationError(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-submit"
                                onClick={editandoPresenca ? atualizarPresenca : (isFormador ? criarPresenca : marcarPresenca)}
                                disabled={loading || validationError || (isFormador && !editandoPresenca && horasNovaPresenca > horasDisponiveis)}
                            >
                                {loading ? "Processando..." : (editandoPresenca ? "Atualizar" : (isFormador ? "Criar" : "Marcar"))}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para listar formandos */}
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