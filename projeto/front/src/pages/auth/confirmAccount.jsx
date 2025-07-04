import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import API_BASE from "../../api";
import logo from "../../images/Logo_Login.png";
import "./css/login.css";

function ConfirmAccount() {
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Obter o token da URL
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Link inválido. Nenhum token de confirmação encontrado.");
      return;
    }

    // Confirmar a conta
    confirmAccount(token);
  }, [location]);

  const confirmAccount = async (token) => {
    try {
      setStatus("loading");
      const response = await axios.post(`${API_BASE}/users/confirm-account`, { token });
      console.log("Confirmação bem-sucedida:", response.data);
      
      // Extrair o email do token para permitir reenvio
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.email) {
          setEmail(tokenData.email);
        }
      } catch (e) {
        console.error("Erro ao decodificar token para obter email:", e);
      }
      
      setStatus("success");
      setMessage(response.data.message || "Conta confirmada com sucesso!");
      
      // Armazenar o token de autenticação gerado
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        
        // Redirecionar para a página inicial após 3 segundos
        setTimeout(() => {
          // Limpar qualquer flag de visita anterior para garantir que o home.jsx fará refresh
          sessionStorage.removeItem('homeVisited');
          // Definir flag de login
          sessionStorage.setItem('needsRefresh', 'true');
          // Redirecionar usando window.location para garantir refresh completo
          window.location.href = "/home";
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao confirmar conta:", error);
      
      // Extrair o email do token mesmo em caso de erro, para permitir reenvio
      if (error.response?.data?.token) {
        try {
          const tokenData = JSON.parse(atob(error.response.data.token.split('.')[1]));
          if (tokenData.email) {
            setEmail(tokenData.email);
          }
        } catch (e) {
          console.error("Erro ao decodificar token para obter email:", e);
        }
      }
      
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
        "Erro ao confirmar sua conta. O link pode ter expirado ou ser inválido."
      );
    }
  };

  const handleResendConfirmation = async () => {
    if (!email || isResending) return;
    
    try {
      setIsResending(true);
      const response = await axios.post(`${API_BASE}/users/resend-confirmation`, { email });
      alert(response.data.message || "Email de confirmação reenviado com sucesso!");
    } catch (error) {
      console.error("Erro ao reenviar confirmação:", error);
      alert(
        error.response?.data?.message ||
        "Erro ao reenviar o email de confirmação. Por favor, tente novamente."
      );
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="loading-container">
            <h3>Confirmando sua conta...</h3>
            <div className="loader"></div>
          </div>
        );
      
      case "success":
        return (
          <div className="success-container">
            <h3>Conta confirmada com sucesso!</h3>
            <p>{message}</p>
            <p> será redirecionado para a página inicial em alguns segundos...</p>
            <div className="loader"></div>
          </div>
        );
      
      case "error":
        return (
          <div className="error-container">
            <h3>Erro na confirmação</h3>
            <p>{message}</p>
            {email && (
              <button 
                className="button" 
                onClick={handleResendConfirmation}
                disabled={isResending}
              >
                {isResending ? "Rea enviar..." : "Reenviar email de confirmação"}
              </button>
            )}
            <button className="a" onClick={() => navigate("/login")}>
              Voltar para Login
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="body123">
      <div className="login-container">
        <div className="card">
          <div className="front">
            <div className="container">
              <div className="logo">
                <img src={logo} alt="Logo" />
              </div>
              
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAccount;