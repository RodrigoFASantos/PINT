import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import CriarPastaModal from './Criar_Pasta_Modal';
import CriarConteudoModal from './Criar_Conteudo_Modal';
import Curso_Conteudo_ficheiro_Modal from './Curso_Conteudo_Ficheiro_Modal';
import QuizzesAvaliacao from './QuizzesAvaliacao';
import { Link } from 'react-router-dom';
import './css/Curso_Conteudos.css';
import './css/Avaliacao_Curso.css';

/**
 * Descodifica tokens JWT para extrair informações do utilizador
 * Valida a estrutura do token e retorna os dados do payload
 * 
 * @param {string} token - Token JWT a descodificar
 * @returns {Object|null} - Dados do payload ou null se inválido
 */
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    try {
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Modal reutilizável para confirmar ações destrutivas
 * Usado para eliminar pastas, conteúdos, tópicos e submissões
 */
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

/**
 * Componente principal para gestão de avaliações de curso
 * 
 * Funcionalidades por tipo de utilizador:
 * - Formador do curso: Criar/gerir pastas, ver todas as submissões, adicionar materiais
 * - Formandos: Submeter/remover trabalhos, ver as suas submissões, aceder a materiais
 * 
 * Suporta dois tipos de curso:
 * - Síncronos: Sistema tradicional de submissão de ficheiros
 * - Assíncronos: Sistema de quizzes interativos
 * 
 * Regras de segurança:
 * - Apenas o formador específico do curso pode gerir conteúdos
 * - Formandos só podem remover as suas próprias submissões até ao prazo
 * - Gestores/admins não podem interferir em cursos de outros formadores
 * - Controlo rigoroso de prazos de submissão
 * 
 * @param {number} cursoId - ID único do curso
 * @param {number} userRole - Papel do utilizador (1=admin, 2=formador, 3=formando)
 * @param {number} formadorId - ID do formador responsável pelo curso
 * @param {string} tipoCurso - Tipo do curso ('sincrono' ou 'assincrono')
 */
const Avaliacao_curso = ({ cursoId, userRole, formadorId, tipoCurso }) => {
  // Estado principal para dados do tópico de avaliação
  const [topicoAvaliacao, setTopicoAvaliacao] = useState(null);
  
  // Estados da interface
  const [expandedPastas, setExpandedPastas] = useState([]);
  const [selectedConteudo, setSelectedConteudo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Estados para modais de gestão (formador apenas)
  const [showCriarConteudoModal, setShowCriarConteudoModal] = useState(false);
  const [showCriarPastaModal, setShowCriarPastaModal] = useState(false);
  const [pastaSelecionada, setPastaSelecionada] = useState(null);
  
  // Estados para confirmação de ações perigosas
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    action: null,
    targetId: null
  });
  
  // Estados para submissão de trabalhos
  const [enviarSubmissaoModal, setEnviarSubmissaoModal] = useState({
    show: false,
    pastaId: null
  });
  const [submissoes, setSubmissoes] = useState({});
  const [arquivo, setArquivo] = useState(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  /**
   * Verifica se o utilizador atual é o formador específico deste curso
   * Esta é a verificação de segurança fundamental do sistema
   * Apenas o formador do curso pode gerir os conteúdos - nem admins podem
   * 
   * @returns {boolean} - True se é o formador deste curso específico
   */
  const isFormadorDoCurso = () => {
    const token = localStorage.getItem('token');
    if (!token || !formadorId) return false;

    try {
      const payload = decodeJWT(token);
      if (!payload) return false;

      return payload.id_utilizador === formadorId;
    } catch (e) {
      return false;
    }
  };

  /**
   * Verifica se o curso é do tipo assíncrono
   * Cursos assíncronos usam quizzes em vez de submissões tradicionais
   * 
   * @returns {boolean} - True se o curso é assíncrono
   */
  const isCursoAssincrono = () => {
    return tipoCurso === 'assincrono';
  };

  /**
   * Verifica se uma submissão foi entregue após o prazo
   * Compara a data de entrega com a data limite da pasta
   * 
   * @param {Object} submissao - Dados da submissão
   * @param {Object} pasta - Dados da pasta com data limite
   * @returns {boolean} - True se a submissão está atrasada
   */
  const isSubmissaoAtrasada = (submissao, pasta) => {
    if (!pasta.data_limite || !submissao.data_entrega) return false;

    const dataLimite = new Date(pasta.data_limite);
    const dataSubmissao = new Date(submissao.data_entrega);

    return dataSubmissao > dataLimite;
  };

  /**
   * Formata datas para apresentação amigável
   * Usa formato português com dia/mês/ano e hora:minuto
   * 
   * @param {string} dataString - Data em formato ISO
   * @returns {string} - Data formatada para exibição
   */
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

  /**
   * Verifica se o prazo de uma pasta já passou
   * Compara a data limite com a data/hora atual
   * 
   * @param {string} dataLimite - Data limite em formato ISO
   * @returns {boolean} - True se o prazo já expirou
   */
  const isDataLimiteExpirada = (dataLimite) => {
    if (!dataLimite) return false;

    const agora = new Date();
    const limite = new Date(dataLimite);

    return agora > limite;
  };

  /**
   * Inicializa o sistema de submissões para todas as pastas
   * Cria estruturas vazias e carrega dados das pastas já expandidas
   * 
   * @param {Object} topico - Dados do tópico de avaliação
   */
  const carregarSubmissoes = async (topico) => {
    try {
      if (topico && topico.pastas) {
        const submissoesData = {};
        for (const pasta of topico.pastas) {
          submissoesData[pasta.id_pasta] = [];
        }

        setSubmissoes(submissoesData);

        // Carregar dados para pastas que já estavam abertas
        for (const pasta of topico.pastas) {
          if (expandedPastas.includes(pasta.id_pasta)) {
            await carregarSubmissoesDaPasta(pasta.id_pasta);
          }
        }
      }
    } catch (error) {
      // Falha silenciosa para não quebrar o carregamento
    }
  };

  /**
   * Atualiza todas as submissões após uma nova entrega ou remoção
   * Garante que a interface mostra os dados mais recentes
   */
  const recarregarSubmissoes = async () => {
    try {
      if (topicoAvaliacao && topicoAvaliacao.pastas) {
        for (const pasta of topicoAvaliacao.pastas) {
          await carregarSubmissoesDaPasta(pasta.id_pasta);
        }
      }
    } catch (error) {
      // Falha silenciosa para manter a experiência fluida
    }
  };

  /**
   * Carrega submissões de uma pasta específica
   * Comportamento diferente conforme o tipo de utilizador:
   * - Formador: vê todas as submissões da pasta
   * - Formando: vê apenas as suas próprias submissões
   * 
   * @param {number} pastaId - ID da pasta a carregar
   */
  const carregarSubmissoesDaPasta = async (pastaId) => {
    if (!pastaId) return;

    try {
      const token = localStorage.getItem('token');
      let submissoesAtualizadas = { ...submissoes };
      const isFormadorUser = isFormadorDoCurso();

      const pasta = topicoAvaliacao.pastas.find(p => p.id_pasta === pastaId);
      if (!pasta) {
        return;
      }

      const dadosUsuario = decodeJWT(token);
      if (!dadosUsuario || !dadosUsuario.id_utilizador) {
        return;
      }

      const idUsuario = dadosUsuario.id_utilizador;

      try {
        const params = {
          id_curso: cursoId,
          id_pasta: pastaId
        };

        // Filtrar por utilizador apenas se não for o formador
        if (!isFormadorUser) {
          params.id_utilizador = idUsuario;
        }

        const response = await axios.get(`${API_BASE}/avaliacoes/submissoes`, {
          params: params,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          submissoesAtualizadas[pastaId] = response.data;
          setSubmissoes(submissoesAtualizadas);
          return;
        }
      } catch (err) {
        // Em caso de erro, inicializar com array vazio
      }

      submissoesAtualizadas[pastaId] = [];
      setSubmissoes(submissoesAtualizadas);

    } catch (error) {
      let submissoesAtualizadas = { ...submissoes };
      submissoesAtualizadas[pastaId] = [];
      setSubmissoes(submissoesAtualizadas);
    }
  };

  /**
   * Carrega todos os tópicos do curso e encontra o de avaliação
   * Filtra e prepara os dados específicos para esta secção
   */
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
        const topicoAvaliacao = { ...topico };

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
      setErro('Não foi possível carregar os tópicos. Tenta novamente.');
      setCarregando(false);
    }
  };

  // Carregamento inicial quando o componente é criado
  useEffect(() => {
    if (cursoId) {
      carregarTopicos();
    }
  }, [cursoId, tipoCurso]);

  /**
   * Alterna entre expandir/colapsar uma pasta
   * Carrega as submissões quando expande pela primeira vez
   * 
   * @param {number} idPasta - ID da pasta a expandir/colapsar
   */
  const toggleExpandPasta = (idPasta) => {
    const expandindo = !expandedPastas.includes(idPasta);

    setExpandedPastas((prev) =>
      prev.includes(idPasta) ? prev.filter((id) => id !== idPasta) : [...prev, idPasta]
    );

    // Carregar submissões quando abre a pasta
    if (expandindo) {
      carregarSubmissoesDaPasta(idPasta);
    }
  };

  /**
   * Abre o modal para criar nova pasta de avaliação
   * Apenas disponível para o formador do curso
   */
  const abrirModalCriarPasta = () => {
    setShowCriarPastaModal(true);
  };

  /**
   * Abre o modal para adicionar conteúdo a uma pasta
   * Apenas disponível para o formador do curso
   * 
   * @param {Object} pasta - Dados da pasta selecionada
   */
  const abrirModalAdicionarConteudo = (pasta) => {
    setPastaSelecionada({
      id_pasta: pasta.id_pasta,
      id_curso: cursoId,
      nome: pasta.nome
    });
    setShowCriarConteudoModal(true);
  };

  /**
   * Abre o modal para visualizar um ficheiro
   * 
   * @param {Object} conteudo - Dados do conteúdo selecionado
   */
  const abrirModalFicheiro = (conteudo) => {
    setSelectedConteudo(conteudo);
  };

  /**
   * Cria o tópico de avaliação no curso
   * Apenas o formador do curso pode criar tópicos
   */
  const criarTopicoAvaliacao = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');

      const dadosEnvio = {
        nome: 'Avaliação',
        id_curso: cursoId,
        ordem: 1
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
      setErro('Erro ao criar tópico de avaliação. Tenta novamente.');
      setCarregando(false);
    }
  };

  /**
   * Remove completamente o tópico de avaliação
   * Ação destrutiva que elimina todas as pastas e conteúdos
   * Apenas o formador do curso pode fazer isto
   */
  const removerTopicoAvaliacao = async () => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/topicos-curso/${topicoAvaliacao.id_topico}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTopicoAvaliacao(null);
    } catch (error) {
      setErro('Erro ao remover tópico de avaliação. Tenta novamente.');
    }
  };

  /**
   * Remove uma pasta e todo o seu conteúdo
   * Apenas o formador do curso pode fazer isto
   * 
   * @param {number} pastaId - ID da pasta a remover
   */
  const removerPasta = async (pastaId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/pastas-curso/${pastaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await carregarTopicos();
    } catch (error) {
      setErro('Erro ao remover pasta. Tenta novamente.');
    }
  };

  /**
   * Remove um conteúdo específico de uma pasta
   * Apenas o formador do curso pode fazer isto
   * 
   * @param {number} conteudoId - ID do conteúdo a remover
   */
  const removerConteudo = async (conteudoId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/conteudos-curso/${conteudoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await carregarTopicos();
    } catch (error) {
      setErro('Erro ao remover conteúdo. Tenta novamente.');
    }
  };

  /**
   * Remove uma submissão específica do formando
   * Apenas o próprio formando pode remover a sua submissão e só antes do prazo
   * 
   * @param {number} submissaoId - ID da submissão a remover
   */
  const removerSubmissao = async (submissaoId) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_BASE}/avaliacoes/submissoes/${submissaoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Recarregar as submissões para atualizar a interface
      await recarregarSubmissoes();
      alert('Submissão removida com sucesso!');
    } catch (error) {
      let errorMsg = 'Erro ao remover a submissão. Tenta novamente.';

      if (error.response && error.response.data?.message) {
        errorMsg = error.response.data.message;
      }

      alert(errorMsg);
    }
  };

  /**
   * Mostra modal de confirmação para ações perigosas
   * 
   * @param {string} mensagem - Texto de confirmação
   * @param {string} acao - Tipo de ação a executar
   * @param {number} id - ID do item afetado
   */
  const mostrarModalConfirmacao = (mensagem, acao, id) => {
    setConfirmModal({
      show: true,
      message: mensagem,
      action: acao,
      targetId: id
    });
  };

  /**
   * Executa a ação confirmada pelo utilizador
   * Chama a função apropriada conforme o tipo de ação
   */
  const executarAcaoConfirmada = () => {
    if (confirmModal.action === 'removerTopico') {
      removerTopicoAvaliacao();
    } else if (confirmModal.action === 'removerPasta') {
      removerPasta(confirmModal.targetId);
    } else if (confirmModal.action === 'removerConteudo') {
      removerConteudo(confirmModal.targetId);
    } else if (confirmModal.action === 'removerSubmissao') {
      removerSubmissao(confirmModal.targetId);
    }

    setConfirmModal({ show: false, message: '', action: null, targetId: null });
  };

  /**
   * Abre o modal para submeter trabalho numa pasta
   * 
   * @param {number} pastaId - ID da pasta para submissão
   */
  const abrirModalEnviarSubmissao = (pastaId) => {
    setEnviarSubmissaoModal({
      show: true,
      pastaId: pastaId
    });
    setArquivo(null);
  };

  /**
   * Gere a seleção de ficheiro para submissão
   * 
   * @param {Event} e - Evento de mudança do input de ficheiro
   */
  const handleArquivoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  /**
   * Processa o envio de uma submissão
   * Valida o ficheiro, envia para o servidor e atualiza a interface
   * 
   * @param {Event} e - Evento de submissão do formulário
   */
  const enviarSubmissao = async (e) => {
    e.preventDefault();

    if (!arquivo) {
      alert('Seleciona um ficheiro primeiro.');
      return;
    }

    try {
      setEnviandoArquivo(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('ficheiro', arquivo);
      formData.append('id_pasta', enviarSubmissaoModal.pastaId);
      formData.append('id_curso', parseInt(cursoId));

      await axios.post(`${API_BASE}/avaliacoes/submissoes`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setEnviarSubmissaoModal({ show: false, pastaId: null });
      await recarregarSubmissoes();
      alert('Trabalho submetido com sucesso!');
    } catch (error) {
      let errorMsg = 'Erro ao submeter o trabalho. Tenta novamente.';

      if (error.response && error.response.data?.message) {
        errorMsg = error.response.data.message;
      }

      alert(errorMsg);
    } finally {
      setEnviandoArquivo(false);
    }
  };

  // Estados de carregamento
  if (carregando) {
    return (
      <div className="avaliacao-loading">
        <div className="loading-spinner"></div>
        <p>A carregar avaliações...</p>
      </div>
    );
  }

  // Estados de erro
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
      {/* Cabeçalho da secção de avaliação */}
      <div className="conteudos-header-avaliacao">
        <h2 className="avaliacao-titulo">Avaliação</h2>

        {/* Botões de gestão - apenas para formador em cursos síncronos */}
        {!isCursoAssincrono() && isFormadorDoCurso() && (
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

                <Link
                  to={`/curso/${cursoId}/avaliar-trabalhos`}
                  className="btn-ver-submissoes-pasta"
                  title="Ver submissões"
                >
                  <i className="fas fa-list"></i> Ver submissões
                </Link>

                <button
                  className="btn-delete"
                  onClick={() => mostrarModalConfirmacao(
                    'Tens a certeza que queres remover o tópico de Avaliação e todo o seu conteúdo?',
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

      {/* Secção de quizzes para cursos assíncronos */}
      <QuizzesAvaliacao
        cursoId={cursoId}
        userRole={userRole}
        inscrito={true}
        tipoCurso={tipoCurso}
      />

      {/* Separador visual para cursos assíncronos */}
      {isCursoAssincrono() && (
        <div style={{
          height: '2px',
          background: 'linear-gradient(to right, #dee2e6, transparent)',
          margin: '30px 0'
        }} />
      )}

      {/* Secção de submissões tradicionais para cursos síncronos */}
      {!isCursoAssincrono() && (
        <>
          <hr />

          {/* Lista de pastas de avaliação */}
          {topicoAvaliacao && (
            <div className="pastas-list">
              {topicoAvaliacao.pastas && topicoAvaliacao.pastas.length > 0 ? (
                topicoAvaliacao.pastas.map((pasta) => {
                  const prazoExpirado = isDataLimiteExpirada(pasta.data_limite);
                  
                  return (
                    <div key={pasta.id_pasta} className="pasta-item">
                      {/* Cabeçalho da pasta com info do prazo */}
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

                        {/* Mostrar prazo limite se existir */}
                        {pasta.data_limite && (
                          <div className={`data-limite ${prazoExpirado ? 'data-limite-expirada' : ''}`}>
                            <i className="fas fa-clock"></i>
                            Prazo: {formatarData(pasta.data_limite)}
                            {prazoExpirado && " (Expirado)"}
                          </div>
                        )}

                        {/* Ações disponíveis conforme o tipo de utilizador */}
                        {isFormadorDoCurso() ? (
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
                                'Tens a certeza que queres remover esta pasta e todo o seu conteúdo?',
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
                              className="btn-submeter-grande"
                              onClick={() => abrirModalEnviarSubmissao(pasta.id_pasta)}
                              title={prazoExpirado ? "Prazo de submissão expirado" : "Submeter trabalho"}
                              disabled={prazoExpirado}
                            >
                              <i className="fas fa-upload"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Conteúdo expandido da pasta */}
                      {expandedPastas.includes(pasta.id_pasta) && (
                        <div className="pasta-expanded-content">
                          {/* Lista de conteúdos da pasta */}
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

                                    {/* Botão de remoção apenas para formador */}
                                    {isFormadorDoCurso() && (
                                      <button
                                        className="btn-delete"
                                        onClick={() => mostrarModalConfirmacao(
                                          'Tens a certeza que queres remover este conteúdo?',
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

                          {/* Lista de submissões - apenas para formador */}
                          {isFormadorDoCurso() && (
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

                          {/* Submissões próprias para formandos */}
                          {!isFormadorDoCurso() && (
                            <div className="minhas-submissoes">
                              <h4 className="secao-titulo">Minhas Submissões</h4>
                              {submissoes[pasta.id_pasta] && submissoes[pasta.id_pasta].length > 0 ? (
                                submissoes[pasta.id_pasta].map((submissao, index) => {
                                  const atrasada = isSubmissaoAtrasada(submissao, pasta);
                                  return (
                                    <div key={submissao.id || index} className={`submissao-item ${atrasada ? 'submissao-atrasada' : ''}`}>
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
                                        {/* Botão de download */}
                                        {submissao.ficheiro_path && (
                                          <button
                                            className="btn-download-verde"
                                            onClick={() => window.open(`${API_BASE}/${submissao.ficheiro_path}`, '_blank')}
                                            title="Descarregar submissão"
                                          >
                                            <i className="fas fa-download"></i>
                                          </button>
                                        )}
                                        
                                        {/* Botão de remover - apenas se o prazo não expirou */}
                                        {!prazoExpirado && (
                                          <button
                                            className="btn-remover-submissao"
                                            onClick={() => mostrarModalConfirmacao(
                                              'Tens a certeza que queres remover esta submissão? Esta ação não pode ser desfeita.',
                                              'removerSubmissao',
                                              submissao.id
                                            )}
                                            title="Remover submissão"
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        )}
                                      </div>
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
                  );
                })
              ) : (
                <div className="topico-empty">
                  <p>Sem pastas no tópico de avaliação</p>
                  {/* Botão apenas para formador */}
                  {isFormadorDoCurso() && (
                    <button onClick={abrirModalCriarPasta} className="btn-add-pasta">
                      <i className="fas fa-folder-plus"></i> Adicionar pasta
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mensagem quando não há tópico de avaliação */}
          {!topicoAvaliacao && (
            <div className="sem-avaliacao">
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📂</div>
                <p>Nenhum tópico de avaliação criado ainda.</p>
                {/* Mensagem apenas para formador */}
                {isFormadorDoCurso() && (
                  <p style={{ fontSize: '14px' }}>Clica em "Criar Avaliação" para começar.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modais para gestão de conteúdos - apenas formador pode aceder */}
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

      {selectedConteudo && (
        <Curso_Conteudo_ficheiro_Modal
          conteudo={selectedConteudo}
          onClose={() => setSelectedConteudo(null)}
          API_BASE={API_BASE}
        />
      )}

      {/* Modal de confirmação para ações perigosas */}
      <ConfirmModal
        show={confirmModal.show}
        title="Confirmação"
        message={confirmModal.message}
        onCancel={() => setConfirmModal({ show: false, message: '', action: null, targetId: null })}
        onConfirm={executarAcaoConfirmada}
      />

      {/* Modal para submissão de trabalhos */}
      {enviarSubmissaoModal.show && (
        <div className="modal-overlay">
          <div className="modal-submissao">
            <h3>Enviar Submissão</h3>

            {/* Aviso sobre prazo expirado */}
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
                <label htmlFor="arquivo-submissao">Seleciona o ficheiro:</label>
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