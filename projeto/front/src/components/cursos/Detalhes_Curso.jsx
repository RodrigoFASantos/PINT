import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { IMAGES } from "../../api";
import './css/Detalhes_Curso.css';

const DetalhesCurso = ({ cursoId, curso: cursoProp, inscrito: inscritoProp, userRole: userRoleProp }) => {
  // Usar propriedades ou parâmetros da URL
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = cursoId || id;

  // Estados principais do componente
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

  // Estados para os tópicos do curso
  const [topicos, setTopicos] = useState([]);
  const [loadingTopicos, setLoadingTopicos] = useState(false);

  // Estado para tópico de área
  const [topicoArea, setTopicoArea] = useState(null);
  const [loadingTopicoArea, setLoadingTopicoArea] = useState(false);

  // Estados para cursos associados
  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [loadingCursosAssociados, setLoadingCursosAssociados] = useState(false);

  // Se o utilizador estiver inscrito, os detalhes não aparecem por defeito
  // Se o utilizador não estiver inscrito, os detalhes aparecem por defeito
  const [mostrarDetalhes, setMostrarDetalhes] = useState(!inscritoProp);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDetalhes = () => setMostrarDetalhes(!mostrarDetalhes);

  // Registo de depuração dos estados importantes
  useEffect(() => {
    console.log('Estados actuais:', {
      courseId,
      cursoTipo: curso?.tipo,
      userRole,
      inscrito,
      mostrarDetalhes
    });
  }, [courseId, curso?.tipo, userRole, inscrito, mostrarDetalhes]);

  // Função para buscar tópico de área específico
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
          topico_area: response.data
        }));
      }
    } catch (error) {
      console.error(`Erro a buscar tópico de área ${topicoAreaId}:`, error);
    } finally {
      setLoadingTopicoArea(false);
    }
  };

  // Função para buscar cursos associados com melhoria na gestão de erros
  const getCursosAssociados = async (cursoId) => {
    try {
      setLoadingCursosAssociados(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/associar-cursos/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`Cursos associados carregados para curso ${cursoId}:`, response.data);

      if (response.data && Array.isArray(response.data)) {
        setCursosAssociados(response.data);
      } else {
        console.warn('Resposta não é um array:', response.data);
        setCursosAssociados([]);
      }
    } catch (error) {
      console.error(`Erro a buscar cursos associados para o curso ${cursoId}:`, error);
      // Não mostrar erro ao utilizador pois é uma funcionalidade secundária
      setCursosAssociados([]);
    } finally {
      setLoadingCursosAssociados(false);
    }
  };

  // Carregar dados do curso se não fornecido através de propriedades
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

        console.log(`A carregar curso com ID: ${courseId}`);
        const response = await axios.get(
          `${API_BASE}/cursos/${courseId}?include=topicos,categoria,area,formador`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isMounted) {
          const cursoData = response.data;
          console.log("Curso carregado:", cursoData.nome, "| Tipo:", cursoData.tipo);
          setCurso(cursoData);

          // Carregar tópicos do curso
          if (cursoData.topicos && Array.isArray(cursoData.topicos) && cursoData.topicos.length > 0) {
            setTopicos(cursoData.topicos);
          } else if (cursoData.id_curso) {
            await getTopicosByCurso(cursoData.id_curso);
          }

          // Carregar tópico de área se necessário
          if (cursoData.id_topico_area && (!cursoData.topico_area || !cursoData.topico_area.titulo)) {
            await getTopicoArea(cursoData.id_topico_area);
          }

          // Carregar cursos associados sempre
          await getCursosAssociados(cursoData.id_curso);

          // Verificar inscrição se não fornecida
          if (!inscritoProp) {
            await verificarInscricao();
          }

          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro a carregar curso:", error);
          setError("Não foi possível carregar o curso. Tenta novamente mais tarde.");
          setLoading(false);
        }
      }
    };

    if (!cursoProp && courseId) {
      carregarCurso();
    } else if (cursoProp) {
      console.log('A usar curso das propriedades:', cursoProp.nome, '| Tipo:', cursoProp.tipo);
      
      // Carregar dados adicionais mesmo quando usar propriedades
      if (cursoProp.topicos && Array.isArray(cursoProp.topicos) && cursoProp.topicos.length > 0) {
        setTopicos(cursoProp.topicos);
      } else if (cursoProp.id_curso) {
        getTopicosByCurso(cursoProp.id_curso);
      }

      if (cursoProp.id_topico_area && (!cursoProp.topico_area || !cursoProp.topico_area.titulo)) {
        getTopicoArea(cursoProp.id_topico_area);
      }

      // Carregar cursos associados mesmo quando usar propriedades
      getCursosAssociados(cursoProp.id_curso);
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, cursoProp, inscritoProp, navigate]);

  // Função para buscar tópicos do curso
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
      console.error(`Erro a buscar tópicos do curso ${cursoId}:`, error);
      setTopicos([]);
    } finally {
      setLoadingTopicos(false);
    }
  };

  // Verificar se o utilizador já está inscrito no curso
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

  // Funções para formatação do estado do curso
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

  // Função para obter a URL da imagem do curso
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

  // Função para navegar para um curso associado
  const navegarParaCursoAssociado = (cursoAssociado) => {
    // Determinar qual curso mostrar baseado no curso actual
    const cursoParaMostrar = cursoAssociado.id_curso_origem === curso.id_curso 
      ? cursoAssociado.cursoDestino 
      : cursoAssociado.cursoOrigem;
    
    if (cursoParaMostrar && cursoParaMostrar.id_curso) {
      console.log('A navegar para curso associado:', cursoParaMostrar.nome);
      navigate(`/cursos/${cursoParaMostrar.id_curso}`);
    } else {
      console.error('Curso associado inválido:', cursoAssociado);
    }
  };

  // Manipuladores de eventos
  const handleInscricao = () => setShowInscricaoForm(true);

  const handleInscricaoConfirm = async () => {
    try {
      setInscrevendo(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { redirectTo: `/cursos/${courseId}` } });
        return;
      }

      const userId = JSON.parse(atob(token.split('.')[1])).id_utilizador;

      await axios.post(`${API_BASE}/inscricoes`, 
        { id_utilizador: userId, id_curso: courseId },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      setInscrito(true);
      setMostrarDetalhes(false);
      setShowInscricaoForm(false);
      alert('Inscrição realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar inscrição:', error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
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

  // Estados de carregamento
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
      {/* Modal de confirmação de exclusão */}
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

      {/* Cabeçalho do curso */}
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

      {/* Detalhes do curso */}
      {mostrarDetalhes && (
        <div className="curso-detalhes">
          <div className="campos-layout">
            {/* Informações básicas */}
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

            {/* Estado e tipo */}
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

            {/* Categoria, área e tópico */}
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
                  ) : curso.topico_area?.titulo || topicoArea?.titulo ? (
                    <span>{curso.topico_area?.titulo || topicoArea?.titulo}</span>
                  ) : (
                    "Não disponível"
                  )}
                </div>
              </div>
            </div>

            {/* Duração e datas */}
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

            {/* Descrição */}
            <div className="campo-container">
              <div className="campo campo-descricao">
                <label>Descrição</label>
                <div className="campo-valor texto-descricao">
                  {curso.descricao || 'Sem descrição disponível.'}
                </div>
              </div>
            </div>

            {/* Cursos Associados com melhor apresentação */}
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
                      <div className="cursos-associados-lista">
                        {cursosAssociados.map((associacao) => {
                          // Determinar qual curso mostrar origem ou destino
                          const cursoParaMostrar = associacao.id_curso_origem === curso.id_curso 
                            ? associacao.cursoDestino 
                            : associacao.cursoOrigem;
                          
                          if (!cursoParaMostrar) {
                            console.warn('Curso associado inválido:', associacao);
                            return null;
                          }
                          
                          return (
                            <div 
                              key={associacao.id_associacao} 
                              className="curso-associado-item"
                              onClick={() => navegarParaCursoAssociado(associacao)}
                              title={`Clica para ver o curso ${cursoParaMostrar.nome}`}
                            >
                              <div className="curso-associado-info">
                                <h4 className="curso-associado-nome">{cursoParaMostrar.nome}</h4>
                                <div className="curso-associado-meta">
                                  <span className={`curso-estado ${formatarEstadoParaCSS(cursoParaMostrar.estado)}`}>
                                    {formatarEstadoParaExibicao(cursoParaMostrar.estado)}
                                  </span>
                                  <span className="curso-tipo">
                                    {cursoParaMostrar.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
                                  </span>
                                </div>
                                {associacao.descricao && (
                                  <p className="curso-associado-descricao">{associacao.descricao}</p>
                                )}
                              </div>
                              <div className="curso-associado-imagem">
                                <img 
                                  src={getImageUrl(cursoParaMostrar)} 
                                  alt={cursoParaMostrar.nome}
                                  onError={(e) => {
                                    e.target.src = '/placeholder-curso.jpg';
                                  }}
                                />
                              </div>
                              <div className="curso-associado-seta">
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botões de administrador */}
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

      {/* Modal de confirmação de inscrição */}
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