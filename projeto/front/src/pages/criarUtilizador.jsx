import React, { useState } from "react";

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
      const response = await fetch("http://localhost:4000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Utilizador criado com sucesso!");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error("Erro ao registar:", error);
      setMessage("Erro no servidor. Tenta novamente.");
    }
  };

  return (
    <div>
      <h2>Registar Utilizador</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Criar Conta</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default CriarUser;
