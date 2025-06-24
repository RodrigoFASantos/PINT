import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_BASE from "../../api";
import "./css/login.css"; // Usar o mesmo CSS do login
import logo from "../../images/Logo_Login.png";

function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Obter o token da URL
    const tokenFromUrl = searchParams.get('token');
    console.log('🔑 [RESET PAGE] Token da URL:', tokenFromUrl);
    
    if (!tokenFromUrl) {
      setError("Token de recuperação não encontrado. Por favor, solicite uma nova recuperação de senha.");
      return;
    }
    
    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validações
    if (!password || !confirmPassword) {
      setError("Por favor, preencha todos os campos");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Token de recuperação inválido");
      setLoading(false);
      return;
    }

    try {
      console.log('🔑 [RESET PAGE] A enviar pedido de redefinição...');
      
      const response = await axios.post(`${API_BASE}/auth/reset-password`, {
        token: token,
        password: password
      });

      console.log('✅ [RESET PAGE] Senha redefinida com sucesso:', response.data);
      
      setMessage("Senha redefinida com sucesso! Redirecionando para o login...");
      
      // Redirecionar para o login após 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      console.error('❌ [RESET PAGE] Erro ao redefinir senha:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const voltarLogin = () => {
    navigate("/login");
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

              <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#ef4444' }}>
                Redefinir Senha
              </h2>

              {message && (
                <div 
                  style={{
                    color: 'green', 
                    marginBottom: '15px', 
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#eeffee',
                    borderRadius: '5px',
                    border: '1px solid #4ade80'
                  }}
                >
                  {message}
                </div>
              )}

              {error && (
                <div 
                  style={{
                    color: 'red', 
                    marginBottom: '15px', 
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#ffeeee',
                    borderRadius: '5px',
                    border: '1px solid #ef4444'
                  }}
                >
                  {error}
                </div>
              )}

              {!message && (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                      Digite sua nova senha abaixo:
                    </p>
                  </div>

                  <input
                    className="input"
                    type="password"
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />

                  <input
                    className="input"
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />

                  <div style={{ marginBottom: '15px', fontSize: '0.9em', color: '#666' }}>
                    <p>• A senha deve ter pelo menos 6 caracteres</p>
                    <p>• Use uma combinação de letras, números e símbolos para maior segurança</p>
                  </div>

                  <button 
                    className="button" 
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#ccc' : '#ef4444',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? "A redefinir..." : "Redefinir Senha"}
                  </button>
                </form>
              )}

              <button 
                onClick={voltarLogin} 
                className="a"
                style={{ marginTop: '15px' }}
              >
                Voltar para Login
              </button>

              {!token && (
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#999', fontSize: '0.9em' }}>
                  <p>Link inválido ou expirado?</p>
                  <p>Solicite uma nova recuperação de senha na página de login.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RedefinirSenha;