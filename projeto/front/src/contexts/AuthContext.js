import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

console.log('AuthContext.js: Arquivo carregado');

const AuthContext = createContext();
console.log('AuthContext.js: Contexto criado');

export const useAuth = () => {
  console.log('AuthContext.js: useAuth chamado');
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  console.log('AuthContext.js: AuthProvider inicializando');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  console.log('AuthContext.js: Estado inicializado', { loading });

  useEffect(() => {
    console.log('AuthContext.js: useEffect executando');
    // Verificar se já existe um token no localStorage
    const token = localStorage.getItem('token');
    console.log('AuthContext.js: Token encontrado?', !!token);
    
    if (token) {
      console.log('AuthContext.js: Tentando validar token');
      // Validar o token e carregar dados do usuário
      fetchUserData(token);
    } else {
      console.log('AuthContext.js: Sem token, definindo loading=false');
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    console.log('AuthContext.js: fetchUserData iniciado');
    try {
      console.log('AuthContext.js: Fazendo requisição ao servidor');
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('AuthContext.js: Dados do usuário obtidos', response.data);
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('AuthContext.js: Erro ao carregar dados do usuário:', error);
      // Token inválido ou expirado
      localStorage.removeItem('token');
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('AuthContext.js: Tentativa de login', { email });
    setError('');
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      const { token, user } = response.data;
      console.log('AuthContext.js: Login bem-sucedido', { user });
      
      // Guardar o token no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('nomeUsuario', user.nome);
      
      // Definir o usuário atual
      setCurrentUser(user);
      
      return true;
    } catch (error) {
      console.error('AuthContext.js: Erro no login:', error);
      setError(
        error.response?.data?.message || 
        'Erro ao fazer login. Verifique suas credenciais.'
      );
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext.js: Logout iniciado');
    // Remover token do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('nomeUsuario');
    
    // Limpar o usuário atual
    setCurrentUser(null);
    console.log('AuthContext.js: Logout concluído');
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout
  };
  
  console.log('AuthContext.js: Renderizando Provider', { currentUser, loading });

  return (
    <AuthContext.Provider value={value}>
      {console.log('AuthContext.js: Renderizando children')}
      {children}
    </AuthContext.Provider>
  );
};