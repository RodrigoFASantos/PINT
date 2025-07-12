import React, { useState, useRef, useEffect } from 'react';
import './css/Novo_Comentario_Form.css';

/**
 * Componente de formulário para criação de novos comentários
 * 
 * Funcionalidades implementadas:
 * - Editor de texto com altura automática e suporte multilinha
 * - Sistema completo de upload com preview inteligente
 * - Validação rigorosa de conteúdo e tipos de ficheiro
 * - Estados visuais claros para feedback do utilizador
 * - Integração perfeita com sistema de avaliações
 * - Limpeza automática de recursos e memória
 * - Suporte para diferentes tipos de anexos
 */
const NovoComentarioForm = ({ 
  onSubmit, 
  disabled = false, 
  placeholder = "Escreve o teu comentário...",
  maxFileSize = 15 * 1024 * 1024, // 15MB por defeito
  allowedTypes = ['image/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}) => {
  // Estados principais do formulário
  const [conteudo, setConteudo] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  
  // Estados para sistema de preview avançado
  const [previewUrls, setPreviewUrls] = useState([]);
  const [tiposArquivos, setTiposArquivos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Referências para elementos DOM
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  /**
   * Ajusta automaticamente a altura da textarea baseado no conteúdo
   * Implementa limite máximo para evitar textarea excessivamente alta
   */
  const ajustarAlturaTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  /**
   * Reajusta altura sempre que o conteúdo muda
   */
  useEffect(() => {
    ajustarAlturaTextarea();
  }, [conteudo]);

  /**
   * Determina o tipo de ficheiro baseado no MIME type
   * Categoriza inteligentemente para renderização apropriada
   */
  const determinarTipoFicheiro = (file) => {
    const mimeType = file.type;
    if (mimeType.startsWith('image/')) {
      return 'imagem';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.includes('pdf')) {
      return 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'documento';
    } else {
      return 'ficheiro';
    }
  };

  /**
   * Valida ficheiro individualmente antes de aceitar
   * Verifica tipo, tamanho e integridade
   */
  const validarFicheiro = (file) => {
    const erros = [];

    // Validação de tamanho
    if (file.size > maxFileSize) {
      erros.push(`O ficheiro "${file.name}" é muito grande. Máximo permitido: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Validação de tipo
    const tipoValido = allowedTypes.some(tipo => {
      if (tipo.endsWith('/*')) {
        return file.type.startsWith(tipo.slice(0, -2));
      }
      return file.type === tipo;
    });

    if (!tipoValido) {
      erros.push(`O tipo do ficheiro "${file.name}" não é suportado`);
    }

    // Validação de nome
    if (file.name.length > 100) {
      erros.push(`O nome do ficheiro "${file.name}" é muito longo`);
    }

    return erros;
  };

  /**
   * Cria URLs de preview para ficheiros selecionados
   * Gere recursos de memória de forma eficiente
   */
  const criarPreviewUrls = (files) => {
    const urls = [];
    const tipos = [];

    files.forEach(file => {
      const tipo = determinarTipoFicheiro(file);
      tipos.push(tipo);

      if (tipo === 'imagem' || tipo === 'video') {
        try {
          const url = URL.createObjectURL(file);
          urls.push(url);
        } catch (error) {
          urls.push(null);
        }
      } else {
        urls.push(null);
      }
    });

    return { urls, tipos };
  };

  /**
   * Liberta recursos de memória das URLs de preview
   * Previne vazamentos de memória no navegador
   */
  const limparPreviewUrls = () => {
    previewUrls.forEach(url => {
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          // Falha silenciosa
        }
      }
    });
  };

  /**
   * Processa seleção de ficheiros pelo utilizador
   * Inclui validação completa e feedback de erros
   */
  const handleArquivoChange = (e) => {
    const novosArquivos = Array.from(e.target.files);
    
    if (novosArquivos.length === 0) return;

    setErro('');
    
    // Validação completa de todos os ficheiros
    const errosValidacao = [];
    const arquivosValidos = [];

    novosArquivos.forEach(file => {
      const errosFicheiro = validarFicheiro(file);
      if (errosFicheiro.length === 0) {
        arquivosValidos.push(file);
      } else {
        errosValidacao.push(...errosFicheiro);
      }
    });

    // Exibe erros de validação se existirem
    if (errosValidacao.length > 0) {
      setErro(errosValidacao.join('. '));
      return;
    }

    // Limita a um ficheiro por vez (limitação do backend)
    const arquivoFinal = arquivosValidos.slice(0, 1);

    // Limpa previews antigos
    limparPreviewUrls();

    // Cria novos previews
    const { urls, tipos } = criarPreviewUrls(arquivoFinal);
    
    setArquivos(arquivoFinal);
    setPreviewUrls(urls);
    setTiposArquivos(tipos);
  };

  /**
   * Remove ficheiro específico da lista
   * Atualiza todos os estados relacionados
   */
  const removerArquivo = (index) => {
    // Remove URL de preview da memória
    if (previewUrls[index]) {
      try {
        URL.revokeObjectURL(previewUrls[index]);
      } catch (error) {
        // Falha silenciosa
      }
    }

    // Atualiza estados
    const novosArquivos = arquivos.filter((_, i) => i !== index);
    const novasUrls = previewUrls.filter((_, i) => i !== index);
    const novosTipos = tiposArquivos.filter((_, i) => i !== index);

    setArquivos(novosArquivos);
    setPreviewUrls(novasUrls);
    setTiposArquivos(novosTipos);

    // Limpa input file se não há mais ficheiros
    if (novosArquivos.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Processa envio do formulário com validação completa
   * Inclui progresso de upload e tratamento robusto de erros
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
    setUploadProgress(0);
    
    // Criação do FormData para envio multipart
    const formData = new FormData();
    formData.append('texto', conteudo.trim());
    
    // Adiciona ficheiro se existir
    if (arquivos.length > 0) {
      formData.append('anexo', arquivos[0]);
    }
    
    try {
      // Simula progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const resultado = await onSubmit(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Verifica se o envio foi bem-sucedido
      if (resultado !== false && resultado !== null && resultado !== undefined) {
        setTimeout(() => {
          limparFormulario();
        }, 500);
      } else {
        setErro('Erro ao enviar comentário. Verifica a ligação e tenta novamente.');
      }
    } catch (error) {
      const mensagemErro = error.response?.data?.message || error.message || 'Erro desconhecido';
      setErro(`Erro ao enviar comentário: ${mensagemErro}`);
    } finally {
      setEnviando(false);
      setUploadProgress(0);
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
    setUploadProgress(0);
    
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
    
    if (e.key === 'Escape') {
      limparFormulario();
    }
  };

  /**
   * Formata tamanho de ficheiro para apresentação
   */
  const formatarTamanhoFicheiro = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Renderiza preview específico baseado no tipo de ficheiro
   */
  const renderizarPreview = (file, index) => {
    const tipo = tiposArquivos[index];
    const url = previewUrls[index];

    const previewBase = (
      <div className="preview-info">
        <span className="nome-ficheiro" title={file.name}>
          {file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name}
        </span>
        <span className="tamanho-ficheiro">
          {formatarTamanhoFicheiro(file.size)}
        </span>
      </div>
    );

    if (tipo === 'imagem' && url) {
      return (
        <div className="preview-container preview-imagem">
          <div className="preview-media">
            <img src={url} alt={`Preview ${index}`} />
          </div>
          {previewBase}
        </div>
      );
    } else if (tipo === 'video' && url) {
      return (
        <div className="preview-container preview-video">
          <div className="preview-media">
            <video src={url} controls preload="metadata" />
          </div>
          {previewBase}
        </div>
      );
    } else {
      return (
        <div className="preview-container preview-documento">
          <div className="preview-icon">
            <i className={`fas ${tipo === 'pdf' ? 'fa-file-pdf' : 'fa-file-alt'}`} />
          </div>
          {previewBase}
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
      <form ref={formRef} onSubmit={handleSubmit} className="comentario-form">
        
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
          
          {/* Barra de progresso durante upload */}
          {enviando && uploadProgress > 0 && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        
        {/* Preview dos ficheiros selecionados */}
        {arquivos.length > 0 && (
          <div className="ficheiros-preview">
            <h4 className="preview-titulo">
              <i className="fas fa-paperclip" />
              Ficheiro anexado:
            </h4>
            <div className="lista-previews">
              {arquivos.map((arquivo, index) => (
                <div key={index} className={`preview-item preview-${tiposArquivos[index]}`}>
                  {renderizarPreview(arquivo, index)}
                  
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
                accept={allowedTypes.join(',')}
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
                title="Limpar formulário (Esc)"
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
            <strong>Atalhos:</strong> Enter para enviar, Shift+Enter para nova linha, Esc para limpar.
            <br />
            <strong>Ficheiros suportados:</strong> Imagens, vídeos, PDF e documentos Word (máx. {(maxFileSize / 1024 / 1024).toFixed(0)}MB).
          </small>
        </div>
      </form>
    </div>
  );
};

export default NovoComentarioForm;