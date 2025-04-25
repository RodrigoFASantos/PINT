import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/cursoConteudos.css';
import API_BASE from "../api";
import CriarTopicoModal from './CriarTopicoModal';
import Curso_Conteudo_ficheiro_Modal from "./Curso_Conteudo_ficheiro_Modal";
import axios from "axios";
import AdicionarConteudoModal from '../components/AdicionarConteudoModal';




const CursoConteudos = ({ cursoId, inscrito = false}) => {
  const { id } = useParams();
  const courseId = cursoId || id;
  const navigate = useNavigate();

  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalInputValue, setModalInputValue] = useState('');
  const [currentTopicoId, setCurrentTopicoId] = useState(null);
  const [currentPastaId, setCurrentPastaId] = useState(null);
  const [conteudoType, setConteudoType] = useState('file');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Estado para controlar o modal de tópico
  const [showTopicoModal, setShowTopicoModal] = useState(false);
  const [categoriaAtual, setCategoriaAtual] = useState('');
  const [areaAtual, setAreaAtual] = useState('');


  const [conteudoSelecionado, setConteudoSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [showAdicionarConteudoModal, setShowAdicionarConteudoModal] = useState(false);
  const [pastaAtual, setPastaAtual] = useState(null);











  // Verificar permissões do usuário
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        setUserRole(userData.id_cargo === 1 ? 'admin' : userData.id_cargo === 2 ? 'formador' : 'user');
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
      }
    }
  }, []);

  // Buscar tópicos e conteúdos do curso
  const fetchTopicos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
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
          setError('Sua sessão expirou. Faça login novamente.');
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        console.error('Erro ao analisar token:', tokenError);
      }

      const url = `${API_BASE}/topicos-curso/curso/${courseId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar tópicos: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Alterar para definir todos os tópicos e pastas como fechados por padrão
        const collapsedTopicos = data.map(topico => ({
          ...topico,
          expanded: false, // Alterado de true para false
          pastas: topico.pastas ? topico.pastas.map(pasta => ({
            ...pasta,
            expanded: false // Alterado de true para false
          })) : []
        }));

        setTopicos(collapsedTopicos);
      } else {
        setTopicos([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar tópicos:', error);
      setError('Falha ao carregar os tópicos. Por favor, tente novamente mais tarde.');
      setLoading(false);
    }
  }, [courseId, navigate]);

  // Efeito para monitorar o estado do showTopicoModal (NOVO)
  useEffect(() => {
    console.log("Estado do modal CriarTopicoModal mudou:", showTopicoModal);
  }, [showTopicoModal]);

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

  // Abrir modal para adicionar/editar tópico, pasta ou conteúdo
  const openModal = (type, title, topicoId = null, pastaId = null, contentType = null) => {
    console.log("Abrindo modal:", type, title);

    // Caso especial para adicionar tópico quando não existem tópicos
    if (type === 'topico' && topicos.length === 0) {
      // Buscar informações de categoria e área do curso
      const fetchCursoInfo = async () => {
        try {
          const token = localStorage.getItem('token');

          // Verificamos primeiro se o token existe
          if (!token) {
            console.error('Token não encontrado');
            return;
          }

          console.log("Buscando informações do curso:", courseId);

          const response = await fetch(`${API_BASE}/cursos/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          // Registramos o status da resposta para debug
          console.log("Status da resposta:", response.status);

          if (response.ok) {
            const cursoData = await response.json();

            // Registramos os dados recebidos para debug
            console.log("Dados do curso recebidos:", cursoData);

            // Definimos valores padrão caso os dados não estejam disponíveis
            let categoriaValue = 'Geral';
            let areaValue = 'Geral';

            // Tentamos extrair valores do objeto área se existir
            if (cursoData.area && cursoData.area.nome) {
              areaValue = cursoData.area.nome;
            }

            // Para categoria, pode ser um objeto ou apenas o nome
            if (cursoData.categoria) {
              if (typeof cursoData.categoria === 'object' && cursoData.categoria.nome) {
                categoriaValue = cursoData.categoria.nome;
              } else if (typeof cursoData.categoria === 'string') {
                categoriaValue = cursoData.categoria;
              }
            }

            console.log("Categoria definida:", categoriaValue);
            console.log("Área definida:", areaValue);

            setCategoriaAtual(categoriaValue);
            setAreaAtual(areaValue);

            // Agora ativamos o modal com um pequeno delay para garantir que os estados foram atualizados
            setTimeout(() => {
              setShowTopicoModal(true);
              console.log("Modal CriarTopicoModal ativado");
            }, 100);
          } else {
            console.error('Erro ao buscar dados do curso:', response.statusText);
            // Mesmo em caso de erro, podemos mostrar o modal com valores padrão
            setCategoriaAtual('Geral');
            setAreaAtual('Geral');
            setTimeout(() => {
              setShowTopicoModal(true);
            }, 100);
          }
        } catch (error) {
          console.error('Erro ao buscar informações do curso:', error);
          // Mesmo com erro, exibimos o modal com valores padrão
          setCategoriaAtual('Geral');
          setAreaAtual('Geral');
          setTimeout(() => {
            setShowTopicoModal(true);
          }, 100);
        }
      };

      fetchCursoInfo();
      return;
    }
    if (type === 'conteudo') {
      // Guarda a pasta atual para usar no modal
      setPastaAtual({
        id_pasta: pastaId,
        id_curso: courseId
      });
      // Mostra o modal de adicionar conteúdo
      setShowAdicionarConteudoModal(true);
      return; // Importante para não executar o resto da função
    }


    // Comportamento normal para outros casos
    setModalType(type);
    setModalTitle(title);
    setModalInputValue('');
    setCurrentTopicoId(topicoId);
    setCurrentPastaId(pastaId);
    if (contentType) setConteudoType(contentType);
    setShowModal(true);
  };

  useEffect(() => {
    console.log("Estado do modal mudou:", showModal);
  }, [showModal]);

  const handleTopicoModalClose = () => {
    console.log("Fechando CriarTopicoModal");
    setShowTopicoModal(false);
  };

  const handleTopicoCreated = () => {
    console.log("Tópico criado com sucesso!");
    setShowTopicoModal(false);
    // Recarregar a lista de tópicos
    fetchTopicos();
  };

  // Fechar o modal
  const closeModal = () => {
    setShowModal(false);
    setModalInputValue('');
    setFileToUpload(null);
  };

  // Adicionar novo tópico
  const handleAddTopico = async () => {
    if (!modalInputValue.trim()) {
      alert('Por favor, insira um nome para o tópico.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/topicos-curso`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: modalInputValue,
          id_curso: courseId,
          ordem: topicos.length + 1
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar tópico');
      }

      // Atualizar lista de tópicos
      fetchTopicos();
      setShowModal(false);

    } catch (error) {
      console.error('Erro ao adicionar tópico:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  // Adicionar nova pasta
  const handleAddPasta = async () => {
    if (!modalInputValue.trim()) {
      alert('Por favor, insira um nome para a pasta.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/pastas-curso`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: modalInputValue,
          id_topico: currentTopicoId,
          ordem: topicos.find(t => t.id_topico === currentTopicoId)?.pastas?.length + 1 || 1
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pasta');
      }

      // Atualizar lista de tópicos
      fetchTopicos();
      setShowModal(false);

    } catch (error) {
      console.error('Erro ao adicionar pasta:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  // Adicionar novo conteúdo
  const handleAddConteudo = async () => {
    if (conteudoType !== 'file' && !modalInputValue.trim()) {
      alert('Por favor, insira um link válido.');
      return;
    }

    if (conteudoType === 'file' && !fileToUpload) {
      alert('Por favor, selecione um arquivo.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Dados comuns para todos os tipos de conteúdo
      formData.append('id_curso', courseId);
      formData.append('id_pasta', currentPastaId);
      formData.append('tipo', conteudoType);
      formData.append('titulo', modalInputValue || fileToUpload?.name || 'Arquivo');

      // Dependendo do tipo, adicionar dados específicos
      if (conteudoType === 'file') {
        formData.append('arquivo', fileToUpload);
      } else {
        formData.append('url', modalInputValue);
      }

      const response = await fetch(`${API_BASE}/conteudos-curso`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar conteúdo');
      }

      // Atualizar lista de tópicos
      fetchTopicos();
      setShowModal(false);

    } catch (error) {
      console.error('Erro ao adicionar conteúdo:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  // Editar nome do tópico
  const handleEditTopico = async (topicoId, currentName) => {
    setCurrentTopicoId(topicoId);
    setModalInputValue(currentName);
    setModalType('edit-topico');
    setModalTitle('Editar Tópico');
    setShowModal(true);
  };

  // Editar nome da pasta
  const handleEditPasta = async (pastaId, currentName) => {
    setCurrentPastaId(pastaId);
    setModalInputValue(currentName);
    setModalType('edit-pasta');
    setModalTitle('Editar Pasta');
    setShowModal(true);
  };

  // Salvar edição de tópico
  const handleSaveEditTopico = async () => {
    if (!modalInputValue.trim()) {
      alert('Por favor, insira um nome para o tópico.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/topicos-curso/${currentTopicoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: modalInputValue
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar tópico');
      }

      // Atualizar lista de tópicos
      fetchTopicos();
      setShowModal(false);

    } catch (error) {
      console.error('Erro ao editar tópico:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  // Salvar edição de pasta
  const handleSaveEditPasta = async () => {
    if (!modalInputValue.trim()) {
      alert('Por favor, insira um nome para a pasta.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/pastas-curso/${currentPastaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: modalInputValue
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar pasta');
      }

      // Atualizar lista de tópicos
      fetchTopicos();
      setShowModal(false);

    } catch (error) {
      console.error('Erro ao editar pasta:', error);
      alert(`Erro: ${error.message}`);
    }
  };

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

      const response = await fetch(`${API_BASE}/topicos-curso/${topicoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover tópico');
      }

      // Atualizar lista de tópicos
      fetchTopicos();

    } catch (error) {
      console.error('Erro ao remover tópico:', error);
      alert(`Erro: ${error.message}`);
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

      const response = await fetch(`${API_BASE}/pastas-curso/${pastaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover pasta');
      }

      // Atualizar lista de tópicos
      fetchTopicos();

    } catch (error) {
      console.error('Erro ao remover pasta:', error);
      alert(`Erro: ${error.message}`);
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

      const response = await fetch(`${API_BASE}/conteudos-curso/${conteudoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover conteúdo');
      }

      // Atualizar lista de tópicos
      fetchTopicos();

    } catch (error) {
      console.error('Erro ao remover conteúdo:', error);
      alert(`Erro: ${error.message}`);
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

  // Lidar com o envio do formulário do modal
  const handleModalSubmit = (e) => {
    e.preventDefault();

    switch (modalType) {
      case 'topico':
        console.log("Processando adição de tópico");
        handleAddTopico();
        break;
      case 'pasta':
        handleAddPasta();
        break;
      case 'conteudo':
        handleAddConteudo();
        break;
      case 'edit-topico':
        handleSaveEditTopico();
        break;
      case 'edit-pasta':
        handleSaveEditPasta();
        break;
      default:
        closeModal();
    }
  };













































  if (loading) {
    return (
      <div className="conteudos-loading">
        <div className="loading-spinner"></div>
        <p>Carregando conteúdos do curso...</p>
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

  if (topicos.length === 0) {
    return (
      <div className="no-conteudos">
        <p>Nenhum conteúdo disponível para este curso.</p>
        {(userRole === 'admin' || userRole === 'formador') && (
          <button
            onClick={() => {
              console.log("Clicou em adicionar primeiro tópico");
              openModal('topico', 'Adicionar Tópico');
            }}
            className="btn-add-first"
          >
            Adicionar primeiro tópico
          </button>
        )}

        {/* Renderizando o modal com uma classe diferente para evitar conflitos de CSS */}
        {showTopicoModal && (
          <div className="topico-modal-wrapper" style={{ position: 'relative', zIndex: 1050 }}>
            <CriarTopicoModal
              curso={{ id_curso: courseId, nome: "Curso postman" }}
              onClose={handleTopicoModalClose}
              onSuccess={handleTopicoCreated}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="curso-conteudos-container">
      <div className="conteudos-header">
        {(userRole === 'admin' || userRole === 'formador') && (
          <button
            className="btn-add-topico"
            onClick={() => openModal('topico', 'Adicionar Tópico')}
          >
            <i className="fas fa-plus"></i> Adicionar Tópico
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
                    onClick={() => openModal('pasta', 'Adicionar Pasta', topico.id_topico)}
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
                              onClick={() => openModal('conteudo', 'Adicionar Conteúdo', topico.id_topico, pasta.id_pasta)}
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
      // Se não estiver inscrito, mostrar alerta
      alert("Você precisa estar inscrito no curso para acessar este conteúdo.");
      return;
    }
    
    if (conteudo.tipo === 'file') {
      // For files, show the modal as before
      setConteudoSelecionado(conteudo);
      setMostrarModal(true);
    } else if (conteudo.tipo === 'link' || conteudo.tipo === 'video') {
      // For links and videos, open in a new tab
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
                        onClick={() => openModal('pasta', 'Adicionar Pasta', topico.id_topico)}
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

        {mostrarModal && conteudoSelecionado && (
          <Curso_Conteudo_ficheiro_Modal
            conteudo={conteudoSelecionado}
            onClose={() => setMostrarModal(false)}
            API_BASE={API_BASE}
          />
        )}

      </div>

      {/* Modais para adicionar/editar tópicos, pastas e conteúdos */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalTitle}</h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              {modalType === 'conteudo' ? (
                <>
                  <div className="form-group">
                    <label>Tipo de Conteúdo:</label>
                    <div className="content-type-options">
                      <div className="content-type-option">
                        <input
                          type="radio"
                          id="type-file"
                          name="conteudoType"
                          value="file"
                          checked={conteudoType === 'file'}
                          onChange={() => setConteudoType('file')}
                        />
                        <label htmlFor="type-file">Arquivo</label>
                      </div>
                      <div className="content-type-option">
                        <input
                          type="radio"
                          id="type-link"
                          name="conteudoType"
                          value="link"
                          checked={conteudoType === 'link'}
                          onChange={() => setConteudoType('link')}
                        />
                        <label htmlFor="type-link">Link</label>
                      </div>
                      <div className="content-type-option">
                        <input
                          type="radio"
                          id="type-video"
                          name="conteudoType"
                          value="video"
                          checked={conteudoType === 'video'}
                          onChange={() => setConteudoType('video')}
                        />
                        <label htmlFor="type-video">Vídeo</label>
                      </div>
                    </div>
                  </div>

                  {conteudoType === 'file' ? (
                    <div className="form-group">
                      <label>Arquivo:</label>
                      <input
                        type="file"
                        onChange={(e) => setFileToUpload(e.target.files[0])}
                        required
                      />
                      <div className="form-group">
                        <label>Título (opcional):</label>
                        <input
                          type="text"
                          value={modalInputValue}
                          onChange={(e) => setModalInputValue(e.target.value)}
                          placeholder="Título do arquivo"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>{conteudoType === 'link' ? 'URL do Link:' : 'URL do Vídeo:'}</label>
                      <input
                        type="text"
                        value={modalInputValue}
                        onChange={(e) => setModalInputValue(e.target.value)}
                        placeholder={conteudoType === 'link' ? 'https://exemplo.com' : 'https://youtube.com/watch?v=...'}
                        required
                      />
                      <div className="form-group">
                        <label>Título:</label>
                        <input
                          type="text"
                          value={modalInputValue}
                          onChange={(e) => setModalInputValue(e.target.value)}
                          placeholder="Título do conteúdo"
                          required
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="form-group">
                  <label>
                    {modalType === 'topico' || modalType === 'edit-topico'
                      ? 'Nome do Tópico:'
                      : 'Nome da Pasta:'}
                  </label>
                  <input
                    type="text"
                    value={modalInputValue}
                    onChange={(e) => setModalInputValue(e.target.value)}
                    placeholder={modalType === 'topico' || modalType === 'edit-topico'
                      ? 'Ex: Introdução'
                      : 'Ex: Instalação'}
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm">
                  {modalType.startsWith('edit') ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
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


      {showTopicoModal && (
        <CriarTopicoModal
          curso={{ id_curso: courseId, nome: "Curso postman" }}
          onClose={handleTopicoModalClose}
          onSuccess={handleTopicoCreated}
        />
      )}



      {showAdicionarConteudoModal && (
        <AdicionarConteudoModal
          curso={pastaAtual}
          onClose={() => setShowAdicionarConteudoModal(false)}
          onSuccess={() => {
            setShowAdicionarConteudoModal(false);
            fetchTopicos(); // Recarrega a lista de tópicos
          }}
        />
      )}


    </div>
  );
};

export default CursoConteudos;