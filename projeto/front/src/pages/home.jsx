import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import banner from '../images/banner.jpg';
import API_BASE from '../api';
import axios from 'axios';
import CursosSugeridos from '../components/Cursos_Sugeridos';
import fallbackCurso from '../images/default_image.png';
import TrocarSenhaModal from '../components/Trocar_Senha_Modal';
import './css/home.css';

/**
 * Componente principal da página inicial
 * Exibe cursos inscritos do utilizador e cursos sugeridos
 */
export default function Home() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');

  // Estados para controlo de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInscricoes, setTotalInscricoes] = useState(0);
  const inscricoesPerPage = 12;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Referência para animação de texto
  const textRef = useRef(null);

  // Frases para animação do banner
  const texts = [
    "Aprender aqui é mais fácil",
    "Aprender aqui é uma experiência nova",
    "Aprender aqui é simples",
    "Aprender aqui é eficaz",
    "Aprender aqui é divertido",
    "Aprender aqui é inovador"
  ];

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Verificar se é o primeiro login do utilizador
  useEffect(() => {
    const verificarPrimeiroLogin = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Descodificar token para obter informações do utilizador
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          setUserId(decodedToken.id_utilizador);

          // Verificar estado do perfil
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };

          const response = await axios.get(`${API_BASE}/users/perfil`, config);

          // Verificar se é primeiro login
          const primeiroLogin = response.data.primeiro_login;
          const isPrimeiroLogin = primeiroLogin === 1 || primeiroLogin === '1' || primeiroLogin === true;

          if (isPrimeiroLogin) {
            setShowPasswordModal(true);
          } else {
            buscarInscricoes();
          }
        } catch (error) {
          // Em caso de erro, tentar carregar inscrições na mesma
          buscarInscricoes();
        }
      }
    };

    verificarPrimeiroLogin();
  }, []);

  // Fechar modal de mudança de senha
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    buscarInscricoes();
  };

  // Animação do texto no banner
  useEffect(() => {
    let index = 0;
    let charIndex = 0;
    let state = "typing";

    function animateText() {
      const current = texts[index];

      if (!textRef.current) return;

      if (state === "typing") {
        textRef.current.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          state = "waitingAfterTyping";
          setTimeout(animateText, 1500);
        } else {
          setTimeout(animateText, 100);
        }
      }
      else if (state === "waitingAfterTyping") {
        state = "deleting";
        setTimeout(animateText, 100);
      }
      else if (state === "deleting") {
        textRef.current.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          index = (index + 1) % texts.length;
          state = "typing";
          setTimeout(animateText, 300);
        } else {
          setTimeout(animateText, 50);
        }
      }
    }

    animateText();

    return () => {
      clearTimeout();
    };
  }, []);

  /**
   * Obter URL da imagem do curso com fallback
   */
  const getImageUrl = (inscricao) => {
    if (inscricao && inscricao.imagem_path) {
      return `${API_BASE}/${inscricao.imagem_path}`;
    }

    if (inscricao && inscricao.nomeCurso) {
      const nomeCursoSlug = inscricao.nomeCurso
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return `${API_BASE}/uploads/cursos/${nomeCursoSlug}/capa.png`;
    }

    return fallbackCurso;
  };

  /**
   * Buscar inscrições do utilizador com paginação
   */
  const buscarInscricoes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Utilizador não autenticado');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Parâmetros de paginação
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: inscricoesPerPage.toString()
      });

      const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes?${params.toString()}`, config);
      
      // Verificar estrutura da resposta
      if (response.data.inscricoes) {
        setInscricoes(response.data.inscricoes);
        setTotalPages(response.data.totalPages || 1);
        setTotalInscricoes(response.data.total || response.data.inscricoes.length);
      } else {
        setInscricoes(response.data);
        const total = response.data.length;
        setTotalInscricoes(total);
        setTotalPages(Math.ceil(total / inscricoesPerPage));
      }
      
      setLoading(false);
      setRefreshCount(prev => prev + 1);
    } catch (err) {
      setError('Não foi possível carregar os cursos inscritos');
      setLoading(false);
    }
  };

  /**
   * Navegar para página de detalhes do curso
   */
  const redirecionarParaDetalheCurso = (cursoId) => {
    navigate(`/cursos/${cursoId}`);
  };

  /**
   * Filtrar inscrições com base no filtro activo
   */
  const filtrarInscricoes = () => {
    if (filtroAtivo === 'ativos') {
      return inscricoes.filter(inscricao => {
        const status = inscricao.status ? inscricao.status.toLowerCase() : 'agendado';
        return !['finalizado', 'cancelado', 'concluído', 'terminado', 'encerrado'].includes(status);
      });
    }
    return inscricoes;
  };

  const inscricoesFiltradas = filtrarInscricoes();

  // Carregar inscrições quando a página muda
  useEffect(() => {
    buscarInscricoes();
  }, [currentPage]);

  // Voltar à primeira página quando filtro muda
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filtroAtivo]);

  // Navegação entre páginas
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Calcular totais para os botões de filtro
  const totalTodos = inscricoes.length;
  const totalAtivos = inscricoes.filter(inscricao => {
    const status = inscricao.status ? inscricao.status.toLowerCase() : 'agendado';
    return !['finalizado', 'cancelado', 'concluído', 'terminado', 'encerrado'].includes(status);
  }).length;

  return (
    <div className="home-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Modal para mudança de senha no primeiro login */}
      <TrocarSenhaModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        userId={userId}
      />

      {/* Banner principal com animação */}
      <div className="banner">
        <img src={banner} alt="banner" />
        <div className="overlay-text">
          <div className="text-animation">
            <h1><span ref={textRef}></span><span className="cursor"></span></h1>
          </div>
          <p>Não vale a pena estar a inventar a roda ou a descobrir a pólvora!</p>
        </div>
      </div>

      <div className="content-container">
        {/* Secção de cursos inscritos */}
        <section className="cursos-section">
          <div className="section-header">
            <h2 className="section-title">Cursos Inscrito</h2>
            
            {/* Filtros de cursos */}
            <div className="filtro-cursos">
              <button 
                className={`filtro-btn ${filtroAtivo === 'todos' ? 'ativo' : ''}`}
                onClick={() => setFiltroAtivo('todos')}
              >
                Todos ({totalTodos})
              </button>
              <button 
                className={`filtro-btn ${filtroAtivo === 'ativos' ? 'ativo' : ''}`}
                onClick={() => setFiltroAtivo('ativos')}
              >
                Ativos ({totalAtivos})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">A carregar cursos...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : inscricoesFiltradas.length > 0 ? (
            <>
              <div className="cursos-grid">
                {inscricoesFiltradas.map((inscricao) => (
                  <div
                    key={inscricao.id}
                    className="cartao-curso"
                    onClick={() => redirecionarParaDetalheCurso(inscricao.cursoId)}
                  >
                    <div className="curso-imagem-container">
                      <img
                        src={getImageUrl(inscricao)}
                        alt={inscricao.nomeCurso}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackCurso;
                        }}
                      />
                    </div>
                    <div className="curso-info">
                      <p className="curso-titulo">{inscricao.nomeCurso}</p>
                      <p className="curso-detalhe">Categoria: {inscricao.categoria}</p>
                      <p className="curso-detalhe">Área: {inscricao.area}</p>

                      <div className={`estado-curso status-${inscricao.status ? inscricao.status.toLowerCase().replace(/\s+/g, '-') : 'agendado'}`}>
                        {inscricao.status || 'Agendado'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1} 
                    className={`pagination-button ${currentPage === 1 ? 'pagination-disabled' : 'pagination-active'}`}
                    aria-label="Página anterior"
                  >
                    <span className="pagination-icon">&#10094;</span>
                  </button>
                  
                  <span className="pagination-info">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages} 
                    className={`pagination-button ${currentPage === totalPages ? 'pagination-disabled' : 'pagination-active'}`}
                    aria-label="Próxima página"
                  >
                    <span className="pagination-icon">&#10095;</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="sem-inscricoes">
              <p>
                {filtroAtivo === 'ativos' 
                  ? 'Não possui cursos ativos no momento.' 
                  : 'Não está inscrito em nenhum curso.'
                }
              </p>
            </div>
          )}
        </section>

        {/* Secção de cursos sugeridos */}
        <section className="cursos-section">
          <h2 className="section-title">Cursos Sugeridos</h2>
          <div className="cursos-grid">
            <CursosSugeridos />
          </div>
        </section>
      </div>
    </div>
  );
}