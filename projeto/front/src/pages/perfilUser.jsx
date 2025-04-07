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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token enviado:", token); // DEBUG

    fetch(`${API_BASE}/users/perfil`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

      .then(res => res.json())
      .then(data => {
        setUser(data);
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          idade: data.idade || ''
        });
      })
      .catch(err => console.error("Erro ao carregar o perfil:", err));
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditing(false);
        setSuccessMsg("Perfil atualizado com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
      })
      .catch(err => console.error('Erro ao atualizar perfil:', err));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("imagem", file);
    formData.append("type", type);

    const token = localStorage.getItem("token");

    fetch(`${API_BASE}/users/upload-foto`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(res => res.json())
      .then(() => {
        window.location.reload();
      })
      .catch(err => console.error("Erro ao fazer upload:", err));
  };

  if (!user) return <p>A carregar perfil...</p>;

  const baseURL = API_BASE.replace("/api", "");

  return (
    <div className="perfil-wrapper">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="perfil-main">

        {/* Capa com lápis */}
        <div className="perfil-capa-wrapper">
          
          <img src={`${baseURL}/uploads/${user.foto_capa || 'CAPA.png'}`} alt="Capa" className="perfil-capa" onClick={() => document.getElementById('input-capa').click()} />
          <div className="perfil-capa-edit-icon"></div>
          <input type="file" id="input-capa" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'capa')} />

          {/* Avatar */}
          <div className="perfil-avatar-wrapper">
            <img src={`${baseURL}/uploads/${user.foto_perfil || 'AVATAR.png'}`} alt="Avatar" className="perfil-avatar" onClick={() => document.getElementById('input-avatar').click()} />
            <div className="perfil-avatar-edit-icon" onClick={() => document.getElementById('input-avatar').click()}> </div>
            <input type="file" id="input-avatar" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'perfil')} />
          </div>

        </div>

        {/* Nome ao lado do avatar */}
        <div className="perfil-titulo">
          <h2>{user.nome}</h2>
        </div>

        {/* Dados em lista */}
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