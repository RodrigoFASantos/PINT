import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import API_BASE from "../../api";
import Sidebar from "../../components/Sidebar";
import "./css/Pagina_Curso.css";

export default function CursoPagina() {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscrito, setInscrito] = useState(false);
  const [conteudos, setConteudos] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [cursosAssociados, setCursosAssociados] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Estados para exibir seções específicas
  const [activeTab, setActiveTab] = useState('detalhes');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Verificar se currentUser existe e definir userRole
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchCursoDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/cursos/${cursoId}`);

        if (!response.ok) {
          throw new Error('Curso não encontrado');
        }

        const data = await response.json();
        setCurso(data);

        // Verificar se o curso é assíncrono e terminou
        const dataAtual = new Date();
        const dataFimCurso = new Date(data.data_fim);
        const cursoTerminado = dataFimCurso < dataAtual;

        // Verificar acesso a cursos assíncronos terminados
        if (data.tipo === 'assincrono' && cursoTerminado) {
          // Se não for admin (role 1), negar acesso
          if (userRole !== 1) {
            setAcessoNegado(true);
            setLoading(false);
            return;
          }
        }

        // Verificar se o utilizador está inscrito
        const userToken = localStorage.getItem('token');
        if (userToken) {
          const inscricaoResponse = await fetch(`${API_BASE}/inscricoes/verificar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ cursoId })
          });

          const inscricaoData = await inscricaoResponse.json();
          setInscrito(inscricaoData.inscrito);

          // Se estiver inscrito e o curso estiver em andamento, carregar conteúdos
          if (inscricaoData.inscrito && data.estado === 'Em curso') {
            const conteudosResponse = await fetch(`${API_BASE}/cursos/${cursoId}/conteudos`, {
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });

            const conteudosData = await conteudosResponse.json();
            setConteudos(conteudosData);
          }
        }

        // Buscar cursos associados
        try {
          const associacoesResponse = await fetch(`${API_BASE}/associar-cursos/curso/${cursoId}`);
          if (associacoesResponse.ok) {
            const associacoesData = await associacoesResponse.json();

            // Transformar os dados das associações em lista de cursos
            const cursosAssociadosArray = associacoesData.map(associacao => {
              // Se o curso atual é a origem, o destino é o associado e vice-versa
              if (associacao.id_curso_origem === parseInt(cursoId)) {
                return associacao.cursoDestino;
              } else {
                return associacao.cursoOrigem;
              }
            });

            setCursosAssociados(cursosAssociadosArray);
          }
        } catch (assocError) {
          console.error("Erro ao carregar associações do curso:", assocError);
        }


      } catch (err) {
        setError(err.message);
        console.error("Erro ao carregar detalhes do curso:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCursoDetails();
  }, [cursoId, userRole]);

  const handleInscrever = async () => {
    try {
      const userToken = localStorage.getItem('token');

      if (!userToken) {
        navigate('/login', { state: { redirect: `/curso/${cursoId}` } });
        return;
      }

      const response = await fetch(`${API_BASE}/inscricoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ cursoId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao inscrever no curso');
      }

      setInscrito(true);
      alert('Inscrição realizada com sucesso!');
    } catch (err) {
      alert(err.message);
      console.error("Erro ao inscrever no curso:", err);
    }
  };

  const handleDeleteCurso = async () => {
    try {
      const userToken = localStorage.getItem('token');

      if (!userToken) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/cursos/${cursoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir curso');
      }

      alert('Curso excluído com sucesso!');
      navigate('/cursos');
    } catch (err) {
      alert(err.message);
      console.error("Erro ao excluir curso:", err);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };


  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (acessoNegado) {
    return (
      <div className="container message-container">
        <h2 className="error-message">Acesso Negado</h2>
        <p>Este curso assíncrono já foi encerrado e apenas administradores podem aceder ao seu conteúdo.</p>
        <button
          onClick={() => navigate('/cursos')}
          className="back-button"
        >
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container message-container">
        <h2 className="error-message">Erro ao carregar o curso</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/cursos')}
          className="back-button"
        >
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container message-container">
        <h2 className="error-message">Curso não encontrado</h2>
        <button
          onClick={() => navigate('/cursos')}
          className="back-button"
        >
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirmation && userRole === 1 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Confirmar Exclusão</h2>
            <p className="modal-text">
              Tem certeza que deseja excluir este curso?
              Esta ação irá remover o curso e todas as inscrições associadas.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="modal-button-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCurso}
                className="modal-button-delete"
              >
                Excluir Curso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Título e tags */}
      <div className="course-header-actions">
        <h1 className="course-title">{curso.nome}</h1>
        {userRole === 1 && (
          <button
            onClick={() => setShowDeleteConfirmation(true)}
            className="action-button action-button-red"
          >
            Excluir Curso
          </button>
        )}
      </div>
      
      <div className="course-tags">
        <span className="tag tag-category">
          {curso.categoria?.nome || curso.categoria}
        </span>
        <span className={`tag ${curso.estado === 'Em curso'
          ? 'tag-status-active'
          : curso.estado === 'Terminado'
            ? 'tag-status-finished'
            : 'tag-status-default'
          }`}>
          {curso.estado}
        </span>
        <span className="tag tag-type">
          {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
        </span>
      </div>
      
      {/* Informações do curso e abas */}
      <div className="course-content">
        {/* Abas de navegação */}
        <div className="tabs-navigation">
          <button
            className={`tab-button ${activeTab === 'detalhes' ? 'tab-button-active' : 'tab-button-inactive'}`}
            onClick={() => setActiveTab('detalhes')}
          >
            Detalhes
          </button>

          {inscrito && curso.estado === 'Em curso' && (
            <button
              className={`tab-button ${activeTab === 'conteudo' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('conteudo')}
            >
              Conteúdo do Curso
            </button>
          )}

          {/* Aba de gerenciamento para formadores e administradores */}
          {(userRole === 1 || (userRole === 2 && currentUser.id_utilizador === curso.id_formador)) && (
            <button
              className={`tab-button ${activeTab === 'gerenciar' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('gerenciar')}
            >
              Gerenciar Curso
            </button>
          )}
        </div>

        {/* Conteúdo das abas */}
        <div className="tab-content">
          {/* Aba de gerenciamento */}
          {activeTab === 'gerenciar' && (userRole === 1 || (userRole === 2 && currentUser.id_utilizador === curso.id_formador)) && (
            <div className="management-section">
              <h2 className="management-title">Gerenciamento do Curso</h2>

              <div className="management-actions">
                <h3 className="actions-title">Ações de Gerenciamento</h3>

                <div className="actions-container">
                  <button
                    onClick={() => navigate(`/gerenciar-inscricoes/${cursoId}`)}
                    className="action-button action-button-blue"
                  >
                    Gerenciar Inscrições
                  </button>

                  {userRole === 1 && (
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="action-button action-button-red"
                    >
                      Excluir Curso
                    </button>
                  )}

                  {(userRole === 1 || (userRole === 2 && currentUser.id_utilizador === curso.id_formador)) && (
                    <button
                      onClick={() => navigate(`/editar-curso/${cursoId}`)}
                      className="action-button action-button-green"
                    >
                      Editar Curso
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          
          {/* Aba de conteúdo (visível apenas para inscritos em cursos em andamento) */}
          {activeTab === 'conteudo' && (
            <div>
              <h2 className="section-title">Conteúdo do Curso</h2>

              {conteudos.length === 0 ? (
                <p className="course-description">Nenhum conteúdo disponível no momento.</p>
              ) : (
                <div className="course-content-list">
                  {conteudos.map((item, index) => (
                    <div key={index} className="content-item">
                      <h3 className="content-title">{item.titulo}</h3>
                      <p className="content-description">{item.descricao}</p>

                      {item.tipo === 'link' && (
                        <a
                          href={item.conteudo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="content-link"
                        >
                          Acessar conteúdo
                        </a>
                      )}

                      {item.tipo === 'video' && (
                        <div className="video-container">
                          <iframe
                            src={item.conteudo}
                            title={item.titulo}
                            className="video-iframe"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}

                      {item.tipo === 'arquivo' && (
                        <a
                          href={item.conteudo}
                          download
                          className="content-link"
                        >
                          Download do material
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Se for um curso síncrono, mostrar área de upload de trabalhos */}
              {curso.tipo === 'sincrono' && (
                <div className="submission-section">
                  <h3 className="submission-title">Envio de Trabalhos</h3>

                  <div className="submission-form">
                    <p className="submission-description">
                      Utilize este espaço para enviar seus trabalhos para avaliação do formador.
                    </p>

                    <label className="form-label">
                      Título do trabalho
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Digite o título do seu trabalho"
                    />

                    <label className="form-label">
                      Descrição (opcional)
                    </label>
                    <textarea
                      className="form-textarea"
                      rows="3"
                      placeholder="Adicione uma breve descrição do seu trabalho"
                    ></textarea>

                    <label className="form-label">
                      Arquivo
                    </label>
                    <input
                      type="file"
                      className="form-input"
                    />

                    <button className="submit-button">
                      Enviar Trabalho
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}