import React from 'react';
import '../components/css/Sidebar.css';
import '../pages/cursos';

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
            <li><i className="fas fa-home"></i> Home</li>
            <li><i className="fas fa-book"></i> Cursos</li>
            <li><i className="fas fa-user"></i> Perfil</li>
            <li><i className="fas fa-cog"></i> Definições</li>
          </ul>
        </div>
      </div>
    </>
  );
}