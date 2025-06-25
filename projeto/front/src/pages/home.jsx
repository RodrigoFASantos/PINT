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

export default function Home() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('todos'); // Estado para o filtro

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInscricoes, setTotalInscricoes] = useState(0);
  const inscricoesPerPage = 12; // Número de inscrições por página

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const textRef = useRef(null);

  const texts = [
    "Aprender aqui é mais fácil",
    "Aprender aqui é uma experiência nova",
    "Aprender aqui é simples",
    "Aprender aqui é eficaz",
    "Aprender aqui é divertido",
    "Aprender aqui é inovador"
  ];

  // Verificar autenticação e redirecionar se não estiver autenticado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Usuário não autenticado, redirecionando para login');
      navigate('/login');
    }
  }, [navigate]);

  // Verificar se é o primeiro login
  useEffect(() => {
    const verificarPrimeiroLogin = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          console.log('Verificando primeiro login...');

          // Decodificar o token para obter as informações do usuário
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          setUserId(decodedToken.id_utilizador);

          // Verificar perfil do usuário para saber se é primeiro login
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };

          const response = await axios.get(`${API_BASE}/users/perfil`, config);
          console.log('Dados do perfil recebidos:', response.data);

          // Verificação mais robusta, aceitando tanto 1 como true ou '1'
          const primeiroLogin = response.data.primeiro_login;
          const isPrimeiroLogin = primeiroLogin === 1 || primeiroLogin === '1' || primeiroLogin === true;

          console.log('Valor de primeiro_login:', primeiroLogin, 'É primeiro login?', isPrimeiroLogin);

          if (isPrimeiroLogin) {
            console.log('Primeiro login detectado, exibindo modal de troca de senha');
            setShowPasswordModal(true);
          } else {
            console.log('Não é primeiro login, carregando inscrições');
            buscarInscricoes();
          }
        } catch (error) {
          console.error('Erro ao verificar perfil:', error);
          // Mesmo com erro, tentamos buscar as inscrições
          buscarInscricoes();
        }
      }
    };

    verificarPrimeiroLogin();
  }, []);

  // Fechar o modal e atualizar o localStorage
  const handleClosePasswordModal = () => {
    console.log('Modal de senha fechado, atualizando estado');
    setShowPasswordModal(false);

    // Após fechar o modal, buscar inscrições
    buscarInscricoes();
  };

  useEffect(() => {
    let index = 0;
    let charIndex = 0;
    let state = "typing"; // typing, waitingAfterTyping, deleting

    function animateText() {
      const current = texts[index];

      if (!textRef.current) return;

      if (state === "typing") {
        textRef.current.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          state = "waitingAfterTyping";
          setTimeout(animateText, 1500); // espera antes de apagar
        } else {
          setTimeout(animateText, 100); // escrever
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
          setTimeout(animateText, 300); // pequena pausa antes de escrever nova
        } else {
          setTimeout(animateText, 50); // apagar
        }
      }
    }

    animateText();

    return () => {
      // Cleanup se o componente desmontar
      clearTimeout();
    };
  }, []);

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

  // Função para buscar inscrições com paginação
  const buscarInscricoes = async () => {
    try {
      console.log(`Buscando inscrições (página: ${currentPage}, contagem: ${refreshCount})`);
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Adicionar parâmetros de paginação
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: inscricoesPerPage.toString()
      });

      const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes?${params.toString()}`, config);
      console.log('Inscrições recebidas:', response.data);
      
      // Verificar se a resposta tem a estrutura esperada com paginação
      if (response.data.inscricoes) {
        // Se a API retorna um objeto com paginação
        setInscricoes(response.data.inscricoes);
        setTotalPages(response.data.totalPages || 1);
        setTotalInscricoes(response.data.total || response.data.inscricoes.length);
      } else {
        // Se a API retorna apenas um array (compatibilidade com versão anterior)
        setInscricoes(response.data);
        const total = response.data.length;
        setTotalInscricoes(total);
        setTotalPages(Math.ceil(total / inscricoesPerPage));
      }
      
      setLoading(false);
      setRefreshCount(prev => prev + 1);
    } catch (err) {
      console.error('Erro ao buscar inscrições:', err);
      setError('Não foi possível carregar os cursos inscritos');
      setLoading(false);
    }
  };

  const redirecionarParaDetalheCurso = (cursoId) => {
    console.log('Redirecionando para o curso:', cursoId);
    navigate(`/cursos/${cursoId}`);
  };

  // Função para filtrar as inscrições
  const filtrarInscricoes = () => {
    if (filtroAtivo === 'ativos') {
      // Filtra apenas cursos com status que indicam atividade
      return inscricoes.filter(inscricao => {
        const status = inscricao.status ? inscricao.status.toLowerCase() : 'agendado';
        // Considera ativos: em andamento, agendado, iniciado, etc.
        // Exclui: finalizado, cancelado, concluído, etc.
        return !['finalizado', 'cancelado', 'concluído', 'terminado', 'encerrado'].includes(status);
      });
    }
    return inscricoes; // Retorna todos se filtro for 'todos'
  };

  const inscricoesFiltradas = filtrarInscricoes();

  // Buscar inscrições sempre que a página mudar
  useEffect(() => {
    buscarInscricoes();
  }, [currentPage]);

  // Resetar para primeira página quando filtro mudar
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filtroAtivo]);

  // Funções para navegação de páginas
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

  // Calcular o total de inscrições filtradas para exibir nos botões
  const totalTodos = inscricoes.length;
  const totalAtivos = inscricoes.filter(inscricao => {
    const status = inscricao.status ? inscricao.status.toLowerCase() : 'agendado';
    return !['finalizado', 'cancelado', 'concluído', 'terminado', 'encerrado'].includes(status);
  }).length;

  return (
    <div className="home-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Modal de alteração de senha para primeiro login */}
      <TrocarSenhaModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        userId={userId}
      />

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
        <section className="cursos-section">
          <div className="section-header">
            <h2 className="section-title">Cursos Inscrito</h2>
            
            {/* Filtro de cursos */}
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
            <div className="loading">Carregando cursos...</div>
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

              {/* Paginação - só mostra se há mais de uma página */}
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
                  ? 'Você não possui cursos ativos no momento.' 
                  : 'Você não está inscrito em nenhum curso.'
                }
              </p>
            </div>
          )}
        </section>

        <section className="cursos-section">
          <h2 className="section-title">Cursos Sugeridos para Você</h2>
          <div className="cursos-grid">
            <CursosSugeridos />
          </div>
        </section>
      </div>
    </div>
  );
}