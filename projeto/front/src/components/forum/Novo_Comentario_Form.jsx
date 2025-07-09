import React, { useState, useRef, useEffect } from 'react';
import './css/Novo_Comentario_Form.css';

/**
 * Componente de formulário para criação de novos comentários
 * 
 * Funcionalidades implementadas:
 * - Editor de texto com suporte a múltiplas linhas
 * - Sistema de upload de ficheiros com preview
 * - Validação de conteúdo antes do envio
 * - Estados de carregamento e feedback visual
 * - Suporte para diferentes tipos de anexos (imagens, vídeos, documentos)
 * - Limpeza automática após envio bem-sucedido
 */
const NovoComentarioForm = ({ onSubmit, disabled = false, placeholder = "Escreve o teu comentário..." }) => {
  // Estados principais do formulário
  const [conteudo, setConteudo] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  
  // Estados para preview de anexos
  const [previewUrls, setPreviewUrls] = useState([]);
  const [tiposArquivos, setTiposArquivos] = useState([]);

  // Referências para elementos DOM
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Ajusta automaticamente a altura da textarea baseado no conteúdo
   * Melhora a experiência do utilizador em comentários longos
   */
  const ajustarAlturaTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  /**
   * Ajusta altura da textarea sempre que o conteúdo muda
   */
  useEffect(() => {
    ajustarAlturaTextarea();
  }, [conteudo]);

  /**
   * Determina o tipo de ficheiro baseado no MIME type
   * Categoriza em imagem, vídeo ou documento geral
   */
  const determinarTipoFicheiro = (file) => {
    const mimeType = file.type;
    if (mimeType.startsWith('image/')) {
      return 'imagem';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else {
      return 'documento';
    }
  };

  /**
   * Cria URLs de preview para ficheiros selecionados
   * Suporta imagens e vídeos com visualização direta
   */
  const criarPreviewUrls = (files) => {
    const urls = [];
    const tipos = [];

    files.forEach(file => {
      const tipo = determinarTipoFicheiro(file);
      tipos.push(tipo);

      if (tipo === 'imagem' || tipo === 'video') {
        const url = URL.createObjectURL(file);
        urls.push(url);
      } else {
        urls.push(null);
      }
    });

    return { urls, tipos };
  };

  /**
   * Liberta memória das URLs de preview criadas
   * Evita vazamentos de memória no navegador
   */
  const limparPreviewUrls = () => {
    previewUrls.forEach(url => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
  };

  /**
   * Processa seleção de ficheiros pelo utilizador
   * Valida tipos permitidos e cria previews automaticamente
   */
  const handleArquivoChange = (e) => {
    const novosArquivos = Array.from(e.target.files);
    
    if (novosArquivos.length === 0) return;

    // Validação de tipos de ficheiro permitidos
    const tiposPermitidos = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats'];
    const arquivosValidos = novosArquivos.filter(file => 
      tiposPermitidos.some(tipo => file.type.includes(tipo))
    );

    if (arquivosValidos.length !== novosArquivos.length) {
      setErro('Alguns ficheiros não são suportados. Apenas imagens, vídeos e documentos são permitidos.');
      return;
    }

    // Limpa previews antigos antes de criar novos
    limparPreviewUrls();

    // Cria novos previews e atualiza estado
    const { urls, tipos } = criarPreviewUrls(arquivosValidos);
    
    setArquivos(arquivosValidos);
    setPreviewUrls(urls);
    setTiposArquivos(tipos);
    setErro('');
  };

  /**
   * Remove ficheiro específico da lista de anexos
   * Atualiza todos os estados relacionados adequadamente
   */
  const removerArquivo = (index) => {
    // Remove URL de preview da memória
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }

    // Atualiza todos os arrays de estado
    const novosArquivos = arquivos.filter((_, i) => i !== index);
    const novasUrls = previewUrls.filter((_, i) => i !== index);
    const novosTipos = tiposArquivos.filter((_, i) => i !== index);

    setArquivos(novosArquivos);
    setPreviewUrls(novasUrls);
    setTiposArquivos(novosTipos);

    // Limpa input file se não há mais arquivos
    if (novosArquivos.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Processa envio do formulário com validação completa
   * Cria FormData para upload de ficheiros e texto
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de conteúdo obrigatório
    if (!conteudo.trim() && arquivos.length === 0) {
      setErro('O comentário deve conter texto ou anexo.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    // Criação do FormData para envio multipart
    const formData = new FormData();
    formData.append('texto', conteudo.trim());
    
    // Adiciona apenas o primeiro ficheiro (limitação do backend)
    if (arquivos.length > 0) {
      formData.append('anexo', arquivos[0]);
    }
    
    try {
      const sucesso = await onSubmit(formData);
      
      if (sucesso !== false) {
        // Limpa formulário após envio bem-sucedido
        limparFormulario();
      } else {
        setErro('Erro ao enviar comentário. Tenta novamente.');
      }
    } catch (error) {
      setErro(`Erro ao enviar comentário: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  /**
   * Limpa completamente o formulário e liberta recursos
   */
  const limparFormulario = () => {
    setConteudo('');
    setArquivos([]);
    limparPreviewUrls();
    setPreviewUrls([]);
    setTiposArquivos([]);
    setErro('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Redefine altura da textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Gere teclas de atalho no textarea
   * Enter envia, Shift+Enter adiciona nova linha
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Renderiza preview específico baseado no tipo de ficheiro
   */
  const renderizarPreview = (file, index) => {
    const tipo = tiposArquivos[index];
    const url = previewUrls[index];

    if (tipo === 'imagem' && url) {
      return (
        <div className="preview-imagem">
          <img src={url} alt={`Preview ${index}`} />
        </div>
      );
    } else if (tipo === 'video' && url) {
      return (
        <div className="preview-video">
          <video src={url} controls />
        </div>
      );
    } else {
      return (
        <div className="preview-documento">
          <i className="fas fa-file" />
          <span className="nome-arquivo">{file.name}</span>
        </div>
      );
    }
  };

  /**
   * Limpeza de recursos ao desmontar componente
   */
  useEffect(() => {
    return () => {
      limparPreviewUrls();
    };
  }, []);

  return (
    <div className="novo-comentario-form">
      <form onSubmit={handleSubmit} className="comentario-form">
        
        {/* Área principal de entrada de texto */}
        <div className="form-group textarea-group">
          <textarea
            ref={textareaRef}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || enviando}
            className="comentario-textarea"
            rows="2"
          />
        </div>
        
        {/* Preview dos ficheiros selecionados */}
        {arquivos.length > 0 && (
          <div className="ficheiros-preview">
            <h4 className="preview-titulo">Ficheiros anexados:</h4>
            <div className="lista-previews">
              {arquivos.map((arquivo, index) => (
                <div key={index} className={`preview-item preview-${tiposArquivos[index]}`}>
                  {renderizarPreview(arquivo, index)}
                  
                  <div className="preview-info">
                    <span className="nome-ficheiro">{arquivo.name}</span>
                    <span className="tamanho-ficheiro">
                      {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    className="btn-remover-ficheiro"
                    onClick={() => removerArquivo(index)}
                    disabled={enviando}
                    title="Remover ficheiro"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Rodapé do formulário com ações */}
        <div className="form-footer">
          <div className="acoes-esquerda">
            <div className="ficheiro-upload">
              <label htmlFor="ficheiros-comentario" className="btn-upload">
                <i className="fas fa-paperclip" />
                <span>Anexar</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="ficheiros-comentario"
                onChange={handleArquivoChange}
                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={disabled || enviando}
                style={{ display: 'none' }}
              />
            </div>
            
            {/* Botão de limpeza do formulário */}
            {(conteudo || arquivos.length > 0) && (
              <button 
                type="button"
                className="btn-limpar"
                onClick={limparFormulario}
                disabled={enviando}
                title="Limpar formulário"
              >
                <i className="fas fa-eraser" />
                <span>Limpar</span>
              </button>
            )}
          </div>
          
          <div className="acoes-direita">
            <button 
              type="submit" 
              className="btn-enviar-comentario"
              disabled={disabled || enviando || (!conteudo.trim() && arquivos.length === 0)}
            >
              {enviando ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>A enviar...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Mensagem de erro, se existir */}
        {erro && (
          <div className="mensagem-erro">
            <i className="fas fa-exclamation-triangle" />
            <span>{erro}</span>
          </div>
        )}
        
        {/* Informações úteis para o utilizador */}
        <div className="form-info">
          <small>
            <i className="fas fa-info-circle" />
            Pressiona Enter para enviar ou Shift+Enter para nova linha.
            Tipos suportados: imagens, vídeos, PDF e documentos Word.
          </small>
        </div>
      </form>
    </div>
  );
};

export default NovoComentarioForm;