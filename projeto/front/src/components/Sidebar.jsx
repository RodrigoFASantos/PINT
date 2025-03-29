import React from 'react';
import { Link } from 'react-router-dom';
import '../components/css/Sidebar.css';

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <>
      {/* Overlay com blur */}
      {isOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <button onClick={toggleSidebar} className="close-btn">
            &times;
          </button>
          <ul>
            <li>
              <Link to="/" onClick={toggleSidebar}>
                <i className="fas fa-home"></i> Home
              </Link>
            </li>
            <li>
              <Link to="/cursos" onClick={toggleSidebar}>
                <i className="fas fa-book"></i> Cursos
              </Link>
            </li>
            <li>
              <Link to="/perfilUser" onClick={toggleSidebar}>
                <i className="fas fa-user"></i> Perfil
              </Link>
            </li>
            <li>
              <Link to="/definicoes" onClick={toggleSidebar}>
                <i className="fas fa-cog"></i> Definições
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
