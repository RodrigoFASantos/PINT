import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import './css/Forum.css';

/**
 * Componente principal do Fórum de Partilha de Conhecimento
 * Permite aos utilizadores visualizar categorias, tópicos e criar novos tópicos
 * 
 * Funcionalidades principais:
 * - Visualização hierárquica: Categoria → Tópico
 * - Criação de novos tópicos com modal completo
 * - Navegação para discussões de tópicos específicos
 * - Controlo de permissões baseado no cargo do utilizador
 * - Interface responsiva com acordeão para categorias
 */
const ForumPartilha = () => {
  const navigate = useNavigate();
  
  // Estados para gestão das categorias e tópicos
  const [categorias, setCategorias] = useState([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  const [categoriasTopicos, setCategoriasTopicos] = useState({});
  const [areas, setAreas] = useState([]);
  
  // Estados para controlo de carregamento
  const [loading, setLoading] = useState(true);
  const [loadingTopicos, setLoadingTopicos] = useState({});
  
  // Estados para utilizador e interface
  const [userRole, setUserRole] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para o modal completo de criação de tópicos
  const [showTopicoForm, setShowTopicoForm] = useState(false);
  const [newTopicoTitulo, setNewTopicoTitulo] = useState('');
  const [newTopicoDescricao, setNewTopicoDescricao] = useState('');
  const [newTopicoCategoria, setNewTopicoCategoria] = useState('');
  const [newTopicoArea, setNewTopicoArea] = useState('');
  const [areasFiltradas, setAreasFiltradas] = useState([]);

  /**
   * Alterna o estado da barra lateral de navegação
   */
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Carrega os dados iniciais necessários para o funcionamento do fórum
   * Executa apenas uma vez quando o componente é montado
   * 
   * Carrega sequencialmente:
   * 1. Lista de categorias disponíveis
   * 2. Lista de áreas para o formulário de criação
   * 3. Perfil do utilizador para controlar permissões
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Obter lista de categorias do fórum
        const categoriasResponse = await axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const categoriasData = categoriasResponse.data.categorias || categoriasResponse.data || [];
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);

        // Inicializar todas as categorias como contraídas (fechadas)
        const estadoInicial = {};
        const categoriasArray = Array.isArray(categoriasData) ? categoriasData : [];
        categoriasArray.forEach(cat => {
          const catId = cat.id_categoria || cat.id;
          estadoInicial[catId] = false;
        });
        setCategoriasExpandidas(estadoInicial);

        // Carregar áreas para o formulário de criação de tópicos
        try {
          const areasResponse = await axios.get(`${API_BASE}/areas`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // A API retorna um objeto com a propriedade 'areas' que contém o array
          const areasData = areasResponse.data.areas || areasResponse.data || [];
          setAreas(Array.isArray(areasData) ? areasData : []);
        } catch (areasError) {
          console.error('Erro ao carregar áreas:', areasError.message);
          setAreas([]); // Definir array vazio em caso de erro
        }

        // Obter informações do perfil do utilizador atual
        const userResponse = await axios.get(`${API_BASE}/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Guardar o cargo do utilizador para controlar permissões
        setUserRole(userResponse.data.id_cargo || '');
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Filtra as áreas disponíveis com base na categoria selecionada no formulário
   * Implementa a hierarquia: Categoria → Área → Tópico
   */
  useEffect(() => {
    if (newTopicoCategoria && Array.isArray(areas)) {
      const areasFiltered = areas.filter(area =>
        area.id_categoria === parseInt(newTopicoCategoria)
      );
      setAreasFiltradas(areasFiltered);
      
      // Limpar seleção de área se a categoria mudou
      if (newTopicoArea && !areasFiltered.some(a => a.id_area === parseInt(newTopicoArea))) {
        setNewTopicoArea('');
      }
    } else {
      setAreasFiltradas([]);
      setNewTopicoArea('');
    }
  }, [newTopicoCategoria, areas, newTopicoArea]);

  /**
   * Alterna o estado de expansão de uma categoria no acordeão
   * Se a categoria for expandida pela primeira vez, carrega os seus tópicos
   * 
   * @param {number} categoriaId - ID da categoria a expandir/colapsar
   */
  const toggleCategoria = async (categoriaId) => {
    // Criar novo estado mantendo a imutabilidade
    const novoEstado = { ...categoriasExpandidas };
    novoEstado[categoriaId] = !categoriasExpandidas[categoriaId];

    // Atualizar estado de expansão
    setCategoriasExpandidas(novoEstado);

    // Se está a expandir e ainda não carregou os tópicos, carregar agora
    if (novoEstado[categoriaId] && !categoriasTopicos[categoriaId]) {
      await carregarTopicosCategoria(categoriaId);
    }
  };

  /**
   * Carrega os tópicos de uma categoria específica da API
   * Implementa lazy loading - só carrega quando necessário
   * 
   * @param {number} categoriaId - ID da categoria cujos tópicos queremos carregar
   */
  const carregarTopicosCategoria = async (categoriaId) => {
    try {
      // Ativar indicador de carregamento para esta categoria
      setLoadingTopicos(prev => ({ ...prev, [categoriaId]: true }));

      const token = localStorage.getItem('token');

      // Fazer pedido à API para obter tópicos da categoria
      const response = await axios.get(`${API_BASE}/topicos-area/categoria/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Guardar os tópicos no estado organizado por categoria
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

  /**
   * Abre o modal completo para criação de novo tópico
   * Limpa todos os campos do formulário
   */
  const handleOpenTopicoForm = () => {
    setShowTopicoForm(true);
    setNewTopicoTitulo('');
    setNewTopicoDescricao('');
    setNewTopicoCategoria('');
    setNewTopicoArea('');
  };

  /**
   * Fecha o modal de criação de tópico e limpa os campos
   */
  const handleCloseTopicoForm = () => {
    setShowTopicoForm(false);
    setNewTopicoTitulo('');
    setNewTopicoDescricao('');
    setNewTopicoCategoria('');
    setNewTopicoArea('');
  };

  /**
   * Grava um novo tópico na base de dados
   * Valida todos os campos obrigatórios antes de submeter
   * Após sucesso, recarrega os tópicos da categoria e expande-a
   */
  const handleSaveTopico = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validações dos campos obrigatórios
      if (!newTopicoTitulo.trim()) {
        toast.error('Por favor, insere um título para o tópico.');
        return;
      }
      
      if (!newTopicoCategoria) {
        toast.error('Por favor, seleciona uma categoria para o tópico.');
        return;
      }
      
      if (!newTopicoArea) {
        toast.error('Por favor, seleciona uma área para o tópico.');
        return;
      }
      
      // Preparar dados para envio
      const dadosTopico = {
        titulo: newTopicoTitulo.trim(),
        descricao: newTopicoDescricao.trim(),
        id_categoria: newTopicoCategoria,
        id_area: newTopicoArea
      };
      
      // Enviar novo tópico para a API
      await axios.post(`${API_BASE}/topicos-area`, dadosTopico, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tópico criado com sucesso!');
      handleCloseTopicoForm();
      
      // Recarregar os tópicos da categoria onde foi criado o novo tópico
      await carregarTopicosCategoria(newTopicoCategoria);
      
      // Garantir que a categoria fica expandida para mostrar o novo tópico
      const novoEstado = { ...categoriasExpandidas };
      novoEstado[newTopicoCategoria] = true;
      setCategoriasExpandidas(novoEstado);
      
    } catch (error) {
      if (error.response) {
        toast.error(`Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao processar a requisição. Por favor, tenta novamente.');
      }
    }
  };

  /**
   * Navega para a página de chat/discussão de um tópico específico
   * 
   * @param {number} id - ID do tópico a visualizar
   */
  const handleVerTopico = (id) => {
    navigate(`/forum/topico/${id}`);
  };

  /**
   * Formata uma data para exibição no formato português
   * 
   * @param {string} dataString - Data em formato ISO string
   * @returns {string} Data formatada em português brasileiro
   */
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  /**
   * Encontra o nome da categoria pelo seu ID
   * Utilizada para mostrar nomes legíveis em vez de IDs
   * 
   * @param {number} id - ID da categoria
   * @returns {string} Nome da categoria ou 'N/A' se não encontrada
   */
  const getCategoriaName = (id) => {
    if (!id || !Array.isArray(categorias)) return 'N/A';
    const categoria = categorias.find(c => c.id_categoria === id || c.id === id);
    return categoria ? categoria.nome : 'N/A';
  };

  /**
   * Encontra o nome da área pelo seu ID
   * Utilizada para mostrar nomes legíveis em vez de IDs
   * 
   * @param {number} id - ID da área
   * @returns {string} Nome da área ou 'N/A' se não encontrada
   */
  const getAreaName = (id) => {
    if (!id || !Array.isArray(areas)) return 'N/A';
    const area = areas.find(a => a.id_area === id || a.id === id);
    return area ? area.nome : 'N/A';
  };

  // Mostrar ecrã de carregamento enquanto os dados iniciais não estão prontos
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
          {/* Cabeçalho principal com título e botão de criar tópico */}
          <div className="forum-header">
            <h1>Fórum de Partilha de Conhecimento</h1>
            <button 
              className="criar-topico-principal-btn"
              onClick={handleOpenTopicoForm}
              title="Criar novo tópico de discussão"
            >
              Criar Tópico
            </button>
          </div>

          {/* Acordeão com todas as categorias do fórum */}
          <div className="categorias-accordion">
            {Array.isArray(categorias) && categorias.map(categoria => {
              const categoriaId = categoria.id_categoria || categoria.id;

              return (
                <div key={categoriaId} className="categoria-item">
                  {/* Cabeçalho da categoria - apenas botão de expandir/colapsar */}
                  <div className="categoria-header">
                    <div
                      className="categoria-title"
                      onClick={() => toggleCategoria(categoriaId)}
                    >
                      <i className={`fas fa-chevron-${categoriasExpandidas[categoriaId] ? 'down' : 'right'}`}></i>
                      <h3>{categoria.nome}</h3>
                    </div>
                  </div>

                  {/* Conteúdo da categoria (tópicos) - só aparece se expandida */}
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
                              {/* Lista de cartões com os tópicos da categoria */}
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

      {/* Modal completo para criação de tópico */}
      {showTopicoForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Criar Novo Tópico</h3>
              <button 
                className="modal-close-btn"
                onClick={handleCloseTopicoForm}
                title="Fechar modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Campo para título do tópico */}
              <div className="form-group">
                <label htmlFor="newTopicoTitulo">Título do Tópico:</label>
                <input 
                  type="text" 
                  id="newTopicoTitulo" 
                  value={newTopicoTitulo}
                  onChange={(e) => setNewTopicoTitulo(e.target.value)}
                  placeholder="Digite o título do tópico"
                  maxLength="200"
                  autoFocus
                />
              </div>

              {/* Campo para descrição opcional */}
              <div className="form-group">
                <label htmlFor="newTopicoDescricao">Descrição (opcional):</label>
                <textarea 
                  id="newTopicoDescricao" 
                  value={newTopicoDescricao}
                  onChange={(e) => setNewTopicoDescricao(e.target.value)}
                  placeholder="Digite uma descrição para o tópico"
                  rows="4"
                  maxLength="500"
                />
              </div>
              
              {/* Seleção de categoria */}
              <div className="form-group">
                <label htmlFor="newTopicoCategoria">Categoria:</label>
                <select
                  id="newTopicoCategoria"
                  value={newTopicoCategoria}
                  onChange={(e) => {
                    setNewTopicoCategoria(e.target.value);
                    setNewTopicoArea(''); // Limpar área quando categoria muda
                  }}
                >
                  <option value="">Seleciona uma categoria</option>
                  {Array.isArray(categorias) && categorias.map(categoria => (
                    <option 
                      key={categoria.id_categoria} 
                      value={categoria.id_categoria}
                    >
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleção de área (filtrada pela categoria) */}
              <div className="form-group">
                <label htmlFor="newTopicoArea">Área:</label>
                <select
                  id="newTopicoArea"
                  value={newTopicoArea}
                  onChange={(e) => setNewTopicoArea(e.target.value)}
                  disabled={!newTopicoCategoria}
                >
                  <option value="">
                    {!newTopicoCategoria 
                      ? "Seleciona uma categoria primeiro" 
                      : "Seleciona uma área"}
                  </option>
                  {areasFiltradas.map(area => (
                    <option 
                      key={area.id_area} 
                      value={area.id_area}
                    >
                      {area.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Ações do modal */}
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={handleCloseTopicoForm}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleSaveTopico}
                disabled={!newTopicoTitulo.trim() || !newTopicoCategoria || !newTopicoArea}
              >
                Criar Tópico
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Container para notificações toast */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default ForumPartilha;