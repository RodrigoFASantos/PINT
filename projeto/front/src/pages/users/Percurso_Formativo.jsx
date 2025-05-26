import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import fallbackCurso from '../../images/default_image.png';
import './css/Percurso_Formativo.css';

const PercursoFormativo = () => {
  const navigate = useNavigate();
  const [cursosAgendados, setCursosAgendados] = useState([]);
  const [cursosEmAndamento, setCursosEmAndamento] = useState([]);
  const [cursosCompletos, setCursosCompletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchPercursoFormativo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Utilizador não autenticado. Faça login novamente.');
          setLoading(false);
          return;
        }
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
        const hoje = new Date();
        const agendados = [];
        const emAndamento = [];
        const completos = [];

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
        console.error(err);
        setError('Erro ao carregar cursos.');
      } finally {
        setLoading(false);
      }
    };
    fetchPercursoFormativo();
  }, []);

  const getImageUrl = (curso) => {
    if (curso.imagem_path) return `${API_BASE}/${curso.imagem_path}`;
    const slug = curso.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `${API_BASE}/uploads/cursos/${slug}/capa.png`;
  };


const getCertificadoUrl = (curso) => {
  // Tentar diferentes formas de obter o email
  let email = localStorage.getItem('email') || 
              localStorage.getItem('userEmail') || 
              localStorage.getItem('user_email') || '';
  
  // Se ainda não encontrou, tentar obter do token JWT
  if (!email) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar o token JWT para obter o email
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email || payload.user?.email || '';
        console.log('Email obtido do token:', email);
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
  }
  
  // Debug: mostrar informações no console
  console.log('=== DEBUG CERTIFICADO ===');
  console.log('Email encontrado:', email);
  console.log('Título do curso:', curso.titulo);
  console.log('LocalStorage keys:', Object.keys(localStorage));
  
  // Verificar se o email existe
  if (!email || email.trim() === '') {
    console.error('Email não encontrado em localStorage nem no token');
    return null;
  }
  
  // Usar o mesmo formato que o backend: @ vira _at_ e . vira _
  const emailFormatado = email.replace(/@/g, '_at_').replace(/\./g, '_');
  
  // Nome do curso formatado (mesmo formato usado no backend)
  const cursoNomeFormatado = curso.titulo.replace(/\s+/g, '_');
  const nomeCertificado = `certificado_${cursoNomeFormatado}.pdf`;
  
  // URL correta seguindo a estrutura do backend
  const url = `${API_BASE}/uploads/users/${emailFormatado}/certificados/${nomeCertificado}`;
  
  console.log('URL gerada:', url);
  console.log('========================');
  
  return url;
};

  const handleVerCurso = id => navigate(`/cursos/${id}`);

const handleVerCertificado = (curso) => {
  console.log('Tentando abrir certificado para:', curso.titulo);
  
  const url = getCertificadoUrl(curso);
  if (url) {
    console.log('Abrindo URL:', url);
    window.open(url, '_blank');
  } else {
    // Mensagem mais específica sobre o problema
    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token');
    
    let mensagem = 'Erro ao gerar URL do certificado.\n\n';
    
    if (!token) {
      mensagem += 'Motivo: Token não encontrado. Faça login novamente.';
    } else if (!email) {
      mensagem += 'Motivo: Email não encontrado. Verifique se está logado corretamente.';
    } else {
      mensagem += 'Motivo: Dados de usuário incompletos.';
    }
    
    console.error('Erro detalhado:', {
      email: !!email,
      token: !!token,
      localStorage: Object.keys(localStorage)
    });
    
    alert(mensagem);
  }
};








  if (loading) return <div className="loading">A carregar seu percurso formativo...</div>;
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

        {/* Cursos Agendados */}
        <section className="percurso-section">
          <h2>Cursos Agendados</h2>
          {cursosAgendados.length === 0 ? (
            <p className="no-cursos">Você não tem cursos agendados.</p>
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

        {/* Cursos em Andamento */}
        <section className="percurso-section">
          <h2>Cursos em Andamento</h2>
          {cursosEmAndamento.length === 0 ? (
            <p className="no-cursos">Você não está inscrito em nenhum curso atualmente.</p>
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

        {/* Cursos Concluídos */}
        <section className="percurso-section">
  <h2>Cursos Concluídos</h2>
  {cursosCompletos.length === 0 ? (
    <p className="no-cursos">Você ainda não concluiu nenhum curso.</p>
  ) : (
    <div className="cursos-grid">
      {cursosCompletos.map(curso => (
        <div key={curso.id} className="curso-card concluido">
          <img src={getImageUrl(curso)} alt={curso.titulo} onError={e => e.target.src = fallbackCurso} />
          <div className="curso-info">
            <h3>{curso.titulo}</h3>
            <div className="curso-details">
              {/* Nota do Curso */}
              {curso.notaFinal !== undefined && curso.notaFinal !== null ? (
                <span className="nota-curso">
                  <strong>Nota:</strong> {curso.notaFinal}/20
                </span>
              ) : (
                <span className="nota-curso sem-nota">
                  <strong>Nota:</strong> Não avaliado
                </span>
              )}
              
              {/* Carga horária total */}
              <span className="horas-curso">
                <strong>Carga horária:</strong> {curso.horasCurso}h
              </span>
              
              {/* Horas de presença */}
              {curso.horasPresenca !== undefined && curso.horasPresenca !== null ? (
                <span className="horas-presenca">
                  <strong>Presença:</strong> {curso.horasPresenca}h
                </span>
              ) : (
                <span className="horas-presenca sem-presenca">
                  <strong>Presença:</strong> Não registrada
                </span>
              )}
              
              {/* Percentual de presença */}
              {curso.horasPresenca && curso.horasCurso > 0 && (
                <span className="percentual-presenca">
                  <strong>Assiduidade:</strong> {Math.round((curso.horasPresenca / curso.horasCurso) * 100)}%
                </span>
              )}
            </div>
            
            <button 
              className="btn-certificado" 
              onClick={(e) => {
                e.stopPropagation();
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