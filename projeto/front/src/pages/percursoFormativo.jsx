import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/percursoFormativo.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CertificadoModal from '../components/CertificadoModal';

const PercursoFormativo = () => {
  const navigate = useNavigate();
  const [cursosCompletos, setCursosCompletos] = useState([]);
  const [cursosEmAndamento, setCursosEmAndamento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertificado, setShowCertificado] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);

  useEffect(() => {
    const fetchPercursoFormativo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/formandos/percurso-formativo', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Separar cursos em andamento e completos
        const hoje = new Date();
        const emAndamento = [];
        const completos = [];

        response.data.forEach(curso => {
          const dataFim = new Date(curso.dataFim);
          if (dataFim < hoje) {
            completos.push(curso);
          } else {
            emAndamento.push(curso);
          }
        });

        setCursosEmAndamento(emAndamento);
        setCursosCompletos(completos);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar percurso formativo:', error);
        setLoading(false);
      }
    };

    fetchPercursoFormativo();
  }, []);

  const handleVerCurso = (id) => {
    navigate(`/cursos/${id}`);
  };

  const handleVerCertificado = (curso) => {
    setCursoSelecionado(curso);
    setShowCertificado(true);
  };

  if (loading) {
    return <div className="loading">Carregando seu percurso formativo...</div>;
  }

  return (
    <div className="percurso-formativo-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="percurso-content">
          <h1>Meu Percurso Formativo</h1>

          <div className="percurso-section">
            <h2>Cursos em Andamento</h2>
            {cursosEmAndamento.length === 0 ? (
              <p className="no-cursos">Você não está inscrito em nenhum curso atualmente.</p>
            ) : (
              <div className="cursos-grid">
                {cursosEmAndamento.map(curso => (
                  <div key={curso.id} className="curso-card">
                    <h3>{curso.titulo}</h3>
                    <p className="categoria">{curso.categoria} &gt; {curso.area}</p>
                    <p className="tipo">{curso.formador ? 'Síncrono' : 'Assíncrono'}</p>
                    <div className="curso-dates">
                      <p>Início: {new Date(curso.dataInicio).toLocaleDateString()}</p>
                      <p>Término: {new Date(curso.dataFim).toLocaleDateString()}</p>
                    </div>
                    {curso.progresso && (
                      <div className="progresso-container">
                        <div className="progresso-bar">
                          <div 
                            className="progresso-fill" 
                            style={{ width: `${curso.progresso}%` }}
                          ></div>
                        </div>
                        <span>{curso.progresso}% concluído</span>
                      </div>
                    )}
                    <button 
                      className="ver-curso-btn"
                      onClick={() => handleVerCurso(curso.id)}
                    >
                      Acessar Curso
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="percurso-section">
            <h2>Cursos Concluídos</h2>
            {cursosCompletos.length === 0 ? (
              <p className="no-cursos">Você ainda não concluiu nenhum curso.</p>
            ) : (
              <div className="cursos-grid">
                {cursosCompletos.map(curso => (
                  <div key={curso.id} className="curso-card concluido">
                    <h3>{curso.titulo}</h3>
                    <p className="categoria">{curso.categoria} &gt; {curso.area}</p>
                    <p className="tipo">{curso.formador ? 'Síncrono' : 'Assíncrono'}</p>
                    
                    <div className="curso-details">
                      <div className="detail-item">
                        <span className="label">Carga horária:</span>
                        <span>{curso.horasCurso} horas</span>
                      </div>
                      
                      {curso.horasPresenca && (
                        <div className="detail-item">
                          <span className="label">Presença:</span>
                          <span>{curso.horasPresenca} horas</span>
                        </div>
                      )}
                      
                      {curso.notaFinal !== undefined && (
                        <div className="detail-item">
                          <span className="label">Nota final:</span>
                          <span className={`nota ${
                            curso.notaFinal >= 10 ? 'aprovado' : 'reprovado'
                          }`}>
                            {curso.notaFinal}/20
                          </span>
                        </div>
                      )}
                      
                      <div className="detail-item">
                        <span className="label">Concluído em:</span>
                        <span>{new Date(curso.dataFim).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="curso-actions">
                      <button 
                        className="ver-curso-btn"
                        onClick={() => handleVerCurso(curso.id)}
                      >
                        Ver Detalhes
                      </button>
                      
                      {curso.notaFinal >= 10 && (
                        <button 
                          className="certificado-btn"
                          onClick={() => handleVerCertificado(curso)}
                        >
                          Ver Certificado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showCertificado && cursoSelecionado && (
        <CertificadoModal 
          curso={cursoSelecionado} 
          onClose={() => setShowCertificado(false)} 
        />
      )}
    </div>
  );
};

export default PercursoFormativo;