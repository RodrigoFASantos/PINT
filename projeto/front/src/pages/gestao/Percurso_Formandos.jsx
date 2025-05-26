import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import './css/Percurso_Formandos.css';

const PercursoFormandos = () => {
  const [formandos, setFormandos] = useState([]);
  const [formandosFiltrados, setFormandosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEmail, setFiltroEmail] = useState('');
  
  // Estados para ordenação
  const [ordenarPor, setOrdenarPor] = useState('nome');
  const [ordemCrescente, setOrdemCrescente] = useState(true);
  
  // Estado para expandir detalhes
  const [expandidos, setExpandidos] = useState({});

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchPercursoFormandos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Utilizador não autenticado. Faça login novamente.');
          setLoading(false);
          return;
        }

        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Endpoint para buscar todas as inscrições (para administradores)
        // Nota: Este endpoint precisa ser implementado no backend
        const response = await axios.get(`${API_BASE}/admin/percurso-formandos`, config);
        
        // Processar dados agrupando por utilizador
        const formandosMap = {};
        
        response.data.forEach(inscricao => {
          const email = inscricao.emailUtilizador;
          
          if (!formandosMap[email]) {
            formandosMap[email] = {
              email: email,
              nome: inscricao.nomeUtilizador,
              cursos: [],
              totalCursos: 0,
              cursosAgendados: 0,
              cursosEmAndamento: 0,
              cursosCompletos: 0,
              totalHorasFormacao: 0,
              mediaNotas: 0
            };
          }
          
          const hoje = new Date();
          const dataInicio = inscricao.dataInicio ? new Date(inscricao.dataInicio) : null;
          const dataFim = inscricao.dataFim ? new Date(inscricao.dataFim) : null;
          
          let statusCurso = 'Em Andamento';
          if (dataInicio && dataInicio > hoje) {
            statusCurso = 'Agendado';
            formandosMap[email].cursosAgendados++;
          } else if (inscricao.status === 'Concluído' || (dataFim && dataFim < hoje)) {
            statusCurso = 'Concluído';
            formandosMap[email].cursosCompletos++;
          } else {
            formandosMap[email].cursosEmAndamento++;
          }
          
          const curso = {
            id: inscricao.cursoId,
            titulo: inscricao.nomeCurso,
            categoria: inscricao.categoria || 'Não especificada',
            area: inscricao.area || 'Não especificada',
            dataInicio: inscricao.dataInicio,
            dataFim: inscricao.dataFim,
            cargaHoraria: inscricao.cargaHoraria || 0,
            horasPresenca: inscricao.horasPresenca,
            notaFinal: inscricao.notaFinal,
            status: statusCurso,
            dataInscricao: inscricao.dataInscricao
          };
          
          formandosMap[email].cursos.push(curso);
          formandosMap[email].totalCursos++;
          formandosMap[email].totalHorasFormacao += curso.cargaHoraria;
        });
        
        // Calcular média das notas para cada formando
        Object.values(formandosMap).forEach(formando => {
          const notasValidas = formando.cursos
            .filter(curso => curso.notaFinal !== null && curso.notaFinal !== undefined)
            .map(curso => curso.notaFinal);
          
          if (notasValidas.length > 0) {
            formando.mediaNotas = (notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length).toFixed(1);
          } else {
            formando.mediaNotas = 'N/A';
          }
        });
        
        const formandosArray = Object.values(formandosMap);
        setFormandos(formandosArray);
        setFormandosFiltrados(formandosArray);
        
      } catch (err) {
        console.error('Erro ao carregar percurso dos formandos:', err);
        if (err.response?.status === 403) {
          setError('Acesso negado. Apenas administradores podem visualizar esta página.');
        } else if (err.response?.status === 404) {
          setError('Endpoint não encontrado. O backend ainda não implementou a rota /admin/percurso-formandos');
        } else {
          setError('Erro ao carregar dados dos formandos. Verifique se o backend está a funcionar.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPercursoFormandos();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...formandos];

    // Filtro por nome
    if (filtroNome) {
      filtered = filtered.filter(formando =>
        formando.nome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    // Filtro por email
    if (filtroEmail) {
      filtered = filtered.filter(formando =>
        formando.email.toLowerCase().includes(filtroEmail.toLowerCase())
      );
    }

    // Filtro por status (aplicado aos cursos do formando)
    if (filtroStatus) {
      filtered = filtered.filter(formando =>
        formando.cursos.some(curso => curso.status === filtroStatus)
      );
    }

    // Filtro por data
    if (filtroDataInicio || filtroDataFim) {
      filtered = filtered.filter(formando => {
        return formando.cursos.some(curso => {
          const dataInicioCurso = curso.dataInicio ? new Date(curso.dataInicio) : null;
          const dataFimCurso = curso.dataFim ? new Date(curso.dataFim) : null;
          
          let passaFiltroInicio = true;
          let passaFiltroFim = true;
          
          if (filtroDataInicio && dataInicioCurso) {
            passaFiltroInicio = dataInicioCurso >= new Date(filtroDataInicio);
          }
          
          if (filtroDataFim && dataFimCurso) {
            passaFiltroFim = dataFimCurso <= new Date(filtroDataFim);
          }
          
          return passaFiltroInicio && passaFiltroFim;
        });
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (ordenarPor) {
        case 'nome':
          valueA = a.nome.toLowerCase();
          valueB = b.nome.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'totalCursos':
          valueA = a.totalCursos;
          valueB = b.totalCursos;
          break;
        case 'cursosCompletos':
          valueA = a.cursosCompletos;
          valueB = b.cursosCompletos;
          break;
        case 'totalHoras':
          valueA = a.totalHorasFormacao;
          valueB = b.totalHorasFormacao;
          break;
        case 'mediaNotas':
          valueA = a.mediaNotas === 'N/A' ? -1 : parseFloat(a.mediaNotas);
          valueB = b.mediaNotas === 'N/A' ? -1 : parseFloat(b.mediaNotas);
          break;
        default:
          valueA = a.nome.toLowerCase();
          valueB = b.nome.toLowerCase();
      }
      
      if (valueA < valueB) return ordemCrescente ? -1 : 1;
      if (valueA > valueB) return ordemCrescente ? 1 : -1;
      return 0;
    });

    setFormandosFiltrados(filtered);
  }, [formandos, filtroNome, filtroEmail, filtroStatus, filtroDataInicio, filtroDataFim, ordenarPor, ordemCrescente]);

  const toggleExpansao = (email) => {
    setExpandidos(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroEmail('');
    setFiltroStatus('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-PT');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Agendado': return 'status-agendado';
      case 'Em Andamento': return 'status-andamento';
      case 'Concluído': return 'status-concluido';
      default: return '';
    }
  };

  // Função para exportar dados (funcionalidade extra)
  const exportarCSV = () => {
    if (formandosFiltrados.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    const csvContent = [
      // Cabeçalho
      'Nome,Email,Total Cursos,Cursos Completos,Total Horas,Média Notas',
      // Dados
      ...formandosFiltrados.map(formando => 
        `"${formando.nome}","${formando.email}",${formando.totalCursos},${formando.cursosCompletos},${formando.totalHorasFormacao},"${formando.mediaNotas}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `percurso_formandos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="loading">A carregar percurso dos formandos...</div>;
  
  if (error) return (
    <div className="percurso-formandos-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
        {error.includes('404') && (
          <div className="backend-info">
            <h4>Informação para o Desenvolvedor:</h4>
            <p>É necessário implementar o endpoint no backend:</p>
            <code>GET /admin/percurso-formandos</code>
            <p>Este endpoint deve retornar todas as inscrições dos utilizadores para administradores.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="percurso-formandos-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="percurso-content">
        <div className="header-section">
          <h1>Percurso Formativo dos Formandos</h1>
          <p className="subtitle">Gestão e acompanhamento do progresso formativo</p>
        </div>

        {/* Filtros */}
        <div className="filtros-section">
          <div className="filtros-header">
            <h3>Filtros e Ordenação</h3>
            <button className="btn-exportar" onClick={exportarCSV}>
              📊 Exportar CSV
            </button>
          </div>
          <div className="filtros-grid">
            <div className="filtro-grupo">
              <label>Nome do Formando:</label>
              <input
                type="text"
                placeholder="Pesquisar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>
            
            <div className="filtro-grupo">
              <label>Email:</label>
              <input
                type="text"
                placeholder="Pesquisar por email..."
                value={filtroEmail}
                onChange={(e) => setFiltroEmail(e.target.value)}
              />
            </div>
            
            <div className="filtro-grupo">
              <label>Status do Curso:</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="Agendado">Agendado</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
            
            <div className="filtro-grupo">
              <label>Data Início (a partir de):</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>
            
            <div className="filtro-grupo">
              <label>Data Fim (até):</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
            
            <div className="filtro-grupo">
              <label>Ordenar por:</label>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
              >
                <option value="nome">Nome</option>
                <option value="email">Email</option>
                <option value="totalCursos">Total de Cursos</option>
                <option value="cursosCompletos">Cursos Completos</option>
                <option value="totalHoras">Total de Horas</option>
                <option value="mediaNotas">Média das Notas</option>
              </select>
            </div>
            
            <div className="filtro-grupo">
              <label>Ordem:</label>
              <select
                value={ordemCrescente ? 'asc' : 'desc'}
                onChange={(e) => setOrdemCrescente(e.target.value === 'asc')}
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
            
            <div className="filtro-grupo">
              <button className="btn-limpar-filtros" onClick={limparFiltros}>
                🗑️ Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="estatisticas-section">
          <div className="estatistica-card">
            <h4>Total de Formandos</h4>
            <span className="numero">{formandosFiltrados.length}</span>
          </div>
          <div className="estatistica-card">
            <h4>Total de Inscrições</h4>
            <span className="numero">
              {formandosFiltrados.reduce((total, formando) => total + formando.totalCursos, 0)}
            </span>
          </div>
          <div className="estatistica-card">
            <h4>Cursos Concluídos</h4>
            <span className="numero">
              {formandosFiltrados.reduce((total, formando) => total + formando.cursosCompletos, 0)}
            </span>
          </div>
          <div className="estatistica-card">
            <h4>Total Horas Formação</h4>
            <span className="numero">
              {formandosFiltrados.reduce((total, formando) => total + formando.totalHorasFormacao, 0)}h
            </span>
          </div>
        </div>

        {/* Lista de Formandos */}
        <div className="formandos-section">
          <h3>Lista de Formandos ({formandosFiltrados.length})</h3>
          
          {formandosFiltrados.length === 0 ? (
            <p className="no-formandos">Nenhum formando encontrado com os filtros aplicados.</p>
          ) : (
            <div className="formandos-lista">
              {formandosFiltrados.map(formando => (
                <div key={formando.email} className="formando-card">
                  <div className="formando-header" onClick={() => toggleExpansao(formando.email)}>
                    <div className="formando-info-principal">
                      <h4>{formando.nome}</h4>
                      <p className="email">{formando.email}</p>
                    </div>
                    
                    <div className="formando-resumo">
                      <div className="resumo-item">
                        <span className="label">Total:</span>
                        <span className="valor">{formando.totalCursos} cursos</span>
                      </div>
                      <div className="resumo-item">
                        <span className="label">Completos:</span>
                        <span className="valor">{formando.cursosCompletos}</span>
                      </div>
                      <div className="resumo-item">
                        <span className="label">Horas:</span>
                        <span className="valor">{formando.totalHorasFormacao}h</span>
                      </div>
                      <div className="resumo-item">
                        <span className="label">Média:</span>
                        <span className="valor">{formando.mediaNotas}</span>
                      </div>
                    </div>
                    
                    <div className="expand-icon">
                      {expandidos[formando.email] ? '▼' : '▶'}
                    </div>
                  </div>
                  
                  {expandidos[formando.email] && (
                    <div className="formando-detalhes">
                      <div className="detalhes-header">
                        <h5>Cursos Inscritos ({formando.cursos.length})</h5>
                      </div>
                      
                      <div className="cursos-lista">
                        {formando.cursos.map(curso => (
                          <div key={`${formando.email}-${curso.id}`} className="curso-item">
                            <div className="curso-info">
                              <h6>{curso.titulo}</h6>
                              <div className="curso-detalhes">
                                <span className="categoria">{curso.categoria}</span>
                                <span className="area">{curso.area}</span>
                                <span className={`status ${getStatusClass(curso.status)}`}>
                                  {curso.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="curso-dados">
                              <div className="dado-item">
                                <span className="label">Início:</span>
                                <span>{formatarData(curso.dataInicio)}</span>
                              </div>
                              <div className="dado-item">
                                <span className="label">Fim:</span>
                                <span>{formatarData(curso.dataFim)}</span>
                              </div>
                              <div className="dado-item">
                                <span className="label">Carga:</span>
                                <span>{curso.cargaHoraria}h</span>
                              </div>
                              {curso.horasPresenca !== null && curso.horasPresenca !== undefined && (
                                <div className="dado-item">
                                  <span className="label">Presença:</span>
                                  <span>{curso.horasPresenca}h</span>
                                </div>
                              )}
                              {curso.notaFinal !== null && curso.notaFinal !== undefined && (
                                <div className="dado-item">
                                  <span className="label">Nota:</span>
                                  <span>{curso.notaFinal}/20</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PercursoFormandos;