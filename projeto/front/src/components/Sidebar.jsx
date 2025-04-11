import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './css/Sidebar.css';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (currentUser) {
      setUserRole(currentUser.id_cargo);
    }
  }, [currentUser]);

  // Função para verificar se o link está ativo
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay com blur */}
      {isOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <button onClick={toggleSidebar} className="close-btn">
            &times;
          </button>

          {/* Links comuns para todos os perfis */}
          <div className="sidebar-section">
            <h3>Geral</h3>
            <ul>
              <li className={isActive('/') ? 'active' : ''}>
                <Link to="/" onClick={toggleSidebar}>
                  <i className="fas fa-home"></i> Home
                </Link>
              </li>
              <li className={isActive('/cursos') ? 'active' : ''}>
                <Link to="/cursos" onClick={toggleSidebar}>
                  <i className="fas fa-book"></i> Cursos
                </Link>
              </li>

              <li className={isActive('/forum') ? 'active' : ''}>
                <Link to="/forum" onClick={toggleSidebar}>
                  <i className="fas fa-comments"></i> Fórum de Partilha
                </Link>
              </li>
              <li className={isActive('/perfil') ? 'active' : ''}>
                <Link to="/perfil" onClick={toggleSidebar}>
                  <i className="fas fa-user"></i> Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Links para formandos */}
          {userRole === 3 && (
            <div className="sidebar-section">
              <h3>Formando</h3>
              <ul>
                <li className={isActive('/percurso-formativo') ? 'active' : ''}>
                  <Link to="/percurso-formativo" onClick={toggleSidebar}>
                    <i className="fas fa-road"></i> Meu Percurso
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Links para formadores */}
          {userRole === 2 && (
            <div className="sidebar-section">
              <h3>Formador</h3>
              <ul>
                
              <li className={isActive('/criarCurso') ? 'active' : ''}>
                <Link to="/criarCurso" onClick={toggleSidebar}>
                  <i className="fas fa-book"></i> Criar Cursos
                </Link>
              </li>

                <li className={isActive('/area-professor') ? 'active' : ''}>
                  <Link to="/area-professor" onClick={toggleSidebar}>
                    <i className="fas fa-chalkboard-teacher"></i> Meus Cursos
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Links para gestores/administradores */}
          {userRole === 1 && (
            <div className="sidebar-section">
              <h3>Administração</h3>
              <ul>
                <li className={isActive('/admin/dashboard') ? 'active' : ''}>
                  <Link to="/admin/dashboard" onClick={toggleSidebar}>
                    <i className="fas fa-tachometer-alt"></i> Dashboard
                  </Link>
                </li>
                <li className={isActive('/admin/cursos') ? 'active' : ''}>
                  <Link to="/admin/cursos" onClick={toggleSidebar}>
                    <i className="fas fa-book-open"></i> Gerenciar Cursos
                  </Link>
                </li>
                <li className={isActive('/admin/usuarios') ? 'active' : ''}>
                  <Link to="/admin/usuarios" onClick={toggleSidebar}>
                    <i className="fas fa-users"></i> Gerenciar Utilizadores
                  </Link>
                </li>
                <li className={isActive('/admin/criar-curso') ? 'active' : ''}>
                  <Link to="/admin/criar-curso" onClick={toggleSidebar}>
                    <i className="fas fa-plus-circle"></i> Criar Curso
                  </Link>
                </li>
                <li className={isActive('/admin/criar-usuario') ? 'active' : ''}>
                  <Link to="/admin/criar-usuario" onClick={toggleSidebar}>
                    <i className="fas fa-user-plus"></i> Criar Utilizador
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Configurações e ajuda */}
          <div className="sidebar-section">
            <h3>Configurações</h3>
            <ul>
              <li className={isActive('/definicoes') ? 'active' : ''}>
                <Link to="/definicoes" onClick={toggleSidebar}>
                  <i className="fas fa-cog"></i> Definições
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  // Lógica para abrir modal de ajuda ou redirecionar para página de ajuda
                  toggleSidebar();
                }}>
                  <i className="fas fa-question-circle"></i> Ajuda
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}