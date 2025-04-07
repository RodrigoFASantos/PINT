import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from "../api";
import "../pages/css/perfilUser.css";
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
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
    
        // ... resto do código permanece igual
      } catch (err) {
        console.error("Erro ao carregar o perfil:", err);
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

    const formData = new FormData();
    formData.append("imagem", file);
    formData.append("type", type);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/users/img/upload-foto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError(`Erro ao fazer upload: ${err.message}`);
    }
  };

  const renderImage = (imageSource, altText, type) => {
    const baseURL = API_BASE.replace("/api", "");
    const defaultImage = type === 'capa' ? 'CAPA.png' : 'AVATAR.png';
    const fallbackImage = type === 'capa' ? '/fallback-capa.jpg' : '/fallback-avatar.jpg';

    return (
      <img 
        src={`${baseURL}/uploads/${imageSource || defaultImage}`} 
        alt={altText} 
        className={`perfil-${type}`} 
        onError={(e) => {
          console.log(`Erro ao carregar imagem de ${type}`);
          if (e.target.src !== fallbackImage) {
            e.target.src = fallbackImage;
          } else {
            e.target.style.display = 'none';
          }
        }}
        onClick={() => document.getElementById(`input-${type}`).click()} 
      />
    );
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

  if (!user) return <p>A carregar perfil...</p>;

  return (
    <div className="perfil-wrapper">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="perfil-main">
        {successMsg && <div className="success-message">{successMsg}</div>}

        <div className="perfil-capa-wrapper">
          {renderImage(user.foto_capa, "Capa", 'capa')}
          <input 
            type="file" 
            id="input-capa" 
            style={{ display: 'none' }} 
            onChange={(e) => handleFileChange(e, 'capa')} 
          />

          <div className="perfil-avatar-wrapper">
            {renderImage(user.foto_perfil, "Avatar", 'avatar')}
            <input 
              type="file" 
              id="input-avatar" 
              style={{ display: 'none' }} 
              onChange={(e) => handleFileChange(e, 'perfil')} 
            />
          </div>
        </div>

        <div className="perfil-titulo">
          <h2>{user.nome}</h2>
        </div>

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