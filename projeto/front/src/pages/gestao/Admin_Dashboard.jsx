import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import API_BASE from "../../api";
import Sidebar from '../../components/Sidebar';
import './css/Admin_Dashboard.css';

/**
 * Componente AdminDashboard
 * 
 * Dashboard principal para administradores do sistema com:
 * - Estatísticas gerais de utilizadores e cursos
 * - Gráficos interativos para análise de dados
 * - Ações rápidas para gestão do sistema
 * - Interface responsiva com sidebar colapsável
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados para as estatísticas principais do dashboard
  const [stats, setStats] = useState({
    totalUtilizadores: 0,
    totalFormadores: 0,
    totalFormandos: 0,
    totalAdministradores: 0,
    totalCursos: 0,
    cursosAtivos: 0,
    cursosTerminados: 0,
    cursosEmAndamento: 0,
    cursosPlaneados: 0,
    cursosSincronos: 0,
    cursosAssincronos: 0,
    totalInscricoes: 0,
    inscricoesUltimos30Dias: 0,
    cursosTerminandoEmBreve: 0
  });

  // Estados para os dados dos diferentes gráficos
  const [cursosPorCategoria, setCursosPorCategoria] = useState([]);
  const [inscricoesPorMes, setInscricoesPorMes] = useState([]);
  const [utilizadorePorPerfil, setUtilizadorePorPerfil] = useState([]);
  const [cursosMaisInscritos, setCursosMaisInscritos] = useState([]);

  /**
   * Função para alternar a visibilidade da sidebar
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Hook para carregar todos os dados necessários para o dashboard
   * Executa chamadas paralelas para diferentes endpoints da API
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Carregar estatísticas gerais do sistema
        try {
          const statsResponse = await axios.get(`${API_BASE}/dashboard/estatisticas`, config);
          setStats(statsResponse.data);
        } catch (error) {
          console.error('Erro ao carregar estatísticas gerais:', error);
        }

        // Carregar dados de distribuição de cursos por categoria
        try {
          const categoriaResponse = await axios.get(`${API_BASE}/dashboard/cursos-categoria`, config);
          setCursosPorCategoria(categoriaResponse.data.categorias || []);
        } catch (error) {
          console.error('Erro ao carregar dados de categorias:', error);
        }

        // Carregar dados de evolução mensal das inscrições
        try {
          const inscricoesResponse = await axios.get(`${API_BASE}/dashboard/inscricoes-mes`, config);
          setInscricoesPorMes(inscricoesResponse.data.mensal || []);
        } catch (error) {
          console.error('Erro ao carregar dados de inscrições mensais:', error);
        }

        // Carregar dados de distribuição de utilizadores por perfil
        try {
          const utilizadoresResponse = await axios.get(`${API_BASE}/dashboard/utilizadores-perfil`, config);
          setUtilizadorePorPerfil(utilizadoresResponse.data.perfis || []);
        } catch (error) {
          console.error('Erro ao carregar dados de utilizadores:', error);
        }

        // Carregar dados dos cursos mais populares
        try {
          const cursosPopularesResponse = await axios.get(`${API_BASE}/dashboard/cursos-populares`, config);
          setCursosMaisInscritos(cursosPopularesResponse.data.populares || []);
        } catch (error) {
          console.error('Erro ao carregar dados de cursos populares:', error);
        }

        setLoading(false);

      } catch (error) {
        console.error('Erro geral ao carregar dados do dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /**
   * Hook para criar os gráficos após todos os dados serem carregados
   * Recria os gráficos sempre que os dados são atualizados
   */
  useEffect(() => {
    if (!loading) {
      criarGraficos();
    }
  }, [loading, cursosPorCategoria, inscricoesPorMes, utilizadorePorPerfil, cursosMaisInscritos]);

  /**
   * Função principal para criar todos os gráficos do dashboard
   * Utiliza Chart.js para gerar visualizações interativas
   */
  const criarGraficos = () => {
    // Destruir gráficos existentes para evitar conflitos de múltiplas instâncias
    ['grafico-categorias', 'grafico-inscricoes', 'grafico-utilizadores', 'grafico-cursos-populares'].forEach(id => {
      const chart = Chart.getChart(id);
      if (chart) chart.destroy();
    });

    // === GRÁFICO DE CURSOS POR CATEGORIA (Doughnut) ===
    const ctxCategorias = document.getElementById('grafico-categorias');
    if (ctxCategorias && cursosPorCategoria.length > 0) {
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

    // === GRÁFICO DE EVOLUÇÃO DAS INSCRIÇÕES (Linha) ===
    const ctxInscricoes = document.getElementById('grafico-inscricoes');
    if (ctxInscricoes && inscricoesPorMes.length > 0) {
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

    // === GRÁFICO DE UTILIZADORES POR PERFIL (Barras) ===
    const ctxUtilizadores = document.getElementById('grafico-utilizadores');
    if (ctxUtilizadores && utilizadorePorPerfil.length > 0) {
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

    // === GRÁFICO DE CURSOS MAIS POPULARES (Barras) ===
    const ctxCursosPopulares = document.getElementById('grafico-cursos-populares');
    if (ctxCursosPopulares && cursosMaisInscritos.length > 0) {
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
  };

  /**
   * Função para navegação entre diferentes páginas do sistema
   * Utiliza React Router para redirecionamento
   */
  const navegarPara = (rota) => {
    navigate(rota);
  };

  // Exibir ecrã de carregamento enquanto os dados são obtidos
  if (loading) {
    return (
      <div className="dashboard-container-tras-dash">
        <div className="loading-container-dash">
          <div className="loading-spinner-dash"></div>
          <p>A carregar painel de administração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-tras-dash">
      {/* Sidebar com menu de navegação */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content-dash">
        {/* Cabeçalho com botões de ação rápida */}
        <div className="dashboard-header-dash">
          <div className="quick-actions-dash">
            <button className="action-btn-dash primary" onClick={() => navegarPara('/admin/criar-curso')}>
              <i className="fas fa-plus"></i>
              Criar Curso
            </button>
            <button className="action-btn-dash primary" onClick={() => navegarPara('/admin/criar-usuario')}>
              <i className="fas fa-user-plus"></i>
              Adicionar Utilizador
            </button>
            <button className="action-btn-dash success" onClick={() => navegarPara('/admin/cursos')}>
              <i className="fas fa-book"></i>
              Gerir Cursos
            </button>
            <button className="action-btn-dash aviso" onClick={() => navegarPara('/admin/denuncias')}>
              <i className="fas fa-flag"></i>
              Ver Denúncias
            </button>
          </div>
        </div>

        {/* Grid principal com cartões de estatísticas */}
        <div className="stats-grid-dash">
          {/* Estatísticas de utilizadores */}
          <div className="stat-card-dash primary">
            <div className="stat-icon-dash">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Total de Utilizadores</h3>
              <p className="stat-value-dash">{stats.totalUtilizadores}</p>
            </div>
          </div>

          <div className="stat-card-dash primary">
            <div className="stat-icon-dash">
              <i className="fas fa-user-graduate"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Total de Formandos</h3>
              <p className="stat-value-dash">{stats.totalFormandos}</p>
            </div>
          </div>

          <div className="stat-card-dash primary">
            <div className="stat-icon-dash">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Total de Formadores</h3>
              <p className="stat-value-dash">{stats.totalFormadores}</p>
            </div>
          </div>

          <div className="stat-card-dash primary">
            <div className="stat-icon-dash">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Total de Administradores</h3>
              <p className="stat-value-dash">{stats.totalAdministradores}</p>
            </div>
          </div>

          {/* Estatísticas de cursos */}
          <div className="stat-card-dash success">
            <div className="stat-icon-dash">
              <i className="fas fa-book"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Total de Cursos</h3>
              <p className="stat-value-dash">{stats.totalCursos}</p>
            </div>
          </div>

          <div className="stat-card-dash warning">
            <div className="stat-icon-dash">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Cursos Ativos</h3>
              <p className="stat-value-dash">{stats.cursosAtivos}</p>
            </div>
          </div>

          <div className="stat-card-dash purple">
            <div className="stat-icon-dash">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Cursos Terminados</h3>
              <p className="stat-value-dash">{stats.cursosTerminados}</p>
            </div>
          </div>

          <div className="stat-card-dash info">
            <div className="stat-icon-dash">
              <i className="fas fa-user-plus"></i>
            </div>
            <div className="stat-info-dash">
              <h3>Inscrições (30d)</h3>
              <p className="stat-value-dash">{stats.inscricoesUltimos30Dias}</p>
            </div>
          </div>
        </div>

        {/* Grid com os gráficos de análise */}
        <div className="charts-grid-dash">
          {/* Gráfico de evolução temporal das inscrições */}
          <div className="chart-container-dash large">
            <canvas id="grafico-inscricoes"></canvas>
          </div>

          {/* Gráfico de distribuição por categorias */}
          <div className="chart-container-dash medium">
            <canvas id="grafico-categorias"></canvas>
          </div>

          {/* Gráfico de utilizadores por perfil */}
          <div className="chart-container-dash medium">
            <canvas id="grafico-utilizadores"></canvas>
          </div>

          {/* Gráfico de cursos mais populares */}
          <div className="chart-container-dash medium">
            <canvas id="grafico-cursos-populares"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;