import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import API_BASE from "../../api";
import Sidebar from "../../components/Sidebar";

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

  // Estados para exibir seções específicas
  const [activeTab, setActiveTab] = useState('detalhes');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Verificar se currentUser existe e definir userRole
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
      console.log("User Role:", currentUser.id_cargo);
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (acessoNegado) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl text-red-600 mb-4">Acesso Negado</h2>
        <p>Este curso assíncrono já foi encerrado e apenas administradores podem aceder ao seu conteúdo.</p>
        <button
          onClick={() => navigate('/cursos')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl text-red-600 mb-4">Erro ao carregar o curso</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/cursos')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl mb-4">Curso não encontrado</h2>
        <button
          onClick={() => navigate('/cursos')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirmation && userRole === 1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirmar Exclusão</h2>
            <p className="mb-6 text-gray-700">
              Tem certeza que deseja excluir este curso?
              Esta ação irá remover o curso e todas as inscrições associadas.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCurso}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir Curso
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Cabeçalho do curso */}
      <div
        className="w-full h-64 bg-cover bg-center rounded-lg mb-6 relative"
        style={{ backgroundImage: `url(${curso.imagem || '/placeholder-curso.jpg'})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex flex-col justify-center px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl text-white font-bold">{curso.nome}</h1>
            {/* Apenas administradores podem excluir cursos */}
            {userRole === 1 && (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200"
              >
                Excluir Curso
              </button>
            )}
          </div>
          <div className="flex items-center mt-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm mr-3">
              {curso.categoria}
            </span>
            <span className={`px-3 py-1 rounded text-sm ${curso.estado === 'Em curso'
                ? 'bg-green-600 text-white'
                : curso.estado === 'Terminado'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
              {curso.estado}
            </span>
            <span className="bg-gray-600 text-white px-3 py-1 rounded text-sm ml-3">
              {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
            </span>
          </div>
        </div>
      </div>


      {/* Informações do curso e abas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Abas de navegação */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'detalhes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('detalhes')}
          >
            Detalhes
          </button>

          {inscrito && curso.estado === 'Em curso' && (
            <button
              className={`px-6 py-3 text-lg font-medium ${activeTab === 'conteudo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('conteudo')}
            >
              Conteúdo do Curso
            </button>
          )}

          {/* Nova aba de gerenciamento para formadores e administradores */}
          {(userRole === 1 || (userRole === 2 && currentUser.id_utilizador === curso.id_formador)) && (
            <button
              className={`px-6 py-3 text-lg font-medium ${activeTab === 'gerenciar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('gerenciar')}
            >
              Gerenciar Curso
            </button>
          )}
        </div>

        {/* Conteúdo das abas */}
        <div className="p-6">
          {/* ... resto do código para abas de detalhes e conteúdo ... */}

          {/* Nova aba de gerenciamento para formadores e administradores */}
          {activeTab === 'gerenciar' && (userRole === 1 || (userRole === 2 && currentUser.id_utilizador === curso.id_formador)) && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Gerenciamento do Curso</h2>

              <div className="space-y-4">
                <div className="border p-4 rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-2">Ações de Gerenciamento</h3>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/gerenciar-inscricoes/${cursoId}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
                    >
                      Gerenciar Inscrições
                    </button>

                    {userRole === 1 && (
                      <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200"
                      >
                        Excluir Curso
                      </button>
                    )}

                    {(userRole === 1 || (userRole === 2 && currentUser.id_utilizador === curso.id_formador)) && (
                      <button
                        onClick={() => navigate(`/editar-curso/${cursoId}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
                      >
                        Editar Curso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações do curso e abas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Abas de navegação */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'detalhes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('detalhes')}
          >
            Detalhes
          </button>

          {inscrito && curso.estado === 'Em curso' && (
            <button
              className={`px-6 py-3 text-lg font-medium ${activeTab === 'conteudo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('conteudo')}
            >
              Conteúdo do Curso
            </button>
          )}
        </div>

        {/* Conteúdo das abas */}
        <div className="p-6">
          {/* Aba de detalhes */}
          {activeTab === 'detalhes' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Sobre o Curso</h2>
                  <p className="text-gray-700 mb-4">{curso.descricao}</p>

                  {curso.formador && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Formador</h3>
                      <div className="flex items-center">
                        <img
                          src={curso.formador.avatar || '/placeholder-avatar.jpg'}
                          alt={curso.formador.nome}
                          className="w-12 h-12 rounded-full mr-3"
                        />
                        <div>
                          <p className="font-medium">{curso.formador.nome}</p>
                          <p className="text-sm text-gray-600">{curso.formador.especialidade}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="bg-gray-100 p-5 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Informações do Curso</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data de início:</span>
                        <span className="font-medium">{new Date(curso.dataInicio).toLocaleDateString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Data de término:</span>
                        <span className="font-medium">{new Date(curso.dataFim).toLocaleDateString()}</span>
                      </div>

                      {curso.tipo === 'síncrono' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vagas disponíveis:</span>
                          <span className="font-medium">{curso.vagasDisponiveis}/{curso.totalVagas}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">Carga horária:</span>
                        <span className="font-medium">{curso.cargaHoraria} horas</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium capitalize">{curso.tipo}</span>
                      </div>
                    </div>

                    {!inscrito && curso.estado === 'Disponível' && (
                      <button
                        onClick={handleInscrever}
                        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
                      >
                        Inscrever-se
                      </button>
                    )}

                    {inscrito && (
                      <div className="mt-6 bg-green-100 text-green-800 p-3 rounded-lg text-center">
                        Você está inscrito neste curso
                      </div>
                    )}

                    {curso.estado === 'Terminado' && !inscrito && (
                      <div className="mt-6 bg-red-100 text-red-800 p-3 rounded-lg text-center">
                        Este curso já foi encerrado
                      </div>
                    )}

                    {curso.tipo === 'assincrono' && curso.estado === 'Terminado' && userRole === 1 && (
                      <div className="mt-6 bg-red-100 text-red-800 p-3 rounded-lg text-center">
                        Como administrador, você tem acesso a este curso assíncrono mesmo após seu término
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba de conteúdo (visível apenas para inscritos em cursos em andamento) */}
          {activeTab === 'conteudo' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Conteúdo do Curso</h2>

              {conteudos.length === 0 ? (
                <p className="text-gray-600">Nenhum conteúdo disponível no momento.</p>
              ) : (
                <div className="space-y-6">
                  {conteudos.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
                      <h3 className="text-lg font-medium mb-2">{item.titulo}</h3>
                      <p className="text-gray-700 mb-3">{item.descricao}</p>

                      {item.tipo === 'link' && (
                        <a
                          href={item.conteudo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Acessar conteúdo
                        </a>
                      )}

                      {item.tipo === 'video' && (
                        <div className="aspect-w-16 aspect-h-9 mt-3">
                          <iframe
                            src={item.conteudo}
                            title={item.titulo}
                            className="w-full h-64 rounded"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}

                      {item.tipo === 'arquivo' && (
                        <a
                          href={item.conteudo}
                          download
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download do material
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Se for um curso síncrono, mostrar área de upload de trabalhos */}
              {curso.tipo === 'sincrono' && (
                <div className="mt-10 border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Envio de Trabalhos</h3>

                  <div className="bg-gray-100 p-5 rounded-lg">
                    <p className="text-gray-700 mb-4">
                      Utilize este espaço para enviar seus trabalhos para avaliação do formador.
                    </p>

                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Título do trabalho
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded mb-4"
                      placeholder="Digite o título do seu trabalho"
                    />

                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Descrição (opcional)
                    </label>
                    <textarea
                      className="w-full p-2 border rounded mb-4"
                      rows="3"
                      placeholder="Adicione uma breve descrição do seu trabalho"
                    ></textarea>

                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Arquivo
                    </label>
                    <input
                      type="file"
                      className="w-full p-2 border rounded mb-4"
                    />

                    <button className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition duration-200">
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