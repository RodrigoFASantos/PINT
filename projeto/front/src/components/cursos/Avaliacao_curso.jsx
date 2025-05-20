import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import CriarPastaModal from './Criar_Pasta_Modal';
import CriarConteudoModal from './Criar_Conteudo_Modal';
import Curso_Conteudo_ficheiro_Modal from './Curso_Conteudo_Ficheiro_Modal';
import DetalhesSubmissao from './Detalhes_Submissao';
import { Link } from 'react-router-dom';
import './css/Curso_Conteudos.css';
import './css/Avaliacao_Curso.css';

const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token JWT inválido: formato incorreto');
      return null;
    }
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
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
  const [submissaoSelecionada, setSubmissaoSelecionada] = useState(null);

  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);


  // Verifica se o utilizador é formador
  const isFormador = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = decodeJWT(token);

      if (!payload) return false;

      return payload.id_utilizador === formadorId ||
        payload.id_cargo === 1 ||
        payload.id_cargo === 2;
    } catch (e) {
      console.error('Erro ao verificar permissões:', e);
      return false;
    }
  };


  // Função para verificar se uma submissão está atrasada
  const isSubmissaoAtrasada = (submissao, pasta) => {
    if (!pasta.data_limite || !submissao.data_entrega) return false;

    const dataLimite = new Date(pasta.data_limite);
    const dataSubmissao = new Date(submissao.data_entrega);

    return dataSubmissao > dataLimite;
  };

  // Função para formatar data para exibição
  const formatarData = (dataString) => {
    if (!dataString) return "Sem data";

    const data = new Date(dataString);
    return data.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para verificar se uma data limite já expirou
  const isDataLimiteExpirada = (dataLimite) => {
    if (!dataLimite) return false;

    const agora = new Date();
    const limite = new Date(dataLimite);

    return agora > limite;
  };

  // Função para carregar submissões iniciais de todas as pastas
  const carregarSubmissoes = async (topico) => {
    try {
      if (topico && topico.pastas) {
        // Inicializar o estado de submissões com arrays vazios para cada pasta
        const submissoesData = {};
        for (const pasta of topico.pastas) {
          submissoesData[pasta.id_pasta] = [];
        }

        // Definir o estado inicial
        setSubmissoes(submissoesData);

        // Carregar dados para as pastas já expandidas
        for (const pasta of topico.pastas) {
          if (expandedPastas.includes(pasta.id_pasta)) {
            await carregarSubmissoesDaPasta(pasta.id_pasta);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar submissões iniciais:', error);
    }
  };

  // Função para recarregar todas as submissões após envio
  const recarregarSubmissoes = async () => {
    try {
      if (topicoAvaliacao && topicoAvaliacao.pastas) {
        for (const pasta of topicoAvaliacao.pastas) {
          await carregarSubmissoesDaPasta(pasta.id_pasta);
        }
      }
    } catch (error) {
      console.error('Erro ao recarregar todas as submissões:', error);
    }
  };

  // Função otimizada para carregar submissões de uma pasta específica
  const carregarSubmissoesDaPasta = async (pastaId) => {
    if (!pastaId) return;

    try {
      const token = localStorage.getItem('token');
      let submissoesAtualizadas = { ...submissoes };
      const isFormadorUser = isFormador(); // Verificar se é formador

      // Obter informações da pasta
      const pasta = topicoAvaliacao.pastas.find(p => p.id_pasta === pastaId);
      if (!pasta) {
        console.error(`Pasta com ID ${pastaId} não encontrada`);
        return;
      }

      // Obter dados do user do token
      const dadosUsuario = decodeJWT(token);
      if (!dadosUsuario || !dadosUsuario.id_utilizador) {
        console.error('Não foi possível obter dados do user do token');
        return;
      }

      const idUsuario = dadosUsuario.id_utilizador;

      try {
        // Construir parâmetros baseados no cargo do user
        const params = {
          id_curso: cursoId,
          id_pasta: pastaId
        };

        // Adicionar filtro de user apenas se for formando
        if (!isFormadorUser) {
          params.id_utilizador = idUsuario;
        }

        console.log(`Obter submissões com parâmetros:`, params);

        // Chamada única à API
        const response = await axios.get(`${API_BASE}/avaliacoes/submissoes`, {
          params: params,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          console.log(`Sucesso! Encontradas ${response.data.length} submissões.`);
          submissoesAtualizadas[pastaId] = response.data;
          setSubmissoes(submissoesAtualizadas);
          return;
        }
      } catch (err) {
        console.error(`Erro ao buscar submissões:`, err);
      }

      // Caso falhe, inicializar com array vazio
      console.log("Falha ao carregar submissões. Inicializando array vazio.");
      submissoesAtualizadas[pastaId] = [];
      setSubmissoes(submissoesAtualizadas);

    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
      let submissoesAtualizadas = { ...submissoes };
      submissoesAtualizadas[pastaId] = [];
      setSubmissoes(submissoesAtualizadas);
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

  // Carregar dados iniciais
  useEffect(() => {
    if (cursoId) {
      carregarTopicos();
    }
  }, [cursoId]);

  // Expandir/colapsar pasta
  const toggleExpandPasta = (idPasta) => {
    const expandindo = !expandedPastas.includes(idPasta);

    setExpandedPastas((prev) =>
      prev.includes(idPasta) ? prev.filter((id) => id !== idPasta) : [...prev, idPasta]
    );

    // Se está expandindo a pasta, carregue as submissões
    if (expandindo) {
      carregarSubmissoesDaPasta(idPasta);
    }
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

  // Enviar submissão do formando
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
      formData.append('id_curso', parseInt(cursoId));

      const response = await axios.post(`${API_BASE}/avaliacoes/submissoes`, formData, {
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


  // Abrir os detalhes da submissão
  const verSubmissaoDetalhes = (submissao) => {
    setSubmissaoSelecionada(submissao);
    setMostrarDetalhes(true);
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
                {/* Criar pastas */}
                <button
                  className="btn-add"
                  onClick={abrirModalCriarPasta}
                  title="Adicionar pasta"
                >
                  <i className="fas fa-folder-plus"></i>
                </button>

                {/* Ver submissões */}
                <Link
                  to={`/curso/${cursoId}/avaliacao/${topicoAvaliacao.id_topico}/submissoes`}
                  className="btn-ver-submissoes-pasta"
                  title="Ver submissões"
                >
                  <i className="fas fa-list"></i> Ver submissões
                </Link>

                {/* Remover avaliação */}
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

                  {/* Exibir data limite junto ao nome da pasta */}
                  {pasta.data_limite && (
                    <div className={`data-limite ${isDataLimiteExpirada(pasta.data_limite) ? 'data-limite-expirada' : ''}`}>
                      <i className="fas fa-clock"></i>
                      Prazo: {formatarData(pasta.data_limite)}
                      {isDataLimiteExpirada(pasta.data_limite) && " (Expirado)"}
                    </div>
                  )}

                  {isFormador() ? (
                    <div className="pasta-actions">
                      <button
                        className="btn-add-conteudo"
                        onClick={() => abrirModalAdicionarConteudo(pasta)}
                        title="Adicionar conteúdo"
                      >
                        <i className="fas fa-file-medical"></i>
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
                        disabled={isDataLimiteExpirada(pasta.data_limite)}
                      >
                        <i className="fas fa-upload"></i> Submeter
                      </button>
                    </div>
                  )}
                </div>

                {expandedPastas.includes(pasta.id_pasta) && (
                  <div className="pasta-expanded-content">
                    {/* Conteúdos */}
                    <div className="conteudos-list">
                      <h4 className="secao-titulo">Conteúdos</h4>
                      {pasta.conteudos && pasta.conteudos.length > 0 ? (
                        pasta.conteudos.map((conteudo) => {
                          return (
                            <div key={conteudo.id_conteudo} className="conteudo-item">
                              <i className={`fas ${conteudo.tipo === 'video' ? 'fa-video' : 'fa-file'}`}></i>
                              <span className="conteudo-nome" onClick={() => abrirModalFicheiro(conteudo)}>
                                {conteudo.titulo || conteudo.arquivo_path?.split('/').pop() || "Ficheiro sem nome"}
                              </span>

                              {isFormador() && (
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
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="secao-vazia">Sem conteúdos disponíveis</div>
                      )}
                    </div>

                    {/* Submissões dos formandos */}
                    {isFormador() && (
                      <div className="submissoes-list">
                        <h4 className="secao-titulo">Submissões dos Formandos</h4>
                        {submissoes[pasta.id_pasta] && submissoes[pasta.id_pasta].length > 0 ? (
                          submissoes[pasta.id_pasta].map((submissao, index) => {
                            const atrasada = isSubmissaoAtrasada(submissao, pasta);
                            return (
                              <div
                                key={submissao.id || index}
                                className={`submissao-item ${atrasada ? 'submissao-atrasada' : ''}`}
                              >
                                <i className="fas fa-file-upload"></i>
                                <span className="submissao-info">
                                  <strong>{submissao.nome_formando || submissao.utilizador?.nome || "Formando"}</strong> - {
                                    formatarData(submissao.data_submissao || submissao.data_entrega)
                                  }
                                  {atrasada && (
                                    <span className="submissao-atrasada-badge">Atrasada</span>
                                  )}
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
                            );
                          })
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
                          // Se existem submissões
                          submissoes[pasta.id_pasta].map((submissao, index) => {
                            const atrasada = isSubmissaoAtrasada(submissao, pasta);
                            return (
                              <div key={submissao.id || index}>
                                {(submissaoSelecionada && submissaoSelecionada.id === submissao.id && mostrarDetalhes) ? (
                                  // Mostrar detalhes completos quando selecionado
                                  <div className="detalhes-wrapper">
                                    <DetalhesSubmissao
                                      submissao={submissao}
                                      cursoId={cursoId}
                                      pastaId={pasta.id_pasta}
                                      atrasada={atrasada}
                                    />
                                    <button
                                      className="btn-fechar-detalhes"
                                      onClick={() => setMostrarDetalhes(false)}
                                    >
                                      <i className="fas fa-times"></i> Fechar
                                    </button>
                                  </div>
                                ) : (
                                  // Mostrar versão resumida com opção para expandir
                                  <div className={`submissao-item ${atrasada ? 'submissao-atrasada' : ''}`}>
                                    <i className="fas fa-file-upload"></i>
                                    <span className="submissao-info">
                                      {submissao.nome_ficheiro || submissao.ficheiro_path.split('/').pop() || "Ficheiro"} - {
                                        formatarData(submissao.data_submissao || submissao.data_entrega)
                                      }
                                      {atrasada && (
                                        <span className="submissao-atrasada-badge">Atrasada</span>
                                      )}
                                    </span>
                                    <div className="submissao-acoes">
                                      {submissao.ficheiro_path && (
                                        <button
                                          className="btn-download"
                                          onClick={() => window.open(`${API_BASE}/${submissao.ficheiro_path}`, '_blank')}
                                          title="Descarregar submissão"
                                        >
                                          <i className="fas fa-download"></i>
                                        </button>
                                      )}
                                      <button
                                        className="btn-detalhes"
                                        onClick={() => verSubmissaoDetalhes(submissao)}
                                        title="Ver detalhes"
                                      >
                                        <i className="fas fa-info-circle"></i>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
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

      {/* Modal para adicionar conteúdos - MANTIDO apenas para a possibilidade de ser aberto */}
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

            {/* Verificar se a pasta selecionada possui data limite expirada */}
            {enviarSubmissaoModal.pastaId &&
              topicoAvaliacao &&
              topicoAvaliacao.pastas &&
              topicoAvaliacao.pastas.find(p => p.id_pasta === enviarSubmissaoModal.pastaId)?.data_limite &&
              isDataLimiteExpirada(topicoAvaliacao.pastas.find(p => p.id_pasta === enviarSubmissaoModal.pastaId).data_limite) && (
                <div className="aviso-atrasado">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Atenção: O prazo de entrega já expirou. Esta submissão será marcada como atrasada.</span>
                </div>
              )}

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