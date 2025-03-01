import React, { useState } from "react";
import "../styles/criarUtilizador.css";

function CriarUser() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!nome || !email || !password) {
      setMessage("Todos os campos são obrigatórios!");
      return;
    }

    if (password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    const userData = { nome, email, password };

    try {
      const response = await fetch("http://localhost:4000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      // Verifica se a resposta do servidor é um JSON válido
      const text = await response.text();
      console.log("Resposta do servidor:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error("A resposta do servidor não é um JSON válido.");
      }

      if (response.ok) {
        setMessage("Utilizador criado com sucesso!");
      } else {
        setMessage(data.message || "Erro desconhecido.");
      }
    } catch (error) {
      console.error("Erro ao registar:", error);
      setMessage("Erro no servidor. Tenta novamente.");
    }
  };

  return (
    <div className="body">
      <div className="container">
        <h2>Registar Utilizador</h2>
        <form onSubmit={handleRegister}>
          <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Criar Conta</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default CriarUser;
