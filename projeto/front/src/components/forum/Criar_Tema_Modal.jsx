import React, { useState, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import './css/Criar_Tema_Modal.css';

const CriarTemaModal = ({ topicoId, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [previewAnexo, setPreviewAnexo] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!texto.trim() && !titulo.trim() && !anexo) {
      setErro('É necessário fornecer título, texto ou anexo para o tema.');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('titulo', titulo);
      formData.append('texto', texto);

      if (anexo) {
        formData.append('anexo', anexo);
      }

      // Usar o endpoint correto para o Forum_Tema_ctrl.js
      const response = await axios.post(
        `${API_BASE}/forum-tema/topico/${topicoId}/tema`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data && response.data.success) {
        console.log('Tema criado com sucesso', response.data);
        onSuccess(response.data.data);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao criar tema:', error);

      setErro(
        error.response?.data?.message ||
        error.message ||
        'Ocorreu um erro ao criar o tema. Tente novamente.'
      );

      setEnviando(false);
    }
  };

  const handleAnexoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAnexo(file);

    // Criar preview do anexo
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewAnexo(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewAnexo(file.name);
    }
  };

  const removerAnexo = () => {
    setAnexo(null);
    setPreviewAnexo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="criar-tema-modal">
        <button className="fechar-modal" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <h2>Criar Novo Tema</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do tema (opcional)"
              className="titulo-input"
            />
          </div>

          <div className="form-group">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Sobre o que deseja conversar? Inicie uma discussão ou coloque uma pergunta..."
              rows="6"
            ></textarea>
          </div>

          {previewAnexo && (
            <div className="anexo-preview">
              {anexo && anexo.type.startsWith('image/') ? (
                <img
                  src={previewAnexo}
                  alt="Preview"
                  className="img-preview"
                />
              ) : (
                <div className="file-preview">
                  <i className="fas fa-file"></i>
                  <span>{previewAnexo}</span>
                </div>
              )}

              <button
                type="button"
                className="remover-anexo"
                onClick={removerAnexo}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <div className="form-actions">
            <div className="acoes-esquerda">
              <button
                type="button"
                className="btn-anexo"
                onClick={() => fileInputRef.current.click()}
              >
                <i className="fas fa-paperclip"></i>
                <span>Anexar</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAnexoChange}
                style={{ display: 'none' }}
                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>

            <button
              type="submit"
              className="btn-publicar"
              disabled={enviando || (!texto.trim() && !titulo.trim() && !anexo)}
            >
              {enviando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>

          {erro && <p className="erro-mensagem">{erro}</p>}
        </form>
      </div>
    </div>
  );
};

export default CriarTemaModal;