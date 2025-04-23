import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  console.log('ProtectedRoute: Inicializando', { roles });
  
  const { currentUser, loading } = useAuth();
  console.log('ProtectedRoute: Auth obtido', { currentUser, loading });
  
  useEffect(() => {
    console.log('ProtectedRoute: useEffect executado', { currentUser, loading });
  }, [currentUser, loading]);

  if (loading) {
    console.log('ProtectedRoute: Loading, mostrando tela de carregamento');
    return <div>Carregando...</div>;
  }

  if (!currentUser) {
    console.log('ProtectedRoute: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(currentUser.id_cargo)) {
    console.log('ProtectedRoute: Usuário sem permissão, redirecionando para home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Acesso permitido, renderizando children');
  return children;
};

export default ProtectedRoute;