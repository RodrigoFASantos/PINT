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
  const { currentUser } = useAuth();
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
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
  
        // Usar URLs diretas para garantir o funcionamento
        if (response.data.foto_perfil === 'AVATAR.png') {
          setAvatarPreview(IMAGES.DEFAULT_AVATAR);
        } else {
          const userName = response.data.nome.toLowerCase().replace(/\s+/g, "-");
          setAvatarPreview(IMAGES.USER_AVATAR(userName));
        }
        
        if (response.data.foto_capa === 'CAPA.png') {
          setCapaPreview(IMAGES.DEFAULT_CAPA);
        } else {
          const userName = response.data.nome.toLowerCase().replace(/\s+/g, "-");
          setCapaPreview(IMAGES.USER_CAPA(userName));
        }
  
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast.error('Não foi possível carregar os dados do perfil');
      }
    };
  
    fetchUserProfile();
  }, [currentUser]);

  console.log("Avatar URL:", avatarPreview);
  console.log("Capa URL:", capaPreview);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/users/img/perfil`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/users/img/capa`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload da capa:', error);
      toast.error('Falha ao enviar imagem de capa');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      // Atualizar dados do perfil
      await axios.put(`${API_BASE}/users/perfil`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Upload de imagens se tiverem sido selecionadas
      let avatarUploaded = false;
      let capaUploaded = false;

      if (avatarFile) {
        const result = await handleAvatarUpload(avatarFile);
        avatarUploaded = !!result;
      }

      if (capaFile) {
        const result = await handleCapaUpload(capaFile);
        capaUploaded = !!result;
      }

      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);

      // Recarregar dados do perfil
      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUserInfo(response.data);

      // Atualizar previews com timestamp para forçar o reload
      if (avatarUploaded || capaUploaded) {
        const timestamp = new Date().getTime();
        const userName = response.data.nome.toLowerCase().replace(/\s+/g, "-");

        if (avatarUploaded) {
          setAvatarPreview(`${IMAGES.USER_AVATAR(userName)}?t=${timestamp}`);
        }

        if (capaUploaded) {
          setCapaPreview(`${IMAGES.USER_CAPA(userName)}?t=${timestamp}`);
        }
      }

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar o perfil: ' + (error.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const handleAvatarChange = (e) => {
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
    }
  };

  const handleCapaChange = (e) => {
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
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="perfil-content">
        <div className="perfil-capa" style={{ backgroundImage: `url('${capaPreview}')` }}>
          {/* Botão invisível que cobre toda a capa */}
          <label className="upload-capa-btn">
            <input
              type="file"
              accept="image/png"
              onChange={handleCapaChange}
            />
          </label>
        </div>

        <div className="perfil-info">
          <div className="perfil-avatar-container">
            <div className="perfil-avatar" style={{ backgroundImage: `url('${avatarPreview}')` }}>
              {/* Botão invisível que cobre todo o avatar */}
              <label className="upload-avatar-btn">
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="perfil-detalhes">
            <div className="perfil-header">
              <h2>{userInfo.nome}</h2>
              <span className="cargo-badge">{userInfo.cargo?.descricao || 'Cargo não definido'}</span>
            </div>

            <div className="perfil-dados">
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label>Nome</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
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
                    />
                  </div>
                </>
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
                  <button type="submit" className="btn-save">Salvar</button>
                  <button type="button" className="btn-cancel" onClick={handleEditToggle}>Cancelar</button>
                </>
              ) : (
                <button type="button" className="btn-edit" onClick={handleEditToggle}>Editar Perfil</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default PerfilUser;