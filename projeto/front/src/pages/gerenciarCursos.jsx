import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/gerenciarCursos.css';
import Sidebar from '../components/Sidebar';
import EditarCursoModal from '../components/EditarCursoModal';

const GerenciarCursos = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [tituloFiltro, setTituloFiltro] = useState('');
  const [showEditarCurso, setShowEditarCurso] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Obter categorias para o filtro
        const categoriasResponse = await axios.get('/api/categorias', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCategorias(categoriasResponse.data);
        
        // Obter cursos
        const cursosResponse = await axios.get('/api/admin/cursos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCursos(cursosResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFiltrarCursos = () => {
    setLoading(true);
    
    const fetchFiltrados = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/cursos', {
          params: {
            titulo: tituloFiltro,
            categoria: categoriaFiltro,
            status: statusFiltro
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCursos(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao filtrar cursos:', error);
        setLoading(false);
      }
    };

    fetchFiltrados();
  };

  const handleLimparFiltros = () => {
    setTituloFiltro('');
    setCategoriaFiltro('');
    setStatusFiltro('');
    
    const fetchCursos = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/cursos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCursos(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        setLoading(false);
      }
    };

    fetchCursos();
  };

  const handleEditarCurso = (curso) => {
    setCursoSelecionado(curso);
    setShowEditarCurso(true);
  };

  const handleAtivarDesativar = async (cursoId, ativo) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/cursos/${cursoId}/ativar-desativar`, 
        { ativo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Atualizar lista de cursos
      setCursos(cursos.map(c => 
        c.id === cursoId ? { ...c, ativo } : c
      ));
      
      return true;
    } catch (error) {
      console.error('Erro ao ativar/desativar curso:', error);
      return false;
    }
  };

  const handleCriarCurso = () => {
    navigate('/admin/criar-curso');
  };

  const handleVerInscritos = (cursoId) => {
    navigate(`/admin/curso/${cursoId}/inscritos`);
  };

  // Função para determinar o status do curso
  const getStatusCurso = (curso) => {
    const hoje = new Date();
    const dataInicio = new Date(curso.dataInicio);
    const dataFim = new Date(curso.dataFim);

    if (!curso.ativo) return "Inativo";
    if (hoje < dataInicio) return "Agendado";
    if (hoje >= dataInicio && hoje <= dataFim) return "Em curso";
    return "Terminado";
  };

  if (loading) {
    return <div className="loading">Carregando cursos...</div>;
  }

  return (
    <div className="gerenciar-cursos-container">
      <div className="main-content">
        <Sidebar />
        <div className="cursos-content">
          <h1>Gerenciar Cursos</h1>
          
          <div className="filtros-container">
            <div className="filtro">
              <label htmlFor="titulo-filtro">Título:</label>
              <input 
                type="text" 
                id="titulo-filtro" 
                value={tituloFiltro}
                onChange={(e) => setTituloFiltro(e.target.value)}
                placeholder="Filtrar por título"
              />
            </div>
            
            <div className="filtro">
              <label htmlFor="categoria-filtro">Categoria:</label>
              <select 
                id="categoria-filtro" 
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="">Todas</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filtro">
              <label htmlFor="status-filtro">Status:</label>
              <select 
                id="status-filtro" 
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Agendado">Agendado</option>
                <option value="Em curso">Em curso</option>
                <option value="Terminado">Terminado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            
            <div className="filtro-acoes">
              <button 
                className="filtrar-btn"
                onClick={handleFiltrarCursos}
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
          
          <div className="cursos-header">
            <h2>Lista de Cursos</h2>
            <button 
              className="criar-curso-btn"
              onClick={handleCriarCurso}
            >
              Criar Novo Curso
            </button>
          </div>
          
          {cursos.length === 0 ? (
            <p className="no-cursos">Nenhum curso encontrado.</p>
          ) : (
            <div className="cursos-table-container">
              <table className="cursos-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Período</th>
                    <th>Inscritos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map(curso => {
                    const status = getStatusCurso(curso);
                    
                    return (
                      <tr key={curso.id} className={!curso.ativo ? 'inativo' : ''}>
                        <td>{curso.titulo}</td>
                        <td>{curso.categoria} &gt; {curso.area}</td>
                        <td>{curso.formador ? 'Síncrono' : 'Assíncrono'}</td>
                        <td>
                          <span className={`status ${status.toLowerCase().replace(' ', '-')}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          {new Date(curso.dataInicio).toLocaleDateString()} - 
                          {new Date(curso.dataFim).toLocaleDateString()}
                        </td>
                        <td>
                          {curso.formador 
                            ? `${curso.inscritosCount || 0} / ${curso.vagasTotal}` 
                            : curso.inscritosCount || 0
                          }
                        </td>
                        <td className="acoes">
                          <button 
                            className="editar-btn"
                            onClick={() => handleEditarCurso(curso)}
                          >
                            Editar
                          </button>
                          
                          <button 
                            className={curso.ativo ? 'desativar-btn' : 'ativar-btn'}
                            onClick={() => handleAtivarDesativar(curso.id, !curso.ativo)}
                          >
                            {curso.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          
                          <button 
                            className="inscritos-btn"
                            onClick={() => handleVerInscritos(curso.id)}
                          >
                            Inscritos
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {showEditarCurso && cursoSelecionado && (
        <EditarCursoModal 
          curso={cursoSelecionado}
          onClose={() => setShowEditarCurso(false)}
          onSuccess={(cursoAtualizado) => {
            setShowEditarCurso(false);
            // Atualizar curso na lista
            setCursos(cursos.map(c => 
              c.id === cursoAtualizado.id ? cursoAtualizado : c
            ));
          }}
        />
      )}
    </div>
  );
};

export default GerenciarCursos;