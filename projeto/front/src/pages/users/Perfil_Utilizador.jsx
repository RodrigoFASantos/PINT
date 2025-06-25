import React, { useState, useEffect } from 'react';
import './css/Perfil_Utilizador.css';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE, { IMAGES } from '../../api';

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

  // estados para categorias, áreas e cursos
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

  // estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState('ministrados');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Função para alternar entre abas
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Código existente para carregar o perfil
  useEffect(() => {
    console.log('🔄 INICIALIZAÇÃO: useEffect disparado, iniciando carregamento');

    // Flag para gerenciar o cleanup quando o componente desmontar
    let isMounted = true;

    const loadProfile = async () => {
      try {
        console.log('🔄 INICIALIZAÇÃO: Tentando carregar perfil do utilizador');
        const token = localStorage.getItem('token');

        if (!token) {
          console.error('🔴 INICIALIZAÇÃO: Token não encontrado');
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        console.log('🔄 INICIALIZAÇÃO: Token encontrado, a buscar perfil');

        // Buscar os dados do perfil
        await fetchUserProfile();

        if (isMounted) {
          console.log('🟢 INICIALIZAÇÃO: Perfil carregado com sucesso');
        }
      } catch (error) {
        if (isMounted) {
          console.error('🔴 INICIALIZAÇÃO: Erro crítico ao inicializar perfil:', error);
          toast.error('Erro ao carregar dados. A tentar novamente em 5 segundos...');

          // Tentar novamente após 5 segundos
          setTimeout(() => {
            if (isMounted) {
              console.log('🔄 INICIALIZAÇÃO: A tentar recarregar o perfil após falha');
              loadProfile();
            }
          }, 5000);
        }
      }
    };

    // Iniciar carregamento
    loadProfile();

    // Cleanup ao desmontar o componente
    return () => {
      isMounted = false;
      console.log('🔄 INICIALIZAÇÃO: Componente desmontando, a cancelar operações pendentes');
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('🔄 PERFIL: A iniciar busca do perfil do utilizador');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔄 PERFIL: Token não encontrado, a abortar');
        return;
      }

      console.log('🔄 PERFIL: A enviar requisição para a API');
      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🔄 PERFIL: Resposta recebida do servidor', {
        status: response.status,
        id_usuario: response.data.id_utilizador,
        nome: response.data.nome,
        foto_perfil: response.data.foto_perfil,
        foto_capa: response.data.foto_capa
      });

      setUserInfo(response.data);
      setFormData({
        nome: response.data.nome || '',
        email: response.data.email || '',
        telefone: response.data.telefone || '',
        idade: response.data.idade || ''
      });

      // Verificar se é formador ou admin
      setIsFormador(response.data.id_cargo === 2);
      setIsAdmin(response.data.id_cargo === 1);

      // Se for formador, buscar categorias, áreas e cursos
      if (response.data.id_cargo === 2) {
        await fetchFormadorData();
      }

      // Extrair o nome do arquivo real (para debug)
      const extractFilename = (path) => {
        if (!path) return 'não definido';
        const parts = path.split('/');
        return parts[parts.length - 1];
      };

      console.log('🔄 PERFIL: Nome do arquivo AVATAR:', extractFilename(response.data.foto_perfil));
      console.log('🔄 PERFIL: Nome do arquivo CAPA:', extractFilename(response.data.foto_capa));

      // Adicionar timestamp para evitar cache do navegador + parâmetro force para garantir
      const timestamp = Date.now();
      const cacheParam = `t=${timestamp}&force=true`;
      console.log('🔄 PERFIL: Usando parâmetros anti-cache:', cacheParam);

      // Configurar as URLs das imagens com timestamp para forçar recarregamento
      if (response.data.foto_perfil === 'AVATAR.png') {
        console.log('🔄 PERFIL: Usando imagem de AVATAR padrão');
        setAvatarPreview(IMAGES.DEFAULT_AVATAR);
      } else {
        const avatarUrl = `${IMAGES.USER_AVATAR(response.data.email)}?${cacheParam}`;
        console.log('🔄 PERFIL: URL do AVATAR com anti-cache:', avatarUrl);
        setAvatarPreview(avatarUrl);
      }

      if (response.data.foto_capa === 'CAPA.png') {
        console.log('🔄 PERFIL: Usando imagem de CAPA padrão');
        setCapaPreview(IMAGES.DEFAULT_CAPA);
      } else {
        const capaUrl = `${IMAGES.USER_CAPA(response.data.email)}?${cacheParam}`;
        console.log('🔄 PERFIL: URL da CAPA com anti-cache:', capaUrl);
        setCapaPreview(capaUrl);
      }

      // Limpeza explícita de cache (adicional)
      if ('caches' in window) {
        console.log('🔄 PERFIL: A limpar cache de imagens');
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

    } catch (error) {
      console.error('🔴 PERFIL: Erro ao buscar perfil:', error);
      console.error('🔴 PERFIL: Detalhes do erro:', error.response || error.message);
      toast.error('Não foi possível carregar os dados do perfil');
    }
  };

  // função para buscar dados específicos de formador
  const fetchFormadorData = async () => {
    try {
      console.log('🔄 FORMADOR: A iniciar busca de dados específicos do formador');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔄 FORMADOR: Token não encontrado, a abortar');
        return;
      }

      const response = await axios.get(`${API_BASE}/formadores/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🔄 FORMADOR: Dados recebidos', {
        categorias: response.data.categorias.length,
        cursosInscritos: response.data.cursosInscritos.length,
        cursosMinistrados: response.data.cursosMinistrados.length
      });

      setFormadorData(response.data);

    } catch (error) {
      console.error('🔴 FORMADOR: Erro ao buscar dados do formador:', error);
      console.error('🔴 FORMADOR: Detalhes do erro:', error.response || error.message);
      toast.error('Não foi possível carregar os dados específicos do formador');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Modificado para prevenir o comportamento padrão do evento
  const handleEditToggle = (e) => {
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

    if (userInfo && userInfo.email) {
      formData.append('email', userInfo.email);
      console.log('Email adicionado ao FormData:', userInfo.email);
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      console.log('A enviar upload de avatar com token:', token ? 'Presente' : 'Ausente');

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
      console.error('Erro ao fazer upload do avatar:', error.response || error);
      toast.error('Falha ao enviar imagem de perfil: ' + (error.response?.data?.message || error.message));
      return null;
    }
  };

  const handleCapaUpload = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('imagem', file);

    if (userInfo && userInfo.email) {
      formData.append('email', userInfo.email);
      console.log('Email adicionado ao FormData:', userInfo.email);
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      console.log('A enviar upload de capa com token:', token ? 'Presente' : 'Ausente');

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
      console.error('Erro ao fazer upload da capa:', error.response || error);
      toast.error('Falha ao enviar imagem de capa: ' + (error.response?.data?.message || error.message));
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

      console.log('🖼️ AVATAR: A iniciar processo de upload', {
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      });

      setAvatarFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('🖼️ AVATAR: Preview criado e armazenado na memória');
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Toast de notificação
      toast.info('A enviar imagem de perfil...', { autoClose: false, toastId: 'uploading-avatar' });

      try {
        // Upload automático
        console.log('🖼️ AVATAR: A enviar para o servidor via API');
        const result = await handleAvatarUpload(file);

        if (result) {
          console.log('🖼️ AVATAR: Upload bem-sucedido', result);
          toast.update('uploading-avatar', {
            render: 'Imagem de perfil atualizada com sucesso!',
            type: 'success',
            autoClose: 3000
          });

          // Recarrega o perfil para obter a URL atualizada
          console.log('🖼️ AVATAR: A recarregar perfil para atualizar URLs das imagens');
          await fetchUserProfile();
          console.log('🖼️ AVATAR: Perfil recarregado');
        } else {
          console.error('🖼️ AVATAR: Falha no upload - resposta vazia ou null');
          toast.update('uploading-avatar', {
            render: 'Falha ao enviar imagem de perfil',
            type: 'error',
            autoClose: 3000
          });
        }
      } catch (error) {
        console.error('🖼️ AVATAR: Erro durante o processo de upload', error);
        toast.update('uploading-avatar', {
          render: `Erro ao enviar imagem: ${error.message}`,
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

      console.log('🖼️ CAPA: A iniciar processo de upload', {
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      });

      setCapaFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('🖼️ CAPA: Preview criado e armazenado na memória');
        setCapaPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Toast de notificação
      toast.info('A enviar imagem de capa...', { autoClose: false, toastId: 'uploading-capa' });

      try {
        // Upload automático
        console.log('🖼️ CAPA: A enviar para o servidor via API');
        const result = await handleCapaUpload(file);

        if (result) {
          console.log('🖼️ CAPA: Upload bem-sucedido', result);
          toast.update('uploading-capa', {
            render: 'Imagem de capa atualizada com sucesso!',
            type: 'success',
            autoClose: 3000
          });

          // Recarrega o perfil para obter a URL atualizada
          console.log('🖼️ CAPA: A recarregar perfil para atualizar URLs das imagens');
          await fetchUserProfile();
          console.log('🖼️ CAPA: Perfil recarregado, URLs atualizadas');
        } else {
          console.error('🖼️ CAPA: Falha no upload - resposta vazia ou null');
          toast.update('uploading-capa', {
            render: 'Falha ao enviar imagem de capa',
            type: 'error',
            autoClose: 3000
          });
        }
      } catch (error) {
        console.error('🖼️ CAPA: Erro durante o processo de upload', error);
        toast.update('uploading-capa', {
          render: `Erro ao enviar imagem: ${error.message}`,
          type: 'error',
          autoClose: 3000
        });
      }
    }
  };

  const handleLogout = () => {
    // Remover token do localStorage
    localStorage.removeItem('token');

    // Se estiver usando o contexto de autenticação, atualize-o
    if (typeof updateUserInfo === 'function') {
      updateUserInfo(null);
    }

    // Exibir mensagem de sucesso
    toast.success('Sessão terminada com sucesso!');

    // Redirecionar para a página de login após um breve delay
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
        {/* Seção da capa do perfil */}
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

        {/* Botão de engrenagem - AGORA POSICIONADO ENTRE A CAPA E AS INFORMAÇÕES */}
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

          <div className="perfil-detalhes">
            <div className="perfil-header">
              <h2>{userInfo.nome}</h2>
              <span className="cargo-badge">{userInfo.cargo?.descricao || 'Cargo não definido'}</span>
            </div>








            <div className={`perfil-dados ${isEditing ? 'editing-mode' : ''}`}>
              {isEditing ? (
                <form id="edit-form" onSubmit={handleSubmit}>
                  <div className="colunas-input">
                    {/* Coluna Nome com classe específica */}
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

                    {/* Coluna Email com classe específica */}
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

                    {/* Coluna Telefone com classe específica */}
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

                    {/* Coluna Idade com classe específica */}
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

                    {/* Coluna Botões com classe específica - botões lado a lado */}
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






            {/* seção para exibir categorias e áreas (apenas para formadores) */}
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

        {/* seção para exibir cursos do formador */}
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
              {/* Tabela de cursos ministrados */}
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
                  <p className="no-data-message">Você não está a ministrar nenhum curso atualmente.</p>
                )}
              </div>

              {/* Tabela de cursos inscritos */}
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
                  <p className="no-data-message">Você não está inscrito em nenhum curso atualmente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botão de Terminar Sessão posicionado no canto inferior direito */}
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