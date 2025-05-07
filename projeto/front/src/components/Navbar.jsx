import React from 'react';
import '../components/css/Navbar.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import { IMAGES } from '../api';
import Badge from '@mui/material/Badge';

export default function Navbar({ toggleSidebar }) {
  const { currentUser } = useAuth();
  const { notificacoesNaoLidas } = useNotificacoes();

  return (
    <header className="navbar">
      <button onClick={toggleSidebar} className="icon-btn">
        <i className="fas fa-bars"></i>
      </button>

      {currentUser && (
        <div className="navbar-right">
          <Link to="/notificacoes" className="icon-btn notification-btn">
            <Badge badgeContent={notificacoesNaoLidas} color="error" overlap="circular">
              <i className="fas fa-bell"></i>
            </Badge>
          </Link>
          {currentUser.email && (
            <Link to="/perfil">
              <img
                src={currentUser.foto_perfil === 'AVATAR.png' ? IMAGES.DEFAULT_AVATAR : IMAGES.USER_AVATAR(currentUser.email)}
                alt="Avatar"
                className="user-avatar"
              />
            </Link>
          )}
        </div>
      )}
    </header>
  );
}