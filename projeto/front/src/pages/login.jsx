import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../api";
import "./css/login.css";
import logo from "../images/Logo_Login.png";

function Login() {
  console.log('Login: Componente inicializado');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Login: useEffect executado');
    const token = localStorage.getItem("token");
    console.log('Login: Token existente?', !!token);
    
    if (token) {
      console.log('Login: Token encontrado, redirecionando para home');
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    console.log('Login: handleLogin chamado');
    e.preventDefault();

    try {
      console.log('Login: Tentando fazer login na API', { email });
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login: Resposta da API recebida', { ok: response.ok });

      if (!response.ok) {
        throw new Error(data.message || "Erro desconhecido");
      }

      console.log('Login: Login bem-sucedido, salvando token');
      // Guardar o token no localStorage
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data));

      console.log('Login: Redirecionando para home');
      navigate("/home");
    } catch (error) {
      console.error(`Login: Erro: ${error.message}`);
    }
  };

  console.log('Login: Renderizando componente');
  return (
    <div className="body123">
      {console.log('Login: Renderizando DOM')}
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