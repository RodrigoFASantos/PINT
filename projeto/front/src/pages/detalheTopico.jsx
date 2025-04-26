import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './css/detalheTopico.css';
import Sidebar from '../components/Sidebar';
import NovoComentarioForm from '../components/NovoComentarioForm';

const DetalheTopico = () => {
  const { id } = useParams();
  const [topico, setTopico] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchTopicoDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Obter detalhes do tópico
        const topicoResponse = await axios.get(`/api/forum/topico/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTopico(topicoResponse.data);
        
        // Obter comentários do tópico
        const comentariosResponse = await axios.get(`/api/forum/topico/${id}/comentarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setComentarios(comentariosResponse.data);
        
        // Obter ID do usuário atual
        const userResponse = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserId(userResponse.data.id);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar detalhes do tópico:', error);
        setLoading(false);
      }
    };

    fetchTopicoDetails();
  }, [id]);

  const handleNovoComentario = async (comentarioData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/forum/topico/${id}/comentario`, comentarioData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Adicionar novo comentário à lista
      setComentarios([...comentarios, response.data]);
      
      // Atualizar contagem de comentários no tópico
      setTopico({
        ...topico,
        comentarios: topico.comentarios + 1
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      return false;
    }
  };

  const handleAvaliarComentario = async (comentarioId, avaliacao) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/forum/comentario/${comentarioId}/avaliar`, 
        { avaliacao },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Atualizar lista de comentários
      const updatedComentarios = comentarios.map(comentario => {
        if (comentario.id === comentarioId) {
          // Verificar se usuário já avaliou
          const avaliacaoExistente = comentario.avaliacoes.find(
            av => av.userId === userId
          );
          
          if (avaliacaoExistente) {
            // Atualizar avaliação existente
            return {
              ...comentario,
              avaliacoes: comentario.avaliacoes.map(av => 
                av.userId === userId ? { ...av, valor: avaliacao } : av
              )
            };
          } else {
            // Adicionar nova avaliação
            return {
              ...comentario,
              avaliacoes: [
                ...comentario.avaliacoes,
                { userId, valor: avaliacao }
              ]
            };
          }
        }
        return comentario;
      });
      
      setComentarios(updatedComentarios);
      return true;
    } catch (error) {
      console.error('Erro ao avaliar comentário:', error);
      return false;
    }
  };

  const handleDenunciarComentario = async (comentarioId) => {
    const motivo = prompt('Por favor, informe o motivo da denúncia:');
    if (!motivo) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/forum/comentario/${comentarioId}/denunciar`, 
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Denúncia enviada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao denunciar comentário:', error);
      alert('Erro ao enviar denúncia. Tente novamente.');
      return false;
    }
  };

  // Função para calcular a pontuação total do comentário
  const calcularPontuacao = (avaliacoes) => {
    if (!avaliacoes || avaliacoes.length === 0) return 0;
    
    return avaliacoes.reduce((total, avaliacao) => total + avaliacao.valor, 0);
  };

  if (loading) {
    return <div className="loading">Carregando tópico...</div>;
  }

  if (!topico) {
    return <div className="error">Tópico não encontrado</div>;
  }

  return (
    <div className="detalhe-topico-container">
      <div className="main-content">
        <Sidebar />
        <div className="topico-content">
          <div className="topico-header">
            <div className="topico-breadcrumb">
              <span>{topico.categoria}</span> &gt; <span>{topico.area}</span>
            </div>
            <h1>{topico.titulo}</h1>
            <div className="topico-meta">
              <span className="autor">Por: {topico.criador.nome}</span>
              <span className="data">
                {new Date(topico.dataCriacao).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="topico-descricao">
            <p>{topico.descricao}</p>
            
            {topico.anexos && topico.anexos.length > 0 && (
              <div className="topico-anexos">
                <h3>Anexos:</h3>
                <ul>
                  {topico.anexos.map((anexo, index) => (
                    <li key={index}>
                      <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                        {anexo.nome}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="comentarios-section">
            <h2>{comentarios.length} Comentário(s)</h2>
            
            {comentarios.length === 0 ? (
              <p className="no-comentarios">Seja o primeiro a comentar!</p>
            ) : (
              <div className="comentarios-list">
                {comentarios.map(comentario => {
                  const pontuacao = calcularPontuacao(comentario.avaliacoes);
                  const usuarioAvaliou = comentario.avaliacoes.some(
                    av => av.userId === userId
                  );
                  
                  return (
                    <div key={comentario.id} className="comentario-card">
                      <div className="comentario-header">
                        <span className="autor">{comentario.usuario.nome}</span>
                        <span className="data">
                          {new Date(comentario.data).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="comentario-conteudo">
                        <p>{comentario.conteudo}</p>
                        
                        {comentario.anexos && comentario.anexos.length > 0 && (
                          <div className="comentario-anexos">
                            <h4>Anexos:</h4>
                            <ul>
                              {comentario.anexos.map((anexo, index) => (
                                <li key={index}>
                                  <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                                    {anexo.nome}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="comentario-actions">
                        <div className="avaliacao-container">
                          <button 
                            className={`like-btn ${
                              usuarioAvaliou && comentario.avaliacoes.find(
                                av => av.userId === userId
                              ).valor > 0 ? 'active' : ''
                            }`}
                            onClick={() => handleAvaliarComentario(comentario.id, 1)}
                            disabled={usuarioAvaliou && comentario.avaliacoes.find(
                              av => av.userId === userId
                            ).valor > 0}
                          >
                            👍
                          </button>
                          
                          <span className="pontuacao">{pontuacao}</span>
                          
                          <button 
                            className={`dislike-btn ${
                              usuarioAvaliou && comentario.avaliacoes.find(
                                av => av.userId === userId
                              ).valor < 0 ? 'active' : ''
                            }`}
                            onClick={() => handleAvaliarComentario(comentario.id, -1)}
                            disabled={usuarioAvaliou && comentario.avaliacoes.find(
                              av => av.userId === userId
                            ).valor < 0}
                          >
                            👎
                          </button>
                        </div>
                        
                        <button 
                          className="denunciar-btn"
                          onClick={() => handleDenunciarComentario(comentario.id)}
                        >
                          Denunciar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="novo-comentario">
              <h3>Adicionar Comentário</h3>
              <NovoComentarioForm onSubmit={handleNovoComentario} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalheTopico;