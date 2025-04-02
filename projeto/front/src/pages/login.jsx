import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../api";
import "../styles/login.css";
import logo from "../images/Logo_Login.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro desconhecido");
      }

      // Guardar o token no localStorage
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data));

      navigate("/home");
    } catch (error) {
      console.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="body123">
      <div className="container">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

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