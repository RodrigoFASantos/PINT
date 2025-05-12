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

  const [topicos, setTopicos] = useState([]);


  // Se o user estiver inscrito (!inscritoProp é false), os detalhes não aparecem
  // Se o user não estiver inscrito (!inscritoProp é true), os detalhes aparecem
  const [mostrarDetalhes, setMostrarDetalhes] = useState(!inscritoProp);
  const [categoria, setCategoria] = useState(null);
  const [carregarCategoria, setCarregarCategoria] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDetalhes = () => setMostrarDetalhes(!mostrarDetalhes);

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

        const response = await axios.get(`${API_BASE}/cursos/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted) {
          const cursoData = response.data;
          setCurso(cursoData);

          if (cursoData.id_categoria) {
            getCategoriaById(cursoData.id_categoria);
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
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, cursoProp, inscritoProp, navigate]);

  // Função para buscar categoria diretamente pelo ID
  const getCategoriaById = async (categoriaId) => {
    try {
      setCarregarCategoria(true);
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axios.get(`${API_BASE}/categorias/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCategoria(response.data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar categoria ${categoriaId}:`, error);
      return null;
    } finally {
      setCarregarCategoria(false);
    }
  };

  // Abrir pop-up de confirmação de inscrição
  const handleInscricao = () => {
    console.log('Botão de inscrição clicado');
    setShowInscricaoForm(true);
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
      // Se o user estiver inscrito, fechar os detalhes
      if (estadoInscrito) {
        setMostrarDetalhes(false);
      }

    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  }, [courseId]
  );

  // Carregar tópicos do curso
  useEffect(() => {
    const fetchTopicos = async () => {
      if (!curso || !curso.id_curso) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/cursos/${curso.id_curso}/topicos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setTopicos(response.data);
      } catch (error) {
        console.error("Erro ao carregar tópicos do curso:", error);
      }
    };

    fetchTopicos();
  }, [curso]);


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

      // Verificar a conexão com o servidor
      try {
        const pingResponse = await axios.get(`${API_BASE}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (pingError) {
        throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão com a internet.");
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

    // Primeiro verificar imagem_path (mesma lógica que Lista_Cursos.jsx)
    if (curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }

    // Depois tentar com o nome do curso (mesma lógica que Lista_Cursos.jsx)
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

                const response = await axios.get(`${API_BASE}/cursos/${courseId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                setCurso(response.data);
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
        <div className="flex justify-between items-start">\
          <div>
            <h1 className='titulo'>{curso.nome}</h1>
            <p className="subtitulo">
              {curso.categoria?.nome} {' > '} {curso.area?.nome}
              {topicos.length > 0 && (
                <> {' > '} {topicos.map(t => t.nome).join(', ')}</>
              )}
            </p>
            {/* Estado do curso abaixo do subtítulo */}
            <span className={`badge-estado ${statusCurso.toLowerCase().replace(' ', '-')}`}>
              {statusCurso}
            </span>
          </div>

          {/* Botão de excluir, se user for admin */}
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
              <div className="campo campo-area">
                <label>Área</label>
                <div className="campo-valor">
                  {curso.area?.nome || "Não atribuída"}
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
            <div className="campo-container">
              <div className="campo campo-tipo">
                <label>Tipo Curso</label>
                <div className="campo-valor">
                  {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
                </div>
              </div>
              <div className="campo campo-categoria">
                <label>Categoria</label>
                <div className="campo-valor">
                  {carregarCategoria
                    ? "A carregar..."
                    : (categoria?.nome || "Não atribuída")}
                </div>
              </div>
              <div className="campo-container">
                <div className="campo campo-topicos">
                  <label>Tópicos</label>
                  <div className="campo-valor">
                    {topicos.length > 0 ? (
                      <ul className="lista-topicos">
                        {topicos.map((topico) => (
                          <li key={topico.id_topico} className="topico-item">
                            {topico.nome}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Sem tópicos associados"
                    )}
                  </div>
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