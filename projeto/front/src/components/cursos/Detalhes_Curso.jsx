import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { IMAGES } from "../../api";
import './css/Detalhes_Curso.css';

const DetalhesCurso = ({ cursoId, curso: cursoProp, inscrito: inscritoProp, userRole: userRoleProp }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = cursoId || id;

  const [curso, setCurso] = useState(cursoProp || null);
  const [loading, setLoading] = useState(!cursoProp);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(userRoleProp || 'admin');
  const [inscrito, setInscrito] = useState(inscritoProp || false);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [showInscricaoForm, setShowInscricaoForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [topicos, setTopicos] = useState([]);
  const [loadingTopicos, setLoadingTopicos] = useState(false);

  const [topicoArea, setTopicoArea] = useState(null);
  const [loadingTopicoArea, setLoadingTopicoArea] = useState(false);

  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [loadingCursosAssociados, setLoadingCursosAssociados] = useState(false);

  const [mostrarDetalhes, setMostrarDetalhes] = useState(!inscritoProp);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDetalhes = () => setMostrarDetalhes(!mostrarDetalhes);

  const decodeTokenSafely = (token) => {
    try {
      if (!token) {
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = parts[1];
      
      let paddedPayload = payload;
      while (paddedPayload.length % 4) {
        paddedPayload += '=';
      }
      
      const decodedPayload = atob(paddedPayload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      localStorage.removeItem('token');
      return null;
    }
  };

  const getTopicoArea = async (topicoAreaId) => {
    try {
      setLoadingTopicoArea(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/cursos/topico-area/${topicoAreaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setTopicoArea(response.data);
        setCurso(prevCurso => ({
          ...prevCurso,
          Topico_Area: response.data
        }));
      }
    } catch (error) {
      console.error(`Erro a buscar tópico de área ${topicoAreaId}:`, error);
    } finally {
      setLoadingTopicoArea(false);
    }
  };

  const getCursosAssociados = async (cursoId) => {
    try {
      setLoadingCursosAssociados(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/associar-cursos/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setCursosAssociados(response.data);
      } else {
        setCursosAssociados([]);
      }
    } catch (error) {
      setCursosAssociados([]);
    } finally {
      setLoadingCursosAssociados(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const carregarCurso = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `${API_BASE}/cursos/${courseId}?include=topicos,categoria,area,formador`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isMounted) {
          const cursoData = response.data;
          setCurso(cursoData);

          if (cursoData.topicos && Array.isArray(cursoData.topicos) && cursoData.topicos.length > 0) {
            setTopicos(cursoData.topicos);
          } else if (cursoData.id_curso) {
            await getTopicosByCurso(cursoData.id_curso);
          }

          if (cursoData.id_topico_area && (!cursoData.Topico_Area || !cursoData.Topico_Area.titulo)) {
            await getTopicoArea(cursoData.id_topico_area);
          }

          await getCursosAssociados(cursoData.id_curso);

          if (!inscritoProp) {
            await verificarInscricao();
          }

          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError("Não foi possível carregar o curso. Tenta novamente mais tarde.");
          setLoading(false);
        }
      }
    };

    if (!cursoProp && courseId) {
      carregarCurso();
    } else if (cursoProp) {
      if (cursoProp.topicos && Array.isArray(cursoProp.topicos) && cursoProp.topicos.length > 0) {
        setTopicos(cursoProp.topicos);
      } else if (cursoProp.id_curso) {
        getTopicosByCurso(cursoProp.id_curso);
      }

      if (cursoProp.id_topico_area && (!cursoProp.Topico_Area || !cursoProp.Topico_Area.titulo)) {
        getTopicoArea(cursoProp.id_topico_area);
      }

      getCursosAssociados(cursoProp.id_curso);
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, cursoProp, inscritoProp, navigate]);

  const getTopicosByCurso = async (cursoId) => {
    try {
      setLoadingTopicos(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/cursos/${cursoId}/topicos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        let topicosDados = [];
        if (Array.isArray(response.data)) {
          topicosDados = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          topicosDados = response.data.data;
        }

        setTopicos(topicosDados);
      }
    } catch (error) {
      setTopicos([]);
    } finally {
      setLoadingTopicos(false);
    }
  };

  const verificarInscricao = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/inscricoes/verificar/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const estadoInscrito = response.data.inscrito;
      setInscrito(estadoInscrito);

      if (estadoInscrito) {
        setMostrarDetalhes(false);
      }
    } catch (error) {
      console.error('Erro a verificar inscrição:', error);
    }
  }, [courseId]);

  const formatarEstadoParaExibicao = (estado) => {
    if (!estado) return 'Indisponível';
    const estadosMap = {
      'planeado': 'Planeado',
      'em_curso': 'Em Curso', 
      'terminado': 'Terminado',
      'inativo': 'Inativo'
    };
    const estadoNormalizado = estado.toLowerCase().replace(/[\s_]+/g, '_');
    return estadosMap[estadoNormalizado] || estado;
  };

  const formatarEstadoParaCSS = (estado) => {
    if (!estado) return 'indisponivel';
    const cssMap = {
      'planeado': 'planeado',
      'em_curso': 'em-curso',
      'terminado': 'terminado', 
      'inativo': 'inativo'
    };
    const estadoNormalizado = estado.toLowerCase().replace(/[\s_]+/g, '_');
    return cssMap[estadoNormalizado] || estadoNormalizado.replace('_', '-');
  };

  const getImageUrl = (curso) => {
    if (!curso) return '/placeholder-curso.jpg';
    if (curso.imagem_path) return `${API_BASE}/${curso.imagem_path}`;
    if (curso.nome) {
      const nomeCursoSlug = curso.nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
      return IMAGES.CURSO(nomeCursoSlug);
    }
    if (curso.dir_path) return `${API_BASE}/${curso.dir_path}/capa.png`;
    return '/placeholder-curso.jpg';
  };

  const handleInscricao = () => setShowInscricaoForm(true);

  const handleInscricaoConfirm = async () => {
    try {
      setInscrevendo(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { state: { redirectTo: `/cursos/${courseId}` } });
        return;
      }

      const decodedToken = decodeTokenSafely(token);
      
      if (!decodedToken) {
        alert('Sessão expirada. Por favor, faz login novamente.');
        localStorage.removeItem('token');
        navigate('/login', { state: { redirectTo: `/cursos/${courseId}` } });
        return;
      }

      const userId = decodedToken.id_utilizador;
      
      if (!userId) {
        alert('Erro na sessão. Por favor, faz login novamente.');
        navigate('/login');
        return;
      }

      const response = await axios.post(`${API_BASE}/inscricoes`, 
        { 
          id_utilizador: userId, 
          id_curso: courseId 
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          } 
        }
      );

      setInscrito(true);
      setMostrarDetalhes(false);
      setShowInscricaoForm(false);
      alert('Inscrição realizada com sucesso!');
      
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Sessão expirada. Por favor, faz login novamente.');
        localStorage.removeItem('token');
        navigate('/login', { state: { redirectTo: `/cursos/${courseId}` } });
      } else {
        alert(`Erro: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setInscrevendo(false);
    }
  };

  const handleDeleteCurso = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`${API_BASE}/cursos/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Curso excluído com sucesso!');
      navigate('/cursos');
    } catch (error) {
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleGerenciarInscricoes = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessão expirada. Faz login novamente.');
      navigate('/login');
      return;
    }
    navigate(`/cursos/${courseId}/inscricoes`);
  };

  if (loading) {
    return (
      <div className="detalhes-loading">
        <div className="carregamento-spinner"></div>
        <p className="ml-3 text-gray-600">A carregar detalhes do curso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalhes-error">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="detalhes-not-found">
        <p className="text-gray-600">Curso não encontrado ou indisponível.</p>
      </div>
    );
  }

  const statusCurso = formatarEstadoParaExibicao(curso.estado);
  const cssClasse = formatarEstadoParaCSS(curso.estado);

  return (
    <div className="curso-detalhes-wrapper">
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-conteudo">
            <h2 className="modal-titulo">Confirmar</h2>
            <p className="modal-texto">
              Tens a certeza que desejas excluir este curso? Esta acção irá remover o curso e todas as inscrições associadas.
            </p>
            <div className="modal-botoes">
              <button onClick={() => setShowDeleteConfirmation(false)} className="botao-cancelar" disabled={isDeleting}>
                Cancelar
              </button>
              <button onClick={handleDeleteCurso} className="botao-confirmar" disabled={isDeleting}>
                {isDeleting ? 'A excluir...' : 'Excluir Curso'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="curso-cabecalho" style={{
        backgroundImage: `url(${getImageUrl(curso)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="curso-info-container">
          <h1 className='titulo'>{curso.nome}</h1>
          <div className="badge-container">
            <span className={`status-badge ${cssClasse}`}>{statusCurso}</span>
          </div>
        </div>

        <div className="icones-acao-container">
          <button className="botao-info" onClick={toggleDetalhes} aria-label="Mostrar detalhes do curso">
            {mostrarDetalhes ? <i className='fas fa-times'></i> : <i className='fas fa-info'></i>}
          </button>
        </div>
      </div>

      {mostrarDetalhes && (
        <div className="curso-detalhes">
          <div className="campos-layout">
            <div className="campo-container">
              <div className="campo campo-formador">
                <label>Formador</label>
                <div className="campo-valor">{curso?.formador?.nome || "Não atribuído"}</div>
              </div>
              <div className="campo campo-formador">
                <label>Email</label>
                <div className="campo-valor">{curso?.formador?.email || "Não atribuído"}</div>
              </div>
              <div className="campo campo-inscricao">
                <div
                  className={`status-inscricao ${inscrito ? 'inscrito' : 'nao-inscrito'}`}
                  onClick={!inscrito ? handleInscricao : undefined}
                >
                  {inscrito ? "Inscrito" : "Inscrever"}
                </div>
              </div>
            </div>

            <div className="campo-container">
              <div className="campo campo-estado">
                <label>Estado</label>
                <div className="campo-valor">{statusCurso}</div>
              </div>
              <div className="campo campo-vagas">
                <label>Vagas</label>
                <div className="campo-valor">
                  {curso.tipo === 'sincrono' && curso.vagas !== null ? `${curso.vagas}` : 'Sem limite'}
                </div>
              </div>
              <div className="campo campo-vagas">
                <label>Tipo Curso</label>
                <div className="campo-valor">{curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}</div>
              </div>
            </div>

            <div className="campos-grid-3">
              <div className="campo campo-categoria">
                <label>Categoria</label>
                <div className="campo-valor">{curso.categoria?.nome || "Não atribuída"}</div>
              </div>
              <div className="campo campo-area">
                <label>Área</label>
                <div className="campo-valor">{curso.area?.nome || "Não atribuída"}</div>
              </div>
              <div className="campo campo-topico-area">
                <label>Tópico</label>
                <div className="campo-valor">
                  {loadingTopicoArea ? (
                    <p>A carregar...</p>
                  ) : curso.Topico_Area?.titulo || topicoArea?.titulo ? (
                    <span>{curso.Topico_Area?.titulo || topicoArea?.titulo}</span>
                  ) : (
                    "Não disponível"
                  )}
                </div>
              </div>
            </div>

            <div className="campo-container">
              <div className="campo campo-tipo">
                <label>Duração</label>
                <div className="campo-valor">{curso.duracao}h</div>
              </div>
              <div className="campo campo-inicio">
                <label>Início</label>
                <div className="campo-valor">{new Date(curso.data_inicio).toLocaleDateString()}</div>
              </div>
              <div className="campo campo-fim">
                <label>Fim</label>
                <div className="campo-valor">{new Date(curso.data_fim).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="campo-container">
              <div className="campo campo-descricao">
                <label>Descrição</label>
                <div className="campo-valor texto-descricao">
                  {curso.descricao || 'Sem descrição disponível.'}
                </div>
              </div>
            </div>

            {cursosAssociados.length > 0 && (
              <div className="campo-container">
                <div className="campo campo-cursos-associados">
                  <label>Cursos Relacionados ({cursosAssociados.length})</label>
                  <div className="campo-valor">
                    {loadingCursosAssociados ? (
                      <div className="loading-associados">
                        <div className="spinner-pequeno"></div>
                        <span>A carregar cursos relacionados...</span>
                      </div>
                    ) : (
                      <div className="cursos-relacionados-lista">
                        {cursosAssociados.map((associacao) => {
                          const cursoParaMostrar = associacao.id_curso_origem === curso.id_curso 
                            ? associacao.cursoDestino 
                            : associacao.cursoOrigem;
                          
                          if (!cursoParaMostrar) {
                            return null;
                          }
                          
                          return (
                            <div 
                              key={associacao.id_associacao} 
                              className="curso-relacionado-item"
                            >
                              <span className="curso-relacionado-nome">{cursoParaMostrar.nome}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {userRole === 1 && (
              <div className="botoes-admin">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => navigate(`/admin/cursos/${courseId}/editar`)} className="botao-editar">
                    Editar Curso
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirmation(true)} 
                    className="botao-apagar-admin"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'A excluir...' : 'Excluir Curso'}
                  </button>
                  <button onClick={handleGerenciarInscricoes} className="botao-inscricoes">
                    Inscrições
                  </button>
                  <button onClick={() => navigate(`/admin/cursos/${courseId}/avaliacoes`)} className="botao-avaliacoes">
                    Avaliações
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showInscricaoForm && (
        <div className="modal-overlay">
          <div className="modal-conteudo">
            <h3 className="modal-titulo">Confirmar Inscrição</h3>
            <p className="modal-texto">Tens a certeza que desejas inscrever-te no curso "{curso.nome}"?</p>
            <div className="modal-botoes">
              <button onClick={() => setShowInscricaoForm(false)} className="botao-cancelar" disabled={inscrevendo}>
                Cancelar
              </button>
              <button onClick={handleInscricaoConfirm} className="botao-confirmar" disabled={inscrevendo}>
                {inscrevendo ? 'A processar...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalhesCurso;