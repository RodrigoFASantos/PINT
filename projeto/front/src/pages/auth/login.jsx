import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/login.css";
import logo from "../../images/Logo_Login.png";
import { useAuth } from '../../contexts/AuthContext';
import axios from "axios";
import API_BASE from "../../api";

function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const navigate = useNavigate();
  
  // Estado para reenvio de confirmação
  const [resendEmail, setResendEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Estado para recuperação de senha
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

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

  // Função para lidar com o reenvio de confirmação
  const handleResendConfirmation = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    setResendError("");
    setResendMessage("");
    
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      setResendError("Por favor, forneça um email válido");
      setResendLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE}/auth/resend-confirmation`, {
        email: resendEmail
      });
      
      setResendMessage("Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.");
      
      // Limpar o formulário após 5 segundos e voltar para login
      setTimeout(() => {
        setShowResendForm(false);
        setResendEmail("");
        setResendMessage("");
      }, 5000);
      
    } catch (err) {
      console.error("Erro ao reenviar confirmação:", err);
      setResendError(
        err.response?.data?.message || 
        "Erro ao reenviar confirmação. Este email pode não estar registrado ou já foi confirmado."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Função para lidar com a recuperação de senha
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");
    
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Por favor, forneça um email válido");
      setForgotLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, {
        email: forgotEmail
      });
      
      setForgotMessage("Email de recuperação enviado com sucesso! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.");
      
      // Limpar o formulário após 5 segundos e voltar para login
      setTimeout(() => {
        setShowForgotForm(false);
        setForgotEmail("");
        setForgotMessage("");
      }, 5000);
      
    } catch (err) {
      console.error("Erro ao enviar recuperação de senha:", err);
      setForgotError(
        err.response?.data?.message || 
        "Erro ao enviar email de recuperação. Verifique se o email está correto e tente novamente."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const toggleResendForm = () => {
    setShowResendForm(!showResendForm);
    setShowForgotForm(false); // Fechar formulário de recuperação se estiver aberto
    setResendEmail("");
    setResendMessage("");
    setResendError("");
  };

  const toggleForgotForm = () => {
    setShowForgotForm(!showForgotForm);
    setShowResendForm(false); // Fechar formulário de reenvio se estiver aberto
    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");
  };

  const backToLogin = () => {
    setShowResendForm(false);
    setShowForgotForm(false);
    setResendEmail("");
    setResendMessage("");
    setResendError("");
    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");
  };

  return (
    <div className="body123">
      <div className="login-container">
        <div className="card">
          {/* Face frontal - Login */}
          <div className="front">
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

              {!showResendForm && !showForgotForm ? (
                <>
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

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                    <button onClick={toggleForgotForm} className="a">Esqueci a senha!</button>
                    <button onClick={toggleResendForm} className="a">Não recebeu o email de confirmação?</button>
                  </div>
                </>
              ) : showResendForm ? (
                <>
                  {resendMessage && (
                    <div 
                      style={{
                        color: 'green', 
                        marginBottom: '10px', 
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: '#eeffee',
                        borderRadius: '5px'
                      }}
                    >
                      {resendMessage}
                    </div>
                  )}
                  
                  {resendError && (
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
                      {resendError}
                    </div>
                  )}
                  
                  <form onSubmit={handleResendConfirmation}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Reenviar email de confirmação</h3>
                    <input
                      className="input"
                      type="email"
                      placeholder="Digite seu email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                    />
                    <button 
                      className="button" 
                      type="submit"
                      disabled={resendLoading}
                    >
                      {resendLoading ? "A enviar..." : "Enviar"}
                    </button>
                  </form>
                  <button onClick={backToLogin} className="a">Voltar para Login</button>
                </>
              ) : (
                <>
                  {forgotMessage && (
                    <div 
                      style={{
                        color: 'green', 
                        marginBottom: '10px', 
                        textAlign: 'center',
                        padding: '10px',
                        backgroundColor: '#eeffee',
                        borderRadius: '5px'
                      }}
                    >
                      {forgotMessage}
                    </div>
                  )}
                  
                  {forgotError && (
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
                      {forgotError}
                    </div>
                  )}
                  
                  <form onSubmit={handleForgotPassword}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Recuperar senha</h3>
                    <input
                      className="input"
                      type="email"
                      placeholder="Digite seu email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <button 
                      className="button" 
                      type="submit"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "A enviar..." : "Enviar"}
                    </button>
                  </form>
                  <button onClick={backToLogin} className="a">Voltar para Login</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;