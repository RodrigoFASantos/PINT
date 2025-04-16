import React, { useState, useEffect } from 'react';
import './css/perfilUser.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE, { IMAGES } from '../api';

const PerfilUser = () => {
  const { currentUser, updateUserInfo } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    idade: ''
  });

  // Estados para upload de imagens
  const [avatarFile, setAvatarFile] = useState(null);
  const [capaFile, setCapaFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [capaPreview, setCapaPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUserInfo(response.data);
      setFormData({
        nome: response.data.nome || '',
        email: response.data.email || '',
        telefone: response.data.telefone || '',
        idade: response.data.idade || ''
      });

      // Configurar as URLs das imagens
      if (response.data.foto_perfil === 'AVATAR.png') {
        setAvatarPreview(IMAGES.DEFAULT_AVATAR);
      } else {
        setAvatarPreview(IMAGES.USER_AVATAR(response.data.email));
      }
      
      if (response.data.foto_capa === 'CAPA.png') {
        setCapaPreview(IMAGES.DEFAULT_CAPA);
      } else {
        setCapaPreview(IMAGES.USER_CAPA(response.data.email));
      }

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Não foi possível carregar os dados do perfil');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Modificado para prevenir o comportamento padrão do evento
  const handleEditToggle = (e) => {
    // IMPORTANTE: Prevenir o comportamento padrão do evento
    e.preventDefault();
    
    console.log("Botão de edição clicado. Estado atual de isEditing:", isEditing);
    
    setIsEditing(!isEditing);
    
    // Se estiver cancelando a edição, restaurar os dados originais
    if (isEditing && userInfo) {
      setFormData({
        nome: userInfo.nome || '',
        email: userInfo.email || '',
        telefone: userInfo.telefone || '',
        idade: userInfo.idade || ''
      });
      // Limpar arquivos de upload
      setAvatarFile(null);
      setCapaFile(null);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('imagem', file);
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/users/img/perfil`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setIsUploading(false);
      return response.data;
    } catch (error) {
      setIsUploading(false);
      console.error('Erro ao fazer upload do avatar:', error);
      toast.error('Falha ao enviar imagem de perfil');
      return null;
    }
  };

  const handleCapaUpload = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('imagem', file);
    formData.append('tipo', 'capa');
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/users/img/capa`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setIsUploading(false);
      return response.data;
    } catch (error) {
      setIsUploading(false);
      console.error('Erro ao fazer upload da capa:', error);
      toast.error('Falha ao enviar imagem de capa');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Formulário enviado com dados:", formData);

    try {
      const token = localStorage.getItem('token');

      // Atualizar dados do perfil
      const response = await axios.put(`${API_BASE}/users/perfil`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 200) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
        
        // Recarregar dados do perfil
        await fetchUserProfile();
        
        // Atualizar o contexto de autenticação se essa função existir
        if (typeof updateUserInfo === 'function') {
          updateUserInfo(userInfo);
        }
      } else {
        toast.error('Erro ao atualizar o perfil. Por favor, tente novamente.');
      }

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar o perfil: ' + (error.response?.data?.message || 'Erro desconhecido'));
    }
  };

  // Funções para lidar com cliques nas áreas de imagem
  const handleAvatarClick = () => {
    // Aciona o input de arquivo
    document.getElementById('avatar-upload').click();
  };

  const handleCapaClick = () => {
    // Aciona o input de arquivo
    document.getElementById('capa-upload').click();
  };

  // Função modificada para fazer upload automático
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast.error('Apenas imagens PNG são permitidas!');
        return;
      }

      setAvatarFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Toast de notificação
      toast.info('Enviando imagem de perfil...', {autoClose: false, toastId: 'uploading-avatar'});
      
      // Upload automático
      const result = await handleAvatarUpload(file);
      
      if (result) {
        toast.update('uploading-avatar', {
          render: 'Imagem de perfil atualizada com sucesso!',
          type: 'success',
          autoClose: 3000
        });
        
        // Recarrega o perfil para obter a URL atualizada
        await fetchUserProfile();
      } else {
        toast.update('uploading-avatar', {
          render: 'Falha ao enviar imagem de perfil',
          type: 'error',
          autoClose: 3000
        });
      }
    }
  };

  // Função modificada para fazer upload automático
  const handleCapaChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast.error('Apenas imagens PNG são permitidas!');
        return;
      }

      setCapaFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapaPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Toast de notificação
      toast.info('Enviando imagem de capa...', {autoClose: false, toastId: 'uploading-capa'});
      
      // Upload automático
      const result = await handleCapaUpload(file);
      
      if (result) {
        toast.update('uploading-capa', {
          render: 'Imagem de capa atualizada com sucesso!',
          type: 'success',
          autoClose: 3000
        });
        
        // Recarrega o perfil para obter a URL atualizada
        await fetchUserProfile();
      } else {
        toast.update('uploading-capa', {
          render: 'Falha ao enviar imagem de capa',
          type: 'error',
          autoClose: 3000
        });
      }
    }
  };

  if (!userInfo) {
    return (
      <div className="perfil-container">
        <Navbar toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="loading">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <Navbar toggleSidebar={toggleSidebar} userInfo={userInfo} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="perfil-content">
        <div className="perfil-capa" style={{ backgroundImage: `url('${capaPreview}')` }} onClick={isUploading ? null : handleCapaClick}>
          {/* Input oculto para upload de capa */}
          <input
            id="capa-upload"
            type="file"
            accept="image/png"
            onChange={handleCapaChange}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
          {isUploading && <div className="uploading-overlay">A enviar imagem...</div>}
        </div>

        <div className="perfil-info">
          <div className="perfil-avatar-container">
            <div className="perfil-avatar" style={{ backgroundImage: `url('${avatarPreview}')` }} onClick={isUploading ? null : handleAvatarClick}>
              {/* Input oculto para upload de avatar */}
              <input
                id="avatar-upload"
                type="file"
                accept="image/png"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              {isUploading && <div className="uploading-avatar-overlay">A enviar...</div>}
            </div>
          </div>

          {/* Note que aqui movemos o onSubmit APENAS para o formulário de salvar */}
          <div className="perfil-detalhes">
            <div className="perfil-header">
              <h2>{userInfo.nome}</h2>
              <span className="cargo-badge">{userInfo.cargo?.descricao || 'Cargo não definido'}</span>
            </div>

            <div className={`perfil-dados ${isEditing ? 'editing-mode' : ''}`}>
              {isEditing ? (
                <form id="edit-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nome</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="edit-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="edit-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefone</label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      required
                      className="edit-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Idade</label>
                    <input
                      type="number"
                      name="idade"
                      value={formData.idade}
                      onChange={handleInputChange}
                      required
                      min="18"
                      max="99"
                      className="edit-input"
                    />
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-item">
                    <span className="info-label">Nome:</span>
                    <span className="info-value">{userInfo.nome}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{userInfo.email}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Telefone:</span>
                    <span className="info-value">{userInfo.telefone}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Idade:</span>
                    <span className="info-value">{userInfo.idade}</span>
                  </div>
                </>
              )}
            </div>

            <div className="perfil-acoes">
              {isEditing ? (
                <>
                  <button type="submit" form="edit-form" className="btn-save">Guardar</button>
                  <button type="button" className="btn-cancel" onClick={handleEditToggle}>Cancelar</button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="btn-edit" 
                  onClick={handleEditToggle}
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default PerfilUser;