import React, { useState } from 'react';
import axios from 'axios';
import './css/AdicionarConteudoModal.css';

const AdicionarConteudoModal = ({ curso, onClose, onSuccess }) => {
  const [tipo, setTipo] = useState('link');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [link, setLink] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    
    if (tipo === 'link' && !link.trim()) {
      setErro('O link é obrigatório para este tipo de conteúdo.');
      return;
    }
    
    if (tipo === 'arquivo' && !arquivo) {
      setErro('O arquivo é obrigatório para este tipo de conteúdo.');
      return;
    }
    
    if (tipo === 'video' && !videoUrl.trim()) {
      setErro('A URL do vídeo é obrigatória para este tipo de conteúdo.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('tipo', tipo === 'arquivo' ? 'file' : tipo);
      formData.append('titulo', titulo);
      formData.append('descricao', descricao);
      formData.append('id_pasta', curso.id_pasta);
      formData.append('id_curso', curso.id_curso);
      
      if (tipo === 'link') {
        formData.append('url', link);
      } else if (tipo === 'arquivo') {
        formData.append('arquivo', arquivo);
      } else if (tipo === 'video') {
        formData.append('url', videoUrl);
      }
      
      
      await axios.post(`/api/conteudos-curso`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao adicionar conteúdo:', error);
      setErro(error.response?.data?.message || 'Erro ao adicionar conteúdo. Tente novamente.');
      setEnviando(false);
    }
  };

  const handleArquivoChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  return (
    <div className="adicionar-conteudo-overlay">
      <div className="adicionar-conteudo-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Adicionar Conteúdo</h2>
        <p className="curso-info">{curso.titulo}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tipo">Tipo de Conteúdo:</label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="link">Link</option>
              <option value="arquivo">Arquivo</option>
              <option value="video">Vídeo (YouTube)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="titulo">Título:</label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título do conteúdo"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="descricao">Descrição:</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows="3"
              placeholder="Descreva brevemente o conteúdo..."
            />
          </div>
          
          {tipo === 'link' && (
            <div className="form-group">
              <label htmlFor="link">URL:</label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Digite a URL completa"
                required
              />
            </div>
          )}
          
          {tipo === 'arquivo' && (
            <div className="form-group">
              <label htmlFor="arquivo">Arquivo:</label>
              <input
                type="file"
                id="arquivo"
                onChange={handleArquivoChange}
                required
              />
              <p className="file-info">
                {arquivo ? `Arquivo selecionado: ${arquivo.name}` : 'Nenhum arquivo selecionado'}
              </p>
            </div>
          )}
          
          {tipo === 'video' && (
            <div className="form-group">
              <label htmlFor="videoUrl">URL do YouTube:</label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=..."
                required
              />
              <p className="help-text">
                Cole a URL do vídeo do YouTube
              </p>
            </div>
          )}
          
          {erro && <p className="erro-message">{erro}</p>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancelar-btn"
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="confirmar-btn"
              disabled={enviando}
            >
              {enviando ? 'Adicionando...' : 'Adicionar Conteúdo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarConteudoModal;