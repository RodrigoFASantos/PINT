import React, { useState } from 'react';
import axios from 'axios';
import API_BASE from '../api';
import './css/PasswordChangeModal.css';

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
      
      const response = await axios.put(`${API_BASE}/users/change-password`, {
        id_utilizador: userId,
        nova_password: password
      });
      
      setSuccess(true);
      
      // Após 2 segundos, fechar o modal
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      setError('Erro ao alterar a senha. Por favor, tente novamente.');
      console.error('Erro ao alterar senha:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-backdrop">
      <div className="password-modal">
        <h2>Alterar Senha</h2>
        <p className="modal-info">
          Por medidas de segurança, você precisa alterar sua senha no primeiro acesso.
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