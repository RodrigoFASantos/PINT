import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import CriarTopicoModal from '../../components/forum/Criar_Topico_Modal';
import SolicitarTopicoModal from '../../components/forum/Solicitar_Topico_Modal';
import './css/Forum.css';

const ForumPartilha = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  const [categoriasTopicos, setCategoriasTopicos] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingTopicos, setLoadingTopicos] = useState({});
  const [showCriarTopico, setShowCriarTopico] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);


  const [showSolicitarTopico, setShowSolicitarTopico] = useState(false);

  // Removido o useEffect problemático que utilizava currentUser não definido

  // Carregar categorias e perfil do utilizador
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Obter categorias
        const categoriasResponse = await axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Categorias recebidas da API:", categoriasResponse.data);

        setCategorias(categoriasResponse.data);

        // Inicializar o estado de todas as categorias como contraídas
        const estadoInicial = {};
        categoriasResponse.data.forEach(cat => {
          // Usar o campo id_categoria se existir, caso contrário usar id
          const catId = cat.id_categoria || cat.id;
          estadoInicial[catId] = false;
        });
        setCategoriasExpandidas(estadoInicial);

        // Obter perfil do utilizador
        const userResponse = await axios.get(`${API_BASE}/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Armazenar o cargo do utilizador
        setUserRole(userResponse.data.id_cargo || '');
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Função para expandir/colapsar categoria e carregar tópicos
  const toggleCategoria = async (categoriaId) => {
    console.log(`Categoria clicada: ${categoriaId}`);
    console.log('Estado atual das categorias expandidas:', categoriasExpandidas);

    // Criar um novo objeto baseado no estado atual (para imutabilidade)
    const novoEstado = { ...categoriasExpandidas };

    // Inverter o estado da categoria clicada (se estava true fica false, se estava false fica true)
    novoEstado[categoriaId] = !categoriasExpandidas[categoriaId];

    console.log('Novo estado das categorias expandidas:', novoEstado);

    // Atualizar estado de expansão
    setCategoriasExpandidas(novoEstado);

    // Se está expandindo e ainda não carregou os tópicos
    if (novoEstado[categoriaId] && !categoriasTopicos[categoriaId]) {
      await carregarTopicosCategoria(categoriaId);
    }
  };

  // Função para carregar tópicos de uma categoria
  const carregarTopicosCategoria = async (categoriaId) => {
    try {
      setLoadingTopicos(prev => ({ ...prev, [categoriaId]: true }));

      const token = localStorage.getItem('token');
      console.log(`A carregar tópicos para categoria: ${categoriaId}`);


      const response = await axios.get(`${API_BASE}/topicos-area/categoria/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`Resposta da API para categoria ${categoriaId}:`, response.data);

      // Atualizar a lista de tópicos por categoria
      setCategoriasTopicos(prev => ({
        ...prev,
        [categoriaId]: response.data.data
      }));

      setLoadingTopicos(prev => ({ ...prev, [categoriaId]: false }));
    } catch (error) {
      console.error(`Erro ao carregar tópicos da categoria ${categoriaId}:`, error);
      setLoadingTopicos(prev => ({ ...prev, [categoriaId]: false }));
    }
  };

  // Função para abrir modal de criação de tópico
  const handleCriarTopico = (categoria) => {
    if (userRole === 1 || userRole === 2) {
      setCategoriaAtiva(categoria);
      setShowCriarTopico(true);
    } else {
      // Para outros perfis, mostrar o modal de solicitação
      setCategoriaAtiva(categoria);
      setShowSolicitarTopico(true);
    }
  };

  const handleSolicitacaoEnviada = () => {
    setShowSolicitarTopico(false);
    // Mostrar uma mensagem de sucesso
    alert('Solicitação enviada com sucesso! O administrador irá analisar seu pedido.');
  };

  // Função para navegar para o chat do tópico
  const handleVerTopico = (id) => {
    console.log(`Ir para o tópico ID: ${id}`);
    navigate(`/forum/topico/${id}`);
  };

  // Formatar data para exibição
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Função chamada após sucesso na criação de um tópico
  const handleTopicoCreated = async (novoTopico) => {
    setShowCriarTopico(false);

    // Recarregar os tópicos da categoria que teve um novo tópico adicionado
    await carregarTopicosCategoria(novoTopico.id_categoria);

    // Criar um novo objeto de estado com todas as categorias contraídas
    const novoEstado = {};
    categorias.forEach(cat => {
      const catId = cat.id_categoria || cat.id;
      novoEstado[catId] = catId === novoTopico.id_categoria;
    });

    // Garantir que a categoria esteja expandida
    setCategoriasExpandidas(novoEstado);
  };

  if (loading) {
    return (
      <div className="forum-partilha-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="loading-container">
            <div className="loading">A carregar fórum de partilha...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-partilha-container">
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className="forum-content">
          <h1>Fórum de Partilha de Conhecimento</h1>

          <div className="categorias-accordion">
            {categorias.map(categoria => {
              // Identificar a chave correta do ID para esta categoria
              const categoriaId = categoria.id_categoria || categoria.id;

              return (
                <div key={categoriaId} className="categoria-item">
                  <div className="categoria-header">
                    <div
                      className="categoria-title"
                      onClick={() => toggleCategoria(categoriaId)}
                    >
                      <i className={`fas fa-chevron-${categoriasExpandidas[categoriaId] ? 'down' : 'right'}`}></i>
                      <h3>{categoria.nome}</h3>
                    </div>

                    <button
                      className="criar-topico-btn"
                      onClick={() => handleCriarTopico(categoria)}
                    >
                      {userRole === 1 || userRole === 2 ? 'Criar Tópico' : 'Solicitar Tópico'}
                    </button>
                  </div>

                  {categoriasExpandidas[categoriaId] && (
                    <div className="categoria-content">
                      {loadingTopicos[categoriaId] ? (
                        <div className="loading">A carregar tópicos...</div>
                      ) : (
                        <>
                          {!categoriasTopicos[categoriaId] || categoriasTopicos[categoriaId].length === 0 ? (
                            <p className="no-topicos">Não há tópicos nesta categoria ainda.</p>
                          ) : (
                            <div className="topicos-list">
                              {categoriasTopicos[categoriaId] && categoriasTopicos[categoriaId].map(topico => (
                                <div
                                  key={topico.id_topico}
                                  className="topico-card"
                                  onClick={() => handleVerTopico(topico.id_topico)}
                                >
                                  <h3>{topico.titulo}</h3>
                                  <p className="topico-desc">{topico.descricao || 'Sem descrição'}</p>
                                  <div className="topico-meta">
                                    <span className="autor">Por: {topico.criador?.nome || 'utilizador'}</span>
                                    <span className="data">
                                      {formatarData(topico.data_criacao)}
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
              )
            })}

          </div>
        </div>
      </div>

      {showCriarTopico && (
        <CriarTopicoModal
          categoria={categoriaAtiva}
          onClose={() => setShowCriarTopico(false)}
          onSuccess={handleTopicoCreated}
        />
      )}

      {showSolicitarTopico && (
        <SolicitarTopicoModal
          categoria={categoriaAtiva}
          onClose={() => setShowSolicitarTopico(false)}
          onSuccess={handleSolicitacaoEnviada}
        />
      )}
    </div>


  );
};

export default ForumPartilha;