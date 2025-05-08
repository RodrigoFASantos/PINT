import React, { useState, useRef } from "react";
import "./css/Curso_Conteudo_Ficheiro_Modal.css";

const Curso_Conteudo_ficheiro_Modal = ({ conteudo, onClose, API_BASE }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  if (!conteudo) return null;

  // Extrair o nome do arquivo original da path, caso o título não esteja disponível
  const getFileName = (path) => {
    if (!path) return "arquivo";
    return path.split("/").pop();
  };

  // Função para determinar o tipo de arquivo baseado na extensão
  const getFileType = (path) => {
    if (!path) return "application/octet-stream";
    const extension = path.split(".").pop().toLowerCase();

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

  // Verifica se é um arquivo de vídeo com base na extensão
  const isVideoFile = (path) => {
    if (!path) return false;
    const extension = path.split(".").pop().toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    return videoExtensions.includes(extension);
  };

  // Simulação do tamanho do arquivo - atualizada para o intervalo pedido (10KB a 15GB)
  const simulateFileSize = () => {
    // 10KB = 10 * 1024 bytes
    // 15GB = 15 * 1024 * 1024 * 1024 bytes
    const minSize = 10 * 1024; // 10KB
    const maxSize = 15 * 1024 * 1024 * 1024; // 15GB
    return Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  };

  // Formatação do tamanho do arquivo
  const formatFileSize = (size) => {
    if (!size) return 'Desconhecido';
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDownload = () => {
    setIsDownloading(true);

    // Caminho completo do arquivo
    const fileUrl = `${API_BASE}/${conteudo.arquivo_path}`;
    const fileName = conteudo.titulo || getFileName(conteudo.arquivo_path);

    // Simulação de progresso de download
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        // Método 1: Usar fetch para forçar o download como blob
        fetch(fileUrl)
          .then(response => response.blob())
          .then(blob => {
            // Criar URL do objeto para o blob
            const blobUrl = window.URL.createObjectURL(blob);

            // Criar um elemento de link temporário
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName; // Isso força o download em vez de abrir
            link.style.display = 'none';

            // Adicionar ao DOM, clicar e remover
            document.body.appendChild(link);
            link.click();

            // Limpar depois de um pequeno atraso
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl); // Liberar memória

              // Resetar o estado após download completo
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

  const openDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };

  const handleLoadVideo = () => {
    if (!videoLoaded && videoRef.current) {
      setVideoLoaded(true);
      // Configura o src do vídeo somente quando é solicitado
      videoRef.current.src = `${API_BASE}/${conteudo.arquivo_path}`;
      videoRef.current.load();
    }
  };

  return (
    <div className="modal-overlay">
      {!isDownloadModalOpen ? (
        <div className="modal-container">
          <h2>{conteudo.titulo}</h2>

          {/* Se for um arquivo de vídeo, mostrar o player */}
          {isVideoFile(conteudo.arquivo_path) && (
            <div className="video-player-container">
              {!videoLoaded ? (
                <div className="video-placeholder" onClick={handleLoadVideo}>
                  <div className="video-play-button">
                    <i className="fas fa-play"></i>
                  </div>
                  <div className="video-placeholder-text">
                    Clique para carregar o vídeo
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="video-player"
                  controls
                  controlsList="nodownload"
                  playsInline
                >
                  <source type={getFileType(conteudo.arquivo_path)} />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              )}
            </div>
          )}

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

          <button onClick={onClose} className="modal-close">
            Fechar
          </button>
        </div>
      ) : (
        <div className="download-modal">
          <div className="modal-header">
            <h3>Descarregar Ficheiro</h3>
            <button className="close-button" onClick={() => setIsDownloadModalOpen(false)}>&times;</button>
          </div>

          <div className="modal-content">
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

          <div className="modal-footer">
            <p className="disclaimer">
              Ao fazer o download, você concorda com os nossos termos de serviço.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Curso_Conteudo_ficheiro_Modal;