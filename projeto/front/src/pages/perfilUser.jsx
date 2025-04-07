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

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔍 Token recebido:", token);
    console.log("🌐 API_BASE:", API_BASE);
    
    if (!token) {
      console.error("❌ Token não encontrado!");
      navigate('/login');
      return;
    }
  
    const fetchPerfil = async () => {
      try {
        console.log("🚀 Iniciando busca de perfil");
        const response = await fetch(`${API_BASE}/users/perfil`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
  
        console.log("📡 Status da resposta:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Erro na resposta:", errorText);
          throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
        }
  
        const data = await response.json();
        console.log("✅ Dados recebidos:", data);
        
        setUser(data);
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          idade: data.idade || ''
        });
      } catch (err) {
        console.error("❌ Erro detalhado ao carregar o perfil:", err);
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
      
      // Resetar os estados de erro quando um novo upload for feito
      if (type === 'capa') setCapaError(false);
      if (type === 'perfil') setAvatarError(false);
      
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError(`Erro ao fazer upload: ${err.message}`);
    }
  };

  // Função para construir o URL da imagem
  const getImageUrl = (filename, type) => {
    if (!filename) return `/default-${type}.jpg`;
    
    // Estado já indica erro? Use a imagem padrão
    if ((type === 'capa' && capaError) || (type === 'avatar' && avatarError)) {
      return `/default-${type}.jpg`;
    }
    
    // Tente a URL completa
    const baseURL = API_BASE.replace("/api", "");
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
    console.log("⏳ A carregar perfil...");
    return <p>A carregar perfil...</p>;
  }
  
  console.log("🖼️ Renderizando perfil do usuário:", user);

  return (
    <div className="perfil-wrapper">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="perfil-main">
        {successMsg && <div className="success-message">{successMsg}</div>}

        <div className="perfil-capa-wrapper">
          <img 
            src={getImageUrl(user.foto_capa, 'capa')} 
            alt="Capa" 
            className="perfil-capa" 
            onError={(e) => {
              console.log("Erro ao carregar imagem de capa");
              // Apenas tenta carregar a imagem padrão se ainda não tentou
              if (!capaError) {
                setCapaError(true);
                e.target.src = "/default-capa.jpg";
              } else {
                // Se mesmo a imagem padrão falhar, apenas oculte a imagem
                e.target.style.display = 'none';
                // Limpe o handler para impedir mais chamadas
                e.target.onError = null;
              }
            }}
            onClick={() => document.getElementById("input-capa").click()} 
          />
          <input 
            type="file" 
            id="input-capa" 
            style={{ display: 'none' }} 
            onChange={(e) => handleFileChange(e, 'capa')} 
          />

          <div className="perfil-avatar-wrapper">
            <img 
              src={getImageUrl(user.foto_perfil, 'avatar')} 
              alt="Avatar" 
              className="perfil-avatar" 
              onError={(e) => {
                console.log("Erro ao carregar imagem de avatar");
                // Apenas tenta carregar a imagem padrão se ainda não tentou
                if (!avatarError) {
                  setAvatarError(true);
                  e.target.src = "/default-avatar.jpg";
                } else {
                  // Se mesmo a imagem padrão falhar, apenas oculte a imagem
                  e.target.style.display = 'none';
                  // Limpe o handler para impedir mais chamadas
                  e.target.onError = null;
                }
              }}
              onClick={() => document.getElementById("input-avatar").click()} 
            />
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