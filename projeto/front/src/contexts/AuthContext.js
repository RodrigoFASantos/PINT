/**
 * Contexto de Autenticação
 * 
 * Gere o estado de autenticação da aplicação, incluindo:
 * - Login e logout de utilizadores
 * - Validação de tokens
 * - Gestão de dados do utilizador atual
 * - Controlo de primeiro login
 * - Alteração de palavras-passe
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../api';

// Criar o contexto de autenticação
const AuthContext = createContext();

/**
 * Hook personalizado para aceder ao contexto de autenticação
 * 
 * @returns {Object} Objeto com funções e estado de autenticação
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Provider do contexto de autenticação
 * 
 * Envolve a aplicação e fornece funcionalidades de autenticação
 * a todos os componentes filhos
 */
export const AuthProvider = ({ children }) => {
  // Estados do contexto
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [primeiroLogin, setPrimeiroLogin] = useState(false);

  /**
   * Efeito para verificar autenticação ao carregar a aplicação
   * 
   * Verifica se existe um token válido e carrega os dados do utilizador
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const primeiroLoginStorage = localStorage.getItem('primeiroLogin');
    
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar dados do utilizador autenticado
   * 
   * @param {string} token - Token de autenticação
   */
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
      console.error('Erro ao validar token:', error);
      
      // Usar a mensagem de erro se disponível
      const errorMessage = error.response?.data?.message || 'Erro ao validar token';
      setError(errorMessage);
      
      // Limpar dados de autenticação inválidos
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('primeiroLogin');
      setCurrentUser(null);
      setLoading(false);
    }
  };

  /**
   * Função de login
   * 
   * @param {string} email - Email do utilizador
   * @param {string} password - Palavra-passe do utilizador
   * @returns {boolean} true se login bem-sucedido, false caso contrário
   */
  const login = async (email, password) => {
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      
      const { 
        token, 
        nome, 
        cargo, 
        id_utilizador, 
        primeiro_login, 
        foto_perfil, 
        foto_capa, 
        email: userEmail 
      } = response.data;
      
      // Guardar dados de autenticação no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userName', nome);
      localStorage.setItem('primeiroLogin', primeiro_login.toString());
      
      // Definir estado de primeiro login
      setPrimeiroLogin(primeiro_login === 1);
      
      // Definir dados do utilizador atual
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
      
      // Definir mensagem de erro apropriada
      setError(
        error.response?.data?.message || 
        error.message ||
        'Erro ao fazer login. Verifica as tuas credenciais.'
      );
      
      return false;
    }
  };

  /**
   * Função de logout
   * 
   * Limpa todos os dados de autenticação e redireciona para login
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('primeiroLogin');
    setCurrentUser(null);
    setPrimeiroLogin(false);
  };
  
  /**
   * Atualizar o status de primeiro login
   * 
   * @param {boolean} status - Novo status de primeiro login
   */
  const updatePrimeiroLogin = (status) => {
    localStorage.setItem('primeiroLogin', status ? '1' : '0');
    setPrimeiroLogin(status);
  };
  
  /**
   * Alterar palavra-passe do utilizador
   * 
   * @param {Object} data - Dados para alteração de palavra-passe
   * @returns {Object} Resultado da operação (success, message)
   */
  const changePassword = async (data) => {
    try {
      setError('');
      
      const response = await axios.put(`${API_BASE}/users/change-password`, data);
      
      // Atualizar o estado de primeiro login se a palavra-passe foi alterada com sucesso
      if (response.data.message === "Senha alterada com sucesso") {
        updatePrimeiroLogin(false);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Erro ao alterar palavra-passe:', error);
      
      setError(
        error.response?.data?.message || 
        'Erro ao alterar palavra-passe. Tenta novamente.'
      );
      
      return { success: false, message: error.response?.data?.message };
    }
  };

  // Valor do contexto disponibilizado para componentes filhos
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