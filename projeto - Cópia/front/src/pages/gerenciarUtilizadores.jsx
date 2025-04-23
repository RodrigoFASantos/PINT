import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/gerenciarUsuarios.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import EditarUsuarioModal from '../components/EditarUsuarioModal';
import API_BASE from '../api';

const GerenciarUtilizadores = () => {
  const navigate = useNavigate();
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilFiltro, setPerfilFiltro] = useState('');
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [showEditarUtilizador, setShowEditarUtilizador] = useState(false);
  const [utilizadorSelecionado, setUtilizadorSelecionado] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [erro, setErro] = useState(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchUtilizadores = async () => {
      try {
        const token = localStorage.getItem('token');
        // Usando a rota padrão /api/users
        const response = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Resposta da API de utilizadores:', response.data);
        
        // A resposta já deve ser um array de utilizadores
        if (Array.isArray(response.data)) {
          setUtilizadores(response.data);
          setErro(null);
        } else {
          console.error('Resposta não é um array:', response.data);
          setErro('Formato de resposta inesperado da API');
          
          // Se a resposta tiver uma mensagem, vamos mostrar para o usuário
          if (response.data && response.data.message) {
            setErro(`API retornou: ${response.data.message}`);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar utilizadores:', error);
        setErro('Erro ao carregar utilizadores: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    };

    fetchUtilizadores();
  }, []);

  const handleFiltrarUtilizadores = () => {
    // Filtragem local
    const filtrados = utilizadores.filter(u => {
      const nomeMatch = !nomeFiltro || u.nome.toLowerCase().includes(nomeFiltro.toLowerCase());
      const perfilMatch = !perfilFiltro || (u.id_cargo === getCargoId(perfilFiltro));
      return nomeMatch && perfilMatch;
    });
    
    setUtilizadores(filtrados);
  };

  const handleLimparFiltros = () => {
    setNomeFiltro('');
    setPerfilFiltro('');
    
    // Recarregar todos os utilizadores
    const fetchUtilizadores = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(response.data)) {
          setUtilizadores(response.data);
          setErro(null);
        } else {
          console.error('Resposta não é um array:', response.data);
          setErro('Formato de resposta inesperado da API');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar utilizadores:', error);
        setErro('Erro ao carregar utilizadores: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    };

    fetchUtilizadores();
  };

  const handleEditarUtilizador = (utilizador) => {
    setUtilizadorSelecionado(utilizador);
    setShowEditarUtilizador(true);
  };

  const handleAtivarDesativar = async (utilizadorId, ativo) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/users/${utilizadorId}/ativar-desativar`,
        { ativo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Atualizar lista de utilizadores
      setUtilizadores(utilizadores.map(u => 
        u.id_utilizador === utilizadorId ? { ...u, ativo } : u
      ));
      
      return true;
    } catch (error) {
      console.error('Erro ao ativar/desativar utilizador:', error);
      return false;
    }
  };

  const handleCriarUtilizador = () => {
    navigate('/admin/criar-usuario');
  };

  const handleVerPercursoFormativo = (utilizadorId) => {
    navigate(`/admin/percurso-formativo/${utilizadorId}`);
  };

  if (loading) {
    return <div className="loading">Carregando utilizadores...</div>;
  }

  return (
    <div className="gerenciar-usuarios-container">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="usuarios-content">
          <h1>Gerir Utilizadores</h1>
          
          {erro && (
            <div className="erro-mensagem">
              {erro}
            </div>
          )}
          
          <div className="filtros-container">
            <div className="filtro">
              <label htmlFor="nome-filtro">Nome:</label>
              <input 
                type="text" 
                id="nome-filtro" 
                value={nomeFiltro}
                onChange={(e) => setNomeFiltro(e.target.value)}
                placeholder="Filtrar por nome"
              />
            </div>
            
            <div className="filtro">
              <label htmlFor="perfil-filtro">Perfil:</label>
              <select 
                id="perfil-filtro" 
                value={perfilFiltro}
                onChange={(e) => setPerfilFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="formando">Formando</option>
                <option value="formador">Formador</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>
            
            <div className="filtro-acoes">
              <button 
                className="filtrar-btn"
                onClick={handleFiltrarUtilizadores}
              >
                Filtrar
              </button>
              
              <button 
                className="limpar-btn"
                onClick={handleLimparFiltros}
              >
                Limpar
              </button>
            </div>
          </div>
          
          <div className="usuarios-header">
            <h2>Lista de Utilizadores</h2>
            <button 
              className="criar-usuario-btn"
              onClick={handleCriarUtilizador}
            >
              Adicionar Utilizador
            </button>
          </div>
          
          {utilizadores.length === 0 ? (
            <p className="no-usuarios">Nenhum utilizador encontrado.</p>
          ) : (
            <div className="usuarios-table-container">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Estado</th>
                    <th>Telefone</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {utilizadores.map((utilizador, index) => (
                    <tr key={utilizador.id_utilizador || index} className={!utilizador.ativo ? 'inativo' : ''}>
                      <td>{utilizador.nome || 'N/A'}</td>
                      <td>{utilizador.email || 'N/A'}</td>
                      <td>
                        <span className={`badge cargo-${utilizador.id_cargo || 'desconhecido'}`}>
                          {getCargo(utilizador.id_cargo)}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${utilizador.ativo ? 'ativo' : 'inativo'}`}>
                          {utilizador.ativo === 1 ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{utilizador.telefone || 'N/A'}</td>
                      <td className="acoes">
                        <button 
                          className="editar-btn"
                          onClick={() => handleEditarUtilizador(utilizador)}
                        >
                          Editar
                        </button>
                        
                        <button 
                          className={utilizador.ativo === 1 ? 'desativar-btn' : 'ativar-btn'}
                          onClick={() => handleAtivarDesativar(utilizador.id_utilizador, utilizador.ativo === 1 ? 0 : 1)}
                        >
                          {utilizador.ativo === 1 ? 'Desativar' : 'Ativar'}
                        </button>
                        
                        {utilizador.id_cargo === 3 && (
                          <button 
                            className="percurso-btn"
                            onClick={() => handleVerPercursoFormativo(utilizador.id_utilizador)}
                          >
                            Percurso
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {showEditarUtilizador && utilizadorSelecionado && (
        <EditarUsuarioModal 
          usuario={utilizadorSelecionado}
          onClose={() => setShowEditarUtilizador(false)}
          onSuccess={(utilizadorAtualizado) => {
            setShowEditarUtilizador(false);
            // Atualizar utilizador na lista
            setUtilizadores(utilizadores.map(u => 
              u.id_utilizador === utilizadorAtualizado.id_utilizador ? utilizadorAtualizado : u
            ));
          }}
        />
      )}
    </div>
  );
};

// Função auxiliar para obter o nome do cargo pelo ID
function getCargo(id_cargo) {
  switch (id_cargo) {
    case 1:
      return 'Gestor';
    case 2:
      return 'Formador';
    case 3:
      return 'Formando';
    default:
      return 'Desconhecido';
  }
}

// Função auxiliar para obter o ID do cargo pelo nome
function getCargoId(cargo) {
  switch (cargo.toLowerCase()) {
    case 'gestor':
      return 1;
    case 'formador':
      return 2;
    case 'formando':
      return 3;
    default:
      return null;
  }
}

export default GerenciarUtilizadores;