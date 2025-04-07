import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/ConteudoCursoList.css';

const ConteudoCursoList = ({ cursoId }) => {
  const [conteudos, setConteudos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConteudos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/cursos/${cursoId}/conteudos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setConteudos(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
        setLoading(false);
      }
    };

    fetchConteudos();
  }, [cursoId]);

  if (loading) {
    return <div className="loading">Carregando conteúdos...</div>;
  }

  if (conteudos.length === 0) {
    return <p className="no-conteudos">Nenhum conteúdo disponível.</p>;
  }

  return (
    <div className="conteudo-list">
      {conteudos.map((conteudo, index) => (
        <div key={conteudo.id} className="conteudo-item">
          <div className="conteudo-header">
            <span className="numero">{index + 1}</span>
            <h3>{conteudo.titulo}</h3>
            <span className="tipo-badge">{conteudo.tipo}</span>
          </div>
          
          <p className="descricao">{conteudo.descricao}</p>
          
          <div className="conteudo-body">
            {conteudo.tipo === 'link' && (
              <a 
                href={conteudo.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="conteudo-link"
              >
                Acessar Conteúdo
              </a>
            )}
            
            {conteudo.tipo === 'arquivo' && (
              <a 
                href={conteudo.url} 
                download
                className="conteudo-download"
              >
                Baixar Arquivo
              </a>
            )}
            
            {conteudo.tipo === 'video' && (
              <div className="video-container">
                <iframe
                  src={conteudo.videoUrl}
                  title={conteudo.titulo}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConteudoCursoList;