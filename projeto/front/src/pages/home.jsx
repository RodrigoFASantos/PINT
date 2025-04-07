import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import banner from '../images/banner.jpg';
import './css/home.css';
/* import cursoImg from '../images/curso.jpg'; */


export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const cursos = [
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
          <p>Não vale a pena estar a inventar a roda ou a descobrir a pólvora!
          </p>
        </div>
      </div>

      {/* Secção de cursos */}
      <section className="cursos">
        <h2>Cursos Associados</h2>
        <div className="cursos-grid">
          {cursos.map((curso) => (
            <div key={curso.id} className="cartao-curso">
              {/* <img src={cursoImg} alt="imagem curso" /> */}
              <h3>{curso.nome}</h3>
              <p>{curso.formador}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secção de Tópicos */}
      <section className="topicos">
        <h2>Tópicos</h2>
        <div className="topicos-grid">
        </div>
      </section>

    </div>
  );
}
