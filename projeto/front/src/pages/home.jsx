import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import banner from '../images/banner.jpg';
import './css/home.css';
import API_BASE from '../api';
import axios from 'axios';
import Cursos_Sugeridos from '../components/Cursos_Sugeridos';
import fallbackCurso from '../images/default_image.png';
import PasswordChangeModal from '../components/PasswordChangeModal'; // Importar o modal

export default function Home() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // Estado para controlar o modal
  const [userId, setUserId] = useState(null); // Estado para armazenar o ID do usuário

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const textRef = useRef(null); // REFERÊNCIA para o span

  const texts = [
    "Aprender aqui é mais fácil",
    "Aprender aqui é uma experiência nova",
    "Aprender aqui é simples",
    "Aprender aqui é eficaz",
    "Aprender aqui é divertido",
    "Aprender aqui é inovador"
  ];

  // Verificar se é o primeiro login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar o token para obter as informações do usuário
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        
        // Verificar se há informações de primeiro login no localStorage
        const primeiroLogin = localStorage.getItem('primeiroLogin');
        setUserId(decodedToken.id_utilizador);
        
        // Se for o primeiro login, exibir o modal
        if (primeiroLogin === '1') {
          setShowPasswordModal(true);
        }
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
  }, []);

  // Fechar o modal e atualizar o localStorage
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    localStorage.setItem('primeiroLogin', '0');
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

  const buscarInscricoes = async () => {
    try {
      console.log(`Buscando inscrições (contagem: ${refreshCount})`);
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

      const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
      setInscricoes(response.data);
      setLoading(false);
      setRefreshCount(prev => prev + 1);
    } catch (err) {
      console.error('Erro ao buscar inscrições:', err);
      setError('Não foi possível carregar os cursos inscritos');
      setLoading(false);
    }
  };

  useEffect(() => {
    const isFirstLoad = sessionStorage.getItem('homeVisited') !== 'true';
    
    if (isFirstLoad) {
      console.log('Primeira visita à página Home - marcando como visitada');
      sessionStorage.setItem('homeVisited', 'true');
      
      // Obter e armazenar a informação de primeiro login
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };
          
          axios.get(`${API_BASE}/users/perfil`, config)
            .then(response => {
              if (response.data && response.data.primeiro_login) {
                localStorage.setItem('primeiroLogin', response.data.primeiro_login.toString());
                // Se for primeiro login, recarregar para exibir o modal
                window.location.reload();
              }
            })
            .catch(error => {
              console.error('Erro ao buscar perfil:', error);
            });
        } catch (error) {
          console.error('Erro ao configurar requisição:', error);
        }
      }
    } else {
      console.log('Componente Home montado - já visitado anteriormente');
      const needsRefresh = sessionStorage.getItem('needsRefresh');
      if (needsRefresh === 'true') {
        console.log('Flag needsRefresh detectada, removendo...');
        sessionStorage.removeItem('needsRefresh');
      }
      buscarInscricoes();
    }

    return () => {
      console.log('Componente Home desmontado');
    };
  }, []);

  const redirecionarParaDetalheCurso = (cursoId) => {
    console.log('Redirecionando para o curso:', cursoId);
    navigate(`/cursos/${cursoId}`);
  };

  const cursosSugeridos = [
    { id: 1, nome: "React Avançado", formador: "João Silva" },
    { id: 2, nome: "Node.js Essentials", formador: "Maria Costa" },
    { id: 3, nome: "UI/UX Design", formador: "Ana Lopes" },
    { id: 4, nome: "MongoDB Completo", formador: "Carlos Pinto" },
    { id: 5, nome: "Python para Data Science", formador: "Sofia Martins" },
    { id: 6, nome: "DevOps Básico", formador: "Rui Nogueira" },
  ];

  return (
    <div className="home-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Modal de alteração de senha para primeiro login */}
      <PasswordChangeModal 
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
          <h2 className="section-title">Cursos Inscrito</h2>
          {loading ? (
            <div className="loading">Carregando cursos...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : inscricoes.length > 0 ? (
            <div className="cursos-grid">
              {inscricoes.map((inscricao) => (
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
                    <div className={`status-badge status-${inscricao.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {inscricao.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sem-inscricoes">
              <p>Você não está inscrito em nenhum curso.</p>
            </div>
          )}
        </section>

        <section className="cursos-section">
          <h2 className="section-title">Cursos Sugeridos para Você</h2>
          <div className="cursos-grid">
          <Cursos_Sugeridos />
          </div>
        </section>

        <section className="topicos-section">
          <h2 className="section-title">Tópicos</h2>
          <div className="topicos-grid">
            <p className="info-message">Nenhum tópico disponível no momento.</p>
          </div>
        </section>
      </div>
    </div>
  );
}