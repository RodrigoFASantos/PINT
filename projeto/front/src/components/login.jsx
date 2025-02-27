import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Para redirecionamento
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Hook para redirecionar

  const handleLogin = async (e) => {
    e.preventDefault(); // Evita recarregar a página

    try {
      const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
     });
     

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro desconhecido");
      }

      setMessage(`Login bem-sucedido! Bem-vindo, ${data.nome}`);
      localStorage.setItem("user", JSON.stringify(data)); // Guarda sessão

      // Redirecionar para outra página após login bem-sucedido
      setTimeout(() => navigate("/dashboard"), 2000);
      
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  };

  return (
    <div class="body">
      <div className="container">
        <h2>Login</h2>
        {message && <p className="message">{message}</p>} {/* Mensagem de erro/sucesso */}

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

          <button type="submit" className="btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
