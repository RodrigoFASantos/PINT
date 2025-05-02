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
    console.log('[DEBUG] AuthContext: Iniciando verificação de autenticação...');
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const primeiroLoginStorage = localStorage.getItem('primeiroLogin');
    
    console.log('[DEBUG] AuthContext: Dados no localStorage:', { 
      token: token ? token.substring(0, 50) + '...' : 'null', 
      userName, 
      primeiroLogin: primeiroLoginStorage 
    });

    if (token) {
      console.log('[DEBUG] AuthContext: Token encontrado, buscando dados do usuário...');
      fetchUserData(token);
    } else {
      console.log('[DEBUG] AuthContext: Nenhum token encontrado');
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      console.log('[DEBUG] AuthContext: Fazendo requisição para /users/perfil...');
      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] AuthContext: Dados do usuário obtidos:', response.data);
      console.log('[DEBUG] AuthContext: Estrutura do usuário:', {
        id_utilizador: response.data.id_utilizador,
        nome: response.data.nome,
        id_cargo: response.data.id_cargo,
        cargoTipo: typeof response.data.id_cargo,
        email: response.data.email,
        primeiro_login: response.data.primeiro_login
      });
      
      setCurrentUser(response.data);
      
      // Verificar e definir o status de primeiro login
      if (response.data.primeiro_login === 1) {
        console.log('[DEBUG] AuthContext: Usuário está no primeiro login');
        localStorage.setItem('primeiroLogin', '1');
        setPrimeiroLogin(true);
      } else {
        console.log('[DEBUG] AuthContext: Usuário não está no primeiro login');
        localStorage.setItem('primeiroLogin', '0');
        setPrimeiroLogin(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] AuthContext: Erro ao buscar dados do usuário:', error);
      console.error('[DEBUG] AuthContext: Status do erro:', error.response?.status);
      console.error('[DEBUG] AuthContext: Dados do erro:', error.response?.data);
      
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
    console.log('[DEBUG] AuthContext: Iniciando login para:', email);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/users/login`, { email, password });
      
      console.log('[DEBUG] AuthContext: Resposta do login:', response.data);
      
      const { token, nome, cargo, id_utilizador, primeiro_login, foto_perfil, foto_capa, email: userEmail } = response.data;
      
      console.log('[DEBUG] AuthContext: Salvando dados do usuário:', {
        id_utilizador,
        nome,
        cargo,
        cargoTipo: typeof cargo,
        email: userEmail,
        primeiro_login
      });
      
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
      console.error('[DEBUG] AuthContext: Erro no login:', error);
      console.error('[DEBUG] AuthContext: Status do erro:', error.response?.status);
      console.error('[DEBUG] AuthContext: Dados do erro:', error.response?.data);
      
      setError(
        error.response?.data?.message || 
        'Erro ao fazer login. Verifique suas credenciais.'
      );
      return false;
    }
  };

  const logout = () => {
    console.log('[DEBUG] AuthContext: Efetuando logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('primeiroLogin');
    setCurrentUser(null);
    setPrimeiroLogin(false);
  };
  
  // Função para atualizar o status de primeiro login
  const updatePrimeiroLogin = (status) => {
    console.log('[DEBUG] AuthContext: Atualizando primeiro login:', status);
    localStorage.setItem('primeiroLogin', status ? '1' : '0');
    setPrimeiroLogin(status);
  };
  
  // Função para alterar senha
  const changePassword = async (data) => {
    try {
      console.log('[DEBUG] AuthContext: Alterando senha...');
      setError('');
      
      const response = await axios.put(`${API_BASE}/users/change-password`, data);
      
      console.log('[DEBUG] AuthContext: Resposta da alteração de senha:', response.data);
      
      // Atualizar o estado de primeiro login se a senha foi alterada com sucesso
      if (response.data.message === "Senha alterada com sucesso") {
        updatePrimeiroLogin(false);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('[DEBUG] AuthContext: Erro ao alterar senha:', error);
      console.error('[DEBUG] AuthContext: Status do erro:', error.response?.status);
      console.error('[DEBUG] AuthContext: Dados do erro:', error.response?.data);
      
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