import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from "../../api";
import CriarTopicoModal from './Criar_Topico_Modal';
import CriarPastaModal from './Criar_Pasta_Modal';
import CriarConteudoModal from './Criar_Conteudo_Modal';
import Curso_Conteudo_ficheiro_Modal from "./Curso_Conteudo_Ficheiro_Modal";
import './css/Curso_Conteudos.css';

const CursoConteudos = ({ cursoId, inscrito = false }) => {
  const { id } = useParams();
  const courseId = cursoId || id;
  const navigate = useNavigate();
  
  // Estados principais
  const [cursoInfo, setCursoInfo] = useState(null);
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loadingCursoInfo, setLoadingCursoInfo] = useState(false);

  // Estados para modais de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Estados para os modais específicos
  const [showTopicoModal, setShowTopicoModal] = useState(false);
  const [showPastaModal, setShowPastaModal] = useState(false);
  const [showConteudoModal, setShowConteudoModal] = useState(false);

  // Estados para armazenar itens selecionados
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);
  const [pastaSelecionada, setPastaSelecionada] = useState(null);
  const [conteudoSelecionado, setConteudoSelecionado] = useState(null);
  const [mostrarConteudoModal, setMostrarConteudoModal] = useState(false);

  // Verificar permissões do utilizador
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        setUserRole(userData.id_cargo === 1 ? 'admin' : userData.id_cargo === 2 ? 'formador' : 'user');
      } catch (error) {
        console.error("Erro ao descodificar token:", error);
      }
    }
  }, []);

  // Carregar os dados do curso uma vez no início
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
          console.log("Dados do curso carregados:", response.data);
        } catch (error) {
          console.error("Erro ao carregar dados do curso:", error);
          setError(`Falha ao carregar informações do curso: ${error.message}`);
        } finally {
          setLoadingCursoInfo(false);
        }
      };
      
      carregarDadosCurso();
    }
  }, [courseId]);

  // Buscar tópicos e conteúdos do curso
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

      // Verificar validade do token
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expDate = new Date(tokenData.exp * 1000);
        const now = new Date();

        if (now > expDate) {
          setError('A sua sessão expirou. Inicie sessão novamente.');
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        console.error('Erro ao analisar token:', tokenError);
      }

      const response = await axios.get(`${API_BASE}/topicos-curso/curso/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        // Definir todos os tópicos e pastas como fechados por padrão
        const collapsedTopicos = response.data.map(topico => ({
          ...topico,
          expanded: false,
          pastas: topico.pastas ? topico.pastas.map(pasta => ({
            ...pasta,
            expanded: false
          })) : []
        }));

        setTopicos(collapsedTopicos);
      } else {
        setTopicos([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao procurar tópicos:', error);
      setError('Falha ao carregar os tópicos. Por favor, tente novamente mais tarde.');
      setLoading(false);
    }
  }, [courseId, navigate]);

  // Carregar tópicos ao iniciar
  useEffect(() => {
    if (courseId) {
      fetchTopicos();
    } else {
      setLoading(false);
      setError('ID do curso não fornecido');
    }
  }, [courseId, fetchTopicos]);

  // Expandir/colapsar tópico
  const toggleTopico = (topicoId) => {
    setTopicos(prevTopicos =>
      prevTopicos.map(topico =>
        topico.id_topico === topicoId
          ? { ...topico, expanded: !topico.expanded }
          : topico
      )
    );
  };

  // Expandir/colapsar pasta
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

  // Renderizar ícone baseado no tipo de conteúdo
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

  // ===== Handlers para abrir modais =====

  // Abrir modal para criar tópico
  const handleCreateTopico = () => {
    console.log("A abrir modal para criar tópico");
    setShowTopicoModal(true);
  };

  // Abrir modal para criar pasta
  const handleCreatePasta = (topico) => {
    setTopicoSelecionado(topico);
    setShowPastaModal(true);
  };

  // Abrir modal para criar conteúdo
  const handleCreateConteudo = (pasta) => {
    setPastaSelecionada({
      id_pasta: pasta.id_pasta,
      id_curso: courseId,
      nome: pasta.nome
    });
    setShowConteudoModal(true);
  };

  // ===== Handlers para edição =====
  const handleEditTopico = async (topicoId, currentName) => {
    const newName = prompt("Editar nome do tópico:", currentName);
    
    if (!newName || newName === currentName) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_BASE}/topicos-curso/${topicoId}`, 
        { nome: newName },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.status === 200) {
        // Update local state to avoid refetching
        setTopicos(prevTopicos => 
          prevTopicos.map(topico => 
            topico.id_topico === topicoId 
              ? { ...topico, nome: newName } 
              : topico
          )
        );
      }
    } catch (error) {
      console.error("Erro ao editar tópico:", error);
      alert("Erro ao editar tópico. Por favor, tente novamente.");
    }
  };

  const handleEditPasta = async (pastaId, currentName) => {
    const newName = prompt("Editar nome da pasta:", currentName);
    
    if (!newName || newName === currentName) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_BASE}/pastas-curso/${pastaId}`, 
        { nome: newName },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.status === 200) {
        // Update local state
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
      console.error("Erro ao editar pasta:", error);
      alert("Erro ao editar pasta. Por favor, tente novamente.");
    }
  };

  // ===== Handlers para confirmação de exclusão =====

  // Mostrar modal de confirmação para remover tópico
  const confirmRemoveTopico = (topicoId) => {
    setConfirmMessage('Tem certeza que deseja remover este tópico e todos os seus conteúdos?');
    setItemToDelete(topicoId);
    setConfirmAction('removeTopico');
    setShowConfirmModal(true);
  };

  // Remover tópico
  const handleRemoveTopico = async (topicoId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/topicos-curso/${topicoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar lista de tópicos
      fetchTopicos();
    } catch (error) {
      console.error('Erro ao remover tópico:', error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    }
  };

  // Mostrar modal de confirmação para remover pasta
  const confirmRemovePasta = (pastaId) => {
    setConfirmMessage('Tem certeza que deseja remover esta pasta e todos os seus conteúdos?');
    setItemToDelete(pastaId);
    setConfirmAction('removePasta');
    setShowConfirmModal(true);
  };

  // Remover pasta
  const handleRemovePasta = async (pastaId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/pastas-curso/${pastaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar lista de tópicos
      fetchTopicos();
    } catch (error) {
      console.error('Erro ao remover pasta:', error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    }
  };

  // Mostrar modal de confirmação para remover conteúdo
  const confirmRemoveConteudo = (conteudoId) => {
    setConfirmMessage('Tem certeza que deseja remover este conteúdo?');
    setItemToDelete(conteudoId);
    setConfirmAction('removeConteudo');
    setShowConfirmModal(true);
  };

  // Remover conteúdo
  const handleRemoveConteudo = async (conteudoId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/conteudos-curso/${conteudoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar lista de tópicos
      fetchTopicos();
    } catch (error) {
      console.error('Erro ao remover conteúdo:', error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    }
  };

  // Processar confirmação de exclusão
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

  // ===== Handlers para callbacks dos modais =====

  // Callback quando o tópico é criado com sucesso
  const handleTopicoCreated = () => {
    console.log("Tópico criado com sucesso!");
    setShowTopicoModal(false);
    fetchTopicos();
  };

  // Callback quando a pasta é criada com sucesso
  const handlePastaCreated = () => {
    console.log("Pasta criada com sucesso!");
    setShowPastaModal(false);
    fetchTopicos();
  };

  // Callback quando o conteúdo é criado com sucesso
  const handleConteudoCreated = () => {
    console.log("Conteúdo adicionado com sucesso!");
    setShowConteudoModal(false);
    fetchTopicos();
  };

  // Renderização condicional para estados de loading/erro
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

  // Caso não tenha tópicos
  if (topicos.length === 0) {
    return (
      <div className="no-conteudos">
        <p>Nenhum conteúdo disponível para este curso.</p>
        {(userRole === 'admin' || userRole === 'formador') && (
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

  // Renderização principal
  return (
    <div className="curso-conteudos-container">
      <div className="conteudos-header">
        {(userRole === 'admin' || userRole === 'formador') && (
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

      <div className="conteudo-list-estruturada">
        {topicos.map((topico) => (
          <div key={topico.id_topico} className="topico-item">
            <div className="topico-header">
              <button
                className="btn-toggle"
                onClick={() => toggleTopico(topico.id_topico)}
              >
                <i className={`fas fa-chevron-${topico.expanded ? 'down' : 'right'}`}></i>
              </button>
              <span className="topico-nome">{topico.nome}</span>

              {(userRole === 'admin' || userRole === 'formador') && (
                <div className="topico-actions">
                  <button
                    className="btn-add"
                    title="Adicionar pasta"
                    onClick={() => handleCreatePasta(topico)}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button
                    className="btn-edit"
                    title="Editar tópico"
                    onClick={() => handleEditTopico(topico.id_topico, topico.nome)}
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    className="btn-delete"
                    title="Remover tópico"
                    onClick={() => confirmRemoveTopico(topico.id_topico)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              )}
            </div>

            {topico.expanded && (
              <div className="pastas-list">
                {topico.pastas && topico.pastas.length > 0 ? (
                  topico.pastas.map(pasta => (
                    <div key={pasta.id_pasta} className="pasta-item">
                      <div className="pasta-header">
                        <button
                          className="btn-toggle"
                          onClick={() => togglePasta(topico.id_topico, pasta.id_pasta)}
                        >
                          <i className={`fas fa-chevron-${pasta.expanded ? 'down' : 'right'}`}></i>
                        </button>
                        <i className="fas fa-folder"></i>
                        <span className="pasta-nome">{pasta.nome}</span>

                        {(userRole === 'admin' || userRole === 'formador') && (
                          <div className="pasta-actions">
                            <button
                              className="btn-add"
                              title="Adicionar conteúdo"
                              onClick={() => handleCreateConteudo(pasta)}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                            <button
                              className="btn-edit"
                              title="Editar pasta"
                              onClick={() => handleEditPasta(pasta.id_pasta, pasta.nome)}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              className="btn-delete"
                              title="Remover pasta"
                              onClick={() => confirmRemovePasta(pasta.id_pasta)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      {pasta.expanded && (
                        <div className="conteudos-list">
                          {pasta.conteudos && pasta.conteudos.length > 0 ? (
                            pasta.conteudos.map(conteudo => (
                              <div key={conteudo.id_conteudo} className="conteudo-item">
                                {getConteudoIcon(conteudo.tipo)}

                                <span
                                  className={`conteudo-titulo ${!inscrito ? 'bloqueado' : ''}`}
                                  onClick={() => {
                                    if (!inscrito) {
                                      alert("Precisa de estar inscrito no curso para aceder a este conteúdo.");
                                      return;
                                    }

                                    if (conteudo.tipo === 'file') {
                                      setConteudoSelecionado(conteudo);
                                      setMostrarConteudoModal(true);
                                    } else if (conteudo.tipo === 'link' || conteudo.tipo === 'video') {
                                      if (conteudo.url) {
                                        window.open(conteudo.url, '_blank', 'noopener,noreferrer');
                                      }
                                    }
                                  }}
                                >
                                  {conteudo.titulo}
                                  {!inscrito && <i className="fas fa-lock ml-2" title="Conteúdo bloqueado"></i>}
                                </span>

                                {(userRole === 'admin' || userRole === 'formador') && (
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
                    {(userRole === 'admin' || userRole === 'formador') && (
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

      {/* Modal para visualizar conteúdo */}
      {mostrarConteudoModal && conteudoSelecionado && (
        <Curso_Conteudo_ficheiro_Modal
          conteudo={conteudoSelecionado}
          onClose={() => setMostrarConteudoModal(false)}
          API_BASE={API_BASE}
        />
      )}

      {/* Modal de confirmação para exclusão */}
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

      {/* Modais para criar tópicos, pastas e conteúdos */}
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