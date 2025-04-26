import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/adminDashboard.css';
import Sidebar from '../components/Sidebar';
import Chart from 'chart.js/auto'; // Adicionando a importação correta

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalCursos: 0,
    cursosAtivos: 0,
    inscricoesUltimos30Dias: 0
  });
  const [cursosPorCategoria, setCursosPorCategoria] = useState([]);
  const [inscricoesPorMes, setInscricoesPorMes] = useState([]);
  const [usuariosPorPerfil, setUsuariosPorPerfil] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Estatísticas gerais
        const statsResponse = await axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setStats(statsResponse.data);
        
        // Cursos por categoria
        const categoriaResponse = await axios.get('/api/admin/cursos-por-categoria', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCursosPorCategoria(categoriaResponse.data);
        
        // Inscrições por mês
        const inscricoesResponse = await axios.get('/api/admin/inscricoes-por-mes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setInscricoesPorMes(inscricoesResponse.data);
        
        // Usuários por perfil
        const usuariosResponse = await axios.get('/api/admin/usuarios-por-perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsuariosPorPerfil(usuariosResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Remover gráficos existentes para evitar duplicação
    const clearExistingCharts = () => {
      const charts = Chart.getChart('grafico-categorias');
      if (charts) charts.destroy();
      
      const inscricoesChart = Chart.getChart('grafico-inscricoes');
      if (inscricoesChart) inscricoesChart.destroy();
      
      const usuariosChart = Chart.getChart('grafico-usuarios');
      if (usuariosChart) usuariosChart.destroy();
    };

    // Criar gráficos após carregar os dados
    if (!loading) {
      clearExistingCharts();
      
      // Gráfico de cursos por categoria
      const ctxCategorias = document.getElementById('grafico-categorias');
      if (ctxCategorias) {
        new Chart(ctxCategorias, {
          type: 'bar',
          data: {
            labels: cursosPorCategoria.map(item => item.categoria),
            datasets: [{
              label: 'Cursos por Categoria',
              data: cursosPorCategoria.map(item => item.total),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Distribuição de Cursos por Categoria'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
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
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Inscrições Mensais'
              }
            }
          }
        });
      }
      
      // Gráfico de usuários por perfil
      const ctxUsuarios = document.getElementById('grafico-usuarios');
      if (ctxUsuarios) {
        new Chart(ctxUsuarios, {
          type: 'pie',
          data: {
            labels: usuariosPorPerfil.map(item => item.perfil),
            datasets: [{
              label: 'Usuários por Perfil',
              data: usuariosPorPerfil.map(item => item.total),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)'
              ],
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Distribuição de Usuários por Perfil'
              }
            }
          }
        });
      }
    }
  }, [loading, cursosPorCategoria, inscricoesPorMes, usuariosPorPerfil]);

  const handleVerCursos = () => {
    navigate('/admin/cursos');
  };

  const handleVerUsuarios = () => {
    navigate('/admin/usuarios');
  };

  const handleVerPercursos = () => {
    navigate('/admin/percursos-formativos');
  };

  const handleCriarCurso = () => {
    navigate('/admin/criar-curso');
  };

  const handleCriarUsuario = () => {
    navigate('/admin/criar-usuario');
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="main-content">
        <Sidebar />
        <div className="dashboard-content">
          <h1>Painel de Administração</h1>
          
          <div className="quick-actions">
            <button className="action-btn" onClick={handleCriarCurso}>
              Criar Novo Curso
            </button>
            <button className="action-btn" onClick={handleCriarUsuario}>
              Adicionar Usuário
            </button>
            <button className="action-btn" onClick={handleVerCursos}>
              Gerenciar Cursos
            </button>
            <button className="action-btn" onClick={handleVerUsuarios}>
              Gerenciar Usuários
            </button>
          </div>
          
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total de Usuários</h3>
              <p className="stat-value">{stats.totalUsuarios}</p>
            </div>
            
            <div className="stat-card">
              <h3>Total de Cursos</h3>
              <p className="stat-value">{stats.totalCursos}</p>
            </div>
            
            <div className="stat-card">
              <h3>Cursos Ativos</h3>
              <p className="stat-value">{stats.cursosAtivos}</p>
            </div>
            
            <div className="stat-card">
              <h3>Inscrições (30d)</h3>
              <p className="stat-value">{stats.inscricoesUltimos30Dias}</p>
            </div>
          </div>
          
          <div className="graficos-container">
            <div className="grafico-wrapper">
              <canvas id="grafico-categorias"></canvas>
            </div>
            
            <div className="grafico-wrapper">
              <canvas id="grafico-inscricoes"></canvas>
            </div>
            
            <div className="grafico-wrapper">
              <canvas id="grafico-usuarios"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;