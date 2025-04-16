import React from 'react';
import '../components/css/Navbar.css';
import { useAuth } from '../contexts/AuthContext';
import { IMAGES } from '../api';

export default function Navbar({ toggleSidebar }) {
  const { currentUser } = useAuth();

  return (
    <header className="navbar">
      <button onClick={toggleSidebar} className="icon-btn">
        <i className="fas fa-bars"></i>
      </button>

      {currentUser && (
        <div className="user-info">
          {currentUser.email && (
            <img
              src={
                currentUser.foto_perfil === 'AVATAR.png'
                  ? IMAGES.DEFAULT_AVATAR
                  : IMAGES.USER_AVATAR(currentUser.email)
              }
              alt="Avatar"
              className="user-avatar"
            />
          )}
        </div>
      )}

      <button className="icon-btn">
        <i className="fas fa-bell"></i>
      </button>
    </header>
  );
}