import React, { useState } from "react";
import "./css/cursoConteudoFicheiroModal.css";

const Curso_Conteudo_ficheiro_Modal = ({ conteudo, onClose, API_BASE }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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

  return (
    <div className="modal-overlay">
      {!isDownloadModalOpen ? (
        <div className="modal-container">
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
                {getFileType(conteudo.arquivo_path).includes('pdf') ? '📄' : 
                 getFileType(conteudo.arquivo_path).includes('image') ? '🖼️' : 
                 getFileType(conteudo.arquivo_path).includes('video') ? '🎬' : 
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
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 500px;
          width: 90%;
        }
        
        .modal-container h2 {
          margin-top: 0;
          margin-bottom: 20px;
        }
        
        .modal-download, .modal-view, .modal-close {
          margin: 10px 0;
          padding: 10px 20px;
          border-radius: 4px;
          border: none;
          font-size: 16px;
          cursor: pointer;
          width: 100%;
          text-align: center;
          text-decoration: none;
          display: block;
        }
        
        .modal-download {
          background-color: #4a90e2;
          color: white;
        }
        
        .modal-view {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .modal-close {
          background-color: #e0e0e0;
          color: #666;
        }
        
        .download-modal {
          background-color: white;
          border-radius: 8px;
          width: 500px;
          max-width: 90%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }
        
        .modal-content {
          padding: 20px;
        }
        
        .file-info {
          display: flex;
          margin-bottom: 20px;
        }
        
        .file-icon {
          font-size: 48px;
          margin-right: 20px;
        }
        
        .file-details h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }
        
        .file-details p {
          margin: 4px 0;
          color: #666;
          font-size: 14px;
        }
        
        .download-progress {
          margin: 20px 0;
        }
        
        .progress-bar {
          height: 10px;
          background-color: #f0f0f0;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #4a90e2;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        
        .download-actions {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        
        .download-button {
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .download-button:hover {
          background-color: #3a7bc8;
        }
        
        .modal-footer {
          padding: 12px 20px;
          border-top: 1px solid #eaeaea;
        }
        
        .disclaimer {
          margin: 0;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default Curso_Conteudo_ficheiro_Modal;