import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import './css/Percurso_Formandos.css';

const PercursoFormandos = () => {
  // Estados principais
  const [formandoSelecionado, setFormandoSelecionado] = useState(null);
  const [percursoFormando, setPercursoFormando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para os filtros de busca
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroEmail, setFiltroEmail] = useState('');
  
  // Estados para lista de formandos
  const [todosFormandos, setTodosFormandos] = useState([]);
  const [loadingFormandos, setLoadingFormandos] = useState(false);
  
  // Estado para expandir detalhes dos cursos
  const [expandidos, setExpandidos] = useState({});

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Carregar lista de todos os formandos ao inicializar
  useEffect(() => {
    carregarListaFormandos();
  }, []);

  // Função para carregar lista de formandos com inscrições
  const carregarListaFormandos = async () => {
    try {
      setLoadingFormandos(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Utilizador não autenticado. Faça login novamente.');
        return;
      }

      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      console.log('🔍 A carregar lista de formandos...');
      
      // Usar a nova rota do backend
      const formandosResponse = await axios.get(`${API_BASE}/percurso-formandos/buscar-formandos`, config);
      const formandosUnicos = formandosResponse.data;
      
      console.log(`✅ Carregados ${formandosUnicos.length} formandos únicos`);
      
      setTodosFormandos(formandosUnicos);
      
    } catch (err) {
      console.error('❌ Erro ao carregar lista de formandos:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Apenas administradores podem visualizar esta página.');
      } else if (err.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
      } else {
        setError('Erro ao carregar lista de formandos. Contacte o administrador.');
      }
    } finally {
      setLoadingFormandos(false);
    }
  };

  // Função para carregar percurso do formando
  const carregarPercursoFormando = async (formandoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Utilizador não autenticado. Faça login novamente.');
        return;
      }

      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // Buscar o formando selecionado
      const formando = todosFormandos.find(f => f.id === formandoId);
      if (!formando) {
        setError('Formando não encontrado.');
        return;
      }

      console.log(`🔍 A carregar percurso do formando: ${formando.nome}`);

      // Usar a nova rota do backend
      const percursoResponse = await axios.get(
        `${API_BASE}/percurso-formandos/admin/percurso-formandos?email=${encodeURIComponent(formando.email)}`, 
        config
      );
      
      const dadosPercurso = percursoResponse.data;
      
      console.log(`📋 Encontrados ${dadosPercurso.length} cursos para ${formando.nome}`);
      
      if (dadosPercurso.length === 0) {
        setError('Este formando não possui inscrições em cursos.');
        return;
      }

      // Processar dados das inscrições para o formato do frontend
      const cursosProcessados = dadosPercurso.map(curso => ({
        id: curso.cursoId,
        titulo: curso.nomeCurso,
        categoria: curso.categoria,
        area: curso.area,
        dataInicio: curso.dataInicio,
        dataFim: curso.dataFim,
        cargaHoraria: curso.cargaHorariaReal, // CORREÇÃO: Usar horas reais do formando
        cargaHorariaCurso: curso.cargaHorariaCurso, // Manter para referência
        status: curso.status,
        dataInscricao: curso.dataInscricao,
        horasPresenca: curso.horasPresenca,
        notaFinal: curso.notaFinal,
        certificado: curso.certificado
      }));

      // Calcular estatísticas
      const cursosTerminados = cursosProcessados.filter(c => c.status === 'Concluído' || c.status === 'Terminado');
      const cursosEmAndamento = cursosProcessados.filter(c => c.status === 'Em Andamento');
      const cursosAgendados = cursosProcessados.filter(c => c.status === 'Agendado');
      
      const totalHoras = cursosProcessados.reduce((total, curso) => total + (curso.cargaHoraria || 0), 0);
      
      const cursosComNota = cursosProcessados.filter(c => c.notaFinal !== null);
      const mediaNotas = cursosComNota.length > 0 
        ? (cursosComNota.reduce((sum, c) => sum + c.notaFinal, 0) / cursosComNota.length).toFixed(1)
        : 'N/A';

      const percurso = {
        email: formando.email,
        nome: formando.nome,
        cursos: cursosProcessados,
        totalCursos: cursosProcessados.length,
        cursosCompletos: cursosTerminados.length,
        cursosEmAndamento: cursosEmAndamento.length,
        cursosAgendados: cursosAgendados.length,
        totalHorasFormacao: totalHoras,
        mediaNotas: mediaNotas
      };

      setPercursoFormando(percurso);
      console.log('✅ Percurso carregado com sucesso');
      console.log(`📊 Estatísticas: ${percurso.totalCursos} cursos, ${percurso.totalHorasFormacao}h total`);
      
    } catch (err) {
      console.error('❌ Erro ao carregar percurso do formando:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Apenas administradores podem visualizar esta página.');
      } else if (err.response?.status === 404) {
        setError('Formando não encontrado ou sem inscrições em cursos.');
      } else if (err.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
      } else {
        setError('Erro ao carregar dados do formando. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manipulador para mudança no dropdown de nome
  const handleNomeChange = (e) => {
    const nomeSelecionado = e.target.value;
    setFiltroNome(nomeSelecionado);
    
    if (nomeSelecionado) {
      const formandoEncontrado = todosFormandos.find(f => f.nome === nomeSelecionado);
      if (formandoEncontrado) {
        setFiltroEmail(formandoEncontrado.email);
        setFormandoSelecionado(formandoEncontrado);
      }
    } else {
      setFiltroEmail('');
      setFormandoSelecionado(null);
    }
  };

  // Manipulador para mudança no dropdown de email
  const handleEmailChange = (e) => {
    const emailSelecionado = e.target.value;
    setFiltroEmail(emailSelecionado);
    
    if (emailSelecionado) {
      const formandoEncontrado = todosFormandos.find(f => f.email === emailSelecionado);
      if (formandoEncontrado) {
        setFiltroNome(formandoEncontrado.nome);
        setFormandoSelecionado(formandoEncontrado);
      }
    } else {
      setFiltroNome('');
      setFormandoSelecionado(null);
    }
  };

  // Função para buscar percurso
  const buscarPercurso = () => {
    if (!formandoSelecionado) {
      setError('Por favor, selecione um formando.');
      return;
    }
    
    carregarPercursoFormando(formandoSelecionado.id);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroEmail('');
    setFormandoSelecionado(null);
    setPercursoFormando(null);
    setError(null);
    setExpandidos({});
  };

  // Toggle expansão dos cursos
  const toggleExpansao = (cursoId) => {
    setExpandidos(prev => ({
      ...prev,
      [cursoId]: !prev[cursoId]
    }));
  };

  // Formatação de data
  const formatarData = (data) => {
    if (!data) return 'N/A';
    try {
      return new Date(data).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Classes de status
  const getStatusClass = (status) => {
    switch (status) {
      case 'Agendado': return 'status-agendado';
      case 'Em Andamento': return 'status-andamento';
      case 'Terminado': 
      case 'Concluído': return 'status-concluido';
      default: return '';
    }
  };

  // Exportar CSV
  const exportarCSV = () => {
    if (!percursoFormando) {
      alert('Não há dados para exportar.');
      return;
    }

    const csvContent = [
      'Nome,Email,Curso,Categoria,Área,Data Início,Data Fim,Horas Realizadas,Status,Nota,Certificado',
      ...percursoFormando.cursos.map(curso => 
        `"${percursoFormando.nome}","${percursoFormando.email}","${curso.titulo}","${curso.categoria}","${curso.area}","${formatarData(curso.dataInicio)}","${formatarData(curso.dataFim)}",${curso.cargaHoraria || 0},"${curso.status}","${curso.notaFinal || 'N/A'}","${curso.certificado ? 'Sim' : 'Não'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `percurso_${percursoFormando.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="percurso-formandos-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="percurso-content">
        <div className="header-section">
          <h1>Percurso Formativo dos Formandos</h1>
          <p className="subtitle">Consulte o progresso formativo de um formando específico</p>
        </div>

        {/* Filtros de Busca */}
        <div className="filtros-busca-section">
          <div className="filtros-header">
            <h3>🔍 Selecionar Formando</h3>
            <p>Escolha um formando pelo nome ou email para visualizar o seu percurso formativo</p>
            {loadingFormandos && (
              <div className="loading-formandos">
                🔄 A carregar lista de formandos...
              </div>
            )}
          </div>
          
          <div className="filtros-busca-grid">
            <div className="filtro-busca-grupo">
              <label>👤 Selecionar por Nome:</label>
              <select
                value={filtroNome}
                onChange={handleNomeChange}
                className="select-busca"
                disabled={loadingFormandos}
              >
                <option value="">-- Selecione um formando --</option>
                {todosFormandos.map((formando, index) => (
                  <option key={index} value={formando.nome}>
                    {formando.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filtro-busca-grupo">
              <label>📧 Selecionar por Email:</label>
              <select
                value={filtroEmail}
                onChange={handleEmailChange}
                className="select-busca"
                disabled={loadingFormandos}
              >
                <option value="">-- Selecione um formando --</option>
                {todosFormandos.map((formando, index) => (
                  <option key={index} value={formando.email}>
                    {formando.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="acoes-busca">
            <button 
              className="btn-buscar" 
              onClick={buscarPercurso}
              disabled={loading || !formandoSelecionado || loadingFormandos}
            >
              {loading ? '🔄 A carregar...' : '🔍 Buscar Percurso'}
            </button>
            <button 
              className="btn-limpar" 
              onClick={limparFiltros}
              disabled={loading}
            >
              🗑️ Limpar
            </button>
            <button 
              className="btn-refresh" 
              onClick={carregarListaFormandos}
              disabled={loadingFormandos}
              title="Atualizar lista de formandos"
            >
              {loadingFormandos ? '🔄' : '🔄'} Atualizar Lista
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Fechar</button>
          </div>
        )}

        {/* Resultados */}
        {percursoFormando && (
          <>
            {/* Informações do Formando */}
            <div className="formando-info-section">
              <div className="formando-header-card">
                <div className="formando-details">
                  <h2>👤 {percursoFormando.nome}</h2>
                  <p className="formando-email">📧 {percursoFormando.email}</p>
                </div>
                <button className="btn-exportar-individual" onClick={exportarCSV}>
                  📊 Exportar Percurso
                </button>
              </div>

              {/* Estatísticas */}
              <div className="estatisticas-formando">
                <div className="estatistica-card">
                  <h4>Total de Cursos</h4>
                  <span className="numero">{percursoFormando.totalCursos}</span>
                </div>
                <div className="estatistica-card">
                  <h4>Terminados</h4>
                  <span className="numero">{percursoFormando.cursosCompletos}</span>
                </div>
                <div className="estatistica-card">
                  <h4>Em Andamento</h4>
                  <span className="numero">{percursoFormando.cursosEmAndamento}</span>
                </div>
                <div className="estatistica-card">
                  <h4>Agendados</h4>
                  <span className="numero">{percursoFormando.cursosAgendados}</span>
                </div>
                <div className="estatistica-card">
                  <h4>Horas Realizadas</h4>
                  <span className="numero">{percursoFormando.totalHorasFormacao}h</span>
                </div>
                <div className="estatistica-card">
                  <h4>Média de Notas</h4>
                  <span className="numero">{percursoFormando.mediaNotas}</span>
                </div>
              </div>
            </div>

            {/* Lista de Cursos */}
            <div className="cursos-formando-section">
              <h3>📚 Cursos do Formando ({percursoFormando.cursos.length})</h3>
              
              <div className="cursos-lista">
                {percursoFormando.cursos.map((curso, index) => (
                  <div key={curso.id || index} className="curso-card">
                    <div className="curso-header" onClick={() => toggleExpansao(curso.id || index)}>
                      <div className="curso-titulo-section">
                        <h4>{curso.titulo}</h4>
                        <div className="curso-meta">
                          <span className="categoria">{curso.categoria}</span>
                          <span className="area">{curso.area}</span>
                          <span className={`status ${getStatusClass(curso.status)}`}>
                            {curso.status}
                          </span>
                          {curso.certificado && (
                            <span className="certificado-badge">📜 Certificado</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="curso-resumo">
                        <div className="resumo-item">
                          <span className="label">Horas:</span>
                          <span className="valor">{curso.cargaHoraria || 0}h</span>
                        </div>
                        {curso.notaFinal !== null && (
                          <div className="resumo-item">
                            <span className="label">Nota:</span>
                            <span className="valor">{curso.notaFinal}/20</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="expand-icon">
                        {expandidos[curso.id || index] ? '▼' : '▶'}
                      </div>
                    </div>
                    
                    {expandidos[curso.id || index] && (
                      <div className="curso-detalhes">
                        <div className="detalhes-grid">
                          <div className="detalhe-item">
                            <span className="label">📅 Data de Início:</span>
                            <span className="valor">{formatarData(curso.dataInicio)}</span>
                          </div>
                          <div className="detalhe-item">
                            <span className="label">📅 Data de Fim:</span>
                            <span className="valor">{formatarData(curso.dataFim)}</span>
                          </div>
                          <div className="detalhe-item">
                            <span className="label">⏰ Horas Realizadas:</span>
                            <span className="valor">{curso.cargaHoraria || 0}h</span>
                          </div>
                          {curso.cargaHorariaCurso && curso.cargaHorariaCurso !== curso.cargaHoraria && (
                            <div className="detalhe-item">
                              <span className="label">⏱️ Horas do Curso:</span>
                              <span className="valor">{curso.cargaHorariaCurso}h</span>
                            </div>
                          )}
                          <div className="detalhe-item">
                            <span className="label">📝 Data de Inscrição:</span>
                            <span className="valor">{formatarData(curso.dataInscricao)}</span>
                          </div>
                          {curso.notaFinal !== null && (
                            <div className="detalhe-item">
                              <span className="label">📊 Nota Final:</span>
                              <span className="valor">{curso.notaFinal}/20</span>
                            </div>
                          )}
                          {curso.cargaHorariaCurso && curso.cargaHoraria && curso.cargaHorariaCurso > 0 && (
                            <div className="detalhe-item">
                              <span className="label">📈 Taxa de Presença:</span>
                              <span className="valor">
                                {Math.round((curso.cargaHoraria / curso.cargaHorariaCurso) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Estado vazio */}
        {!loading && !error && !percursoFormando && !loadingFormandos && todosFormandos.length > 0 && (
          <div className="estado-vazio">
            <div className="vazio-icon">🎯</div>
            <h3>Selecione um Formando</h3>
            <p>Use os dropdowns acima para selecionar um formando específico.</p>
            <p className="hint">💡 {todosFormandos.length} formandos disponíveis</p>
          </div>
        )}

        {/* Estado sem formandos */}
        {!loading && !error && !loadingFormandos && todosFormandos.length === 0 && (
          <div className="estado-vazio">
            <div className="vazio-icon">👥</div>
            <h3>Nenhum Formando Encontrado</h3>
            <p>Não foram encontrados formandos com inscrições em cursos.</p>
            <button className="btn-refresh" onClick={carregarListaFormandos}>
              🔄 Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PercursoFormandos;