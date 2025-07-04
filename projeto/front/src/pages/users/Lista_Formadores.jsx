import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../../api";
import Sidebar from "../../components/Sidebar";
import "./css/Lista_Formadores.css";

/**
 * Componente da página que apresenta a listagem completa de formadores
 * Inclui paginação, gestão de estados de carregamento e navegação para perfis individuais
 */
export default function FormadoresPage() {
  // Estados principais para gestão dos dados dos formadores
  const [formadores, setFormadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para controlo da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const formadoresPerPage = 10;

  const navigate = useNavigate();
  
  /**
   * Alterna entre abrir e fechar a barra lateral de navegação
   */
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Constrói o URL da imagem de perfil do formador
   * Tenta diferentes abordagens para garantir que uma imagem válida é sempre retornada
   * 
   * @param {Object} formador - Dados do formador que contêm informações da foto
   * @returns {string} URL completo da imagem de perfil
   */
  const getProfileImageUrl = (formador) => {
    if (!formador) return '/placeholder-formador.jpg';

    // Verifica se já tem URL absoluto ou relativo válido
    if (formador.foto_perfil && (formador.foto_perfil.startsWith('http') || formador.foto_perfil.startsWith('/'))) {
      return formador.foto_perfil;
    }

    // Tenta gerar URL baseado no email através do sistema de imagens da API
    const email = formador.email;
    if (!email) return '/placeholder-formador.jpg';

    // Utiliza as funções específicas do sistema de imagens se disponíveis
    if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
      return IMAGES.FORMADOR(email);
    } else if (IMAGES && typeof IMAGES.USER_AVATAR === 'function') {
      return IMAGES.USER_AVATAR(email);
    }

    return '/placeholder-formador.jpg';
  };

  /**
   * Constrói o URL da imagem de capa/fundo do cartão do formador
   * Funciona de forma similar à função anterior mas para imagens de capa
   * 
   * @param {Object} formador - Dados do formador que contêm informações da capa
   * @returns {string} URL completo da imagem de capa
   */
  const getCoverImageUrl = (formador) => {
    if (!formador) return '/placeholder-cover.jpg';

    // Verifica se já tem URL de capa definido
    if (formador.foto_capa && (formador.foto_capa.startsWith('http') || formador.foto_capa.startsWith('/'))) {
      return formador.foto_capa;
    }

    const email = formador.email;
    if (!email) return '/placeholder-cover.jpg';

    // Tenta usar as funções específicas para capas no sistema de imagens
    if (IMAGES && typeof IMAGES.USER_CAPA === 'function') {
      return IMAGES.USER_CAPA(email);
    } else if (IMAGES && IMAGES.DEFAULT_CAPA) {
      return IMAGES.DEFAULT_CAPA;
    }

    return '/placeholder-cover.jpg';
  };

  /**
   * Efetua chamada à API para carregar a lista de formadores
   * Implementa paginação e gestão de erros robusta
   * Executa automaticamente quando a página atual muda
   */
  useEffect(() => {
    const fetchFormadores = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE}/formadores?page=${currentPage}&limit=${formadoresPerPage}`);
  
        if (!response.ok) {
          let errorMessage = `Erro ${response.status}`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = `Erro de servidor (${response.status})`;
          }
          
          throw new Error(errorMessage);
        }
  
        const data = await response.json();
        
        // Valida a estrutura dos dados recebidos
        if (!data || typeof data !== 'object') {
          throw new Error('Resposta inválida do servidor');
        }
        
        const totalPagesFromAPI = Math.max(1, data.totalPages || 1);
  
        // Corrige automaticamente se a página atual exceder o total disponível
        if (currentPage > totalPagesFromAPI) {
          setCurrentPage(1);
          return;
        }
  
        setFormadores(Array.isArray(data.formadores) ? data.formadores : []);
        setTotalPages(totalPagesFromAPI);
        
      } catch (error) {
        console.error("Erro ao carregar formadores:", error);
        setError(error.message || "Não foi possível carregar a lista de formadores. Tenta novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchFormadores();
  }, [currentPage]);
  
  /**
   * Navega para a página anterior na paginação
   * Só executa se não estivermos já na primeira página
   */
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  /**
   * Navega para a próxima página na paginação
   * Só executa se não estivermos já na última página
   */
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Redireciona para a página de detalhes de um formador específico
   * Valida se o ID do formador é válido antes de navegar
   * 
   * @param {number} formadorId - Identificador único do formador
   */
  const handleFormadorClick = (formadorId) => {
    if (!formadorId) {
      console.error("Tentativa de navegar para formador sem ID válido");
      return;
    }

    navigate(`/formadores/${formadorId}`);
  };

  // Interface de carregamento mostrada enquanto os dados são obtidos
  if (loading) {
    return (
      <div className="p-6 min-h-screen flex flex-col bg-white">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-3 text-gray-600">A carregar formadores...</p>
          </div>
        </div>
      </div>
    );
  }

  // Interface de erro com opção para tentar novamente
  if (error) {
    return (
      <div className="p-6 min-h-screen flex flex-col bg-white">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-2">⚠️ Erro ao carregar formadores</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interface principal da página com lista de formadores
  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <h1 className="page-title">Formadores</h1>

      {/* Grelha responsiva que apresenta os cartões dos formadores */}
      <div className="formadores-grid">
        {formadores.length > 0 ? (
          formadores.map((formador, index) => {
            // Obtém o ID do formador de forma segura, tentando diferentes propriedades
            const formadorId = formador.id_utilizador || formador.id;

            return (
              <div
                key={formadorId || `formador-${index}`}
                onClick={() => formadorId && handleFormadorClick(formadorId)}
                className={`formador-card ${formadorId ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  backgroundImage: `url(${getCoverImageUrl(formador)})`
                }}
              >
                <div className="formador-info">
                  <img 
                    src={getProfileImageUrl(formador)} 
                    alt={formador.nome || "Formador"} 
                    className="formador-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-formador.jpg';
                    }}
                  />
                  <h3 className="formador-name">
                    {formador.nome || "Nome não disponível"}
                  </h3>
                  <p className="formador-email">
                    {formador.email || "Email não disponível"}
                  </p>
                  
                  {/* Mostra informações adicionais se disponíveis */}
                  {formador.telefone && (
                    <p className="formador-telefone text-sm text-gray-300 mt-1">
                      📞 {formador.telefone}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-600 text-lg">Nenhum formador disponível no momento.</p>
            <p className="text-gray-500 text-sm mt-2">
              Os formadores poderão aparecer aqui após se registarem no sistema.
            </p>
          </div>
        )}
      </div>

      {/* Controlos de paginação - só aparecem se houver mais de uma página */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center my-6 pagination-container">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 pagination-button ${currentPage === 1 ? 'pagination-disabled' : 'pagination-active'}`}
            aria-label="Página anterior"
          >
            <span className="pagination-icon">&#10094;</span>
          </button>

          <span className="mx-4 text-lg font-medium pagination-info">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 pagination-button ${currentPage === totalPages ? 'pagination-disabled' : 'pagination-active'}`}
            aria-label="Próxima página"
          >
            <span className="pagination-icon">&#10095;</span>
          </button>
        </div>
      )}
    </div>
  );
}