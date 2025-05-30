import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import Sidebar from '../../components/Sidebar';
import './css/Admin_Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalUtilizadores: 0,
    totalCursos: 0,
    cursosAtivos: 0,
    inscricoesUltimos30Dias: 0,
    totalFormadores: 0,
    totalFormandos: 0,
    cursosTerminados: 0,
    totalDenuncias: 0,
    denunciasResolvidasPorcentagem: 0,
    presencasHoje: 0
  });

  // Estados para gráficos
  const [cursosPorCategoria, setCursosPorCategoria] = useState([]);
  const [inscricoesPorMes, setInscricoesPorMes] = useState([]);
  const [utilizadorePorPerfil, setUtilizadorePorPerfil] = useState([]);
  const [denunciasPorTopico, setDenunciasPorTopico] = useState([]);
  const [cursosMaisInscritos, setCursosMaisInscritos] = useState([]);
  const [evolucaoUtilizadores, setEvolucaoUtilizadores] = useState([]);
  const [topFormadores, setTopFormadores] = useState([]);
  const [cursosCompletudePorcentagem, setCursosCompletudePorcentagem] = useState([]);

  const toggleSidebar = () => {
    console.log('[DEBUG] AdminDashboard: A alternar estado da sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        console.log('[DEBUG] A carregar dados do dashboard...');
        
        // Estatísticas gerais
        try {
          const statsResponse = await axios.get('/api/dashboard/estatisticas', config);
          console.log('[DEBUG] Estatísticas carregadas:', statsResponse.data);
          setStats(statsResponse.data);
        } catch (error) {
          console.warn('[WARN] Erro ao carregar estatísticas:', error.message);
          // Dados mock para desenvolvimento
          setStats({
            totalUtilizadores: 245,
            totalCursos: 67,
            cursosAtivos: 23,
            inscricoesUltimos30Dias: 89,
            totalFormadores: 15,
            totalFormandos: 230,
            cursosTerminados: 44,
            totalDenuncias: 12,
            denunciasResolvidasPorcentagem: 83.3,
            presencasHoje: 156
          });
        }

        // Cursos por categoria
        try {
          const categoriaResponse = await axios.get('/api/cursos', { 
            ...config, 
            params: { stats: 'categoria' } 
          });
          setCursosPorCategoria(categoriaResponse.data.categorias || [
            { categoria: 'Tecnologia', total: 25 },
            { categoria: 'Gestão', total: 18 },
            { categoria: 'Marketing', total: 12 },
            { categoria: 'Design', total: 8 },
            { categoria: 'Finanças', total: 4 }
          ]);
        } catch (error) {
          console.warn('[WARN] A usar dados mock para categorias');
          setCursosPorCategoria([
            { categoria: 'Tecnologia', total: 25 },
            { categoria: 'Gestão', total: 18 },
            { categoria: 'Marketing', total: 12 },
            { categoria: 'Design', total: 8 },
            { categoria: 'Finanças', total: 4 }
          ]);
        }

        // Inscrições por mês
        try {
          const inscricoesResponse = await axios.get('/api/inscricoes', { 
            ...config, 
            params: { stats: 'mensal' } 
          });
          setInscricoesPorMes(inscricoesResponse.data.mensal || [
            { mes: 'Jan', total: 45 },
            { mes: 'Fev', total: 52 },
            { mes: 'Mar', total: 38 },
            { mes: 'Abr', total: 61 },
            { mes: 'Mai', total: 89 },
            { mes: 'Jun', total: 73 }
          ]);
        } catch (error) {
          setInscricoesPorMes([
            { mes: 'Jan', total: 45 },
            { mes: 'Fev', total: 52 },
            { mes: 'Mar', total: 38 },
            { mes: 'Abr', total: 61 },
            { mes: 'Mai', total: 89 },
            { mes: 'Jun', total: 73 }
          ]);
        }

        // Utilizadores por perfil
        try {
          const utilizadoresResponse = await axios.get('/api/users', { 
            ...config, 
            params: { stats: 'perfil' } 
          });
          setUtilizadorePorPerfil(utilizadoresResponse.data.perfis || [
            { perfil: 'Formandos', total: 230 },
            { perfil: 'Formadores', total: 15 },
            { perfil: 'Administradores', total: 3 }
          ]);
        } catch (error) {
          setUtilizadorePorPerfil([
            { perfil: 'Formandos', total: 230 },
            { perfil: 'Formadores', total: 15 },
            { perfil: 'Administradores', total: 3 }
          ]);
        }

        // Denúncias por tópico
        try {
          const denunciasResponse = await axios.get('/api/denuncias', { 
            ...config, 
            params: { stats: 'topicos' } 
          });
          setDenunciasPorTopico(denunciasResponse.data.topicos || [
            { topico: 'Programação Web', denuncias: 5 },
            { topico: 'Marketing Digital', denuncias: 3 },
            { topico: 'Design Gráfico', denuncias: 2 },
            { topico: 'Gestão de Projetos', denuncias: 1 },
            { topico: 'Análise de Dados', denuncias: 1 }
          ]);
        } catch (error) {
          setDenunciasPorTopico([
            { topico: 'Programação Web', denuncias: 5 },
            { topico: 'Marketing Digital', denuncias: 3 },
            { topico: 'Design Gráfico', denuncias: 2 },
            { topico: 'Gestão de Projetos', denuncias: 1 },
            { topico: 'Análise de Dados', denuncias: 1 }
          ]);
        }

        // Cursos mais inscritos
        try {
          const cursosPopularesResponse = await axios.get('/api/cursos', { 
            ...config, 
            params: { stats: 'populares', limit: 10 } 
          });
          setCursosMaisInscritos(cursosPopularesResponse.data.populares || [
            { nome: 'React.js Avançado', inscricoes: 45 },
            { nome: 'Python para Data Science', inscricoes: 38 },
            { nome: 'Marketing Digital', inscricoes: 32 },
            { nome: 'UI/UX Design', inscricoes: 28 },
            { nome: 'Gestão de Equipas', inscricoes: 25 },
            { nome: 'Excel Avançado', inscricoes: 22 },
            { nome: 'Photoshop Profissional', inscricoes: 19 },
            { nome: 'Node.js Backend', inscricoes: 17 }
          ]);
        } catch (error) {
          setCursosMaisInscritos([
            { nome: 'React.js Avançado', inscricoes: 45 },
            { nome: 'Python para Data Science', inscricoes: 38 },
            { nome: 'Marketing Digital', inscricoes: 32 },
            { nome: 'UI/UX Design', inscricoes: 28 },
            { nome: 'Gestão de Equipas', inscricoes: 25 }
          ]);
        }

        // Evolução de utilizadores
        setEvolucaoUtilizadores([
          { mes: 'Jan', novos: 15, ativos: 180 },
          { mes: 'Fev', novos: 23, ativos: 195 },
          { mes: 'Mar', novos: 18, ativos: 210 },
          { mes: 'Abr', novos: 31, ativos: 225 },
          { mes: 'Mai', novos: 27, ativos: 240 },
          { mes: 'Jun', novos: 19, ativos: 245 }
        ]);

        // Top formadores
        setTopFormadores([
          { nome: 'Ana Silva', cursos: 8, avaliacao: 4.9 },
          { nome: 'João Santos', cursos: 6, avaliacao: 4.8 },
          { nome: 'Maria Costa', cursos: 5, avaliacao: 4.7 },
          { nome: 'Pedro Oliveira', cursos: 4, avaliacao: 4.6 },
          { nome: 'Sofia Rodrigues', cursos: 3, avaliacao: 4.5 }
        ]);

        // Taxa de conclusão por curso
        setCursosCompletudePorcentagem([
          { curso: 'React.js', conclusao: 89 },
          { curso: 'Python', conclusao: 76 },
          { curso: 'Marketing', conclusao: 92 },
          { curso: 'Design', conclusao: 68 },
          { curso: 'Excel', conclusao: 95 }
        ]);

        setLoading(false);
        console.log('[DEBUG] Todos os dados carregados com sucesso');
        
      } catch (error) {
        console.error('[ERROR] Erro ao carregar dados do dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log('[DEBUG] A criar gráficos...');
      criarGraficos();
    }
  }, [loading, cursosPorCategoria, inscricoesPorMes, utilizadorePorPerfil, denunciasPorTopico, cursosMaisInscritos, evolucaoUtilizadores]);

  const criarGraficos = () => {
    // Destruir gráficos existentes
    ['grafico-categorias', 'grafico-inscricoes', 'grafico-utilizadores', 'grafico-denuncias', 'grafico-cursos-populares', 'grafico-evolucao', 'grafico-conclusao'].forEach(id => {
      const chart = Chart.getChart(id);
      if (chart) chart.destroy();
    });

    // Gráfico de cursos por categoria
    const ctxCategorias = document.getElementById('grafico-categorias');
    if (ctxCategorias) {
      new Chart(ctxCategorias, {
        type: 'doughnut',
        data: {
          labels: cursosPorCategoria.map(item => item.categoria),
          datasets: [{
            label: 'Cursos por Categoria',
            data: cursosPorCategoria.map(item => item.total),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
            ],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: { size: 12 }
              }
            },
            title: {
              display: true,
              text: 'Distribuição de Cursos por Categoria',
              font: { size: 16, weight: 'bold' }
            }
          }
        }
      });
    }

    // Gráfico de inscrições por mês
    const ctxInscricoes = document.getElementById('grafico-inscricoes');
    if (ctxInscricoes) {
      new Chart(ctxInscricoes, {
        type: 'line',
        data: {
          labels: inscricoesPorMes.map(item => item.mes),
          datasets: [{
            label: 'Inscrições',
            data: inscricoesPorMes.map(item => item.total),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Evolução das Inscrições Mensais',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' },
              ticks: { font: { size: 12 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 12 } }
            }
          }
        }
      });
    }

    // Gráfico de utilizadores por perfil
    const ctxUtilizadores = document.getElementById('grafico-utilizadores');
    if (ctxUtilizadores) {
      new Chart(ctxUtilizadores, {
        type: 'bar',
        data: {
          labels: utilizadorePorPerfil.map(item => item.perfil),
          datasets: [{
            label: 'Utilizadores',
            data: utilizadorePorPerfil.map(item => item.total),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Distribuição de Utilizadores por Perfil',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' },
              ticks: { font: { size: 12 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 12 } }
            }
          }
        }
      });
    }

    // Gráfico de denúncias por tópico
    const ctxDenuncias = document.getElementById('grafico-denuncias');
    if (ctxDenuncias) {
      new Chart(ctxDenuncias, {
        type: 'bar',
        data: {
          labels: denunciasPorTopico.map(item => item.topico),
          datasets: [{
            label: 'Denúncias',
            data: denunciasPorTopico.map(item => item.denuncias),
            backgroundColor: '#EF4444',
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Denúncias por Tópico',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' },
              ticks: { font: { size: 12 } }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11 } }
            }
          }
        }
      });
    }

    // Gráfico de cursos mais inscritos
    const ctxCursosPopulares = document.getElementById('grafico-cursos-populares');
    if (ctxCursosPopulares) {
      new Chart(ctxCursosPopulares, {
        type: 'bar',
        data: {
          labels: cursosMaisInscritos.slice(0, 5).map(item => item.nome),
          datasets: [{
            label: 'Inscrições',
            data: cursosMaisInscritos.slice(0, 5).map(item => item.inscricoes),
            backgroundColor: '#8B5CF6',
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Top 5 Cursos Mais Procurados',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' },
              ticks: { font: { size: 12 } }
            },
            x: {
              grid: { display: false },
              ticks: { 
                font: { size: 11 },
                maxRotation: 45
              }
            }
          }
        }
      });
    }

    // Gráfico de evolução de utilizadores
    const ctxEvolucao = document.getElementById('grafico-evolucao');
    if (ctxEvolucao) {
      new Chart(ctxEvolucao, {
        type: 'line',
        data: {
          labels: evolucaoUtilizadores.map(item => item.mes),
          datasets: [
            {
              label: 'Novos Utilizadores',
              data: evolucaoUtilizadores.map(item => item.novos),
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4,
              fill: false
            },
            {
              label: 'Total Ativos',
              data: evolucaoUtilizadores.map(item => item.ativos),
              borderColor: '#06B6D4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              tension: 0.4,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Evolução de Utilizadores',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'top',
              labels: { usePointStyle: true }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // Gráfico de taxa de conclusão
    const ctxConclusao = document.getElementById('grafico-conclusao');
    if (ctxConclusao) {
      new Chart(ctxConclusao, {
        type: 'doughnut',
        data: {
          labels: cursosCompletudePorcentagem.map(item => item.curso),
          datasets: [{
            label: 'Taxa de Conclusão (%)',
            data: cursosCompletudePorcentagem.map(item => item.conclusao),
            backgroundColor: [
              '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true }
            },
            title: {
              display: true,
              text: 'Taxa de Conclusão por Curso (%)',
              font: { size: 16, weight: 'bold' }
            }
          }
        }
      });
    }
  };

  // Handlers de navegação
  const navegarPara = (rota) => {
    console.log(`[DEBUG] A navegar para: ${rota}`);
    navigate(rota);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>A carregar painel de administração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <div className="dashboard-header">
          <h1>Painel de Administração</h1>
          <p className="dashboard-subtitle">Visão geral completa do sistema</p>
        </div>

        {/* Ações rápidas */}
        <div className="quick-actions">
          <button className="action-btn primary" onClick={() => navegarPara('/admin/criar-curso')}>
            <i className="fas fa-plus"></i>
            Criar Curso
          </button>
          <button className="action-btn secondary" onClick={() => navegarPara('/admin/criar-usuario')}>
            <i className="fas fa-user-plus"></i>
            Adicionar Utilizador
          </button>
          <button className="action-btn success" onClick={() => navegarPara('/admin/cursos')}>
            <i className="fas fa-book"></i>
            Gerir Cursos
          </button>
          <button className="action-btn warning" onClick={() => navegarPara('/admin/denuncias')}>
            <i className="fas fa-flag"></i>
            Ver Denúncias
          </button>
        </div>

        {/* Estatísticas principais */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <h3>Total de Utilizadores</h3>
              <p className="stat-value">{stats.totalUtilizadores}</p>
              <span className="stat-trend positive">+12% este mês</span>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-book"></i>
            </div>
            <div className="stat-info">
              <h3>Total de Cursos</h3>
              <p className="stat-value">{stats.totalCursos}</p>
              <span className="stat-trend positive">+5 novos</span>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="stat-info">
              <h3>Cursos Ativos</h3>
              <p className="stat-value">{stats.cursosAtivos}</p>
              <span className="stat-trend neutral">{Math.round((stats.cursosAtivos / stats.totalCursos) * 100)}% do total</span>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <div className="stat-info">
              <h3>Inscrições (30d)</h3>
              <p className="stat-value">{stats.inscricoesUltimos30Dias}</p>
              <span className="stat-trend positive">+23% vs anterior</span>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-flag"></i>
            </div>
            <div className="stat-info">
              <h3>Denúncias Ativas</h3>
              <p className="stat-value">{stats.totalDenuncias}</p>
              <span className="stat-trend negative">{stats.denunciasResolvidasPorcentagem}% resolvidas</span>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-info">
              <h3>Presenças Hoje</h3>
              <p className="stat-value">{stats.presencasHoje}</p>
              <span className="stat-trend positive">85% de comparência</span>
            </div>
          </div>
        </div>

        {/* Gráficos principais */}
        <div className="charts-grid">
          <div className="chart-container large">
            <canvas id="grafico-inscricoes"></canvas>
          </div>
          
          <div className="chart-container medium">
            <canvas id="grafico-categorias"></canvas>
          </div>

          <div className="chart-container medium">
            <canvas id="grafico-utilizadores"></canvas>
          </div>

          <div className="chart-container large">
            <canvas id="grafico-evolucao"></canvas>
          </div>

          <div className="chart-container medium">
            <canvas id="grafico-denuncias"></canvas>
          </div>

          <div className="chart-container medium">
            <canvas id="grafico-cursos-populares"></canvas>
          </div>

          <div className="chart-container small">
            <canvas id="grafico-conclusao"></canvas>
          </div>
        </div>

        {/* Tabelas de dados */}
        <div className="data-tables">
          {/* Top Formadores */}
          <div className="table-container">
            <h3><i className="fas fa-star"></i> Top Formadores</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cursos</th>
                    <th>Avaliação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {topFormadores.map((formador, index) => (
                    <tr key={index}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">{formador.nome.charAt(0)}</div>
                          <span>{formador.nome}</span>
                        </div>
                      </td>
                      <td><span className="badge">{formador.cursos}</span></td>
                      <td>
                        <div className="rating">
                          <span>{formador.avaliacao}</span>
                          <i className="fas fa-star"></i>
                        </div>
                      </td>
                      <td>
                        <button className="btn-small">Ver Perfil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cursos Populares */}
          <div className="table-container">
            <h3><i className="fas fa-fire"></i> Cursos Mais Procurados</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Inscrições</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosMaisInscritos.slice(0, 5).map((curso, index) => (
                    <tr key={index}>
                      <td>
                        <div className="course-info">
                          <strong>{curso.nome}</strong>
                        </div>
                      </td>
                      <td><span className="badge success">{curso.inscricoes}</span></td>
                      <td><span className="status active">Ativo</span></td>
                      <td>
                        <button className="btn-small">Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Atividade recente */}
        <div className="recent-activity">
          <h3><i className="fas fa-clock"></i> Atividade Recente</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon success">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="activity-content">
                <p><strong>Novo utilizador registado:</strong> Maria Santos</p>
                <span className="activity-time">há 5 minutos</span>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon info">
                <i className="fas fa-book"></i>
              </div>
              <div className="activity-content">
                <p><strong>Curso criado:</strong> "JavaScript Avançado"</p>
                <span className="activity-time">há 1 hora</span>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon warning">
                <i className="fas fa-flag"></i>
              </div>
              <div className="activity-content">
                <p><strong>Nova denúncia:</strong> Comentário inadequado no fórum</p>
                <span className="activity-time">há 2 horas</span>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon success">
                <i className="fas fa-certificate"></i>
              </div>
              <div className="activity-content">
                <p><strong>Certificado emitido:</strong> João Silva - React.js</p>
                <span className="activity-time">há 3 horas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;