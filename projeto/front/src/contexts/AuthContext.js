import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [primeiroLogin, setPrimeiroLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const primeiroLoginStorage = localStorage.getItem('primeiroLogin');
    
    console.log('Verificando token no refresh:', { token, userName, primeiroLogin: primeiroLoginStorage });

    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Dados do usuário obtidos:', response.data);
      
      setCurrentUser(response.data);
      
      // Verificar e definir o status de primeiro login
      if (response.data.primeiro_login === 1) {
        localStorage.setItem('primeiroLogin', '1');
        setPrimeiroLogin(true);
      } else {
        localStorage.setItem('primeiroLogin', '0');
        setPrimeiroLogin(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      
      // Use a mensagem de erro se disponível
      const errorMessage = error.response?.data?.message || 'Erro ao validar token';
      setError(errorMessage);
      
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('primeiroLogin');
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/users/login`, { email, password });
      
      const { token, nome, cargo, id_utilizador, primeiro_login, foto_perfil, foto_capa, email: userEmail } = response.data;
      
      // Salvar token e nome de usuário
      localStorage.setItem('token', token);
      localStorage.setItem('userName', nome);
      localStorage.setItem('primeiroLogin', primeiro_login.toString());
      
      // Definir estado de primeiro login
      setPrimeiroLogin(primeiro_login === 1);
      
      setCurrentUser({
        id_utilizador,
        nome,
        cargo,
        email: userEmail,
        foto_perfil,
        foto_capa,
        primeiro_login
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
    localStorage.removeItem('primeiroLogin');
    setCurrentUser(null);
    setPrimeiroLogin(false);
  };
  
  // Função para atualizar o status de primeiro login
  const updatePrimeiroLogin = (status) => {
    localStorage.setItem('primeiroLogin', status ? '1' : '0');
    setPrimeiroLogin(status);
  };
  
  // Função para alterar senha
  const changePassword = async (data) => {
    try {
      setError('');
      
      const response = await axios.put(`${API_BASE}/users/change-password`, data);
      
      // Atualizar o estado de primeiro login se a senha foi alterada com sucesso
      if (response.data.message === "Senha alterada com sucesso") {
        updatePrimeiroLogin(false);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setError(
        error.response?.data?.message || 
        'Erro ao alterar senha. Tente novamente.'
      );
      return { success: false, message: error.response?.data?.message };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    primeiroLogin,
    login,
    logout,
    updatePrimeiroLogin,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};