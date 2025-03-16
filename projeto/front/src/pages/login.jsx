import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../styles/login.css";
import logo from "../images/Logo_Login.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro desconhecido");
      }

      if (lembrar) {
        Cookies.set("token", data.token, { expires: 7, secure: true });
      } else {
        Cookies.set("token", data.token, { secure: true });
      }

      sessionStorage.setItem("user", JSON.stringify(data));
      navigate("/home");
    } catch (error) {
      console.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="body">
      <div className="container">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="checkbox-container">
            <input
              type="checkbox"
              id="lembrar"
              checked={lembrar}
              onChange={() => setLembrar(!lembrar)}
            />
            <label htmlFor="lembrar">Lembrar</label>
          </div>

          <button type="submit">Entrar</button>
        </form>

        <a href="/register">Criar conta</a>
        <a href="/recover">Esqueci a senha!</a>
      </div>
    </div>
  );
}

export default Login;
