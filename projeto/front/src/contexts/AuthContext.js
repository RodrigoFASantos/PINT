import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:4000';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    console.log('Verificando token no refresh:', { token, userName });

    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Dados do usuário obtidos:', response.data);
      
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      
      // Use a mensagem de erro se disponível
      const errorMessage = error.response?.data?.message || 'Erro ao validar token';
      setError(errorMessage);
      
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/users/login`, { email, password });
      
      const { token, nome, cargo, id_utilizador } = response.data;
      
      // Salvar token e nome de usuário
      localStorage.setItem('token', token);
      localStorage.setItem('userName', nome);
      
      setCurrentUser({
        id: id_utilizador,
        nome,
        cargo
      });
      
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      setError(
        error.response?.data?.message || 
        'Erro ao fazer login. Verifique suas credenciais.'
      );
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};