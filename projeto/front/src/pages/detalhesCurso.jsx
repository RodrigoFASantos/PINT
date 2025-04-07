import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/detalhesCurso.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConteudoCursoList from '../components/ConteudoCursoList';
import FormularioInscricao from '../components/FormularioInscricao';

const DetalhesCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [inscrito, setInscrito] = useState(false);
  const [showInscricaoForm, setShowInscricaoForm] = useState(false);

  useEffect(() => {
    // Obter dados do curso e verificar se o usuário está inscrito
    const fetchCursoDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/cursos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCurso(response.data);
        
        // Verificar se o usuário está inscrito
        const userResponse = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserRole(userResponse.data.role);
        
        // Verificar se o usuário está inscrito neste curso
        if (userResponse.data.cursosInscritos && 
            userResponse.data.cursosInscritos.includes(id)) {
          setInscrito(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar detalhes do curso:', error);
        setLoading(false);
      }
    };

    fetchCursoDetails();
  }, [id]);

  // Verificar se o curso está "Em curso" ou "Terminado"
  const verificarStatusCurso = (curso) => {
    const hoje = new Date();
    const dataInicio = new Date(curso.dataInicio);
    const dataFim = new Date(curso.dataFim);

    if (hoje >= dataInicio && hoje <= dataFim) {
      return "Em curso";
    } else if (hoje > dataFim) {
      return "Terminado";
    } else {
      return "Agendado";
    }
  };

  const handleInscricao = () => {
    setShowInscricaoForm(true);
  };

  if (loading) {
    return <div className="loading">Carregando detalhes do curso...</div>;
  }

  if (!curso) {
    return <div className="error">Curso não encontrado</div>;
  }

  const statusCurso = verificarStatusCurso(curso);

  return (
    <div className="detalhes-curso-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="curso-details">
          <h1>{curso.titulo}</h1>
          
          <div className="curso-info">
            <div className="curso-header">
              <span className={`status-badge ${statusCurso.toLowerCase().replace(' ', '-')}`}>
                {statusCurso}
              </span>
              <p className="categoria">{curso.categoria} &gt; {curso.area}</p>
            </div>
            
            <div className="curso-description">
              <p>{curso.descricao}</p>
            </div>
            
            <div className="curso-meta">
              <div className="meta-item">
                <span className="label">Tipo:</span>
                <span>{curso.formador ? 'Síncrono' : 'Assíncrono'}</span>
              </div>
              
              {curso.formador && (
                <div className="meta-item">
                  <span className="label">Formador:</span>
                  <span>{curso.formador.nome}</span>
                </div>
              )}
              
              <div className="meta-item">
                <span className="label">Data de início:</span>
                <span>{new Date(curso.dataInicio).toLocaleDateString()}</span>
              </div>
              
              <div className="meta-item">
                <span className="label">Data de término:</span>
                <span>{new Date(curso.dataFim).toLocaleDateString()}</span>
              </div>
              
              {curso.formador && (
                <div className="meta-item">
                  <span className="label">Vagas:</span>
                  <span>{curso.vagasOcupadas} / {curso.vagasTotal}</span>
                </div>
              )}
              
              <div className="meta-item">
                <span className="label">Duração:</span>
                <span>{curso.horasCurso} horas</span>
              </div>
            </div>

            {/* Botão de inscrição ou acesso ao conteúdo */}
            {!inscrito && statusCurso === "Agendado" && userRole === "formando" && (
              <button className="inscricao-btn" onClick={handleInscricao}>
                Inscrever-se
              </button>
            )}
            
            {inscrito && statusCurso === "Em curso" && (
              <div className="conteudo-curso">
                <h2>Conteúdo do Curso</h2>
                <ConteudoCursoList cursoId={id} />
              </div>
            )}
            
            {inscrito && statusCurso === "Terminado" && curso.formador && (
              <div className="resultado-curso">
                <h2>Resultado do Curso</h2>
                <div className="avaliacao">
                  <span className="label">Nota final:</span>
                  <span className="nota">{curso.notaFinal || "Ainda não avaliado"}</span>
                </div>
                
                <button className="certificado-btn">
                  Ver Certificado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showInscricaoForm && (
        <FormularioInscricao 
          cursoId={id} 
          onClose={() => setShowInscricaoForm(false)}
          onSuccess={() => {
            setInscrito(true);
            setShowInscricaoForm(false);
          }}
        />
      )}
    </div>
  );
};

export default DetalhesCurso;