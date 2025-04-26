// Novo Avaliacao_curso.jsx atualizado conforme solicitado por Rafael

import React, { useState, useEffect } from 'react';
import API_BASE from '../api';
import AdicionarConteudoModal from './AdicionarConteudoModal';
import Curso_Conteudo_ficheiro_Modal from './Curso_Conteudo_ficheiro_Modal';
import './css/cursoConteudos.css';

const Avaliacao_curso = ({ cursoId, userRole, formadorId }) => {
  const [topicoAvaliacao, setTopicoAvaliacao] = useState(null);
  const [mostrarCriarAvaliacao, setMostrarCriarAvaliacao] = useState(false);
  const [expandedPastas, setExpandedPastas] = useState([]);
  const [selectedConteudo, setSelectedConteudo] = useState(null);
  const [showAdicionarConteudoModal, setShowAdicionarConteudoModal] = useState(false);
  const [pastaSelecionada, setPastaSelecionada] = useState(null);

  const isFormador = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id_utilizador === formadorId || payload.id_cargo === 1;
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
      return false;
    }
  };

  useEffect(() => {
    const carregarTopicos = async () => {
      try {
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
          setMostrarCriarAvaliacao(false);
        } else {
          setTopicoAvaliacao(null);
          setMostrarCriarAvaliacao(true);
        }
      } catch (error) {
        console.error('Erro ao carregar tópicos:', error);
      }
    };

    carregarTopicos();
  }, [cursoId]);

  const toggleExpandPasta = (idPasta) => {
    setExpandedPastas((prev) =>
      prev.includes(idPasta) ? prev.filter((id) => id !== idPasta) : [...prev, idPasta]
    );
  };

  const abrirModalAdicionarConteudo = (pasta) => {
    setPastaSelecionada(pasta);
    setShowAdicionarConteudoModal(true);
  };

  const abrirModalFicheiro = (conteudo) => {
    setSelectedConteudo(conteudo);
  };

  return (
    <div className="curso-conteudos-container">
      <div className="conteudos-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="avaliacao-titulo">Avaliação</h2>
        {topicoAvaliacao && isFormador() && (
          <div className="topico-actions">
            <button className="btn-add" onClick={() => alert('Adicionar pasta dentro de Avaliação ainda não implementado')}>
              <i className="fas fa-plus"></i>
            </button>
            <button className="btn-delete" onClick={() => alert('Apagar Avaliação ainda não implementado')}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        )}
      </div>
      <hr />

      {mostrarCriarAvaliacao && isFormador() && (
        <div className="conteudos-header">
          <button className="btn-add-topico" onClick={() => alert('Criar Avaliação está bloqueado após criada.')}>Criar Avaliação</button>
        </div>
      )}

      {topicoAvaliacao && (
        <div className="pastas-list">
          {topicoAvaliacao.pastas?.map((pasta) => (
            <div key={pasta.id_pasta} className="pasta-item">
              <div className="pasta-header">
                <button className="btn-toggle" onClick={() => toggleExpandPasta(pasta.id_pasta)}>
                  {expandedPastas.includes(pasta.id_pasta) ? <i className="fas fa-chevron-down"></i> : <i className="fas fa-chevron-right"></i>}
                </button>
                <i className="fas fa-folder"></i>
                <span className="pasta-nome">{pasta.nome}</span>
                <div className="pasta-actions">
                  <button className="btn-add" onClick={() => abrirModalAdicionarConteudo(pasta)}><i className="fas fa-plus"></i></button>
                  <button className="btn-edit" onClick={() => alert('Editar Pasta ainda não implementado')}><i className="fas fa-edit"></i></button>
                  <button className="btn-delete" onClick={() => alert('Apagar Pasta ainda não implementado')}><i className="fas fa-trash"></i></button>
                </div>
              </div>

              {expandedPastas.includes(pasta.id_pasta) && (
                <div className="conteudos-list">
                  {pasta.conteudos?.length > 0 ? (
                    pasta.conteudos.map((conteudo) => (
                      <div key={conteudo.id_conteudo} className="conteudo-item">
                        <i className="fas fa-file-alt"></i>
                        <span className="conteudo-titulo" onClick={() => abrirModalFicheiro(conteudo)}>{conteudo.titulo}</span>
                      </div>
                    ))
                  ) : (
                    <div className="pasta-empty">Sem conteúdos</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdicionarConteudoModal && pastaSelecionada && (
        <AdicionarConteudoModal
          id_topico={topicoAvaliacao.id_topico}
          id_pasta={pastaSelecionada.id_pasta}
          onClose={() => setShowAdicionarConteudoModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {selectedConteudo && (
        <Curso_Conteudo_ficheiro_Modal
          conteudo={selectedConteudo}
          onClose={() => setSelectedConteudo(null)}
          API_BASE={API_BASE}
        />
      )}
    </div>
  );
};

export default Avaliacao_curso;
