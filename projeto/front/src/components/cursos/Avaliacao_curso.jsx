import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import CriarPastaModal from './Criar_Pasta_Modal';
import CriarConteudoModal from './Criar_Conteudo_Modal';
import Curso_Conteudo_ficheiro_Modal from './Curso_Conteudo_Ficheiro_Modal';
import './css/Curso_Conteudos.css';
import './css/Avaliacao_Curso.css';

// Componente reutilizável para modal de confirmação
const ConfirmModal = ({ show, title, message, onCancel, onConfirm, confirmLabel = "Confirmar" }) => {
  if (!show) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-confirm">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancelar" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-confirmar" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const Avaliacao_curso = ({ cursoId, userRole, formadorId }) => {
  const [topicoAvaliacao, setTopicoAvaliacao] = useState(null);
  const [expandedPastas, setExpandedPastas] = useState([]);
  const [selectedConteudo, setSelectedConteudo] = useState(null);
  const [showCriarConteudoModal, setShowCriarConteudoModal] = useState(false);
  const [showCriarPastaModal, setShowCriarPastaModal] = useState(false);
  const [pastaSelecionada, setPastaSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    action: null,
    targetId: null
  });
  const [enviarSubmissaoModal, setEnviarSubmissaoModal] = useState({
    show: false,
    pastaId: null
  });
  const [submissoes, setSubmissoes] = useState({});
  const [arquivo, setArquivo] = useState(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  // Verifica se o utilizador é formador
  const isFormador = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id_utilizador === formadorId || payload.id_cargo === 1 || payload.id_cargo === 2;
    } catch (e) {
      console.error('Erro ao descodificar token:', e);
      return false;
    }
  };

  // Carregar tópicos do curso
  const carregarTopicos = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/topicos-curso/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      const topico = data.find(t => t.nome.toLowerCase() === 'avaliação');

      if (topico) {
        // Clonar o tópico para evitar referências
        const topicoAvaliacao = { ...topico };
        
        // Marcar cada pasta como pertencente à avaliação
        if (topicoAvaliacao.pastas) {
          topicoAvaliacao.pastas = topicoAvaliacao.pastas.map(pasta => ({
            ...pasta,
            isAvaliacao: true
          }));
        }
        
        setTopicoAvaliacao(topicoAvaliacao);
        await carregarSubmissoes(topicoAvaliacao);
      } else {
        setTopicoAvaliacao(null);
      }
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error);
      setErro('Não foi possível carregar os tópicos. Por favor, tente novamente.');
      setCarregando(false);
    }
  };

  // MODIFICADO: Carregar submissões dos formandos usando o endpoint correto
  const carregarSubmissoes = async (topico) => {
    try {
      const token = localStorage.getItem('token');
      const submissoesData = {};
      
      if (topico && topico.pastas) {
        for (const pasta of topico.pastas) {
          submissoesData[pasta.id_pasta] = [];
          
          try {
            // Corrigido: usar trabalhos em vez de submissoes
            const response = await axios.get(`${API_BASE}/trabalhos/pasta/${pasta.id_pasta}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.status === 200) {
              submissoesData[pasta.id_pasta] = response.data;
            }
          } catch (submissaoError) {
            console.log('A verificar trabalhos submetidos para a pasta:', submissaoError);
            
            // Tentar endpoint alternativo caso o primeiro falhe
            try {
              const altResponse = await axios.get(`${API_BASE}/trabalhos/curso/${cursoId}/pasta/${pasta.id_pasta}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (altResponse.status === 200) {
                submissoesData[pasta.id_pasta] = altResponse.data;
              }
            } catch (altError) {
              console.log('Nenhum trabalho encontrado para esta pasta', altError);
            }
          }
        }
      }
      
      setSubmissoes(submissoesData);
    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (cursoId) {
      carregarTopicos();
    }
  }, [cursoId]);

  // Expandir/colapsar pasta
  const toggleExpandPasta = (idPasta) => {
    setExpandedPastas((prev) =>
      prev.includes(idPasta) ? prev.filter((id) => id !== idPasta) : [...prev, idPasta]
    );
  };

  // Abrir modal para criar pasta
  const abrirModalCriarPasta = () => {
    setShowCriarPastaModal(true);
  };

  // Abrir modal para adicionar conteúdo
  const abrirModalAdicionarConteudo = (pasta) => {
    setPastaSelecionada({
      id_pasta: pasta.id_pasta,
      id_curso: cursoId,
      nome: pasta.nome
    });
    setShowCriarConteudoModal(true);
  };

  // Abrir modal para visualizar conteúdo
  const abrirModalFicheiro = (conteudo) => {
    setSelectedConteudo(conteudo);
  };

  // Criar tópico de avaliação
  const criarTopicoAvaliacao = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      
      const dadosEnvio = {
        nome: 'Avaliação',
        id_curso: cursoId,
        ordem: 1  // Posição do tópico na lista
      };
      
      const response = await axios.post(`${API_BASE}/topicos-curso`, dadosEnvio, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        await carregarTopicos();
      }
    } catch (error) {
      console.error('Erro ao criar tópico de avaliação:', error);
      setErro('Erro ao criar tópico de avaliação. Por favor, tente novamente.');
      setCarregando(false);
    }
  };

  // Remover tópico de avaliação
  const removerTopicoAvaliacao = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${API_BASE}/topicos-curso/${topicoAvaliacao.id_topico}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTopicoAvaliacao(null);
    } catch (error) {
      console.error('Erro ao remover tópico:', error);
      setErro('Erro ao remover tópico de avaliação. Por favor, tente novamente.');
    }
  };

  // Remover pasta
  const removerPasta = async (pastaId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/pastas-curso/${pastaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao remover pasta:', error);
      setErro('Erro ao remover pasta. Por favor, tente novamente.');
    }
  };

  // Remover conteúdo
  const removerConteudo = async (conteudoId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE}/conteudos-curso/${conteudoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await carregarTopicos();
    } catch (error) {
      console.error('Erro ao remover conteúdo:', error);
      setErro('Erro ao remover conteúdo. Por favor, tente novamente.');
    }
  };

  // Modal de confirmação para ações
  const mostrarModalConfirmacao = (mensagem, acao, id) => {
    setConfirmModal({
      show: true,
      message: mensagem,
      action: acao,
      targetId: id
    });
  };

  // Executar ação confirmada
  const executarAcaoConfirmada = () => {
    if (confirmModal.action === 'removerTopico') {
      removerTopicoAvaliacao();
    } else if (confirmModal.action === 'removerPasta') {
      removerPasta(confirmModal.targetId);
    } else if (confirmModal.action === 'removerConteudo') {
      removerConteudo(confirmModal.targetId);
    }
    
    setConfirmModal({ show: false, message: '', action: null, targetId: null });
  };

  // Abrir modal para enviar submissão
  const abrirModalEnviarSubmissao = (pastaId) => {
    setEnviarSubmissaoModal({
      show: true,
      pastaId: pastaId
    });
    setArquivo(null);
  };

  // Selecionar arquivo para submissão
  const handleArquivoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  // MODIFICADO: Enviar submissão do formando com endpoints corrigidos
  const enviarSubmissao = async (e) => {
    e.preventDefault();
    
    if (!arquivo) {
      alert('Por favor, selecione um ficheiro.');
      return;
    }
    
    try {
      setEnviandoArquivo(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('ficheiro', arquivo); // Alterado de 'arquivo' para 'ficheiro' (nome do campo correto)
      formData.append('id_pasta', enviarSubmissaoModal.pastaId);
      formData.append('id_curso', cursoId);
      
      // Obter ID do utilizador do token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idUtilizador = payload.id_utilizador;
      formData.append('id_utilizador', idUtilizador);
      
      // Corrigido: usar trabalhos em vez de submissoes
      const response = await axios.post(`${API_BASE}/trabalhos`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Em caso de sucesso
      await carregarTopicos();
      setEnviarSubmissaoModal({ show: false, pastaId: null });
      alert('Trabalho submetido com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar trabalho:', error);
      
      // Tentativa alternativa com outro endpoint
      if (error.response && error.response.status === 404) {
        try {
          console.log("A tentar endpoint alternativo para submissão...");
          const token = localStorage.getItem('token');
          const formData = new FormData();
          
          formData.append('ficheiro', arquivo);
          formData.append('id_pasta', enviarSubmissaoModal.pastaId);
          formData.append('id_curso', cursoId);
          
          // Obter ID do utilizador do token
          const payload = JSON.parse(atob(token.split('.')[1]));
          const idUtilizador = payload.id_utilizador;
          formData.append('id_utilizador', idUtilizador);
          
          // Tentando outro possível endpoint
          const altResponse = await axios.post(`${API_BASE}/trabalhos/submeter`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          await carregarTopicos();
          setEnviarSubmissaoModal({ show: false, pastaId: null });
          alert('Trabalho submetido com sucesso!');
          return;
        } catch (altError) {
          console.error('Falha na tentativa alternativa:', altError);
        }
      }
      
      // Melhor tratamento de erros com mensagens específicas
      let errorMsg = 'Erro ao submeter o trabalho. Por favor, tente novamente.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMsg = 'O serviço de submissão de trabalhos não foi encontrado. Por favor, contacte o administrador.';
        } else if (error.response.status === 400) {
          errorMsg = error.response.data?.message || 'Erro de validação. Verifique os dados do ficheiro.';
        } else if (error.response.status === 413) {
          errorMsg = 'O ficheiro é demasiado grande. Por favor, escolha um ficheiro menor.';
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      alert(errorMsg);
    } finally {
      setEnviandoArquivo(false);
    }
  };

  // Renderização condicional para carregamento
  if (carregando) {
    return (
      <div className="avaliacao-loading">
        <div className="loading-spinner"></div>
        <p>A carregar avaliações...</p>
      </div>
    );
  }

  // Renderização condicional para erro
  if (erro) {
    return (
      <div className="avaliacao-erro">
        <p className="erro-mensagem">{erro}</p>
        <button onClick={() => { setErro(null); carregarTopicos(); }} className="btn-retry">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="curso-conteudos-container avaliacao-container">
      <div className="conteudos-header-avaliacao">
        <h2 className="avaliacao-titulo">Avaliação</h2>
        {isFormador() && (
          <div className="topico-actions">
            {topicoAvaliacao ? (
              <>
                <button 
                  className="btn-add" 
                  onClick={abrirModalCriarPasta}
                  title="Adicionar pasta"
                >
                  <i className="fas fa-folder-plus"></i>
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => mostrarModalConfirmacao(
                    'Tem certeza que deseja remover o tópico de Avaliação e todo o seu conteúdo?',
                    'removerTopico',
                    null
                  )}
                  title="Remover avaliação"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </>
            ) : (
              <button 
                className="btn-add-topico" 
                onClick={criarTopicoAvaliacao}
              >
                Criar Avaliação
              </button>
            )}
          </div>
        )}
      </div>
      <hr />

      {/* Conteúdo do tópico de avaliação */}
      {topicoAvaliacao && (
        <div className="pastas-list">
          {topicoAvaliacao.pastas && topicoAvaliacao.pastas.length > 0 ? (
            topicoAvaliacao.pastas.map((pasta) => (
              <div key={pasta.id_pasta} className="pasta-item">
                <div className="pasta-header">
                  <button 
                    className="btn-toggle" 
                    onClick={() => toggleExpandPasta(pasta.id_pasta)}
                  >
                    {expandedPastas.includes(pasta.id_pasta) ? (
                      <i className="fas fa-chevron-down"></i>
                    ) : (
                      <i className="fas fa-chevron-right"></i>
                    )}
                  </button>
                  <i className="fas fa-folder"></i>
                  <span className="pasta-nome">{pasta.nome}</span>
                  
                  {isFormador() ? (
                    <div className="pasta-actions">
                      <button 
                        className="btn-add" 
                        onClick={() => abrirModalAdicionarConteudo(pasta)}
                        title="Adicionar conteúdo"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => mostrarModalConfirmacao(
                          'Tem certeza que deseja remover esta pasta e todo o seu conteúdo?',
                          'removerPasta',
                          pasta.id_pasta
                        )}
                        title="Remover pasta"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="pasta-actions">
                      <button 
                        className="btn-submeter"
                        onClick={() => abrirModalEnviarSubmissao(pasta.id_pasta)}
                        title="Submeter trabalho"
                      >
                        <i className="fas fa-upload"></i> Submeter
                      </button>
                    </div>
                  )}
                </div>

                {expandedPastas.includes(pasta.id_pasta) && (
                  <div className="pasta-expanded-content">
                    {/* Conteúdos adicionados pelo formador */}
                    <div className="conteudos-list">
                      <h4 className="secao-titulo">Conteúdos</h4>
                      {pasta.conteudos && pasta.conteudos.length > 0 ? (
                        pasta.conteudos.map((conteudo) => (
                          <div key={conteudo.id_conteudo} className="conteudo-item">
                            <i className={`fas fa-${conteudo.tipo === 'file' ? 'file-alt' : 
                                            conteudo.tipo === 'link' ? 'link' : 
                                            conteudo.tipo === 'video' ? 'video' : 'file'}`}></i>
                            <span 
                              className="conteudo-titulo"
                              onClick={() => {
                                if (conteudo.tipo === 'file') {
                                  abrirModalFicheiro(conteudo);
                                } else if (conteudo.tipo === 'link' || conteudo.tipo === 'video') {
                                  if (conteudo.url) {
                                    window.open(conteudo.url, '_blank', 'noopener,noreferrer');
                                  }
                                }
                              }}
                            >
                              {conteudo.titulo}
                            </span>
                            
                            {isFormador() && (
                              <div className="conteudo-actions">
                                <button 
                                  className="btn-delete"
                                  onClick={() => mostrarModalConfirmacao(
                                    'Tem certeza que deseja remover este conteúdo?',
                                    'removerConteudo',
                                    conteudo.id_conteudo
                                  )}
                                  title="Remover conteúdo"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="secao-vazia">Nenhum conteúdo disponível</div>
                      )}
                    </div>
                    
                    {/* Submissões dos formandos */}
                    {isFormador() && (
                      <div className="submissoes-list">
                        <h4 className="secao-titulo">Submissões dos Formandos</h4>
                        {submissoes[pasta.id_pasta] && submissoes[pasta.id_pasta].length > 0 ? (
                          submissoes[pasta.id_pasta].map((submissao, index) => (
                            <div key={submissao.id || index} className="submissao-item">
                              <i className="fas fa-file-upload"></i>
                              <span className="submissao-info">
                                <strong>{submissao.nome_formando || "Formando"}</strong> - {submissao.data_submissao || "Data não disponível"}
                              </span>
                              <button 
                                className="btn-download"
                                onClick={() => {
                                  if (submissao.ficheiro_path) {
                                    window.open(`${API_BASE}/${submissao.ficheiro_path}`, '_blank');
                                  } else {
                                    alert('Caminho do ficheiro não disponível');
                                  }
                                }}
                                title="Descarregar submissão"
                              >
                                <i className="fas fa-download"></i>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="secao-vazia">Nenhuma submissão recebida</div>
                        )}
                      </div>
                    )}
                    
                    {/* Para formandos, mostrar suas próprias submissões */}
                    {!isFormador() && (
                      <div className="minhas-submissoes">
                        <h4 className="secao-titulo">Minhas Submissões</h4>
                        {submissoes[pasta.id_pasta] && submissoes[pasta.id_pasta].length > 0 ? (
                          submissoes[pasta.id_pasta].map((submissao, index) => (
                            <div key={submissao.id || index} className="submissao-item">
                              <i className="fas fa-file-upload"></i>
                              <span className="submissao-info">
                                {submissao.nome_ficheiro || submissao.nome_arquivo || "Ficheiro"} - {submissao.data_submissao || "Data não disponível"}
                              </span>
                              {submissao.ficheiro_path && (
                                <button 
                                  className="btn-download"
                                  onClick={() => window.open(`${API_BASE}/${submissao.ficheiro_path}`, '_blank')}
                                  title="Descarregar submissão"
                                >
                                  <i className="fas fa-download"></i>
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="secao-vazia">Nenhuma submissão enviada</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="topico-empty">
              <p>Sem pastas no tópico de avaliação</p>
              {isFormador() && (
                <button onClick={abrirModalCriarPasta} className="btn-add-pasta">
                  <i className="fas fa-folder-plus"></i> Adicionar pasta
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal para criar pastas */}
      {showCriarPastaModal && topicoAvaliacao && (
        <CriarPastaModal
          topico={topicoAvaliacao}
          onClose={() => setShowCriarPastaModal(false)}
          onSuccess={() => {
            setShowCriarPastaModal(false);
            carregarTopicos();
          }}
        />
      )}

      {/* Modal para adicionar conteúdos */}
      {showCriarConteudoModal && pastaSelecionada && (
        <CriarConteudoModal
          pasta={pastaSelecionada}
          onClose={() => setShowCriarConteudoModal(false)}
          onSuccess={() => {
            setShowCriarConteudoModal(false);
            carregarTopicos();
          }}
        />
      )}

      {/* Modal para visualizar conteúdo */}
      {selectedConteudo && (
        <Curso_Conteudo_ficheiro_Modal
          conteudo={selectedConteudo}
          onClose={() => setSelectedConteudo(null)}
          API_BASE={API_BASE}
        />
      )}

      {/* Modal de confirmação para ações */}
      <ConfirmModal
        show={confirmModal.show}
        title="Confirmação"
        message={confirmModal.message}
        onCancel={() => setConfirmModal({ show: false, message: '', action: null, targetId: null })}
        onConfirm={executarAcaoConfirmada}
      />

      {/* Modal para enviar submissão */}
      {enviarSubmissaoModal.show && (
        <div className="modal-overlay">
          <div className="modal-submissao">
            <h3>Enviar Submissão</h3>
            <form onSubmit={enviarSubmissao}>
              <div className="form-group">
                <label htmlFor="arquivo-submissao">Selecione o ficheiro:</label>
                <input
                  type="file"
                  id="arquivo-submissao"
                  onChange={handleArquivoChange}
                  required
                />
                {arquivo && (
                  <p className="arquivo-info">Ficheiro selecionado: {arquivo.name}</p>
                )}
              </div>
              <div className="submissao-actions">
                <button 
                  type="button" 
                  className="btn-cancelar"
                  onClick={() => setEnviarSubmissaoModal({ show: false, pastaId: null })}
                  disabled={enviandoArquivo}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-enviar"
                  disabled={enviandoArquivo || !arquivo}
                >
                  {enviandoArquivo ? 'A enviar...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Avaliacao_curso;