import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/detalheTopico.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Categoria_Chat from '../components/Categoria_Chat';
import API_BASE from '../api';

const DetalheTopico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topico, setTopico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopico = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/topicos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTopico(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar tópico:', error);
        setError('Não foi possível carregar o tópico. Verifique se ele existe ou se você tem permissão para acessá-lo.');
        setLoading(false);
      }
    };

    fetchTopico();
  }, [id]);

  const handleVoltar = () => {
    navigate('/forum');
  };

  if (loading) {
    return (
      <div className="detalhe-topico-container">
        <Navbar />
        <div className="main-content">
          <Sidebar />
          <div className="topico-content loading">
            <p>Carregando tópico...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalhe-topico-container">
        <Navbar />
        <div className="main-content">
          <Sidebar />
          <div className="topico-content error">
            <h2>Erro</h2>
            <p>{error}</p>
            <button className="btn-voltar" onClick={handleVoltar}>
              Voltar para o Fórum
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza o componente Categoria_Chat passando o id do tópico
  return <Categoria_Chat />;
};

export default DetalheTopico;