import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/login.css";
import logo from "../images/Logo_Login.png";
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      // Redirecionar para home usando uma abordagem de refresh completo
      // Limpar qualquer flag de visita anterior para garantir que o home.jsx fará refresh
      sessionStorage.removeItem('homeVisited');
      window.location.href = "/home";
    }
  }, [navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();

    const success = await login(email, password);
    if (success) {
      // Definir flag de login bem-sucedido
      sessionStorage.setItem('needsRefresh', 'true');
      // Limpar qualquer flag de visita anterior para garantir que o home.jsx fará refresh
      sessionStorage.removeItem('homeVisited');
      // Usar window.location.href em vez de navigate para garantir um refresh completo
      window.location.href = "/home";
    }
  };

  return (
    <div className="body123">
      <div className="container">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        {error && (
          <div 
            style={{
              color: 'red', 
              marginBottom: '10px', 
              textAlign: 'center',
              padding: '10px',
              backgroundColor: '#ffeeee',
              borderRadius: '5px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="checkbox-container">
            <input
              className="input"
              type="checkbox"
              id="lembrar"
              checked={lembrar}
              onChange={() => setLembrar(!lembrar)}
            />
            <label htmlFor="lembrar">Lembrar</label>
          </div>

          <button className="button" type="submit">Entrar</button>
        </form>

        <a className="a" href="/register">Criar conta</a>
        <a className="a" href="/recover">Esqueci a senha!</a>
      </div>
    </div>
  );
}

export default Login;