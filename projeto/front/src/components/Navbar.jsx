import React from 'react';
import '../components/css/Navbar.css';

export default function Navbar({ toggleSidebar }) {
  return (
    <header className="navbar">
      <button onClick={toggleSidebar} className="icon-btn">
        <i className="fas fa-bars"></i>
      </button>

      <button className="icon-btn">
        <i className="fas fa-bell"></i>
      </button>
    </header>
  );
}