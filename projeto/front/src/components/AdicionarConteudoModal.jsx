import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdicionarConteudoModal.css';
import API_BASE from "../api";

// Modal inicial de seleção de tipo que é chamado de CursoConteudos.jsx
const AdicionarConteudoModal = ({ curso, onClose, onSuccess }) => {
  // Estado para gerenciar os modais
  const [modalAtual, setModalAtual] = useState('selecao-tipo');
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  
  // Função para fechar todos os modais
  const fecharTodosModais = () => {
    onClose();
  };
  
  // Handler para seleção de tipo
  const handleTipoSelecionado = (tipo) => {
    console.log(`Tipo selecionado: ${tipo}`);
    setTipoSelecionado(tipo);
    
    if (tipo === 'arquivo') {
      setModalAtual('arquivo-modal');
    } else {
      setModalAtual('url-link-modal');
    }
  };

  return (
    <div className="adicionar-conteudo-overlay">
      {modalAtual === 'selecao-tipo' && (
        <div className="adicionar-conteudo-modal">
          <button className="close-btn" onClick={fecharTodosModais} type="button">×</button>
          
          <h2>Adicionar Conteúdo</h2>
          {curso && curso.titulo && <p className="curso-info">{curso.titulo}</p>}
          
          <div className="tipo-botoes">
            <button 
              type="button" 
              className="tipo-btn"
              onClick={() => handleTipoSelecionado('link')}
            >
              Link
            </button>
            
            <button 
              type="button" 
              className="tipo-btn"
              onClick={() => handleTipoSelecionado('arquivo')}
            >
              Arquivo
            </button>
            
            <button 
              type="button" 
              className="tipo-btn"
              onClick={() => handleTipoSelecionado('video')}
            >
              Vídeo (YouTube)
            </button>
          </div>
        </div>
      )}

{modalAtual === 'url-link-modal' && (
        <UrlLinkModal 
          tipo={tipoSelecionado}
          curso={curso}
          API_BASE={API_BASE}
          onClose={fecharTodosModais}
          onVoltar={() => setModalAtual('selecao-tipo')}
          onSuccess={onSuccess}
        />
      )}

      {modalAtual === 'arquivo-modal' && (
        <ArquivoModal 
          curso={curso}
          API_BASE={API_BASE}
          onClose={fecharTodosModais}
          onVoltar={() => setModalAtual('selecao-tipo')}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
};

// Modal para URL (Link ou YouTube)
const UrlLinkModal = ({ tipo, curso, onClose, onVoltar, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const tipoLabel = tipo === 'link' ? 'Link' : 'URL do YouTube';
  const placeholder = tipo === 'link' 
    ? 'Digite a URL completa' 
    : 'Ex: https://www.youtube.com/watch?v=...';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    
    if (!url.trim()) {
      setErro(`O ${tipoLabel} é obrigatório para este tipo de conteúdo.`);
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('titulo', titulo.trim());
      formData.append('descricao', ''); // Não há campo de descrição neste modal
      formData.append('id_pasta', curso.id_pasta);
      formData.append('id_curso', curso.id_curso);
      formData.append('url', url.trim());
      
      const response = await axios.post(`${API_BASE}/conteudos-curso`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Resposta da API:', response.data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar conteúdo:', error);
      setErro(error.response?.data?.message || 'Erro ao adicionar conteúdo. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="adicionar-conteudo-modal">
      <button className="close-btn" onClick={onClose} type="button">×</button>
      
      <h2>Adicionar {tipo === 'link' ? 'Link' : 'Vídeo'}</h2>
      {curso && curso.titulo && <p className="curso-info">{curso.titulo}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="titulo">Título:</label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Digite o título do conteúdo"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="url">{tipoLabel}:</label>
          <input
            type="url"
            id="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            required
          />
          {tipo === 'video' && (
            <p className="help-text">Cole a URL do vídeo do YouTube</p>
          )}
        </div>
        
        {erro && <p className="erro-message">{erro}</p>}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="voltar-btn"
            onClick={onVoltar}
            disabled={enviando}
          >
            Voltar
          </button>
          
          <button 
            type="submit" 
            className="confirmar-btn"
            disabled={enviando}
          >
            {enviando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Modal para Arquivo (sem campo de título)
const ArquivoModal = ({ curso, onClose, onVoltar, onSuccess }) => {
  const [arquivo, setArquivo] = useState(null);
  const [arquivoNome, setArquivoNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleArquivoChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setArquivo(selectedFile);
      setArquivoNome(selectedFile.name);
      setErro('');
    } else {
      setArquivo(null);
      setArquivoNome('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!arquivo) {
      setErro('O arquivo é obrigatório.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('tipo', 'file');
      formData.append('titulo', arquivo.name); // Usamos o nome do arquivo como título
      formData.append('descricao', '');
      formData.append('id_pasta', curso.id_pasta);
      formData.append('id_curso', curso.id_curso);
      formData.append('arquivo', arquivo);
      
      const response = await axios.post(`${API_BASE}/conteudos-curso`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Resposta da API:', response.data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar arquivo:', error);
      setErro(error.response?.data?.message || 'Erro ao adicionar arquivo. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="adicionar-conteudo-modal">
      <button className="close-btn" onClick={onClose} type="button">×</button>
      
      <h2>Adicionar Arquivo</h2>
      {curso && curso.titulo && <p className="curso-info">{curso.titulo}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="arquivo">Selecione o arquivo:</label>
          <input
            type="file"
            id="arquivo"
            name="arquivo"
            onChange={handleArquivoChange}
            required
          />
          <p className="file-info">
            {arquivo ? `Arquivo selecionado: ${arquivoNome}` : 'Nenhum arquivo selecionado'}
          </p>
        </div>
        
        {erro && <p className="erro-message">{erro}</p>}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="voltar-btn"
            onClick={onVoltar}
            disabled={enviando}
          >
            Voltar
          </button>
          
          <button 
            type="submit" 
            className="confirmar-btn"
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar Arquivo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdicionarConteudoModal;