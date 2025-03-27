import React, { useEffect, useState } from 'react';
import API_BASE from "../api";

const Perfil = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/perfil`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error('Erro ao carregar o perfil:', err));
  }, []);

  if (!user) return <p>A carregar perfil...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Perfil do Utilizador</h1>
      <div style={styles.card}>
        <p><strong>Nome:</strong> {user.nome}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Cargo:</strong> {user.cargo?.descricao || '---'}</p>
        <p><strong>Telefone:</strong> {user.telefone}</p>
        <p><strong>Idade:</strong> {user.idade}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: '#f9f9f9',
  },
  titulo: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    maxWidth: '400px',
  },
};

export default Perfil;
