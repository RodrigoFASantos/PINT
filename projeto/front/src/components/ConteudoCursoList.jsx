import React, { useState, useEffect } from 'react';
import './css/ConteudoCursoList.css';
import API_BASE from "../api";

const ConteudoCursoList = ({ cursoId }) => {
  const [conteudos, setConteudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ConteudoCursoList - cursoId:', cursoId);
    
    const fetchConteudos = async () => {
      console.log('Iniciando busca de conteúdos...');
      try {
        const token = localStorage.getItem('token');
        console.log('Token disponível:', !!token);
        
        if (!token) {
          setError('Token não encontrado. Faça login novamente.');
          setLoading(false);
          return;
        }
        
        // Verificar se o token está expirado
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const expDate = new Date(tokenData.exp * 1000);
          const now = new Date();
          
          console.log('Token expira em:', expDate.toLocaleString());
          console.log('Hora atual:', now.toLocaleString());
          
          if (now > expDate) {
            console.error('Token expirado');
            setError('Sua sessão expirou. Faça login novamente.');
            setLoading(false);
            return;
          }
        } catch (tokenError) {
          console.error('Erro ao analisar token:', tokenError);
        }
        
        // Log da URL que será usada
        const url = `${API_BASE}/conteudos-curso/curso/${cursoId}`;
        console.log('Buscando conteúdos na URL:', url);
        
        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar conteúdos: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        if (Array.isArray(data)) {
          console.log(`Encontrados ${data.length} conteúdos`);
          setConteudos(data);
        } else {
          console.warn('Resposta não é um array:', data);
          setConteudos([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar conteúdos:', error);
        setError('Falha ao carregar os conteúdos. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };
  
    if (cursoId) {
      fetchConteudos();
    } else {
      setLoading(false);
      setError('ID do curso não fornecido');
    }
  }, [cursoId]);

  if (loading) {
    return <div className="loading">Carregando conteúdos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (conteudos.length === 0) {
    return <p className="no-conteudos">Nenhum conteúdo disponível.</p>;
  }

  const getIconByType = (tipo) => {
    switch (tipo) {
      case 'video': return '🎬';
      case 'link': return '🔗';
      case 'file': return '📄';
      default: return '📌';
    }
  };

  const renderConteudoBody = (conteudo) => {
    switch (conteudo.tipo) {
      case 'video':
        return (
          <div className="video-container">
            <iframe
              src={conteudo.url}
              title={conteudo.titulo}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );

      case 'link':
        return (
          <a
            href={conteudo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="conteudo-link"
          >
            Acessar Conteúdo
          </a>
        );

      case 'file':
        const downloadUrl = conteudo.arquivo_path
          ? `${API_BASE}/uploads/${encodeURIComponent(conteudo.arquivo_path.replace('uploads/', ''))}`
          : '#';

        return (
          <a
            href={downloadUrl}
            download
            className="conteudo-download"
          >
            Baixar Arquivo
          </a>
        );

      default:
        return <p>Tipo de conteúdo não reconhecido</p>;
    }
  };

  return (
    <div className="conteudo-list">
      {conteudos.map((conteudo, index) => (
        <div key={conteudo.id_conteudo || index} className="conteudo-item">
          <div className="conteudo-header">
            <span className="numero">{index + 1}</span>
            <div className="conteudo-info">
              <h3>
                <span className="conteudo-icon">{getIconByType(conteudo.tipo)}</span>
                {conteudo.titulo}
              </h3>
              {conteudo.pasta_nome && (
                <span className="conteudo-path">
                  {conteudo.pasta_nome}
                </span>
              )}
            </div>
            <span className="tipo-badge">{conteudo.tipo}</span>
          </div>

          {conteudo.descricao && (
            <p className="descricao">{conteudo.descricao}</p>
          )}

          <div className="conteudo-body">
            {renderConteudoBody(conteudo)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConteudoCursoList;