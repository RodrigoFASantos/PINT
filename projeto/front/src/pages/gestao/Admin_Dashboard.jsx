import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import API_BASE from "../../api";
import Sidebar from '../../components/Sidebar';
import './css/Admin_Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalUtilizadores: 0,
    totalFormadores: 0,
    totalFormandos: 0,
    totalAdministradores: 0,
    totalCursos: 0,
    cursosAtivos: 0,
    cursosTerminados: 0,
    cursosSincronos: 0,
    cursosAssincronos: 0,
    totalInscricoes: 0,
    inscricoesUltimos30Dias: 0,
    totalDenuncias: 0,
    denunciasResolvidasPorcentagem: 0,
    presencasHoje: 0,
    cursosTerminandoEmBreve: 0
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
  const [atividadeRecente, setAtividadeRecente] = useState([]);

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

        console.log('[DEBUG] A carregar dados reais do dashboard...');

        // 1. Estatísticas gerais
        try {
          console.log('[DEBUG] A buscar estatísticas...');
          const statsResponse = await axios.get(`${API_BASE}/dashboard/estatisticas`, config);
          console.log('[DEBUG] Estatísticas carregadas:', statsResponse.data);
          setStats(statsResponse.data);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar estatísticas:', error);
        }

        // 2. Cursos por categoria
        try {
          console.log('[DEBUG] A buscar cursos por categoria...');
          const categoriaResponse = await axios.get(`${API_BASE}/dashboard/cursos-categoria`, config);
          console.log('[DEBUG] Cursos por categoria:', categoriaResponse.data);
          setCursosPorCategoria(categoriaResponse.data.categorias || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar cursos por categoria:', error);
        }

        // 3. Inscrições por mês
        try {
          console.log('[DEBUG] A buscar inscrições por mês...');
          const inscricoesResponse = await axios.get(`${API_BASE}/dashboard/inscricoes-mes`, config);
          console.log('[DEBUG] Inscrições por mês:', inscricoesResponse.data);
          setInscricoesPorMes(inscricoesResponse.data.mensal || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar inscrições por mês:', error);
        }

        // 4. Utilizadores por perfil
        try {
          console.log('[DEBUG] A buscar utilizadores por perfil...');
          const utilizadoresResponse = await axios.get(`${API_BASE}/dashboard/utilizadores-perfil`, config);
          console.log('[DEBUG] Utilizadores por perfil:', utilizadoresResponse.data);
          setUtilizadorePorPerfil(utilizadoresResponse.data.perfis || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar utilizadores por perfil:', error);
        }

        // 5. Denúncias por tópico
        try {
          console.log('[DEBUG] A buscar denúncias por tópico...');
          const denunciasResponse = await axios.get(`${API_BASE}/dashboard/denuncias-topico`, config);
          console.log('[DEBUG] Denúncias por tópico:', denunciasResponse.data);
          setDenunciasPorTopico(denunciasResponse.data.topicos || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar denúncias por tópico:', error);
        }

        // 6. Cursos mais inscritos
        try {
          console.log('[DEBUG] A buscar cursos mais inscritos...');
          const cursosPopularesResponse = await axios.get(`${API_BASE}/dashboard/cursos-populares`, config);
          console.log('[DEBUG] Cursos mais inscritos:', cursosPopularesResponse.data);
          setCursosMaisInscritos(cursosPopularesResponse.data.populares || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar cursos mais inscritos:', error);
        }

        // 7. Evolução de utilizadores
        try {
          console.log('[DEBUG] A buscar evolução de utilizadores...');
          const evolucaoResponse = await axios.get(`${API_BASE}/dashboard/evolucao-utilizadores`, config);
          console.log('[DEBUG] Evolução de utilizadores:', evolucaoResponse.data);
          setEvolucaoUtilizadores(evolucaoResponse.data.evolucao || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar evolução de utilizadores:', error);
        }

        // 8. Top formadores
        try {
          console.log('[DEBUG] A buscar top formadores...');
          const formadoresResponse = await axios.get(`${API_BASE}/dashboard/top-formadores`, config);
          console.log('[DEBUG] Top formadores:', formadoresResponse.data);
          setTopFormadores(formadoresResponse.data.formadores || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar top formadores:', error);
        }

        // 9. Taxa de conclusão
        try {
          console.log('[DEBUG] A buscar taxa de conclusão...');
          const conclusaoResponse = await axios.get(`${API_BASE}/dashboard/taxa-conclusao`, config);
          console.log('[DEBUG] Taxa de conclusão:', conclusaoResponse.data);
          setCursosCompletudePorcentagem(conclusaoResponse.data.conclusao || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar taxa de conclusão:', error);
        }

        // 10. Atividade recente
        try {
          console.log('[DEBUG] A buscar atividade recente...');
          const atividadeResponse = await axios.get(`${API_BASE}/dashboard/atividade-recente`, config);
          console.log('[DEBUG] Atividade recente:', atividadeResponse.data);
          setAtividadeRecente(atividadeResponse.data.atividades || []);
        } catch (error) {
          console.error('[ERROR] Erro ao carregar atividade recente:', error);
        }

        setLoading(false);
        console.log('[DEBUG] Todos os dados reais carregados com sucesso');

      } catch (error) {
        console.error('[ERROR] Erro geral ao carregar dados do dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log('[DEBUG] A criar gráficos com dados reais...');
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

    // Gráfico de inscrições por mês
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

    // Gráfico de utilizadores por perfil
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

    // Gráfico de denúncias por tópico
    const ctxDenuncias = document.getElementById('grafico-denuncias');
    if (ctxDenuncias && denunciasPorTopico.length > 0) {
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

    // Gráfico de evolução de utilizadores
    const ctxEvolucao = document.getElementById('grafico-evolucao');
    if (ctxEvolucao && evolucaoUtilizadores.length > 0) {
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
    if (ctxConclusao && cursosCompletudePorcentagem.length > 0) {
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
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-user"></i>
            </div>
            <div className="stat-info">
              <h3>Total de Formandos</h3>
              <p className="stat-value">{stats.totalFormandos}</p>
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-user"></i>
            </div>
            <div className="stat-info">
              <h3>Total de Formadores</h3>
              <p className="stat-value">{stats.totalFormadores}</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-book"></i>
            </div>
            <div className="stat-info">
              <h3>Total de Cursos</h3>
              <p className="stat-value">{stats.totalCursos}</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="stat-info">
              <h3>Cursos Ativos</h3>
              <p className="stat-value">{stats.cursosAtivos}</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="stat-info">
              <h3>Cursos Inativos</h3>
              <p className="stat-value">{stats.cursosInativos}</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <div className="stat-info">
              <h3>Inscrições (30d)</h3>
              <p className="stat-value">{stats.inscricoesUltimos30Dias}</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-flag"></i>
            </div>
            <div className="stat-info">
              <h3>Denúncias Ativas</h3>
              <p className="stat-value">{stats.totalDenuncias}</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-info">
              <h3>Presenças Hoje</h3>
              <p className="stat-value">{stats.presencasHoje}</p>
              <span className="stat-trend positive">
                {Math.round((stats.presencasHoje / stats.totalUtilizadores) * 100)}% dos utilizadores
              </span>
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

        </div>

        {/* Tabelas de dados */}
        <div className="data-tables">

          {/* Cursos Populares - Versão Melhorada */}
          <div className="table-container">
            <h3><i className="fas fa-fire"></i> Cursos Mais Procurados</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Categoria/Área</th>
                    <th>Inscrições</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosMaisInscritos.length > 0 ? (
                    cursosMaisInscritos.slice(0, 8).map((curso, index) => (
                      <tr key={index}>
                        <td>
                          <div className="course-info">
                            <strong>{curso.nome}</strong>
                            {curso.data_inicio && curso.data_fim && (
                              <small className="course-dates">
                                {new Date(curso.data_inicio).toLocaleDateString('pt-PT')} - 
                                {new Date(curso.data_fim).toLocaleDateString('pt-PT')}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="category-area">
                            <span className="category">{curso.categoria || 'N/A'}</span>
                            <small className="area">{curso.area || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${curso.inscricoes > 10 ? 'success' : curso.inscricoes > 5 ? 'warning' : 'info'}`}>
                            {curso.inscricoes || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`tipo-badge ${curso.tipo}`}>
                            {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${curso.estado === 'ativo' ? 'active' : 'inactive'}`}>
                            {curso.estado === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-small"
                            onClick={() => navegarPara(`/admin/cursos/${curso.id_curso}`)}
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data-row">
                        <i className="fas fa-info-circle"></i>
                        Nenhum curso com inscrições encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Atividade recente */}
        <div className="recent-activity">
          <h3><i className="fas fa-clock"></i> Atividade Recente</h3>
          <div className="activity-list">
            {atividadeRecente.length > 0 ? (
              atividadeRecente.map((atividade, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${atividade.classe}`}>
                    <i className={atividade.icon}></i>
                  </div>
                  <div className="activity-content">
                    <p><strong>{atividade.descricao}</strong></p>
                    <span className="activity-time">{atividade.tempo}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <div className="activity-icon info">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="activity-content">
                  <p>Nenhuma atividade recente encontrada</p>
                  <span className="activity-time">-</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;