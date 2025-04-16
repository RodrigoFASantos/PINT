import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/forumPartilha.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CriarTopicoModal from '../components/CriarTopicoModal';
import API_BASE from '../api';

const ForumPartilha = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCriarTopico, setShowCriarTopico] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCategorias(response.data);
        
        // Obter perfil do usuário
        const userResponse = await axios.get(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserRole(userResponse.data.role);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    // Carregar tópicos quando uma área for selecionada
    const fetchTopicos = async () => {
      if (categoriaSelecionada && areaSelecionada) {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_BASE}/topicos`, {
            params: {
              categoria: categoriaSelecionada,
              area: areaSelecionada
            },
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setTopicos(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Erro ao carregar tópicos:', error);
          setLoading(false);
        }
      }
    };

    fetchTopicos();
  }, [categoriaSelecionada, areaSelecionada]);

  const handleSelecionarCategoria = (categoriaId, categoriaNome) => {
    setCategoriaSelecionada({ id: categoriaId, nome: categoriaNome });
    setAreaSelecionada(null);
  };

  const handleSelecionarArea = (areaId, areaNome) => {
    setAreaSelecionada({ id: areaId, nome: areaNome });
  };

  const handleVerTopico = (id) => {
    navigate(`/forum/topico/${id}`);
  };

  const handleCriarTopico = () => {
    if (userRole === 1 || userRole === 2) { // Admin ou Gestor
      setShowCriarTopico(true);
    } else {
      // Para outros perfis, exibe mensagem de solicitar ao gestor
      alert('Apenas gestores podem criar tópicos. Entre em contato com um gestor para solicitar a criação de um tópico.');
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  if (loading && !categorias.length) {
    return (
      <div className="forum-partilha-container">
        <Navbar />
        <div className="main-content">
          <Sidebar />
          <div className="loading-container">
            <div className="loading">Carregando fórum de partilha...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-partilha-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="forum-content">
          <h1>Fórum de Partilha de Conhecimento</h1>
          
          <div className="forum-navigation">
            <div className="categoria-list">
              <h2>Categorias</h2>
              <ul>
                {categorias.map(categoria => (
                  <li 
                    key={categoria.id} 
                    className={categoriaSelecionada?.id === categoria.id ? 'selected' : ''}
                    onClick={() => handleSelecionarCategoria(categoria.id, categoria.nome)}
                  >
                    {categoria.nome}
                  </li>
                ))}
              </ul>
            </div>
            
            {categoriaSelecionada && (
              <div className="area-list">
                <h2>Áreas</h2>
                <ul>
                  {categorias
                    .find(cat => cat.id === categoriaSelecionada.id)
                    .areas.map(area => (
                      <li 
                        key={area.id} 
                        className={areaSelecionada?.id === area.id ? 'selected' : ''}
                        onClick={() => handleSelecionarArea(area.id, area.nome)}
                      >
                        {area.nome}
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
          </div>
          
          {categoriaSelecionada && areaSelecionada && (
            <div className="topicos-section">
              <div className="topicos-header">
                <h2>Tópicos em {areaSelecionada.nome}</h2>
                <button 
                  className="criar-topico-btn"
                  onClick={handleCriarTopico}
                >
                  {userRole === 1 || userRole === 2 ? 'Criar Tópico' : 'Solicitar Tópico'}
                </button>
              </div>
              
              {loading ? (
                <div className="loading">Carregando tópicos...</div>
              ) : (
                <>
                  {topicos.length === 0 ? (
                    <p className="no-topicos">Não há tópicos nesta área ainda.</p>
                  ) : (
                    <div className="topicos-list">
                      {topicos.map(topico => (
                        <div 
                          key={topico.id} 
                          className="topico-card"
                          onClick={() => handleVerTopico(topico.id)}
                        >
                          <h3>{topico.titulo}</h3>
                          <p className="topico-desc">{topico.descricao || 'Sem descrição'}</p>
                          <div className="topico-meta">
                            <span className="autor">Por: {topico.criador?.nome || 'Usuário'}</span>
                            <span className="data">
                              {formatarData(topico.dataCriacao)}
                            </span>
                            <span className="comentarios">
                              {topico.comentarios || 0} comentário(s)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showCriarTopico && (
        <CriarTopicoModal 
          categoria={categoriaSelecionada}
          area={areaSelecionada}
          onClose={() => setShowCriarTopico(false)}
          onSuccess={() => {
            setShowCriarTopico(false);
            // Recarregar tópicos
            const fetchTopicos = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE}/topicos`, {
                  params: {
                    categoria: categoriaSelecionada.id,
                    area: areaSelecionada.id
                  },
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                setTopicos(response.data);
              } catch (error) {
                console.error('Erro ao recarregar tópicos:', error);
              }
            };
            fetchTopicos();
          }}
        />
      )}
    </div>
  );
};

export default ForumPartilha;