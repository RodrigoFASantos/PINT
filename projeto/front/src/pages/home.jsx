import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import banner from '../images/banner.jpg';
import './css/home.css';
import API_BASE, { IMAGES } from '../api';
import axios from 'axios';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Efeito para verificar se precisa recarregar após login
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('needsRefresh');
  
    if (needsRefresh === 'true') {
      // Remover o flag para evitar loops de recargas
      sessionStorage.removeItem('needsRefresh');
      // Recarregar a página uma vez
      window.location.reload();
    }
  }, []);
  
  // Função para buscar as inscrições do usuário
  const buscarInscricoes = async () => {
    try {
      setLoading(true);
      // Obter o token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      // Configurar o header com o token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Fazer a requisição para a API
      const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
      
      // Atualizar o estado com as inscrições recebidas
      setInscricoes(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar inscrições:', err);
      setError('Não foi possível carregar os cursos inscritos');
      setLoading(false);
    }
  };
  
  // Efeito para carregar as inscrições quando o componente montar
  useEffect(() => {
    buscarInscricoes();
  }, []);

  // Cursos para serem exibidos caso não haja inscrições ou o usuário não esteja logado
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
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Banner com overlay */}
      <div className="banner">
        <img src={banner} alt="banner" />
        <div className="overlay-text">
          <h1>Aprender aqui é mais fácil</h1>
          <p>Não vale a pena estar a inventar a roda ou a descobrir a pólvora!</p>
        </div>
      </div>

      <div className="content-container">
        {/* Seção de cursos inscritos */}
        <section className="cursos-section">
          <h2 className="section-title">Meus Cursos Inscritos</h2>
          
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
                  onClick={() => window.location.href = `/curso/${inscricao.cursoId}`}
                >
                  {/* Tentar usar a imagem do curso se disponível */}
                  <img 
                    src={IMAGES.CURSO(inscricao.nomeCurso?.replace(/\s+/g, '-').toLowerCase() || inscricao.cursoId)} 
                    alt={inscricao.nomeCurso}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/fallback-curso.jpg'; // Imagem padrão caso não encontre
                    }}
                  />
                  <div className="curso-info">
                    <h3>{inscricao.nomeCurso}</h3>
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

        {/* Seção de cursos sugeridos (sempre exibida) */}
        <section className="cursos-section">
          <h2 className="section-title">Cursos Sugeridos para Você</h2>
          <div className="cursos-grid">
            {cursosSugeridos.map((curso) => (
              <div key={curso.id} className="cartao-curso">
                <div className="curso-info">
                  <h3>{curso.nome}</h3>
                  <p className="curso-detalhe">Formador: {curso.formador}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção de Tópicos */}
        <section className="topicos-section">
          <h2 className="section-title">Tópicos</h2>
          <div className="topicos-grid">
            {/* Conteúdo da seção de tópicos */}
            <p className="info-message">Nenhum tópico disponível no momento.</p>
          </div>
        </section>
      </div>
    </div>
  );
}