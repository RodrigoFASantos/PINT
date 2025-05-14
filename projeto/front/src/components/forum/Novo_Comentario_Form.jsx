import React, { useState } from 'react';
import './css/Novo_Comentario_Form.css';

const NovoComentarioForm = ({ onSubmit }) => {
  const [conteudo, setConteudo] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!conteudo.trim() && arquivos.length === 0) {
      setErro('O comentário não pode estar vazio e deve incluir texto ou anexo.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    const formData = new FormData();

    formData.append('texto', conteudo);
    if (arquivos.length > 0) {
      formData.append('anexo', arquivos[0]);
    }
    
    try {
      const sucesso = await onSubmit(formData);
      
      if (sucesso) {
        setConteudo('');
        setArquivos([]);
      } else {
        setErro('Erro ao enviar comentário. Tente novamente.');
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      setErro(`Erro ao enviar comentário: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleArquivoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivos(Array.from(e.target.files));
    }
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
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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