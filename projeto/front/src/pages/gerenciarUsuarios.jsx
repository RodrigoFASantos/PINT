import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/gerenciarUsuarios.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import EditarUsuarioModal from '../components/EditarUsuarioModal';

const GerenciarUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilFiltro, setPerfilFiltro] = useState('');
  const [nomeFiltro, setNomeFiltro] = useState('');
  const [showEditarUsuario, setShowEditarUsuario] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsuarios(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const handleFiltrarUsuarios = () => {
    setLoading(true);
    
    const fetchFiltrados = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/usuarios', {
          params: {
            nome: nomeFiltro,
            perfil: perfilFiltro
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsuarios(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao filtrar usuários:', error);
        setLoading(false);
      }
    };

    fetchFiltrados();
  };

  const handleLimparFiltros = () => {
    setNomeFiltro('');
    setPerfilFiltro('');
    
    const fetchUsuarios = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsuarios(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setLoading(false);
      }
    };

    fetchUsuarios();
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioSelecionado(usuario);
    setShowEditarUsuario(true);
  };

  const handleAtivarDesativar = async (usuarioId, ativo) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/usuarios/${usuarioId}/ativar-desativar`, 
        { ativo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Atualizar lista de usuários
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, ativo } : u
      ));
      
      return true;
    } catch (error) {
      console.error('Erro ao ativar/desativar usuário:', error);
      return false;
    }
  };

  const handleCriarUsuario = () => {
    navigate('/admin/criar-usuario');
  };

  const handleVerPercursoFormativo = (usuarioId) => {
    navigate(`/admin/percurso-formativo/${usuarioId}`);
  };

  if (loading) {
    return <div className="loading">Carregando usuários...</div>;
  }

  return (
    <div className="gerenciar-usuarios-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="usuarios-content">
          <h1>Gerenciar Usuários</h1>
          
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
                onClick={handleFiltrarUsuarios}
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
            <h2>Lista de Usuários</h2>
            <button 
              className="criar-usuario-btn"
              onClick={handleCriarUsuario}
            >
              Adicionar Usuário
            </button>
          </div>
          
          {usuarios.length === 0 ? (
            <p className="no-usuarios">Nenhum usuário encontrado.</p>
          ) : (
            <div className="usuarios-table-container">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Data de Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario.id} className={!usuario.ativo ? 'inativo' : ''}>
                      <td>{usuario.nome}</td>
                      <td>{usuario.email}</td>
                      <td>
                        <span className={`badge ${usuario.perfil}`}>
                          {usuario.perfil.charAt(0).toUpperCase() + usuario.perfil.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${usuario.ativo ? 'ativo' : 'inativo'}`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{new Date(usuario.dataCadastro).toLocaleDateString()}</td>
                      <td className="acoes">
                        <button 
                          className="editar-btn"
                          onClick={() => handleEditarUsuario(usuario)}
                        >
                          Editar
                        </button>
                        
                        <button 
                          className={usuario.ativo ? 'desativar-btn' : 'ativar-btn'}
                          onClick={() => handleAtivarDesativar(usuario.id, !usuario.ativo)}
                        >
                          {usuario.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        
                        {usuario.perfil === 'formando' && (
                          <button 
                            className="percurso-btn"
                            onClick={() => handleVerPercursoFormativo(usuario.id)}
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
      
      {showEditarUsuario && usuarioSelecionado && (
        <EditarUsuarioModal 
          usuario={usuarioSelecionado}
          onClose={() => setShowEditarUsuario(false)}
          onSuccess={(usuarioAtualizado) => {
            setShowEditarUsuario(false);
            // Atualizar usuário na lista
            setUsuarios(usuarios.map(u => 
              u.id === usuarioAtualizado.id ? usuarioAtualizado : u
            ));
          }}
        />
      )}
    </div>
  );
};

export default GerenciarUsuarios;