import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from "../../api";
import CriarTopicoModal from './Criar_Topico_Modal';
import CriarPastaModal from './Criar_Pasta_Modal';
import CriarConteudoModal from './Criar_Conteudo_Modal';
import Curso_Conteudo_ficheiro_Modal from "./Curso_Conteudo_Ficheiro_Modal";
import './css/Curso_Conteudos.css';

/**
 * Componente principal para gestão e visualização de conteúdos dum curso
 * 
 * REGRA FUNDAMENTAL: Apenas o formador específico do curso pode gerir conteúdos
 * Gestores/admins NÃO podem gerir cursos que não são seus
 * 
 * Funcionalidades principais:
 * - Formador do curso: Criar/editar/eliminar tópicos, pastas e conteúdos
 * - Formandos: Visualizar conteúdos mediante inscrição e validade do curso
 * - Estrutura hierárquica: Tópicos > Pastas > Conteúdos
 * - Controlo de acesso baseado em inscrições e datas do curso
 * - Interface expandível/colapsável para melhor organização
 * 
 * @param {number} cursoId - Identificador único do curso
 * @param {boolean} inscrito - Se o utilizador tá inscrito no curso
 * @param {number} formadorId - ID do formador responsável pelo curso
 */
const CursoConteudos = ({ cursoId, inscrito = false, formadorId }) => {
  const { id } = useParams();
  const courseId = cursoId || id;
  const navigate = useNavigate();

  // Estados principais para dados do curso e conteúdos
  const [cursoInfo, setCursoInfo] = useState(null);
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loadingCursoInfo, setLoadingCursoInfo] = useState(false);

  // Estados para modais de confirmação de ações destrutivas
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Estados para controlo dos modais de criação (apenas formador do curso)
  const [showTopicoModal, setShowTopicoModal] = useState(false);
  const [showPastaModal, setShowPastaModal] = useState(false);
  const [showConteudoModal, setShowConteudoModal] = useState(false);

  // Estados para armazenar itens selecionados durante operações
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);
  const [pastaSelecionada, setPastaSelecionada] = useState(null);
  const [conteudoSelecionado, setConteudoSelecionado] = useState(null);
  const [mostrarConteudoModal, setMostrarConteudoModal] = useState(false);

  /**
   * Verifica se o utilizador atual é o formador específico deste curso
   * APENAS o formador do curso pode gerir conteúdos - gestores/admins NÃO podem
   * Esta é a regra fundamental de segurança do sistema
   * 
   * @returns {boolean} - True apenas se é o formador deste curso específico
   */
  const isFormadorDoCurso = useCallback(() => {
    const token = localStorage.getItem('token');
    
    if (!token || !formadorId) {
      return false;
    }

    try {
      // Descodifica o token JWT para extrair os dados do utilizador
      const userData = JSON.parse(atob(token.split('.')[1]));
      
      // Garante que ambos são números para comparação correta
      const userIdNumber = parseInt(userData.id_utilizador);
      const formadorIdNumber = parseInt(formadorId);
      
      return userIdNumber === formadorIdNumber;
    } catch (error) {
      console.error('Erro ao processar token para verificação de formador:', error);
      return false;
    }
  }, [formadorId]);

  /**
   * Verifica as permissões do utilizador através do token JWT
   * Define o papel do utilizador mas a gestão depende sempre de ser o formador do curso
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        const role = userData.id_cargo === 1 ? 'admin' : userData.id_cargo === 2 ? 'formador' : 'user';
        setUserRole(role);
      } catch (error) {
        console.error('Erro ao processar token para definir role:', error);
      }
    }
  }, []);

  /**
   * Carrega as informações detalhadas do curso (datas, tipo, etc.)
   * Estas informações são essenciais para controlar o acesso aos conteúdos
   */
  useEffect(() => {
    if (courseId) {
      const carregarDadosCurso = async () => {
        try {
          setLoadingCursoInfo(true);
          const token = localStorage.getItem('token');

          if (!token) {
            setError('Token não encontrado. Inicie sessão novamente.');
            return;
          }

          const response = await axios.get(`${API_BASE}/cursos/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setCursoInfo(response.data);
        } catch (error) {
          console.error('Erro ao carregar informações do curso:', error);
          setError(`Falha ao carregar informações do curso: ${error.message}`);
        } finally {
          setLoadingCursoInfo(false);
        }
      };

      carregarDadosCurso();
    }
  }, [courseId]);

  /**
   * Verifica se o utilizador pode aceder aos conteúdos do curso
   * Regras de acesso:
   * - Formador do curso: sempre pode aceder para gerir conteúdos
   * - Formandos: apenas se inscritos e dentro das regras do curso
   * - Cursos assíncronos: bloqueados após data de fim
   * - Cursos síncronos: acessíveis mesmo após fim se tava inscrito
   * 
   * @returns {boolean} - True se pode aceder aos conteúdos
   */
  const podeAcederConteudos = useCallback(() => {
    if (!cursoInfo) return false;
    
    // O formador do curso sempre pode aceder para gerir conteúdos
    if (isFormadorDoCurso()) return true;
    
    // Utilizadores não inscritos não podem aceder
    if (!inscrito) return false;
    
    // Verificar se o curso já terminou
    const dataAtual = new Date();
    const dataFimCurso = new Date(cursoInfo.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;
    
    // Se o curso não terminou, formandos inscritos podem aceder
    if (!cursoTerminado) return true;
    
    // Se o curso terminou e é assíncrono, bloquear acesso
    if (cursoInfo.tipo === 'assincrono') return false;
    
    // Se o curso terminou e é síncrono, permitir acesso a quem tava inscrito
    if (cursoInfo.tipo === 'sincrono') return true;
    
    return false;
  }, [cursoInfo, inscrito, isFormadorDoCurso]);

  /**
   * Busca todos os tópicos e conteúdos do curso
   * Organiza os dados numa estrutura hierárquica e filtra tópicos de avaliação
   * Define estados expandidos como falso por padrão para melhor performance
   */
  const fetchTopicos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Token não encontrado. Inicie sessão novamente.');
        navigate('/login', { state: { redirectTo: `/cursos/${courseId}` } });
        setLoading(false);
        return;
      }

      // Verificar validade do token para evitar pedidos desnecessários
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expDate = new Date(tokenData.exp * 1000);
        const now = new Date();

        if (now > expDate) {
          setError('A vossa sessão expirou. Inicie sessão novamente.');
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        // Token malformado - continuar sem verificação de expiração
        console.warn('Token malformado, a continuar sem verificação de validade');
      }

      const response = await axios.get(`${API_BASE}/topicos-curso/curso/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        // Processar dados e definir estados iniciais de expansão
        let processedTopicos = response.data.map(topico => ({
          ...topico,
          expanded: false, // Todos os tópicos começam colapsados para melhor performance
          isAvaliacao: topico.nome.toLowerCase() === 'avaliação',
          pastas: topico.pastas ? topico.pastas.map(pasta => ({
            ...pasta,
            expanded: false, // Todas as pastas começam colapsadas
            isAvaliacao: topico.nome.toLowerCase() === 'avaliação' || pasta.isAvaliacao
          })) : []
        }));

        // Filtrar tópicos de avaliação (são geridos noutra secção específica)
        processedTopicos = processedTopicos.filter(topico => !topico.isAvaliacao);

        setTopicos(processedTopicos);
      } else {
        setTopicos([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar tópicos do curso:', error);
      setError('Falha ao carregar os tópicos. Por favor, tente novamente mais tarde.');
      setLoading(false);
    }
  }, [courseId, navigate]);

  // Carregamento inicial dos tópicos quando o componente é montado
  useEffect(() => {
    if (courseId) {
      fetchTopicos();
    } else {
      setLoading(false);
      setError('ID do curso não fornecido');
    }
  }, [courseId, fetchTopicos]);

  /**
   * Alterna o estado expandido/colapsado dum tópico
   * Permite organizar visualmente a estrutura hierárquica dos conteúdos
   * 
   * @param {number} topicoId - ID do tópico a expandir/colapsar
   */
  const toggleTopico = (topicoId) => {
    setTopicos(prevTopicos =>
      prevTopicos.map(topico =>
        topico.id_topico === topicoId
          ? { ...topico, expanded: !topico.expanded }
          : topico
      )
    );
  };

  /**
   * Alterna o estado expandido/colapsado duma pasta dentro dum tópico
   * Permite navegar pela estrutura hierárquica: Tópicos > Pastas > Conteúdos
   * 
   * @param {number} topicoId - ID do tópico pai
   * @param {number} pastaId - ID da pasta a expandir/colapsar
   */
  const togglePasta = (topicoId, pastaId) => {
    setTopicos(prevTopicos =>
      prevTopicos.map(topico =>
        topico.id_topico === topicoId
          ? {
            ...topico,
            pastas: topico.pastas.map(pasta =>
              pasta.id_pasta === pastaId
                ? { ...pasta, expanded: !pasta.expanded }
                : pasta
            )
          }
          : topico
      )
    );
  };

  /**
   * Determina o ícone apropriado baseado no tipo de conteúdo
   * Ajuda na identificação visual rápida do tipo de material
   * 
   * @param {string} tipo - Tipo do conteúdo (file, link, video)
   * @returns {JSX.Element} - Ícone FontAwesome apropriado
   */
  const getConteudoIcon = (tipo) => {
    switch (tipo) {
      case 'file':
        return <i className="fas fa-file-alt"></i>;
      case 'link':
        return <i className="fas fa-link"></i>;
      case 'video':
        return <i className="fas fa-video"></i>;
      default:
        return <i className="fas fa-file"></i>;
    }
  };

  /**
   * Gera mensagem de bloqueio apropriada baseada no estado do utilizador e curso
   * Fornece feedback claro sobre porque o acesso tá bloqueado
   * 
   * @returns {string} - Mensagem explicativa do bloqueio
   */
  const getMensagemBloqueio = () => {
    if (!cursoInfo) return "A carregar informações do curso...";
    
    if (!inscrito) {
      return "Precisa de tar inscrito no curso para aceder a este conteúdo.";
    }
    
    const dataAtual = new Date();
    const dataFimCurso = new Date(cursoInfo.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;
    
    if (cursoTerminado && cursoInfo.tipo === 'assincrono') {
      return "Este curso assíncrono já terminou e os conteúdos não tão mais disponíveis.";
    }
    
    return "Não tem permissão para aceder a este conteúdo.";
  };

  // ===== Handlers para criação de novos itens (APENAS formador do curso) =====

  /**
   * Abre o modal para criar um novo tópico
   * Apenas o formador do curso pode criar tópicos
   */
  const handleCreateTopico = () => {
    setShowTopicoModal(true);
  };

  /**
   * Abre o modal para criar uma nova pasta dentro dum tópico
   * Apenas o formador do curso pode criar pastas
   * 
   * @param {Object} topico - Objeto do tópico pai onde criar a pasta
   */
  const handleCreatePasta = (topico) => {
    setTopicoSelecionado(topico);
    setShowPastaModal(true);
  };

  /**
   * Abre o modal para criar um novo conteúdo dentro duma pasta
   * Apenas o formador do curso pode criar conteúdos
   * 
   * @param {Object} pasta - Objeto da pasta pai onde criar o conteúdo
   */
  const handleCreateConteudo = (pasta) => {
    setPastaSelecionada({
      id_pasta: pasta.id_pasta,
      id_curso: courseId,
      nome: pasta.nome,
      isAvaliacao: pasta.isAvaliacao || false
    });
    setShowConteudoModal(true);
  };

  // ===== Handlers para edição in-line (APENAS formador do curso) =====

  /**
   * Permite editar o nome dum tópico através de prompt
   * Atualiza localmente para evitar recarregamento desnecessário
   * Apenas o formador do curso pode editar
   * 
   * @param {number} topicoId - ID do tópico a editar
   * @param {string} currentName - Nome atual do tópico
   */
  const handleEditTopico = async (topicoId, currentName) => {
    const newName = prompt("Editar nome do tópico:", currentName);

    if (!newName || newName === currentName) return;

    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(`${API_BASE}/topicos-curso/${topicoId}`,
        { nome: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Atualizar estado local para resposta imediata na interface
        setTopicos(prevTopicos =>
          prevTopicos.map(topico =>
            topico.id_topico === topicoId
              ? { ...topico, nome: newName }
              : topico
          )
        );
      }
    } catch (error) {
      alert("Erro ao editar tópico. Por favor, tente novamente.");
    }
  };

  /**
   * Permite editar o nome duma pasta através de prompt
   * Apenas o formador do curso pode editar
   * 
   * @param {number} pastaId - ID da pasta a editar
   * @param {string} currentName - Nome atual da pasta
   */
  const handleEditPasta = async (pastaId, currentName) => {
    const newName = prompt("Editar nome da pasta:", currentName);

    if (!newName || newName === currentName) return;

    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(`${API_BASE}/pastas-curso/${pastaId}`,
        { nome: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Atualizar estado local para resposta imediata
        setTopicos(prevTopicos =>
          prevTopicos.map(topico => ({
            ...topico,
            pastas: topico.pastas.map(pasta =>
              pasta.id_pasta === pastaId
                ? { ...pasta, nome: newName }
                : pasta
            )
          }))
        );
      }
    } catch (error) {
      alert("Erro ao editar pasta. Por favor, tente novamente.");
    }
  };

  // ===== Handlers para confirmação e eliminação (APENAS formador do curso) =====

  /**
   * Exibe modal de confirmação para eliminar um tópico
   * Apenas o formador do curso pode eliminar
   * 
   * @param {number} topicoId - ID do tópico a eliminar
   */
  const confirmRemoveTopico = (topicoId) => {
    setConfirmMessage('Tem certeza que deseja remover este tópico e todos os seus conteúdos?');
    setItemToDelete(topicoId);
    setConfirmAction('removeTopico');
    setShowConfirmModal(true);
  };

  /**
   * Elimina um tópico e todo o seu conteúdo
   * Apenas o formador do curso pode eliminar
   * 
   * @param {number} topicoId - ID do tópico a eliminar
   */
  const handleRemoveTopico = async (topicoId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/topicos-curso/${topicoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Recarregar dados após eliminação para garantir consistência
      fetchTopicos();
    } catch (error) {
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Exibe modal de confirmação para eliminar uma pasta
   * Apenas o formador do curso pode eliminar
   * 
   * @param {number} pastaId - ID da pasta a eliminar
   */
  const confirmRemovePasta = (pastaId) => {
    setConfirmMessage('Tem certeza que deseja remover esta pasta e todos os seus conteúdos?');
    setItemToDelete(pastaId);
    setConfirmAction('removePasta');
    setShowConfirmModal(true);
  };

  /**
   * Elimina uma pasta e todo o seu conteúdo
   * Apenas o formador do curso pode eliminar
   * 
   * @param {number} pastaId - ID da pasta a eliminar
   */
  const handleRemovePasta = async (pastaId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/pastas-curso/${pastaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchTopicos();
    } catch (error) {
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Exibe modal de confirmação para eliminar um conteúdo
   * Apenas o formador do curso pode eliminar
   * 
   * @param {number} conteudoId - ID do conteúdo a eliminar
   */
  const confirmRemoveConteudo = (conteudoId) => {
    setConfirmMessage('Tem certeza que deseja remover este conteúdo?');
    setItemToDelete(conteudoId);
    setConfirmAction('removeConteudo');
    setShowConfirmModal(true);
  };

  /**
   * Elimina um conteúdo específico
   * Apenas o formador do curso pode eliminar
   * 
   * @param {number} conteudoId - ID do conteúdo a eliminar
   */
  const handleRemoveConteudo = async (conteudoId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/conteudos-curso/${conteudoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchTopicos();
    } catch (error) {
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Processa a confirmação de ações destrutivas
   * Chama a função apropriada baseada no tipo de ação confirmada
   */
  const handleConfirmAction = () => {
    if (confirmAction === 'removeTopico') {
      handleRemoveTopico(itemToDelete);
    } else if (confirmAction === 'removePasta') {
      handleRemovePasta(itemToDelete);
    } else if (confirmAction === 'removeConteudo') {
      handleRemoveConteudo(itemToDelete);
    }
    setShowConfirmModal(false);
  };

  // ===== Callbacks de sucesso dos modais =====

  /**
   * Callback executado quando um tópico é criado com sucesso
   * Fecha o modal e recarrega os dados para mostrar o novo tópico
   */
  const handleTopicoCreated = () => {
    setShowTopicoModal(false);
    fetchTopicos();
  };

  /**
   * Callback executado quando uma pasta é criada com sucesso
   * Fecha o modal e recarrega os dados para mostrar a nova pasta
   */
  const handlePastaCreated = () => {
    setShowPastaModal(false);
    fetchTopicos();
  };

  /**
   * Callback executado quando um conteúdo é adicionado com sucesso
   * Fecha o modal e recarrega os dados para mostrar o novo conteúdo
   */
  const handleConteudoCreated = () => {
    setShowConteudoModal(false);
    fetchTopicos();
  };

  // ===== Renderização condicional para estados especiais =====

  if (loading) {
    return (
      <div className="conteudos-loading">
        <div className="loading-spinner"></div>
        <p>A carregar conteúdos do curso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conteudos-error">
        <p className="error-message">{error}</p>
        <button onClick={fetchTopicos} className="btn-retry">
          Tentar novamente
        </button>
      </div>
    );
  }

  // Estado inicial quando não há tópicos criados
  if (topicos.length === 0) {
    const isFormadorAtual = isFormadorDoCurso();
    
    return (
      <div className="no-conteudos">
        <p>Nenhum conteúdo disponível para este curso.</p>
        {/* Botão apenas para o formador do curso */}
        {isFormadorAtual && (
          <button
            onClick={handleCreateTopico}
            className="btn-add-first"
            disabled={loadingCursoInfo}
          >
            {loadingCursoInfo ? 'A carregar...' : 'Adicionar primeiro tópico'}
          </button>
        )}

        {showTopicoModal && cursoInfo && (
          <CriarTopicoModal
            curso={cursoInfo}
            onClose={() => setShowTopicoModal(false)}
            onSuccess={handleTopicoCreated}
          />
        )}
      </div>
    );
  }

  // Verificação de acesso aos conteúdos baseada nas regras do curso
  const podeAceder = podeAcederConteudos();

  // ===== Renderização principal do componente =====
  return (
    <div className="curso-conteudos-container">
      {/* Cabeçalho com botão de criação - APENAS para o formador do curso */}
      <div className="conteudos-header">
        {isFormadorDoCurso() && (
          <button
            className="btn-add-topico"
            onClick={handleCreateTopico}
            disabled={loadingCursoInfo}
          >
            {loadingCursoInfo ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> A carregar...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> Adicionar Tópico
              </>
            )}
          </button>
        )}
      </div>

      {/* Lista estruturada de conteúdos com navegação hierárquica */}
      <div className="conteudo-list-estruturada">
        {topicos.map((topico) => (
          <div key={topico.id_topico} className="pasta-item topico-container">
            {/* Cabeçalho do tópico com ações apenas para o formador do curso */}
            <div
              className="pasta-header"
              onClick={() => toggleTopico(topico.id_topico)}
            >
              <button
                className="btn-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTopico(topico.id_topico);
                }}
              >
                <i className={`fas fa-chevron-${topico.expanded ? 'down' : 'right'}`}></i>
              </button>
              <i className="fas fa-folder"></i>
              <span className="pasta-nome">{topico.nome}</span>

              {/* Ações de gestão APENAS para o formador do curso */}
              {isFormadorDoCurso() && (
                <div className="pasta-actions">
                  <button
                    className="btn-add"
                    title="Adicionar pasta"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreatePasta(topico);
                    }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button
                    className="btn-edit"
                    title="Editar tópico"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTopico(topico.id_topico, topico.nome);
                    }}
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    className="btn-delete"
                    title="Remover tópico"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmRemoveTopico(topico.id_topico);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo expandido do tópico - lista de pastas */}
            {topico.expanded && (
              <div className="pastas-list">
                {topico.pastas && topico.pastas.length > 0 ? (
                  topico.pastas.map(pasta => (
                    <div key={pasta.id_pasta} className="pasta-item">
                      {/* Cabeçalho da pasta com ações apenas para o formador do curso */}
                      <div
                        className="pasta-header"
                        onClick={() => togglePasta(topico.id_topico, pasta.id_pasta)}
                      >
                        <button
                          className="btn-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePasta(topico.id_topico, pasta.id_pasta);
                          }}
                        >
                          <i className={`fas fa-chevron-${pasta.expanded ? 'down' : 'right'}`}></i>
                        </button>
                        <i className="fas fa-folder"></i>
                        <span className="pasta-nome">{pasta.nome}</span>

                        {/* Ações de gestão APENAS para o formador do curso */}
                        {isFormadorDoCurso() && (
                          <div className="pasta-actions">
                            <button
                              className="btn-add"
                              title="Adicionar conteúdo"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateConteudo(pasta);
                              }}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                            <button
                              className="btn-edit"
                              title="Editar pasta"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPasta(pasta.id_pasta, pasta.nome);
                              }}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              className="btn-delete"
                              title="Remover pasta"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmRemovePasta(pasta.id_pasta);
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Conteúdo expandido da pasta - lista de ficheiros/links/vídeos */}
                      {pasta.expanded && (
                        <div className="conteudos-list">
                          {pasta.conteudos && pasta.conteudos.length > 0 ? (
                            pasta.conteudos.map(conteudo => (
                              <div key={conteudo.id_conteudo} className="conteudo-item">
                                {getConteudoIcon(conteudo.tipo)}

                                <span
                                  className={`conteudo-titulo ${!podeAceder ? 'bloqueado' : ''}`}
                                  onClick={() => {
                                    if (!podeAceder) {
                                      alert(getMensagemBloqueio());
                                      return;
                                    }

                                    // Processar clique baseado no tipo de conteúdo
                                    // Ficheiros e vídeos abrem o modal com opções de visualizar/descarregar
                                    if (conteudo.tipo === 'file' || conteudo.tipo === 'video') {
                                      setConteudoSelecionado(conteudo);
                                      setMostrarConteudoModal(true);
                                    } else if (conteudo.tipo === 'link') {
                                      // Links abrem diretamente numa nova janela
                                      if (conteudo.url) {
                                        window.open(conteudo.url, '_blank', 'noopener,noreferrer');
                                      }
                                    }
                                  }}
                                >
                                  {conteudo.titulo}
                                  {!podeAceder && <i className="fas fa-lock ml-2" title="Conteúdo bloqueado"></i>}
                                </span>

                                {/* Ações de gestão APENAS para o formador do curso */}
                                {isFormadorDoCurso() && (
                                  <div className="conteudo-actions">
                                    <button
                                      className="btn-delete"
                                      onClick={() => confirmRemoveConteudo(conteudo.id_conteudo)}
                                      title="Remover conteúdo"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="pasta-empty">Pasta vazia</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="topico-empty">
                    <p>Sem pastas neste tópico</p>
                    {/* Botão apenas para o formador do curso */}
                    {isFormadorDoCurso() && (
                      <button
                        onClick={() => handleCreatePasta(topico)}
                        className="btn-add-pasta"
                      >
                        <i className="fas fa-folder-plus"></i> Adicionar pasta
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal para visualização de conteúdos (ficheiros e vídeos) */}
      {mostrarConteudoModal && conteudoSelecionado && (
        <Curso_Conteudo_ficheiro_Modal
          conteudo={conteudoSelecionado}
          onClose={() => setMostrarConteudoModal(false)}
          API_BASE={API_BASE}
        />
      )}

      {/* Modal de confirmação para ações destrutivas */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p>{confirmMessage}</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm btn-danger"
                onClick={handleConfirmAction}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais para criação de novos itens - APENAS o formador do curso pode aceder */}
      {showTopicoModal && cursoInfo && (
        <CriarTopicoModal
          curso={cursoInfo}
          onClose={() => setShowTopicoModal(false)}
          onSuccess={handleTopicoCreated}
        />
      )}

      {showPastaModal && topicoSelecionado && (
        <CriarPastaModal
          topico={topicoSelecionado}
          onClose={() => setShowPastaModal(false)}
          onSuccess={handlePastaCreated}
        />
      )}

      {showConteudoModal && pastaSelecionada && (
        <CriarConteudoModal
          pasta={pastaSelecionada}
          onClose={() => setShowConteudoModal(false)}
          onSuccess={handleConteudoCreated}
        />
      )}
    </div>
  );
};

export default CursoConteudos;