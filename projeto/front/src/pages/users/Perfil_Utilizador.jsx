import React, { useState, useEffect } from 'react';
import './css/Perfil_Utilizador.css';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE, { IMAGES } from '../../api';

/**
 * Componente do perfil do utilizador
 * Permite visualizar e editar informações pessoais
 */
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

  // Estados para dados específicos de formador
  const [formadorData, setFormadorData] = useState({
    categorias: [],
    cursosInscritos: [],
    cursosMinistrados: []
  });
  const [isFormador, setIsFormador] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados para upload de imagens
  const [avatarFile, setAvatarFile] = useState(null);
  const [capaFile, setCapaFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [capaPreview, setCapaPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Estado para controlo de abas
  const [activeTab, setActiveTab] = useState('ministrados');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Alternar entre abas
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Inicialização do componente
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        await fetchUserProfile();

        if (isMounted) {
          // Perfil carregado com sucesso
        }
      } catch (error) {
        if (isMounted) {
          toast.error('Erro ao carregar dados. A tentar novamente em 5 segundos...');

          setTimeout(() => {
            if (isMounted) {
              loadProfile();
            }
          }, 5000);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Carregar perfil do utilizador
   */
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

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

      // Verificar tipo de utilizador
      setIsFormador(response.data.id_cargo === 2);
      setIsAdmin(response.data.id_cargo === 1);

      // Carregar dados específicos de formador
      if (response.data.id_cargo === 2) {
        await fetchFormadorData();
      }

      // Configurar URLs das imagens com timestamp anti-cache
      const timestamp = Date.now();
      const cacheParam = `t=${timestamp}&force=true`;

      if (response.data.foto_perfil === 'AVATAR.png') {
        setAvatarPreview(IMAGES.DEFAULT_AVATAR);
      } else {
        const avatarUrl = `${IMAGES.USER_AVATAR(response.data.email)}?${cacheParam}`;
        setAvatarPreview(avatarUrl);
      }

      if (response.data.foto_capa === 'CAPA.png') {
        setCapaPreview(IMAGES.DEFAULT_CAPA);
      } else {
        const capaUrl = `${IMAGES.USER_CAPA(response.data.email)}?${cacheParam}`;
        setCapaPreview(capaUrl);
      }

      // Limpeza de cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

    } catch (error) {
      toast.error('Não foi possível carregar os dados do perfil');
    }
  };

  /**
   * Carregar dados específicos de formador
   */
  const fetchFormadorData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get(`${API_BASE}/formadores/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setFormadorData(response.data);

    } catch (error) {
      toast.error('Não foi possível carregar os dados específicos do formador');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Alternar modo de edição
   */
  const handleEditToggle = (e) => {
    e.preventDefault();
    setIsEditing(!isEditing);

    if (isEditing && userInfo) {
      setFormData({
        nome: userInfo.nome || '',
        email: userInfo.email || '',
        telefone: userInfo.telefone || '',
        idade: userInfo.idade || ''
      });
      setAvatarFile(null);
      setCapaFile(null);
    }
  };

  /**
   * Upload da foto de perfil
   */
  const handleAvatarUpload = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('imagem', file);

    if (userInfo && userInfo.email) {
      formData.append('email', userInfo.email);
    }

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
      toast.error('Falha ao enviar imagem de perfil: ' + (error.response?.data?.message || error.message));
      return null;
    }
  };

  /**
   * Upload da foto de capa
   */
  const handleCapaUpload = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('imagem', file);

    if (userInfo && userInfo.email) {
      formData.append('email', userInfo.email);
    }

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
      toast.error('Falha ao enviar imagem de capa: ' + (error.response?.data?.message || error.message));
      return null;
    }
  };

  /**
   * Submeter alterações do perfil
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(`${API_BASE}/users/perfil`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 200) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);

        await fetchUserProfile();

        if (typeof updateUserInfo === 'function') {
          updateUserInfo(userInfo);
        }
      } else {
        toast.error('Erro ao atualizar o perfil. Por favor, tente novamente.');
      }

    } catch (error) {
      toast.error('Erro ao atualizar o perfil: ' + (error.response?.data?.message || 'Erro desconhecido'));
    }
  };

  /**
   * Acionar upload de avatar
   */
  const handleAvatarClick = () => {
    document.getElementById('avatar-upload').click();
  };

  /**
   * Acionar upload de capa
   */
  const handleCapaClick = () => {
    document.getElementById('capa-upload').click();
  };

  /**
   * Processar mudança de avatar
   */
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

      toast.info('A enviar imagem de perfil...', { autoClose: false, toastId: 'uploading-avatar' });

      try {
        const result = await handleAvatarUpload(file);

        if (result) {
          toast.update('uploading-avatar', {
            render: 'Imagem de perfil atualizada com sucesso!',
            type: 'success',
            autoClose: 3000
          });

          await fetchUserProfile();
        } else {
          toast.update('uploading-avatar', {
            render: 'Falha ao enviar imagem de perfil',
            type: 'error',
            autoClose: 3000
          });
        }
      } catch (error) {
        toast.update('uploading-avatar', {
          render: `Erro ao enviar imagem: ${error.message}`,
          type: 'error',
          autoClose: 3000
        });
      }
    }
  };

  /**
   * Processar mudança de capa
   */
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

      toast.info('A enviar imagem de capa...', { autoClose: false, toastId: 'uploading-capa' });

      try {
        const result = await handleCapaUpload(file);

        if (result) {
          toast.update('uploading-capa', {
            render: 'Imagem de capa atualizada com sucesso!',
            type: 'success',
            autoClose: 3000
          });

          await fetchUserProfile();
        } else {
          toast.update('uploading-capa', {
            render: 'Falha ao enviar imagem de capa',
            type: 'error',
            autoClose: 3000
          });
        }
      } catch (error) {
        toast.update('uploading-capa', {
          render: `Erro ao enviar imagem: ${error.message}`,
          type: 'error',
          autoClose: 3000
        });
      }
    }
  };

  /**
   * Terminar sessão
   */
  const handleLogout = () => {
    localStorage.removeItem('token');

    if (typeof updateUserInfo === 'function') {
      updateUserInfo(null);
    }

    toast.success('Sessão terminada com sucesso!');

    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  };

  if (!userInfo) {
    return (
      <div className="perfil-container">
        <Navbar toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="loading-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>A carregar perfil...</p>
            <p className="loading-tip">Se esta tela persistir por mais de 10 segundos,
              <span className="reload-link" onClick={() => window.location.reload()}>
                clique aqui para recarregar
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <Navbar toggleSidebar={toggleSidebar} userInfo={userInfo} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="perfil-content">
        {/* Foto de capa */}
        <div className="perfil-capa" style={{ backgroundImage: `url('${capaPreview}')` }} onClick={isUploading ? null : handleCapaClick}>
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

        {/* Botão de configurações */}
        <button
          className="btn-settings-gear"
          onClick={handleEditToggle}
          title="Editar Perfil"
          aria-label="Editar Perfil"
        >
          <i className="fas fa-cog"></i>
        </button>

        <div className="perfil-info">
          <div className="perfil-avatar-container">
            <div className="perfil-avatar" style={{ backgroundImage: `url('${avatarPreview}')` }} onClick={isUploading ? null : handleAvatarClick}>
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

          <div className="perfil-detalhes">
            <div className="perfil-header">
              <h2>{userInfo.nome}</h2>
              <span className="cargo-badge">{userInfo.cargo?.descricao || 'Cargo não definido'}</span>
            </div>

            <div className={`perfil-dados ${isEditing ? 'editing-mode' : ''}`}>
              {isEditing ? (
                <form id="edit-form" onSubmit={handleSubmit}>
                  <div className="colunas-input">
                    <div className="coluna coluna-nome">
                      <div className="form-group">
                        <input
                          type="text"
                          name="nome"
                          value={formData.nome}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="coluna coluna-email">
                      <div className="form-group">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="coluna coluna-telefone">
                      <div className="form-group">
                        <input
                          type="tel"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="coluna coluna-idade">
                      <div className="form-group">
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
                    </div>

                    <div className="coluna coluna-botoes">
                      <button type="submit" className="btn-action-icon btn-save-icon" title="Guardar">
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon btn-cancel-icon"
                        onClick={handleEditToggle}
                        title="Cancelar"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
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

            {/* Especializações para formadores */}
            {isFormador && (
              <div className="formador-categorias-areas">
                <h3>Especializações</h3>
                <div className="categorias-areas-list">
                  {formadorData.categorias.length > 0 ? (
                    formadorData.categorias.map(categoria => (
                      <div key={categoria.id} className="categoria-item">
                        <strong>{categoria.nome}:</strong> {
                          categoria.areas.length > 0
                            ? categoria.areas.map(area => area.nome).join(', ')
                            : 'Nenhuma área específica'
                        }
                      </div>
                    ))
                  ) : (
                    <p>Nenhuma categoria ou área associada.</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="admin-actions">
                    <button className="btn-edit btn-sm">Editar Especializações</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Cursos do formador */}
        {isFormador && (
          <div className="formador-cursos-section">
            <div className="cursos-tabs">
              <button
                className={`cursos-tab ${activeTab === 'ministrados' ? 'active' : ''}`}
                onClick={() => handleTabChange('ministrados')}
              >
                Cursos Administrados
              </button>
              <button
                className={`cursos-tab ${activeTab === 'inscritos' ? 'active' : ''}`}
                onClick={() => handleTabChange('inscritos')}
              >
                Cursos Inscritos
              </button>
            </div>

            <div className="cursos-content">
              {/* Cursos ministrados */}
              <div
                className="cursos-table-container"
                style={{ display: activeTab === 'ministrados' ? 'block' : 'none' }}
              >
                {formadorData.cursosMinistrados && formadorData.cursosMinistrados.length > 0 ? (
                  <table className="cursos-table">
                    <thead>
                      <tr>
                        <th>Nome do Curso</th>
                        <th>Categoria</th>
                        <th>Área</th>
                        <th>Tipo</th>
                        <th>Data Início</th>
                        <th>Data Fim</th>
                        <th>Vagas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formadorData.cursosMinistrados.map(curso => (
                        <tr key={curso.id}>
                          <td>{curso.nome}</td>
                          <td>{curso.categoria}</td>
                          <td>{curso.area}</td>
                          <td>{curso.tipo}</td>
                          <td>{new Date(curso.dataInicio).toLocaleDateString()}</td>
                          <td>{new Date(curso.dataFim).toLocaleDateString()}</td>
                          <td>{curso.vagas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message"> não está a ministrar nenhum curso atualmente.</p>
                )}
              </div>

              {/* Cursos inscritos */}
              <div
                className="cursos-table-container"
                style={{ display: activeTab === 'inscritos' ? 'block' : 'none' }}
              >
                {formadorData.cursosInscritos && formadorData.cursosInscritos.length > 0 ? (
                  <table className="cursos-table">
                    <thead>
                      <tr>
                        <th>Nome do Curso</th>
                        <th>Categoria</th>
                        <th>Área</th>
                        <th>Tipo</th>
                        <th>Data Início</th>
                        <th>Data Fim</th>
                        <th>Data Inscrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formadorData.cursosInscritos.map(curso => (
                        <tr key={curso.id}>
                          <td>{curso.nome}</td>
                          <td>{curso.categoria}</td>
                          <td>{curso.area}</td>
                          <td>{curso.tipo}</td>
                          <td>{new Date(curso.dataInicio).toLocaleDateString()}</td>
                          <td>{new Date(curso.dataFim).toLocaleDateString()}</td>
                          <td>{new Date(curso.dataInscricao).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message"> não está inscrito em nenhum curso atualmente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botão de terminar sessão */}
        <div className="logout-button-container">
          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
          >
            Terminar Sessão
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default PerfilUser;