import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import banner from '../images/banner.jpg';
import './css/home.css';
import API_BASE from '../api';
import axios from 'axios';
import Cursos_Sugeridos from '../components/Cursos_Sugeridos';
import fallbackCurso from '../images/default_image.png';
import Trocar_Senha_Modal from '../components/Trocar_Senha_Modal'; // Importar o modal

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
      console.log('Inscrições recebidas:', response.data);
      setInscricoes(response.data);
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

  return (
    <div className="home-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Modal de alteração de senha para primeiro login */}
      <Trocar_Senha_Modal 
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