import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/percursoFormativo.css';
import Sidebar from '../components/Sidebar';
import CertificadoModal from '../components/CertificadoModal';
import API_BASE from '../api';
import fallbackCurso from '../images/default_image.png'; // Importe uma imagem padrão

const PercursoFormativo = () => {
  const navigate = useNavigate();
  const [cursosCompletos, setCursosCompletos] = useState([]);
  const [cursosEmAndamento, setCursosEmAndamento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertificado, setShowCertificado] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchPercursoFormativo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Usuário não autenticado. Faça login novamente.');
          setLoading(false);
          return;
        }

        console.log('Buscando inscrições do usuário...');
        
        // Usar exatamente o mesmo método que funciona na página home
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        // Primeira tentativa - buscar inscrições do usuário
        try {
          const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
          console.log('Dados recebidos da API (inscricoes):', response.data);
          
          if (response.data && response.data.length > 0) {
            const hoje = new Date();
            const emAndamento = [];
            const completos = [];
            
            response.data.forEach(inscricao => {
              const cursoProcessado = {
                id: inscricao.cursoId,
                titulo: inscricao.nomeCurso,
                categoria: inscricao.categoria || 'Não especificada',
                area: inscricao.area || 'Não especificada',
                formador: inscricao.formadorId,
                dataInicio: inscricao.dataInicio,
                dataFim: inscricao.dataFim,
                progresso: inscricao.progresso || 0,
                horasCurso: inscricao.cargaHoraria || 0,
                notaFinal: inscricao.notaFinal || 0,
                status: inscricao.status,
                imagem_path: inscricao.imagem_path
              };
              
              if (inscricao.status === 'Concluído' || 
                 (inscricao.dataFim && new Date(inscricao.dataFim) < hoje)) {
                completos.push(cursoProcessado);
              } else {
                emAndamento.push(cursoProcessado);
              }
            });
            
            setCursosEmAndamento(emAndamento);
            setCursosCompletos(completos);
            setLoading(false);
            return;
          }
        } catch (inscricoesError) {
          console.error('Erro ao buscar minhas-inscricoes:', inscricoesError.message);
        }
        
        // Segunda tentativa - buscar todos os cursos como fallback
        try {
          const cursosResponse = await axios.get(`${API_BASE}/cursos`);
          console.log('Fallback - Dados de todos os cursos:', cursosResponse.data);
          
          if (cursosResponse.data && (cursosResponse.data.cursos || cursosResponse.data)) {
            const todosCursos = cursosResponse.data.cursos || cursosResponse.data;
            setCursosEmAndamento(todosCursos.map(curso => ({
              id: curso.id_curso,
              titulo: curso.nome,
              categoria: curso.categoria?.nome || 'Não especificada',
              area: curso.area?.nome || 'Não especificada',
              formador: curso.id_formador,
              dataInicio: curso.data_inicio,
              dataFim: curso.data_fim,
              progresso: 0,
              horasCurso: curso.carga_horaria || 0,
              imagem_path: curso.imagem_path
            })));
            setCursosCompletos([]);
            setLoading(false);
            return;
          }
        } catch (cursosError) {
          console.error('Erro ao buscar todos os cursos:', cursosError.message);
        }
        
        setError('Não foi possível carregar os cursos. Tente novamente mais tarde.');
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar percurso formativo:', error);
        setError(`Erro ao carregar os cursos: ${error.message}`);
        setLoading(false);
      }
    };

    fetchPercursoFormativo();
  }, []);

  const getImageUrl = (curso) => {
    // Se o curso tiver um caminho de imagem definido, usá-lo diretamente
    if (curso && curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }
    
    // Se não tiver imagem_path mas tiver nome, criar um slug do nome (compatibilidade)
    if (curso && curso.titulo) {
      const nomeCursoSlug = curso.titulo
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return `${API_BASE}/uploads/cursos/${nomeCursoSlug}/capa.png`;
    }
    
    // Fallback para imagem padrão
    return fallbackCurso;
  };

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

  if (error) {
    return (
      <div className="percurso-formativo-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="percurso-content">
            <h1>Meu Percurso Formativo</h1>
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="percurso-formativo-container">
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="percurso-content">
          <h1>Meu Percurso Formativo</h1>

          <div className="percurso-section">
            <h2>Cursos em Andamento</h2>
            {cursosEmAndamento.length === 0 ? (
              <p className="no-cursos">Você não está inscrito em nenhum curso atualmente.</p>
            ) : (
              <div className="cursos-grid">
                {cursosEmAndamento.map(curso => (
                  <div 
                    key={curso.id} 
                    className="curso-card"
                    onClick={() => handleVerCurso(curso.id)}
                  >
                    <div className="curso-imagem-container">
                      <img 
                        src={getImageUrl(curso)}
                        alt={curso.titulo}
                        className="curso-imagem"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackCurso;
                        }}
                      />
                    </div>
                    <div className="curso-info">
                      <h3>{curso.titulo}</h3>
                      <p className="categoria">Categoria: {curso.categoria}</p>
                      <p className="tipo">Área: {curso.area}</p>
                      
                      {curso.progresso !== undefined && (
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
                      
                      <span className="status-badge status-em-curso">EM CURSO</span>
                    </div>
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
                  <div 
                    key={curso.id} 
                    className="curso-card concluido"
                    onClick={() => handleVerCurso(curso.id)}
                  >
                    <div className="curso-imagem-container">
                      <img 
                        src={getImageUrl(curso)}
                        alt={curso.titulo}
                        className="curso-imagem"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackCurso;
                        }}
                      />
                    </div>
                    <div className="curso-info">
                      <h3>{curso.titulo}</h3>
                      <p className="categoria">Categoria: {curso.categoria}</p>
                      <p className="tipo">Área: {curso.area}</p>
                    
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
                      </div>
                      
                      <span className="status-badge status-terminado">CONCLUÍDO</span>
                      
                      {curso.notaFinal >= 10 && (
                        <button 
                          className="certificado-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que o clique propague para o card
                            handleVerCertificado(curso);
                          }}
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