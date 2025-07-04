import React, { useState } from 'react';
import axios from 'axios';
import API_BASE from '../api';
import './css/Trocar_Senha_Modal.css';

const PasswordChangeModal = ({ isOpen, onClose, userId }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar senhas
    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Obter o token de autenticação do localStorage
      const token = localStorage.getItem('token');
      
      // Configurar cabeçalhos com token de autenticação
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log('Enviando requisição para alteração de senha');
      
      // Usar a rota correta para alteração de senha
      const response = await axios.put(`${API_BASE}/users/change-password`, {
        id_utilizador: userId,
        password: password // Parâmetro correto conforme backend
      }, config);
      
      console.log('Resposta do servidor:', response.data);
      
      // Se a requisição for bem-sucedida, atualizar o estado do primeiro login
      if (response.data) {
        localStorage.setItem('primeiroLogin', '0');
        setSuccess(true);
        
        // Após 2 segundos, fechar o modal
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Erro ao alterar a senha. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-backdrop">
      <div className="password-modal">
        <h2>Alterar Senha</h2>
        <p className="modal-info">
          Por medidas de segurança, precisa alterar sua senha no primeiro acesso.
        </p>
        
        {success ? (
          <div className="success-message">
            <p>Senha alterada com sucesso!</p>
            <div className="loader"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="password">Nova Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirme a Nova Senha</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeModal;