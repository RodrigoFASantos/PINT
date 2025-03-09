import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Cookies from "js-cookie"; // Importar a biblioteca para manipular cookies
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [lembrar, setLembrar] = useState(false); // Checkbox para lembrar sessão
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault(); 

    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro desconhecido");
      }

      setMessage(`Login bem-sucedido! Bem-vindo, ${data.nome}`);

      // Guardar token nos cookies (se lembrar for ativado)
      if (lembrar) {
        Cookies.set("token", data.token, { expires: 7, secure: true }); // Expira em 7 dias
      } else {
        Cookies.set("token", data.token, { secure: true }); // Expira ao fechar o navegador
      }

      // Guardar outras informações no sessionStorage
      sessionStorage.setItem("user", JSON.stringify(data));

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="body">
      <div className="container">
        <h2>Login</h2>
        {message && <p className="message">{message}</p>}

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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Checkbox para "Lembrar sessão" */}
          <label>
            <input
              type="checkbox"
              checked={lembrar}
              onChange={() => setLembrar(!lembrar)}
            />
            Lembrar sessão
          </label>

          <button type="submit" className="btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
