import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import CriarPastaModal from './Criar_Pasta_Modal';
import CriarConteudoModal from './Criar_Conteudo_Modal';
import Curso_Conteudo_ficheiro_Modal from './Curso_Conteudo_Ficheiro_Modal';
import './css/Curso_Conteudos.css';
import './css/Avaliacao_Curso.css';


const decodeJWT = (token) => {
  try {
    // Divide o token nas suas partes (cabeçalho, payload, assinatura)
    const parts = token.split('.');
    
    // Se não tiver 3 partes, não é um JWT válido
    if (parts.length !== 3) {
      console.error('Token JWT inválido: formato incorreto');
      return null;
    }
    
    // A função atob() espera uma string em Base64 sem padding
    // Ajustar o padding da string Base64 para garantir decodificação correta
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    // Decodificar a string Base64
    try {
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Erro ao decodificar payload JWT:', e);
      return null;
    }
  } catch (error) {
    console.error('Erro ao processar token JWT:', error);
    return null;
  }
};
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
    // Usar a função segura para decodificar o token
    const payload = decodeJWT(token);
    
    if (!payload) return false;
    
    // Verificar o id_utilizador ou cargo
    return payload.id_utilizador === formadorId || 
           payload.id_cargo === 1 || 
           payload.id_cargo === 2;
  } catch (e) {
    console.error('Erro ao verificar permissões:', e);
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
    formData.append('ficheiro', arquivo);
    formData.append('id_pasta', enviarSubmissaoModal.pastaId);
    formData.append('id_curso', cursoId);
    
    const response = await axios.post(`${API_BASE}/trabalhos`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Fechar modal
    setEnviarSubmissaoModal({ show: false, pastaId: null });
    
    // Importante: recarregar submissões APÓS o envio bem-sucedido
    await recarregarSubmissoes();
    
    alert('Trabalho submetido com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar trabalho:', error);
    
    let errorMsg = 'Erro ao submeter o trabalho. Por favor, tente novamente.';
    
    if (error.response) {
      if (error.response.data?.message) {
        errorMsg = error.response.data.message;
      }
    }
    
    alert(errorMsg);
  } finally {
    setEnviandoArquivo(false);
  }
};


const recarregarSubmissoes = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Usar apenas o endpoint principal de trabalhos
    const response = await axios.get(`${API_BASE}/trabalhos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log("Trabalhos carregados:", response.data);
      
      // Filtrar e organizar os trabalhos por pasta
      const submissoesAtualizadas = {};
      
      // Inicializar entradas vazias para todas as pastas existentes
      if (topicoAvaliacao && topicoAvaliacao.pastas) {
        topicoAvaliacao.pastas.forEach(pasta => {
          submissoesAtualizadas[pasta.id_pasta] = [];
        });
      }
      
      // Preencher com os trabalhos correspondentes
      response.data.forEach(trabalho => {
        // Verificar se o trabalho pertence ao curso atual
        if (trabalho.id_curso == cursoId) {
          // Se a pasta existe no objeto, adicionar o trabalho
          if (submissoesAtualizadas.hasOwnProperty(trabalho.id_pasta)) {
            submissoesAtualizadas[trabalho.id_pasta].push(trabalho);
          }
        }
      });
      
      console.log("Submissões organizadas:", submissoesAtualizadas);
      setSubmissoes(submissoesAtualizadas);
    }
  } catch (error) {
    console.error('Erro ao recarregar submissões:', error);
  }
};

const recarregarSubmissoesDaPasta = async (pastaId) => {
  if (!pastaId) return;
  
  try {
    const token = localStorage.getItem('token');
    let submissoesAtualizadas = { ...submissoes };
    
    // Tentar primeiro endpoint
    try {
      const response = await axios.get(`${API_BASE}/trabalhos`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id_curso: cursoId }
      });
      
      if (response.status === 200 && response.data) {
        // Filtrar apenas os trabalhos desta pasta
        const trabalhosDaPasta = response.data.filter(
          trabalho => trabalho.id_pasta === pastaId
        );
        
        submissoesAtualizadas[pastaId] = trabalhosDaPasta;
        console.log(`Submissões recarregadas para pasta ${pastaId}:`, trabalhosDaPasta);
      }
    } catch (err) {
      console.log(`Erro ao obter trabalhos para pasta ${pastaId}:`, err.message);
    }
    
    // Atualizar estado
    setSubmissoes(submissoesAtualizadas);
  } catch (error) {
    console.error('Erro ao recarregar submissões:', error);
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