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
    console.log('🔒 [AUTH DEBUG] AuthContext: Iniciando verificação de autenticação...');
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const primeiroLoginStorage = localStorage.getItem('primeiroLogin');
    
    console.log('🔒 [AUTH DEBUG] AuthContext: Dados no localStorage:', { 
      token: token ? token.substring(0, 50) + '...' : 'null', 
      userName, 
      primeiroLogin: primeiroLoginStorage 
    });

    if (token) {
      console.log('🔒 [AUTH DEBUG] AuthContext: Token encontrado, buscando dados do usuário...');
      fetchUserData(token);
    } else {
      console.log('🔒 [AUTH DEBUG] AuthContext: Nenhum token encontrado');
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      console.log('🔒 [AUTH DEBUG] AuthContext: Fazendo requisição para /users/perfil...');
      console.log('🔒 [AUTH DEBUG] AuthContext: URL completa:', `${API_BASE}/users/perfil`);
      
      const response = await axios.get(`${API_BASE}/users/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('🔒 [AUTH DEBUG] AuthContext: Dados do usuário obtidos:', response.data);
      console.log('🔒 [AUTH DEBUG] AuthContext: Estrutura do usuário:', {
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
        console.log('🔒 [AUTH DEBUG] AuthContext: Usuário está no primeiro login');
        localStorage.setItem('primeiroLogin', '1');
        setPrimeiroLogin(true);
      } else {
        console.log('🔒 [AUTH DEBUG] AuthContext: Usuário não está no primeiro login');
        localStorage.setItem('primeiroLogin', '0');
        setPrimeiroLogin(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('🔒 [AUTH DEBUG] AuthContext: Erro ao buscar dados do usuário:', error);
      console.error('🔒 [AUTH DEBUG] AuthContext: Status do erro:', error.response?.status);
      console.error('🔒 [AUTH DEBUG] AuthContext: Dados do erro:', error.response?.data);
      
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
    console.log('🔒 [AUTH DEBUG] ===============================');
    console.log('🔒 [AUTH DEBUG] INICIANDO PROCESSO DE LOGIN');
    console.log('🔒 [AUTH DEBUG] ===============================');
    console.log('🔒 [AUTH DEBUG] Email:', email);
    console.log('🔒 [AUTH DEBUG] API_BASE atual:', API_BASE);
    console.log('🔒 [AUTH DEBUG] URL completa de login:', `${API_BASE}/users/login`);
    console.log('🔒 [AUTH DEBUG] window.location.href:', window.location.href);
    console.log('🔒 [AUTH DEBUG] window.location.hostname:', window.location.hostname);
    console.log('🔒 [AUTH DEBUG] window.location.protocol:', window.location.protocol);
    
    setError('');
    try {
      console.log('🔒 [AUTH DEBUG] Fazendo requisição POST para login...');
      console.log('🔒 [AUTH DEBUG] Dados enviados:', { email, password: '***' });
      
      const response = await axios.post(`${API_BASE}/users/login`, { email, password });
      
      console.log('🔒 [AUTH DEBUG] ✅ Resposta do login recebida:', response.data);
      console.log('🔒 [AUTH DEBUG] Status da resposta:', response.status);
      
      const { token, nome, cargo, id_utilizador, primeiro_login, foto_perfil, foto_capa, email: userEmail } = response.data;
      
      console.log('🔒 [AUTH DEBUG] Salvando dados do usuário:', {
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
      
      console.log('🔒 [AUTH DEBUG] ✅ LOGIN REALIZADO COM SUCESSO!');
      console.log('🔒 [AUTH DEBUG] ===============================');
      
      return true;
    } catch (error) {
      console.error('🔒 [AUTH DEBUG] ❌ ===============================');
      console.error('🔒 [AUTH DEBUG] ❌ ERRO NO LOGIN');
      console.error('🔒 [AUTH DEBUG] ❌ ===============================');
      console.error('🔒 [AUTH DEBUG] ❌ Erro completo:', error);
      console.error('🔒 [AUTH DEBUG] ❌ Tipo do erro:', error.name);
      console.error('🔒 [AUTH DEBUG] ❌ Mensagem do erro:', error.message);
      console.error('🔒 [AUTH DEBUG] ❌ Código do erro:', error.code);
      console.error('🔒 [AUTH DEBUG] ❌ Status da resposta:', error.response?.status);
      console.error('🔒 [AUTH DEBUG] ❌ Dados da resposta:', error.response?.data);
      console.error('🔒 [AUTH DEBUG] ❌ URL da requisição:', error.config?.url);
      console.error('🔒 [AUTH DEBUG] ❌ Método da requisição:', error.config?.method);
      console.error('🔒 [AUTH DEBUG] ❌ Headers da requisição:', error.config?.headers);
      
      if (error.code === 'ERR_NETWORK') {
        console.error('🔒 [AUTH DEBUG] ❌ ERRO DE REDE - Servidor pode estar inacessível');
        console.error('🔒 [AUTH DEBUG] ❌ Verificar se o servidor está rodando');
        console.error('🔒 [AUTH DEBUG] ❌ Verificar firewall/proxy');
      }
      
      if (error.code === 'ERR_CONNECTION_REFUSED') {
        console.error('🔒 [AUTH DEBUG] ❌ CONEXÃO RECUSADA - Porta pode estar fechada');
      }
      
      setError(
        error.response?.data?.message || 
        error.message ||
        'Erro ao fazer login. Verifique suas credenciais.'
      );
      console.error('🔒 [AUTH DEBUG] ❌ ===============================');
      return false;
    }
  };

  const logout = () => {
    console.log('🔒 [AUTH DEBUG] Efetuando logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('primeiroLogin');
    setCurrentUser(null);
    setPrimeiroLogin(false);
  };
  
  // Função para atualizar o status de primeiro login
  const updatePrimeiroLogin = (status) => {
    console.log('🔒 [AUTH DEBUG] Atualizando primeiro login:', status);
    localStorage.setItem('primeiroLogin', status ? '1' : '0');
    setPrimeiroLogin(status);
  };
  
  // Função para alterar senha
  const changePassword = async (data) => {
    try {
      console.log('🔒 [AUTH DEBUG] Alterando senha...');
      setError('');
      
      const response = await axios.put(`${API_BASE}/users/change-password`, data);
      
      console.log('🔒 [AUTH DEBUG] Resposta da alteração de senha:', response.data);
      
      // Atualizar o estado de primeiro login se a senha foi alterada com sucesso
      if (response.data.message === "Senha alterada com sucesso") {
        updatePrimeiroLogin(false);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('🔒 [AUTH DEBUG] Erro ao alterar senha:', error);
      console.error('🔒 [AUTH DEBUG] Status do erro:', error.response?.status);
      console.error('🔒 [AUTH DEBUG] Dados do erro:', error.response?.data);
      
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