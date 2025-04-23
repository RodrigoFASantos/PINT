import React, { useState, useEffect } from 'react';
import { conteudosService } from '../services/apiService';
import './ConteudoCursoList.css';

const ConteudoCursoList = ({ cursoId }) => {
  const [conteudos, setConteudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConteudos = async () => {
      try {
        setLoading(true);
        
        const data = await conteudosService.getConteudosCurso(cursoId);
        setConteudos(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar conteúdos do curso:', error);
        setError('Não foi possível carregar o conteúdo do curso. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    if (cursoId) {
      fetchConteudos();
    }
  }, [cursoId]);

  const getTipoConteudoIcon = (tipo) => {
    switch (tipo.toLowerCase()) {
      case 'link':
        return <i className="fas fa-link"></i>;
      case 'video':
        return <i className="fas fa-video"></i>;
      case 'ficheiro':
      case 'arquivo':
      case 'file':
        return <i className="fas fa-file"></i>;
      default:
        return <i className="fas fa-file-alt"></i>;
    }
  };

  const handleConteudoClick = (conteudo) => {
    // Se for um link, abrir em nova aba
    if (conteudo.tipo === 'link' && conteudo.url) {
      window.open(conteudo.url, '_blank');
    } 
    // Se for um vídeo do YouTube
    else if (conteudo.tipo === 'video' && conteudo.url) {
      window.open(conteudo.url, '_blank');
    } 
    // Se for um arquivo para download
    else if (conteudo.tipo === 'ficheiro' && conteudo.path) {
      window.open(`/uploads/${conteudo.path}`, '_blank');
    }
  };

  if (loading) {
    return <div className="conteudo-loading">Carregando conteúdo do curso...</div>;
  }

  if (error) {
    return <div className="conteudo-error">{error}</div>;
  }

  if (conteudos.length === 0) {
    return <div className="conteudo-empty">Nenhum conteúdo disponível para este curso.</div>;
  }

  return (
    <div className="conteudo-curso-list">
      {conteudos.map((conteudo) => (
        <div 
          key={conteudo.id_conteudo} 
          className="conteudo-item"
          onClick={() => handleConteudoClick(conteudo)}
        >
          <div className="conteudo-icon">
            {getTipoConteudoIcon(conteudo.tipo)}
          </div>
          <div className="conteudo-info">
            <h3 className="conteudo-titulo">{conteudo.titulo}</h3>
            <p className="conteudo-descricao">{conteudo.descricao}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConteudoCursoList;