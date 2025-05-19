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

  // Função única de normalização - mesma que no backend
  const normalizarNomeFrontend = (nome) => {
    if (!nome) return '';

    // Converter para minúsculas
    let normalizado = nome.toLowerCase();

    // Remover acentos
    normalizado = normalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Substituir espaços por hífens
    normalizado = normalizado.replace(/\s+/g, '-');

    // Remover caracteres especiais
    normalizado = normalizado.replace(/[^a-z0-9-_]/g, '');

    return normalizado;
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
    
    // Obter informações da pasta (nome)
    const pasta = topicoAvaliacao.pastas.find(p => p.id_pasta === pastaId);
    if (!pasta) {
      console.error(`Pasta com ID ${pastaId} não encontrada`);
      return;
    }
    
    // MÉTODO 1 (CORRIGIDO): Usar o endpoint de submissões por ID de pasta
    try {
      console.log(`Tentando endpoint /avaliacoes/submissoes-pasta com id_pasta=${pastaId}`);
      const response = await axios.get(`${API_BASE}/avaliacoes/submissoes-pasta`, {
        params: { id_pasta: pastaId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        submissoesAtualizadas[pastaId] = response.data;
        setSubmissoes(submissoesAtualizadas);
        console.log(`Sucesso! Encontradas ${response.data.length} submissões.`);
        return;
      }
    } catch (err) {
      console.log(`Método 1 falhou: ${err.message}`);
    }
    
    // MÉTODO 2 (SIMPLIFICADO): Buscar trabalhos pelo curso e pasta
    try {
      console.log(`Tentando buscar trabalhos pelo curso ${cursoId} e pasta ${pastaId}`);
      const response = await axios.get(`${API_BASE}/avaliacoes/submissoes`, {
        params: { 
          id_curso: cursoId,
          id_pasta: pastaId 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        submissoesAtualizadas[pastaId] = response.data;
        setSubmissoes(submissoesAtualizadas);
        console.log(`Método 2 sucesso! Encontradas ${response.data.length} submissões.`);
        return;
      }
    } catch (err) {
      console.log(`Método 2 falhou: ${err.message}`);
    }
    
    // MÉTODO 3: Buscar pelo usuário atual
    try {
      const dadosUsuario = decodeJWT(token);
      if (!dadosUsuario || !dadosUsuario.id_utilizador) {
        throw new Error('Não foi possível obter dados do usuário do token');
      }
      
      const idUsuario = dadosUsuario.id_utilizador;
      
      console.log(`Buscando submissões do usuário ${idUsuario} na pasta ${pastaId}`);
      const response = await axios.get(`${API_BASE}/avaliacoes/submissoes`, {
        params: { 
          id_curso: cursoId,
          id_utilizador: idUsuario,
          id_pasta: pastaId
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        submissoesAtualizadas[pastaId] = response.data;
        setSubmissoes(submissoesAtualizadas);
        console.log(`Método 3 sucesso! Encontradas ${response.data.length} submissões do usuário.`);
        return;
      }
    } catch (err) {
      console.log(`Método 3 falhou: ${err.message}`);
    }
    
    // Se todas as tentativas falharem, inicializar com array vazio
    console.log("Todos os métodos falharam. Inicializando array vazio.");
    submissoesAtualizadas[pastaId] = [];
    setSubmissoes(submissoesAtualizadas);
    
  } catch (error) {
    console.error('Erro ao carregar submissões:', error);
    // Inicializar com array vazio em caso de erro
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
                {/* botão para criar pastas */}
                <button
                  className="btn-add"
                  onClick={abrirModalCriarPasta}
                  title="Adicionar pasta"
                >
                  <i className="fas fa-folder-plus"></i>
                </button>

                {/* NOVO: botão Ver submissões */}
                <Link
                  to={`/curso/${cursoId}/avaliacao/${topicoAvaliacao.id_topico}/submissoes`}
                  className="btn-ver-submissoes"
                  title="Ver submissões"
                >
                  <i className="fas fa-list"></i> Ver submissões
                </Link>

                {/* botão para remover avaliação */}
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
                                <strong>{submissao.nome_formando || submissao.utilizador?.nome || "Formando"}</strong> - {
                                  new Date(submissao.data_submissao || submissao.data_entrega).toLocaleDateString('pt-PT')
                                }
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
                          // Se existem submissões
                          submissoes[pasta.id_pasta].map((submissao, index) => (
                            <div key={submissao.id || index}>
                              {submissaoSelecionada && submissaoSelecionada.id === submissao.id ? (
                                // Mostrar detalhes completos quando selecionado
                                <DetalhesSubmissao
                                  submissao={submissao}
                                  cursoId={cursoId}
                                  pastaId={pasta.id_pasta}
                                />
                              ) : (
                                // Mostrar versão resumida com opção para expandir
                                <div className="submissao-item">
                                  <i className="fas fa-file-upload"></i>
                                  <span className="submissao-info">
                                    {submissao.nome_ficheiro || submissao.ficheiro_path.split('/').pop() || "Ficheiro"} - {
                                      new Date(submissao.data_submissao || submissao.data_entrega).toLocaleDateString('pt-PT')
                                    }
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
                                      onClick={() => setSubmissaoSelecionada(submissao)}
                                      title="Ver detalhes"
                                    >
                                      <i className="fas fa-info-circle"></i>
                                    </button>
                                  </div>
                                </div>
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