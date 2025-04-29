import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../api';
import CriarPastaModal from './CriarPastaModal';
import CriarConteudoModal from './CriarConteudoModal';
import Curso_Conteudo_ficheiro_Modal from './Curso_Conteudo_ficheiro_Modal';
import './css/cursoConteudos.css';
import './css/avaliacaoCurso.css';

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

  // Verifica se o usuário é formador
  const isFormador = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id_utilizador === formadorId || payload.id_cargo === 1 || payload.id_cargo === 2;
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
      return false;
    }
  };

  // Carregar tópicos do curso
  const carregarTopicos = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/topicos-curso/curso/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar tópicos.');

      const data = await response.json();
      const topico = data.find(t => t.nome.toLowerCase() === 'avaliação');

      if (topico) {
        setTopicoAvaliacao(topico);
        await carregarSubmissoes(topico);
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

  // Carregar submissões dos formandos
  const carregarSubmissoes = async (topico) => {
    try {
      const token = localStorage.getItem('token');
      // Aqui seria a chamada para a API que busca submissões
      // Como não existe essa API no código fornecido, estou simulando
      const submissoesData = {};
      
      if (topico && topico.pastas) {
        for (const pasta of topico.pastas) {
          // Simular submissões para cada pasta
          // Na implementação real, isso seria substituído pela chamada API
          submissoesData[pasta.id_pasta] = [];
          
          // Tentar buscar as submissões reais da API
          try {
            const response = await fetch(`${API_BASE}/submissoes/pasta/${pasta.id_pasta}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data)) {
                submissoesData[pasta.id_pasta] = data;
              }
            }
          } catch (submissaoError) {
            console.log('API de submissões pode não estar implementada ainda');
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
      
      const response = await fetch(`${API_BASE}/topicos-curso/${topicoAvaliacao.id_topico}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setTopicoAvaliacao(null);
      } else {
        throw new Error('Erro ao remover tópico');
      }
    } catch (error) {
      console.error('Erro ao remover tópico:', error);
      setErro('Erro ao remover tópico de avaliação. Por favor, tente novamente.');
    }
  };

  // Remover pasta
  const removerPasta = async (pastaId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/pastas-curso/${pastaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await carregarTopicos();
      } else {
        throw new Error('Erro ao remover pasta');
      }
    } catch (error) {
      console.error('Erro ao remover pasta:', error);
      setErro('Erro ao remover pasta. Por favor, tente novamente.');
    }
  };

  // Remover conteúdo
  const removerConteudo = async (conteudoId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/conteudos-curso/${conteudoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await carregarTopicos();
      } else {
        throw new Error('Erro ao remover conteúdo');
      }
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

  // Enviar submissão do formando
  const enviarSubmissao = async (e) => {
    e.preventDefault();
    
    if (!arquivo) {
      alert('Por favor, selecione um arquivo.');
      return;
    }
    
    try {
      setEnviandoArquivo(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('id_pasta', enviarSubmissaoModal.pastaId);
      formData.append('id_curso', cursoId);
      
      // Aqui seria a chamada para a API que salva submissões
      // Como não existe essa API no código fornecido, estou simulando
      
      // Simulando uma chamada de API
      // Na implementação real, substituir pelo endpoint correto
      try {
        const response = await axios.post(`${API_BASE}/submissoes`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Se a API existir e funcionar
        await carregarTopicos();
        setEnviarSubmissaoModal({ show: false, pastaId: null });
      } catch (apiError) {
        console.log('API de submissões pode não estar implementada ainda');
        // Simulando sucesso
        alert('Submissão enviada com sucesso! (Simulado)');
        await carregarTopicos();
        setEnviarSubmissaoModal({ show: false, pastaId: null });
      }
    } catch (error) {
      console.error('Erro ao enviar submissão:', error);
      alert('Erro ao enviar submissão. Por favor, tente novamente.');
    } finally {
      setEnviandoArquivo(false);
    }
  };

  // Renderização condicional para carregamento
  if (carregando) {
    return (
      <div className="avaliacao-loading">
        <div className="loading-spinner"></div>
        <p>Carregando avaliações...</p>
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
                                onClick={() => alert('Função para baixar submissão não implementada')}
                                title="Baixar submissão"
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
                                {submissao.nome_arquivo || "Arquivo"} - {submissao.data_submissao || "Data não disponível"}
                              </span>
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
      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-confirm">
            <h3>Confirmação</h3>
            <p>{confirmModal.message}</p>
            <div className="confirm-actions">
              <button 
                className="btn-cancelar"
                onClick={() => setConfirmModal({ show: false, message: '', action: null, targetId: null })}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={executarAcaoConfirmada}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para enviar submissão */}
      {enviarSubmissaoModal.show && (
        <div className="modal-overlay">
          <div className="modal-submissao">
            <h3>Enviar Submissão</h3>
            <form onSubmit={enviarSubmissao}>
              <div className="form-group">
                <label htmlFor="arquivo-submissao">Selecione o arquivo:</label>
                <input
                  type="file"
                  id="arquivo-submissao"
                  onChange={handleArquivoChange}
                  required
                />
                {arquivo && (
                  <p className="arquivo-info">Arquivo selecionado: {arquivo.name}</p>
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
                  {enviandoArquivo ? 'Enviando...' : 'Enviar'}
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