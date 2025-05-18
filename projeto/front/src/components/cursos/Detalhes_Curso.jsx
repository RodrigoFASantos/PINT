import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { IMAGES } from "../../api";
import './css/Detalhes_Curso.css';

const DetalhesCurso = ({ cursoId, curso: cursoProp, inscrito: inscritoProp, userRole: userRoleProp }) => {
  // Usando props ou parâmetros de URL
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = cursoId || id;

  // Estados
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

  // Estados para os tópicos - consolidados em um único estado
  const [topicos, setTopicos] = useState([]);
  const [loadingTopicos, setLoadingTopicos] = useState(false);

  // Estado para tópico de área
  const [topicoArea, setTopicoArea] = useState(null);
  const [loadingTopicoArea, setLoadingTopicoArea] = useState(false);

  // Se o user estiver inscrito (!inscritoProp é false), os detalhes não aparecem
  // Se o user não estiver inscrito (!inscritoProp é true), os detalhes aparecem
  const [mostrarDetalhes, setMostrarDetalhes] = useState(!inscritoProp);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDetalhes = () => setMostrarDetalhes(!mostrarDetalhes);


  const getTopicoArea = async (topicoAreaId) => {
    try {
      setLoadingTopicoArea(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log(`A buscar tópico de área com ID: ${topicoAreaId}`);

      try {
        // Usar o endpoint para buscar o tópico de área
        const response = await axios.get(`${API_BASE}/cursos/topico-area/${topicoAreaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Resposta da API de tópico área:", response.data);

        if (response.data) {
          // Guardar o tópico no estado
          setTopicoArea(response.data);

          // Atualizar o curso com o tópico de área
          setCurso(prevCurso => ({
            ...prevCurso,
            topico_area: response.data
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar tópico de área:", err);
      } finally {
        setLoadingTopicoArea(false);
      }
    } catch (error) {
      console.error(`Erro ao buscar tópico de área ${topicoAreaId}:`, error);
      setLoadingTopicoArea(false);
    }
  };


  // Carregar curso se não for fornecido via props
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
        // Incluir todos os relacionamentos importantes na mesma requisição
        const response = await axios.get(
          `${API_BASE}/cursos/${courseId}?include=topicos,categoria,area,formador`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isMounted) {
          const cursoData = response.data;
          console.log("Dados do curso recebidos:", cursoData);
          setCurso(cursoData);

          // Se temos tópicos incluídos na resposta, salve-os no estado
          if (cursoData.topicos && Array.isArray(cursoData.topicos) && cursoData.topicos.length > 0) {
            console.log("Tópicos recebidos com o curso:", cursoData.topicos);
            setTopicos(cursoData.topicos);
          }
          // Se não temos tópicos, tentar carregar separadamente
          else if (cursoData.id_curso) {
            await getTopicosByCurso(cursoData.id_curso);
          }

          // Buscar o tópico de área associado ao curso se não estiver incluído
          if (cursoData.id_topico_area && (!cursoData.topico_area || !cursoData.topico_area.titulo)) {
            await getTopicoArea(cursoData.id_topico_area);
          }

          if (!inscritoProp) {
            await verificarInscricao();
          }

          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro ao carregar curso:", error);
          setError("Não foi possível carregar o curso. Tente novamente mais tarde.");
          setLoading(false);
        }
      }
    };

    if (!cursoProp && courseId) {
      carregarCurso();
    } else if (cursoProp) {
      // Se o curso já estiver disponível via props, precisamos verificar se já tem tópicos
      if (cursoProp.topicos && Array.isArray(cursoProp.topicos) && cursoProp.topicos.length > 0) {
        setTopicos(cursoProp.topicos);
      }
      // Se não tem tópicos, tentar carregar separadamente
      else if (cursoProp.id_curso) {
        getTopicosByCurso(cursoProp.id_curso);
      }

      // Buscar o tópico de área associado ao curso se não estiver incluído
      if (cursoProp.id_topico_area && (!cursoProp.topico_area || !cursoProp.topico_area.titulo)) {
        getTopicoArea(cursoProp.id_topico_area);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, cursoProp, inscritoProp, navigate]);

  // Função consolidada para buscar tópicos do curso
  const getTopicosByCurso = async (cursoId) => {
    try {
      setLoadingTopicos(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log(`A buscar tópicos do curso: ${cursoId}`);

      // Tentar diretamente pelo endpoint mais confiável
      try {
        const response = await axios.get(`${API_BASE}/cursos/${cursoId}/topicos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Resposta da API de tópicos:", response.data);

        if (response.data) {
          let topicosDados = [];

          if (Array.isArray(response.data)) {
            topicosDados = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            topicosDados = response.data.data;
          }

          if (topicosDados.length > 0) {
            console.log("Tópicos encontrados:", topicosDados);
            setTopicos(topicosDados);
          } else {
            console.warn("Nenhum tópico encontrado");
            setTopicos([]);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar tópicos:", err);
        setTopicos([]);
      } finally {
        setLoadingTopicos(false);
      }
    } catch (error) {
      console.error(`Erro ao buscar tópicos do curso ${cursoId}:`, error);
      setTopicos([]);
      setLoadingTopicos(false);
    }
  };

  // Verificar se o user já está inscrito no curso
  const verificarInscricao = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/inscricoes/verificar/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const estadoInscrito = response.data.inscrito;
      setInscrito(estadoInscrito);

      // Atualizar o estado mostrarDetalhes com base no status de inscrição
      if (estadoInscrito) {
        setMostrarDetalhes(false);
      }

    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  }, [courseId]);

  // Verificar o status do curso em relação às datas
  const verificarStatusCurso = (curso) => {
    if (!curso) return 'Indisponível';

    const hoje = new Date();
    const dataInicio = new Date(curso.data_inicio);
    const dataFim = new Date(curso.data_fim);

    if (hoje >= dataInicio && hoje <= dataFim) {
      return "Em curso";
    } else if (hoje > dataFim) {
      return "Terminado";
    } else {
      return "Agendado";
    }
  };

  // Abrir pop-up de confirmação de inscrição
  const handleInscricao = () => {
    console.log('Botão de inscrição clicado');
    setShowInscricaoForm(true);
  };

  // Confirmar inscrição no curso
  const handleInscricaoConfirm = async () => {
    try {
      setInscrevendo(true);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { redirectTo: `/cursos/${courseId}` } });
        return;
      }

      const userId = JSON.parse(atob(token.split('.')[1])).id_utilizador;

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

      // Atualizar o estado do curso com o novo número de vagas se disponível
      if (response.data.vagasRestantes !== undefined && curso) {
        setCurso(prevCurso => ({
          ...prevCurso,
          vagas: response.data.vagasRestantes
        }));
      } else {
        // Recarregar detalhes do curso
        const cursoResponse = await axios.get(`${API_BASE}/cursos/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurso(cursoResponse.data);
      }

      setInscrito(true);
      // Depois de inscrever, fechar os detalhes
      setMostrarDetalhes(false);
      setShowInscricaoForm(false);
      alert('Inscrição realizada com sucesso! Você receberá um email de confirmação.');

    } catch (error) {
      console.error('Erro ao realizar inscrição:', error);
      const errorMessage = error.response?.data?.message || error.message || "Erro ao realizar inscrição";
      alert(`Erro: ${errorMessage}`);
    } finally {
      setInscrevendo(false);
    }
  };

  // Função para excluir curso
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

      // Sucesso
      alert('Curso excluído com sucesso!');
      navigate('/cursos');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Erro ao excluir curso";
      alert(`Erro: ${errorMessage}`);
      console.error("Erro ao excluir curso:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const getImageUrl = (curso) => {
    if (!curso) return '/placeholder-curso.jpg';

    // Primeiro verificar imagem_path
    if (curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }

    // Depois tentar com o nome do curso
    if (curso.nome) {
      const nomeCursoSlug = curso.nome
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return IMAGES.CURSO(nomeCursoSlug);
    }

    // Verificar dir_path por compatibilidade
    if (curso.dir_path) {
      return `${API_BASE}/${curso.dir_path}/capa.png`;
    }

    return '/placeholder-curso.jpg';
  };

  // Função para gerenciar inscrições
  const handleGerenciarInscricoes = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessão expirada ou inválida. Por favor, faça login novamente.');
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
        <button
          onClick={() => {
            setLoading(true);
            setError('');
            const fetchData = async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) {
                  navigate('/login');
                  return;
                }

                const response = await axios.get(`${API_BASE}/cursos/${courseId}?include=topicos,categoria,area`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                setCurso(response.data);

                // Extrair tópicos
                if (response.data.topicos && Array.isArray(response.data.topicos)) {
                  setTopicos(response.data.topicos);
                }

                setLoading(false);
              } catch (error) {
                console.error("Erro ao carregar curso:", error);
                setError("Não foi possível carregar o curso. Tente novamente mais tarde.");
                setLoading(false);
              }
            };
            fetchData();
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
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

  // Definir o status do curso
  const statusCurso = verificarStatusCurso(curso);

  return (
    <div className="curso-detalhes-wrapper">
      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-conteudo">
            <h2 className="modal-titulo">Confirmar</h2>
            <p className="modal-texto">
              Tem certeza que deseja excluir este curso? Esta ação irá remover o curso e todas as inscrições associadas.
            </p>
            <div className="modal-botoes">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="botao-cancelar"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCurso}
                className="botao-confirmar"
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Curso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho do curso */}
      <div
        className="curso-cabecalho"
        style={{
          backgroundImage: `url(${getImageUrl(curso)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className='titulo'>{curso.nome}</h1>
            <p className="subtitulo">
              <span className={`badge-estado ${statusCurso.toLowerCase().replace(' ', '-')}`}>
                {statusCurso}
              </span>
            </p>
          </div>
        </div>

        {/* Ícone de informação no canto inferior direito */}
        <div className="icones-acao-container">
          <button
            className="botao-info"
            onClick={toggleDetalhes}
            aria-label="Mostrar detalhes do curso"
          >
            {mostrarDetalhes ? (
              <i className='fas fa-times'></i>
            ) : (
              <i className='fas fa-info'></i>
            )}
          </button>
        </div>
      </div>

      {/* Detalhes do curso */}
      {mostrarDetalhes && (
        <div className="curso-detalhes">
          <div className="campos-layout">
            {/* Primeira linha */}
            <div className="campo-container">
              <div className="campo campo-formador">
                <label>Formador</label>
                <div className="campo-valor">
                  {curso?.formador?.nome || "Não atribuído"}
                </div>
              </div>
              <div className="campo campo-formador">
                <label>Email</label>
                <div className="campo-valor">
                  {curso?.formador?.email || "Não atribuído"}
                </div>
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

            {/* Segunda linha */}
            <div className="campo-container">
              <div className="campo campo-estado">
                <label>Estado</label>
                <div className="campo-valor">
                  {statusCurso}
                </div>
              </div>
              <div className="campo campo-vagas">
                <label>Vagas</label>
                <div className="campo-valor">
                  {curso.tipo === 'sincrono' && curso.vagas !== null
                    ? `${curso.vagas}`
                    : 'Sem limite'}
                </div>
              </div>
            </div>

            {/* Terceira linha */}
            <div className="campo-container">




              <div className="campo campo-tipo">
                <label>Tipo Curso</label>
                <div className="campo-valor">
                  {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
                </div>
              </div>

              <div className="campo campo-inicio">
                <label>Início</label>
                <div className="campo-valor">
                  {new Date(curso.data_inicio).toLocaleDateString()}
                </div>
              </div>
              <div className="campo campo-fim">
                <label>Fim</label>
                <div className="campo-valor">
                  {new Date(curso.data_fim).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Quarta linha */}
            <div className="campos-grid-3">

              <div className="campo campo-categoria">
                <label>Categoria</label>
                <div className="campo-valor">
                  {curso.categoria?.nome || "Não atribuída"}
                </div>
              </div>


              <div className="campo campo-area">
                <label>Área</label>
                <div className="campo-valor">
                  {curso.area?.nome || "Não atribuída"}
                </div>
              </div>

              {/*Tópico de Área */}
              <div className="campo campo-topico-area">
                <label>Tópico de Área</label>
                <div className="campo-valor">
                  {loadingTopicoArea ? (
                    <p>A carregar tópico de área...</p>
                  ) : curso.topico_area?.titulo || topicoArea?.titulo ? (
                    <span className="topico-item">
                      {curso.topico_area?.titulo || topicoArea?.titulo}
                    </span>
                  ) : (
                    "Tópico de área não disponível"
                  )}
                </div>
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

            {/* Botões de administrador (se o user for admin) */}
            {userRole === 1 && (
              <div className="botoes-admin">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/admin/cursos/${courseId}/editar`)}
                    className="botao-editar"
                  >
                    Editar Curso
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="botao-apagar-admin"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir Curso'}
                  </button>

                  <button
                    onClick={handleGerenciarInscricoes}
                    className="botao-inscricoes"
                  >
                    Inscrições
                  </button>

                  <button
                    onClick={() => navigate(`/admin/cursos/${courseId}/avaliacoes`)}
                    className="botao-avaliacoes"
                  >
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
            <p className="modal-texto">Tem certeza que deseja se inscrever no curso "{curso.nome}"?</p>
            <div className="modal-botoes">
              <button
                onClick={() => setShowInscricaoForm(false)}
                className="botao-cancelar"
                disabled={inscrevendo}
              >
                Cancelar
              </button>
              <button
                onClick={handleInscricaoConfirm}
                className={`botao-confirmar ${inscrevendo ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={inscrevendo}
              >
                {inscrevendo ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalhesCurso;