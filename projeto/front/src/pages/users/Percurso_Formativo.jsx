import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import fallbackCurso from '../../images/default_image.png';
import './css/Percurso_Formativo.css';

/**
 * Componente que apresenta o percurso formativo do utilizador
 * Organiza os cursos em três categorias: agendados, em andamento e completos
 * Permite visualizar certificados dos cursos concluídos
 */
const PercursoFormativo = () => {
  const navigate = useNavigate();
  
  // Estados para armazenar os diferentes tipos de cursos
  const [cursosAgendados, setCursosAgendados] = useState([]);
  const [cursosEmAndamento, setCursosEmAndamento] = useState([]);
  const [cursosCompletos, setCursosCompletos] = useState([]);
  
  // Estados de controlo da interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Alterna o estado da barra lateral
   */
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Carrega todas as inscrições do utilizador e organiza por estado
   * Separa automaticamente em agendados, em andamento e completos
   */
  useEffect(() => {
    const fetchPercursoFormativo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Utilizador não autenticado. Faz login novamente.');
          setLoading(false);
          return;
        }
        
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
        const hoje = new Date();
        const agendados = [];
        const emAndamento = [];
        const completos = [];

        // Processa cada inscrição e categoriza por estado
        response.data.forEach(inscricao => {
          const curso = {
            id: inscricao.cursoId,
            titulo: inscricao.nomeCurso,
            categoria: inscricao.categoria || 'Não especificada',
            area: inscricao.area || 'Não especificada',
            dataInicio: inscricao.dataInicio,
            dataFim: inscricao.dataFim,
            horasCurso: inscricao.cargaHoraria || 0,
            horasPresenca: inscricao.horasPresenca,
            notaFinal: inscricao.notaFinal,
            status: inscricao.status,
            imagem_path: inscricao.imagem_path
          };
          
          const dataInicio = inscricao.dataInicio ? new Date(inscricao.dataInicio) : null;
          const dataFim = inscricao.dataFim ? new Date(inscricao.dataFim) : null;

          // Categoriza o curso baseado nas datas e estado
          if (dataInicio && dataInicio > hoje) {
            agendados.push(curso);
          } else if (inscricao.status === 'Concluído' || (dataFim && dataFim < hoje)) {
            completos.push(curso);
          } else {
            emAndamento.push(curso);
          }
        });

        setCursosAgendados(agendados);
        setCursosEmAndamento(emAndamento);
        setCursosCompletos(completos);
      } catch (err) {
        console.error("Erro ao carregar percurso formativo:", err);
        setError('Erro ao carregar cursos.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPercursoFormativo();
  }, []);

  /**
   * Gera o URL da imagem do curso
   * Primeiro tenta usar o caminho específico, depois um caminho baseado no título
   * @param {Object} curso - Dados do curso
   * @returns {string} URL da imagem
   */
  const getImageUrl = (curso) => {
    if (curso.imagem_path) return `${API_BASE}/${curso.imagem_path}`;
    
    // Gera slug do título para tentar encontrar imagem padrão
    const slug = curso.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `${API_BASE}/uploads/cursos/${slug}/capa.png`;
  };

  /**
   * Gera o URL do certificado do curso para o utilizador atual
   * Utiliza o email do localStorage ou token JWT para construir o caminho
   * @param {Object} curso - Dados do curso concluído
   * @returns {string|null} URL do certificado ou null se não conseguir gerar
   */
  const getCertificadoUrl = (curso) => {
    // Tenta obter o email de várias fontes possíveis
    let email = localStorage.getItem('email') || 
                localStorage.getItem('userEmail') || 
                localStorage.getItem('user_email') || '';
    
    // Se não encontrou email no localStorage, tenta extrair do token JWT
    if (!email) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Descodifica o token JWT para obter o email
          const payload = JSON.parse(atob(token.split('.')[1]));
          email = payload.email || payload.user?.email || '';
        } catch (error) {
          console.error('Erro ao descodificar token:', error);
        }
      }
    }
    
    // Verifica se conseguiu obter um email válido
    if (!email || email.trim() === '') {
      console.error('Email não encontrado para gerar URL do certificado');
      return null;
    }
    
    // Formata o email conforme esperado pelo backend (@ vira _at_ e . vira _)
    const emailFormatado = email.replace(/@/g, '_at_').replace(/\./g, '_');
    
    // Formata o nome do curso removendo espaços
    const cursoNomeFormatado = curso.titulo.replace(/\s+/g, '_');
    const nomeCertificado = `certificado_${cursoNomeFormatado}.pdf`;
    
    // Constrói a URL completa do certificado
    const url = `${API_BASE}/uploads/users/${emailFormatado}/certificados/${nomeCertificado}`;
    
    return url;
  };

  /**
   * Navega para a página de detalhes do curso
   * @param {number} id - ID do curso
   */
  const handleVerCurso = id => navigate(`/cursos/${id}`);

  /**
   * Abre o certificado do curso numa nova janela
   * Verifica se é possível gerar a URL antes de tentar abrir
   * @param {Object} curso - Dados do curso concluído
   */
  const handleVerCertificado = (curso) => {
    const url = getCertificadoUrl(curso);
    if (url) {
      window.open(url, '_blank');
    } else {
      // Diagnóstica o problema e informa o utilizador
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      
      let mensagem = 'Erro ao gerar URL do certificado.\n\n';
      
      if (!token) {
        mensagem += 'Motivo: Token não encontrado. Faz login novamente.';
      } else if (!email) {
        mensagem += 'Motivo: Email não encontrado. Verifica se estás logado corretamente.';
      } else {
        mensagem += 'Motivo: Dados de utilizador incompletos.';
      }
      
      alert(mensagem);
    }
  };

  // Ecrã de carregamento
  if (loading) return <div className="loading">A carregar teu percurso formativo...</div>;
  
  // Ecrã de erro com opção de tentar novamente
  if (error) return (
    <div className="percurso-formativo-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    </div>
  );

  return (
    <div className="percurso-formativo-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="percurso-content">
        <h1>Meu Percurso Formativo</h1>

        {/* Secção dos cursos agendados (ainda não iniciados) */}
        <section className="percurso-section">
          <h2>Cursos Agendados</h2>
          {cursosAgendados.length === 0 ? (
            <p className="no-cursos">Não tens cursos agendados.</p>
          ) : (
            <div className="cursos-grid">
              {cursosAgendados.map(curso => (
                <div key={curso.id} className="curso-card agendado" onClick={() => handleVerCurso(curso.id)}>
                  <img src={getImageUrl(curso)} alt={curso.titulo} onError={e => e.target.src = fallbackCurso} />
                  <div className="curso-info">
                    <h3>{curso.titulo}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Secção dos cursos em andamento */}
        <section className="percurso-section">
          <h2>Cursos em Andamento</h2>
          {cursosEmAndamento.length === 0 ? (
            <p className="no-cursos">Não estás inscrito em nenhum curso atualmente.</p>
          ) : (
            <div className="cursos-grid">
              {cursosEmAndamento.map(curso => (
                <div key={curso.id} className="curso-card" onClick={() => handleVerCurso(curso.id)}>
                  <img src={getImageUrl(curso)} alt={curso.titulo} onError={e => e.target.src = fallbackCurso} />
                  <div className="curso-info">
                    <h3>{curso.titulo}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Secção dos cursos concluídos com informações detalhadas */}
        <section className="percurso-section">
          <h2>Cursos Concluídos</h2>
          {cursosCompletos.length === 0 ? (
            <p className="no-cursos">Ainda não concluíste nenhum curso.</p>
          ) : (
            <div className="cursos-grid">
              {cursosCompletos.map(curso => (
                <div key={curso.id} className="curso-card concluido">
                  <img src={getImageUrl(curso)} alt={curso.titulo} onError={e => e.target.src = fallbackCurso} />
                  <div className="curso-info">
                    <h3>{curso.titulo}</h3>
                    <div className="curso-details">
                      {/* Apresenta a nota final do curso */}
                      {curso.notaFinal !== undefined && curso.notaFinal !== null ? (
                        <span className="nota-curso">
                          <strong>Nota:</strong> {curso.notaFinal}/20
                        </span>
                      ) : (
                        <span className="nota-curso sem-nota">
                          <strong>Nota:</strong> Não avaliado
                        </span>
                      )}
                      
                      {/* Mostra a carga horária total */}
                      <span className="horas-curso">
                        <strong>Carga horária:</strong> {curso.horasCurso}h
                      </span>
                      
                      {/* Apresenta as horas de presença registadas */}
                      {curso.horasPresenca !== undefined && curso.horasPresenca !== null ? (
                        <span className="horas-presenca">
                          <strong>Presença:</strong> {curso.horasPresenca}h
                        </span>
                      ) : (
                        <span className="horas-presenca sem-presenca">
                          <strong>Presença:</strong> Não registada
                        </span>
                      )}
                      
                      {/* Calcula e apresenta a percentagem de assiduidade */}
                      {curso.horasPresenca && curso.horasCurso > 0 && (
                        <span className="percentual-presenca">
                          <strong>Assiduidade:</strong> {Math.round((curso.horasPresenca / curso.horasCurso) * 100)}%
                        </span>
                      )}
                    </div>
                    
                    {/* Botão para visualizar o certificado */}
                    <button 
                      className="btn-certificado" 
                      onClick={(e) => {
                        e.stopPropagation(); // Impede que clique no cartão
                        handleVerCertificado(curso);
                      }}
                    >
                      📜 Ver Certificado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PercursoFormativo;