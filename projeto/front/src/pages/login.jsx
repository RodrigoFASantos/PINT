import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/login.css";
import logo from "../images/Logo_Login.png";
import { useAuth } from '../contexts/AuthContext';
import axios from "axios";
import API_BASE from "../api";

function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();
  
  // Estados para o formulário de registro
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerAge, setRegisterAge] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para reenvio de confirmação
  const [resendEmail, setResendEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

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
  
  // Função para lidar com o registro
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRegisterError("");
    
    // Validações básicas
    if (registerPassword.length < 6) {
      setRegisterError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }
    
    if (!/^\d+$/.test(registerAge)) {
      setRegisterError("A idade deve ser um número");
      setLoading(false);
      return;
    }
    
    if (!/^\d{9}$/.test(registerPhone)) {
      setRegisterError("O telefone deve ter 9 dígitos");
      setLoading(false);
      return;
    }
    
    try {
      // Assumindo que o cargo padrão para novos registros é 3 (formando)
      const response = await axios.post(`${API_BASE}/users/register`, {
        id_cargo: 3, // Cargo de formando
        nome: registerName,
        idade: parseInt(registerAge),
        email: registerEmail,
        telefone: registerPhone,
        password: registerPassword
      });
      
      console.log("Registro bem-sucedido:", response.data);
      setRegisterSuccess(true);
      
      // Resetar o formulário
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterAge("");
      setRegisterPhone("");
      
      // Após 3 segundos, voltar para o login
      setTimeout(() => {
        setIsFlipped(false);
        setRegisterSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setRegisterError(
        err.response?.data?.message || 
        "Erro ao criar conta. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
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
      const response = await axios.post(`${API_BASE}/users/resend-confirmation`, {
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

  const toggleForm = () => {
    setIsFlipped(!isFlipped);
    // Resetar o formulário de reenvio quando alternar
    setShowResendForm(false);
    setResendEmail("");
    setResendMessage("");
    setResendError("");
  };

  const toggleResendForm = () => {
    setShowResendForm(!showResendForm);
  };

  return (
    <div className="body123">
      <div className={`login-container ${isFlipped ? 'flipped' : ''}`}>
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

              {!showResendForm ? (
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

                  <button onClick={toggleForm} className="a">Criar conta</button>
                  <a className="a" href="/recover">Esqueci a senha!</a>
                  <button onClick={toggleResendForm} className="a">Não recebeu o email de confirmação?</button>
                </>
              ) : (
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
                      {resendLoading ? "Enviando..." : "Enviar"}
                    </button>
                  </form>
                  <button onClick={toggleResendForm} className="a">Voltar para Login</button>
                </>
              )}
            </div>
          </div>
          
          {/* Face traseira - Registro */}
          <div className="back">
            <div className="container">
              <div className="logo">
                <img src={logo} alt="Logo" />
              </div>
              
              {registerSuccess ? (
                <div className="success-message">
                  <h3>Pré-registro realizado com sucesso!</h3>
                  <p>Um email de confirmação foi enviado para o seu endereço.</p>
                  <p>Por favor, verifique sua caixa de entrada para ativar sua conta.</p>
                  <div className="loader"></div>
                </div>
              ) : (
                <>
                  {registerError && (
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
                      {registerError}
                    </div>
                  )}

                  <form onSubmit={handleRegister}>
                    <input
                      className="input"
                      type="text"
                      placeholder="Nome Completo"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                    
                    <input
                      className="input"
                      type="email"
                      placeholder="Email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                    
                    <input
                      className="input"
                      type="password"
                      placeholder="Senha"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                    
                    <input
                      className="input"
                      type="text"
                      placeholder="Idade"
                      value={registerAge}
                      onChange={(e) => setRegisterAge(e.target.value)}
                      required
                    />
                    
                    <input
                      className="input"
                      type="text"
                      placeholder="Telefone (9 dígitos)"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      required
                    />

                    <button 
                      className="button" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Registrando..." : "Registrar"}
                    </button>
                  </form>
                </>
              )}
              
              <button onClick={toggleForm} className="a">Voltar para Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;