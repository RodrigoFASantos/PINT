import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from "../api";
import "./css/perfilUser.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    idade: '',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Estados para controlar erros de imagem e evitar loops
  const [capaError, setCapaError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Carregar dados do perfil
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token não encontrado!");
      navigate('/login');
      return;
    }

    const fetchPerfil = async () => {
      try {
        const response = await fetch(`${API_BASE}/users/perfil`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setUser(data);
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          idade: data.idade || ''
        });
      } catch (err) {
        setError(`Erro ao carregar o perfil: ${err.message}`);
      }
    };

    fetchPerfil();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      setUser(data);
      setEditing(false);
      setSuccessMsg("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(`Erro ao atualizar perfil: ${err.message}`);
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataEnv = new FormData();
    formDataEnv.append("imagem", file);
    formDataEnv.append("type", type);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/users/img/upload-foto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataEnv,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log("Resposta do upload:", data);

      // Recarregar os dados do usuário
      const userResponse = await fetch(`${API_BASE}/users/perfil`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!userResponse.ok) {
        throw new Error(`Erro HTTP: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      setUser(userData);
      if (type === 'CAPA') setCapaError(false);
      if (type === 'AVATAR') setAvatarError(false);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError(`Erro ao fazer upload: ${err.message}`);
    }
  };

  const getImageUrl = (filename, type) => {
    let baseURL = API_BASE;
    if (baseURL.endsWith('/api')) {
      baseURL = baseURL.substring(0, baseURL.length - 4);
    } else if (baseURL.includes('/api/')) {
      baseURL = baseURL.substring(0, baseURL.indexOf('/api/'));
    }
    if (!filename) {
      return type === 'capa'
        ? `${baseURL}/uploads/CAPA.png`
        : `${baseURL}/uploads/AVATAR.png`;
    }
    if ((type === 'capa' && capaError) || (type === 'avatar' && avatarError)) {
      return type === 'capa'
        ? `${baseURL}/uploads/CAPA.png`
        : `${baseURL}/uploads/AVATAR.png`;
    }
    return `${baseURL}/uploads/${filename}`;
  };

  if (error) return (
    <div className="perfil-wrapper">
      <div className="error-message">
        <h3>Erro:</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    </div>
  );

  if (!user) {
    return <p>A carregar perfil...</p>;
  }

  return (
    <div className="perfil-wrapper">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="perfil-main">
        {successMsg && <div className="success-message">{successMsg}</div>}

        {/* Capa */}
        <div className="perfil-capa-wrapper">
          <img
            src={getImageUrl(user.foto_capa, 'capa')}
            alt="Capa"
            className="perfil-capa"
            onError={(e) => {
              if (!capaError) {
                setCapaError(true);
                e.target.src = `${API_BASE.replace('/api', '')}/uploads/CAPA.png`;
              } else {
                e.target.style.display = 'none';
                e.target.onError = null;
              }
            }}
            onClick={() => document.getElementById("input-capa").click()}
          />
          {/* Ícone de editar capa */}
          <div className="edit-icon-overlay capa-edit-icon">
            <span>&#9998;</span>
          </div>
          <input
            type="file"
            id="input-capa"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e, 'capa')}
          />
        </div>

        {/* Header: Avatar sobreposto e Nome */}
        <div className="perfil-header">
          <div className="perfil-avatar-wrapper">
            <img
              src={getImageUrl(user.foto_perfil, 'avatar')}
              alt="Avatar"
              className="perfil-avatar"
              onError={(e) => {
                if (!avatarError) {
                  setAvatarError(true);
                  e.target.src = `${API_BASE.replace('/api', '')}/uploads/AVATAR.png`;
                } else {
                  e.target.style.display = 'none';
                  e.target.onError = null;
                }
              }}
              onClick={() => document.getElementById("input-avatar").click()}
            />
            {/* Ícone de editar avatar */}
            <div className="edit-icon-overlay avatar-edit-icon">
              <span>&#9998;</span>
            </div>
            <input
              type="file"
              id="input-avatar"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'perfil')}
            />
          </div>
          <h2 className="perfil-nome">{user.nome}</h2>
        </div>

        {/* Cartão de informações do perfil */}
        <div className="perfil-card">
          {!editing ? (
            <>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Cargo:</strong> {user.cargo?.descricao || '---'}</p>
              <p><strong>Telefone:</strong> {user.telefone}</p>
              <p><strong>Idade:</strong> {user.idade}</p>
              <button className="perfil-button" onClick={() => setEditing(true)}>Editar Perfil</button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="perfil-form">
              <input className="perfil-input" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome" />
              <input className="perfil-input" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
              <input className="perfil-input" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone" />
              <input className="perfil-input" name="idade" value={formData.idade} onChange={handleChange} placeholder="Idade" />
              <button type="submit" className="perfil-button">Guardar</button>
              <button type="button" onClick={() => setEditing(false)} className="perfil-cancel">Cancelar</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
