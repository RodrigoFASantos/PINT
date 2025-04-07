import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/forumPartilha.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CriarTopicoModal from '../components/CriarTopicoModal';

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
        const response = await axios.get('/api/categorias', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCategorias(response.data);
        
        // Obter perfil do usuário
        const userResponse = await axios.get('/api/user/profile', {
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
          const response = await axios.get(`/api/forum/topicos`, {
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

  const handleSelecionarCategoria = (categoria) => {
    setCategoriaSelecionada(categoria);
    setAreaSelecionada(null);
  };

  const handleSelecionarArea = (area) => {
    setAreaSelecionada(area);
  };

  const handleVerTopico = (id) => {
    navigate(`/forum/topico/${id}`);
  };

  const handleCriarTopico = () => {
    if (userRole === 'gestor') {
      setShowCriarTopico(true);
    } else {
      // Para outros perfis, exibe mensagem de solicitar ao gestor
      alert('Apenas gestores podem criar tópicos. Entre em contato com um gestor para solicitar a criação de um tópico.');
    }
  };

  if (loading && !categoriaSelecionada && !areaSelecionada) {
    return <div className="loading">Carregando fórum de partilha...</div>;
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
                    className={categoriaSelecionada === categoria.nome ? 'selected' : ''}
                    onClick={() => handleSelecionarCategoria(categoria.nome)}
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
                    .find(cat => cat.nome === categoriaSelecionada)
                    .areas.map(area => (
                      <li 
                        key={area.id} 
                        className={areaSelecionada === area.nome ? 'selected' : ''}
                        onClick={() => handleSelecionarArea(area.nome)}
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
                <h2>Tópicos em {areaSelecionada}</h2>
                <button 
                  className="criar-topico-btn"
                  onClick={handleCriarTopico}
                >
                  {userRole === 'gestor' ? 'Criar Tópico' : 'Solicitar Tópico'}
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
                          <p className="topico-desc">{topico.descricao}</p>
                          <div className="topico-meta">
                            <span className="autor">Por: {topico.criador.nome}</span>
                            <span className="data">
                              {new Date(topico.dataCriacao).toLocaleDateString()}
                            </span>
                            <span className="comentarios">
                              {topico.comentarios} comentário(s)
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
                const response = await axios.get(`/api/forum/topicos`, {
                  params: {
                    categoria: categoriaSelecionada,
                    area: areaSelecionada
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