import React, { useState, useRef } from "react";
import "./css/Curso_Conteudo_Ficheiro_Modal.css";

/**
 * Componente modal para visualização e download de ficheiros de curso
 * Permite ao utilizador visualizar informações do ficheiro, fazer download e pré-visualizar conteúdo
 * 
 * @param {Object} conteudo - Objeto com informações do ficheiro (título, arquivo_path)
 * @param {Function} onClose - Função callback para fechar o modal
 * @param {string} API_BASE - URL base da API para construir caminhos dos ficheiros
 */
const Curso_Conteudo_ficheiro_Modal = ({ conteudo, onClose, API_BASE }) => {
  // Estados para controlar o progresso e UI do download
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Referência para o elemento de vídeo quando aplicável
  const videoRef = useRef(null);

  // Se não há conteúdo, não renderiza nada
  if (!conteudo) return null;

  /**
   * Extrai o nome do ficheiro a partir do caminho completo
   * Remove a estrutura de pastas e mantém apenas o nome do ficheiro
   * 
   * @param {string} path - Caminho completo do ficheiro
   * @returns {string} Nome do ficheiro ou "arquivo" se inválido
   */
  const getFileName = (path) => {
    if (!path) return "arquivo";
    return path.split("/").pop();
  };

  /**
   * Determina o tipo MIME do ficheiro baseado na sua extensão
   * Usado para mostrar ícones apropriados e configurar downloads
   * 
   * @param {string} path - Caminho do ficheiro
   * @returns {string} Tipo MIME correspondente
   */
  const getFileType = (path) => {
    if (!path) return "application/octet-stream";
    const extension = path.split(".").pop().toLowerCase();

    // Mapeamento de extensões para tipos MIME
    const typeMap = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'mp3': 'audio/mpeg',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };

    return typeMap[extension] || 'application/octet-stream';
  };

  /**
   * Verifica se o ficheiro é um vídeo baseado na extensão
   * 
   * @param {string} path - Caminho do ficheiro
   * @returns {boolean} True se for vídeo, false caso contrário
   */
  const isVideoFile = (path) => {
    if (!path) return false;
    const extension = path.split(".").pop().toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    return videoExtensions.includes(extension);
  };

  /**
   * Simula o tamanho do ficheiro para demonstração
   * Gera um valor aleatório entre 10KB e 15GB
   * 
   * @returns {number} Tamanho simulado em bytes
   */
  const simulateFileSize = () => {
    const minSize = 10 * 1024; // 10KB
    const maxSize = 15 * 1024 * 1024 * 1024; // 15GB
    return Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  };

  /**
   * Formata o tamanho do ficheiro para apresentação legível
   * Converte bytes para KB, MB ou GB conforme apropriado
   * 
   * @param {number} size - Tamanho em bytes
   * @returns {string} Tamanho formatado com unidade
   */
  const formatFileSize = (size) => {
    if (!size) return 'Desconhecido';
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  /**
   * Executa o download do ficheiro com simulação de progresso
   * Usa fetch para obter o ficheiro como blob e força o download
   */
  const handleDownload = () => {
    setIsDownloading(true);

    // Constrói o URL completo do ficheiro
    const fileUrl = `${API_BASE}/${conteudo.arquivo_path}`;
    const fileName = conteudo.titulo || getFileName(conteudo.arquivo_path);

    // Simulação visual do progresso de download
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        // Download efetivo do ficheiro usando fetch
        fetch(fileUrl)
          .then(response => response.blob())
          .then(blob => {
            // Cria URL temporário para o blob
            const blobUrl = window.URL.createObjectURL(blob);

            // Cria elemento de link temporário para forçar download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.style.display = 'none';

            // Executa o download
            document.body.appendChild(link);
            link.click();

            // Limpeza após download
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);

              // Reset do estado do modal
              setIsDownloading(false);
              setDownloadProgress(0);
              setIsDownloadModalOpen(false);
            }, 100);
          })
          .catch(error => {
            console.error('Erro ao fazer download do arquivo:', error);
            setIsDownloading(false);
            setDownloadProgress(0);
            alert('Ocorreu um erro ao baixar o arquivo. Por favor, tente novamente.');
          });
      }
    }, 300);
  };

  /**
   * Abre o modal de confirmação de download
   */
  const openDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };

  /**
   * Carrega o vídeo apenas quando solicitado pelo utilizador
   * Otimização para evitar carregar vídeos desnecessariamente
   */
  const handleLoadVideo = () => {
    if (!videoLoaded && videoRef.current) {
      setVideoLoaded(true);
      videoRef.current.src = `${API_BASE}/${conteudo.arquivo_path}`;
      videoRef.current.load();
    }
  };

  return (
    <div className="modal-overlay">
      {!isDownloadModalOpen ? (
        // Modal principal com opções básicas
        <div className="modal-container">
          {/* Botão de fechar no canto superior direito */}
          <button onClick={onClose} className="modal-close-x">
            &times;
          </button>

          <h2>{conteudo.titulo}</h2>
          
          <button
            onClick={openDownloadModal}
            className="modal-download"
          >
            Descarregar
          </button>

          <a
            href={`${API_BASE}/${conteudo.arquivo_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-view"
          >
            Visualizar
          </a>
        </div>
      ) : (
        // Modal de download com informações detalhadas
        <div className="download-modal">
          <div className="modal-header">
            <h3>Descarregar Ficheiro</h3>
            <button className="close-button" onClick={() => setIsDownloadModalOpen(false)}>
              &times;
            </button>
          </div>

          <div className="modal-content">
            {/* Informações do ficheiro com ícone apropriado */}
            <div className="file-info">
              <div className="file-icon">
                {getFileType(conteudo.arquivo_path).includes('video') ? '🎬' :
                  getFileType(conteudo.arquivo_path).includes('pdf') ? '📄' :
                    getFileType(conteudo.arquivo_path).includes('image') ? '🖼️' :
                      getFileType(conteudo.arquivo_path).includes('audio') ? '🎵' : '📁'}
              </div>
              <div className="file-details">
                <h4>{conteudo.titulo || getFileName(conteudo.arquivo_path)}</h4>
                <p>Tipo: {getFileType(conteudo.arquivo_path)}</p>
                <p>Tamanho: {formatFileSize(simulateFileSize())}</p>
              </div>
            </div>

            {/* Barra de progresso durante download ou botão de download */}
            {isDownloading ? (
              <div className="download-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="progress-text">{downloadProgress}%</div>
              </div>
            ) : (
              <div className="download-actions">
                <button className="download-button" onClick={handleDownload}>
                  Descarregar Agora
                </button>
              </div>
            )}
          </div>

          {/* Rodapé com termos de serviço */}
          <div className="modal-footer">
            <p className="disclaimer">
              Ao fazer o download, concorda com os nossos termos de serviço.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curso_Conteudo_ficheiro_Modal;