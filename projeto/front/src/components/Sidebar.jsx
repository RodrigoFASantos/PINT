import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import './css/Sidebar.css';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState('');
  const [overlayActive, setOverlayActive] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUserRole(currentUser.id_cargo);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setOverlayActive(true);
      }, 10);
    } else {
      setOverlayActive(false);
    }
  }, [isOpen]);

  const isActive = (path) => {
    return location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Navbar integrada */}
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isOpen} />

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <button onClick={toggleSidebar} className="close-btn">&times;</button>

          {/* Links comuns para todos */}
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
              <li className={isActive('/formadores') ? 'active' : ''}>
                <Link to="/formadores" onClick={toggleSidebar}>
                  <i className="fas fa-user"></i> Formadores
                </Link>
              </li>
              <li className={isActive('/forum') ? 'active' : ''}>
                <Link to="/forum" onClick={toggleSidebar}>
                  <i className="fas fa-comments"></i> Chats
                </Link>
              </li>

            </ul>
          </div>

          {/* Links para Formandos */}
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

          {/* Links para Formadores */}
          {userRole === 2 && (
            <div className="sidebar-section">
              <h3>Formador</h3>
              <ul>
                <li className={isActive('/area-formador') ? 'active' : ''}>
                  <Link to="/area-formador" onClick={toggleSidebar}>
                    <i className="fas fa-chalkboard-teacher"></i> Cursos Lecionados
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Links para Administração */}
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
                    <i className="fas fa-book-open"></i> Gerir Cursos
                  </Link>
                </li>
                <li className={isActive('/admin/usuarios') ? 'active' : ''}>
                  <Link to="/admin/usuarios" onClick={toggleSidebar}>
                    <i className="fas fa-users"></i> Gerir Utilizadores
                  </Link>
                </li>

                <li className={isActive('/admin/denuncias') ? 'active' : ''}>
                  <Link to="/admin/denuncias" onClick={toggleSidebar}>
                    <i className="fas fa-flag"></i> Gerenciar Denúncias
                  </Link>
                </li>

                <li className={isActive('/admin/percurso-formandos') ? 'active' : ''}>
                  <Link to="/admin/percurso-formandos" onClick={toggleSidebar}>
                    <i className="fas fa-chart-line"></i> Percurso Formandos
                  </Link>
                </li>

                <li className={isActive('/admin/categorias') ? 'active' : ''}>
                  <Link to="/admin/categorias" onClick={toggleSidebar}>
                    <i className="fas fa-pencil-ruler"></i> Gerir Categorias
                  </Link>
                </li>

                <li className={isActive('/admin/areas') ? 'active' : ''}>
                  <Link to="/admin/areas" onClick={toggleSidebar}>
                    <i className="fas fa-pencil-ruler"></i> Gerir Áreas
                  </Link>
                </li>

                <li className={isActive('/admin/topicos') ? 'active' : ''}>
                  <Link to="/admin/topicos" onClick={toggleSidebar}>
                    <i className="fas fa-pencil-ruler"></i> Gerir Topicos
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

          {/* Configurações */}

          <div className="sidebar-section">
            <h3>Configurações</h3>
            <ul>
              <li className={isActive('/perfil') ? 'active' : ''}>
                <Link to="/perfil" onClick={toggleSidebar}>
                  <i className="fas fa-user"></i> Perfil
                </Link>
              </li>
              <li className={isActive('/definicoes') ? 'active' : ''}>
                <Link to="/definicoes" onClick={toggleSidebar}>
                  <i className="fas fa-cog"></i> Definições
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  toggleSidebar();
                }}>
                  <i className="fas fa-question-circle"></i> Ajuda
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Overlay */}
      <div className={`overlay ${overlayActive ? 'active' : ''}`} onClick={toggleSidebar}></div>
    </>
  );
}