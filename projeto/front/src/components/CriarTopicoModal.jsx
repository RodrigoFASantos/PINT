import React, { useState } from 'react';
import axios from 'axios';
import './css/CriarTopicoModal.css';

const CriarTopicoModal = ({ categoria, area, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    
    if (!descricao.trim()) {
      setErro('A descrição é obrigatória.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descricao', descricao);
      formData.append('categoria', categoria);
      formData.append('area', area);
      
      // Adicionar arquivos ao formData
      for (const arquivo of arquivos) {
        formData.append('arquivos', arquivo);
      }
      
      await axios.post('/api/forum/topicos', 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      setErro(error.response?.data?.message || 'Erro ao criar tópico. Tente novamente.');
      setEnviando(false);
    }
  };

  const handleArquivoChange = (e) => {
    setArquivos(Array.from(e.target.files));
  };

  const removerArquivo = (index) => {
    setArquivos(arquivos.filter((_, i) => i !== index));
  };

  return (
    <div className="criar-topico-overlay">
      <div className="criar-topico-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Criar Novo Tópico</h2>
        <p className="categoria-info">{categoria} &gt; {area}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="titulo">Título:</label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título do tópico"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="descricao">Descrição:</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows="5"
              placeholder="Descreva o tópico..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="arquivos">Anexos (opcional):</label>
            <input
              type="file"
              id="arquivos"
              onChange={handleArquivoChange}
              multiple
            />
            
            {arquivos.length > 0 && (
              <div className="arquivos-preview">
                <h4>Arquivos selecionados:</h4>
                <ul>
                  {arquivos.map((arquivo, index) => (
                    <li key={index}>
                      {arquivo.name}
                      <button 
                        type="button"
                        className="remover-arquivo"
                        onClick={() => removerArquivo(index)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
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
              {enviando ? 'Criando...' : 'Criar Tópico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarTopicoModal;