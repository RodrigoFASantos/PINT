import React, { useState } from 'react';
import axios from 'axios';
import './css/Criar_Conteudo_Modal.css';
import API_BASE from "../../api";

// Modal inicial de seleção de tipo que é chamado de CursoConteudos.jsx
const CriarConteudoModal = ({ pasta, onClose, onSuccess }) => {
  // Estado para gerenciar os modais
  const [modalAtual, setModalAtual] = useState('selecao-tipo');
  const [tipoSelecionado, setTipoSelecionado] = useState('');

  // Verificar se o conteúdo está associado a uma pasta de avaliação
  const isAvaliacao = pasta.isAvaliacao;

  // Função para fechar todos os modais
  const fecharTodosModais = () => {
    onClose();
  };

  // Handler para seleção de tipo
  const handleTipoSelecionado = (tipo) => {
    console.log(`Tipo selecionado: ${tipo}`);
    setTipoSelecionado(tipo);

    if (tipo === 'arquivo' || tipo === 'video') {
      setModalAtual('arquivo-modal');
    } else {
      setModalAtual('url-link-modal');
    }
  };

  return (
    <div className="criar-conteudo-overlay">
      {modalAtual === 'selecao-tipo' && (
        <div className="criar-conteudo-modal">
          <button className="close-btn" onClick={fecharTodosModais} type="button">×</button>

          <h2>Adicionar Conteúdo{isAvaliacao ? ' de Avaliação' : ''}</h2>
          {pasta && pasta.nome && (
            <p className="pasta-info">
              {pasta.nome}
              {isAvaliacao && <span className="avaliacao-badge"> (Avaliação)</span>}
            </p>
          )}

          <div className="tipo-botoes">
            {/* Botão Link - Amarelo */}
            <button
              type="button"
              className="tipo-btn"
              onClick={() => handleTipoSelecionado('link')}
              style={{ backgroundColor: "#f1c40f" }}
            >
              Link
            </button>

            {/* Botão Arquivo - Azul */}
            <button
              type="button"
              className="tipo-btn"
              onClick={() => handleTipoSelecionado('arquivo')}
              style={{ backgroundColor: "#3498db" }}
            >
              Arquivo
            </button>

            {/* Botão Vídeo - Vermelho */}
            <button
              type="button"
              className="tipo-btn"
              onClick={() => handleTipoSelecionado('video')}
              style={{ backgroundColor: "#e74c3c" }}
            >
              Vídeo
            </button>
          </div>
        </div>
      )}

      {modalAtual === 'url-link-modal' && (
        <UrlLinkModal
          tipo={tipoSelecionado}
          pasta={pasta}
          API_BASE={API_BASE}
          onClose={fecharTodosModais}
          onVoltar={() => setModalAtual('selecao-tipo')}
          onSuccess={onSuccess}
          isAvaliacao={isAvaliacao}
        />
      )}

      {modalAtual === 'arquivo-modal' && (
        <ArquivoModal
          pasta={pasta}
          API_BASE={API_BASE}
          onClose={fecharTodosModais}
          onVoltar={() => setModalAtual('selecao-tipo')}
          onSuccess={onSuccess}
          tipo={tipoSelecionado}
          isAvaliacao={isAvaliacao}
        />
      )}
    </div>
  );
};

// Modal para URL (Link)
const UrlLinkModal = ({ tipo, pasta, onClose, onVoltar, onSuccess, API_BASE, isAvaliacao }) => {
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const tipoLabel = 'Link';
  const placeholder = 'Digite a URL completa';

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
      formData.append('descricao', '');
      formData.append('id_pasta', pasta.id_pasta);
      formData.append('id_curso', pasta.id_curso);
      formData.append('url', url.trim());

      // Adicionar flag para indicar se é avaliação
      if (isAvaliacao) {
        formData.append('isAvaliacao', 'true');
      }

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
    <div className="criar-conteudo-modal">
      <button className="close-btn" onClick={onClose} type="button">×</button>

      <h2>Adicionar Link{isAvaliacao ? ' de Avaliação' : ''}</h2>
      {pasta && pasta.nome && (
        <p className="pasta-info">
          {pasta.nome}
          {isAvaliacao && <span className="avaliacao-badge"> (Avaliação)</span>}
        </p>
      )}

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

// Modal para Arquivo ou Vídeo
const ArquivoModal = ({ pasta, onClose, onVoltar, onSuccess, API_BASE, tipo, isAvaliacao }) => {
  const [arquivo, setArquivo] = useState(null);
  const [arquivoNome, setArquivoNome] = useState('');
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // Determina se estamos adicionando um arquivo comum ou um vídeo
  const isVideo = tipo === 'video';

  // Extensões de arquivo permitidas para vídeo
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

  // Aceitar apenas formatos de vídeo se tipo for vídeo
  const acceptAttribute = isVideo ?
    `.${videoExtensions.join(',.')}` :
    '*/*';

  const handleArquivoChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Verifica o tipo de arquivo se for vídeo
      if (isVideo) {
        const extension = selectedFile.name.split('.').pop().toLowerCase();
        if (!videoExtensions.includes(extension)) {
          setErro(`Formato de vídeo não suportado. Por favor, use um dos seguintes formatos: ${videoExtensions.join(', ')}`);
          return;
        }
      }

      setArquivo(selectedFile);
      setArquivoNome(selectedFile.name);
      setTitulo(selectedFile.name); // Preenche o título com o nome do arquivo por padrão
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
    setShowProgress(true);
    setErro('');

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      
      // CORREÇÃO: Enviar o tipo correto baseado na seleção do usuário
      if (isVideo) {
        formData.append('tipo', 'video');
      } else {
        formData.append('tipo', 'file');
      }
      
      // Manter compatibilidade com campo tipo_midia se necessário
      formData.append('tipo_midia', isVideo ? 'video' : 'documento');
      
      formData.append('titulo', titulo || arquivo.name);
      formData.append('descricao', '');
      formData.append('id_pasta', pasta.id_pasta);
      formData.append('id_curso', pasta.id_curso);
      formData.append('ficheiro', arquivo);

      // Adicionar flag para indicar se é avaliação
      if (isAvaliacao) {
        formData.append('isAvaliacao', 'true');
      }

      // Configura axios para monitorar o progresso do upload
      const response = await axios.post(`${API_BASE}/conteudos-curso`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Resposta da API:', response.data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar arquivo:', error);

      // Verifica se é um erro de tamanho de arquivo
      if (error.response && error.response.status === 413) {
        setErro('O arquivo é muito grande. Verifique as configurações de upload do servidor.');
      } else {
        setErro(error.response?.data?.message || 'Erro ao adicionar arquivo. Tente novamente.');
      }

      setEnviando(false);
      setShowProgress(false);
    }
  };

  return (
    <div className="criar-conteudo-modal">
      <button className="close-btn" onClick={onClose} type="button">×</button>

      <h2>Adicionar {isVideo ? 'Vídeo' : 'Arquivo'}{isAvaliacao ? ' de Avaliação' : ''}</h2>
      {pasta && pasta.nome && (
        <p className="pasta-info">
          {pasta.nome}
          {isAvaliacao && <span className="avaliacao-badge"> (Avaliação)</span>}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="arquivo">Selecione o {isVideo ? 'vídeo' : 'arquivo'}:</label>
          {isVideo && (
            <p className="help-text">Formatos suportados: {videoExtensions.join(', ')}</p>
          )}
          <input
            type="file"
            id="arquivo"
            name="ficheiro"
            accept={acceptAttribute}
            onChange={handleArquivoChange}
            required
          />
          <p className="file-info">
            {arquivo ? `${isVideo ? 'Vídeo' : 'Arquivo'} selecionado: ${arquivoNome}` : `Nenhum ${isVideo ? 'vídeo' : 'arquivo'} selecionado`}
          </p>
          {arquivo && <p className="file-size">Tamanho: {(arquivo.size / (1024 * 1024)).toFixed(2)} MB</p>}
        </div>

        <div className="form-group">
          <label htmlFor="titulo">Título (opcional):</label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={`Deixe em branco para usar o nome do ${isVideo ? 'vídeo' : 'arquivo'}`}
          />
        </div>

        {showProgress && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="progress-text">{uploadProgress}% Enviado</div>
          </div>
        )}

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
            {enviando ? 'Enviando...' : `Enviar ${isVideo ? 'Vídeo' : 'Arquivo'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CriarConteudoModal;