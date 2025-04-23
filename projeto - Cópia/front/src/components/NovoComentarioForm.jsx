import React, { useState } from 'react';
import './css/NovoComentarioForm.css';

const NovoComentarioForm = ({ onSubmit }) => {
  const [conteudo, setConteudo] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!conteudo.trim()) {
      setErro('O comentário não pode estar vazio.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    const formData = new FormData();
    formData.append('conteudo', conteudo);
    
    // Adicionar arquivos ao formData
    for (const arquivo of arquivos) {
      formData.append('arquivos', arquivo);
    }
    
    const sucesso = await onSubmit(formData);
    
    if (sucesso) {
      setConteudo('');
      setArquivos([]);
    } else {
      setErro('Erro ao enviar comentário. Tente novamente.');
    }
    
    setEnviando(false);
  };

  const handleArquivoChange = (e) => {
    setArquivos(Array.from(e.target.files));
  };

  const removerArquivo = (index) => {
    setArquivos(arquivos.filter((_, i) => i !== index));
  };

  return (
    <div className="novo-comentario-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows="4"
            placeholder="Digite seu comentário..."
            required
          />
        </div>
        
        <div className="form-footer">
          <div className="arquivo-upload">
            <label htmlFor="arquivos-comentario">
              <span className="upload-icon">📎</span> Anexar arquivos
            </label>
            <input
              type="file"
              id="arquivos-comentario"
              onChange={handleArquivoChange}
              multiple
              style={{ display: 'none' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="enviar-btn"
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar Comentário'}
          </button>
        </div>
        
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
        
        {erro && <p className="erro-message">{erro}</p>}
      </form>
    </div>
  );
};

export default NovoComentarioForm;