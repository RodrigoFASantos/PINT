// ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../api';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      console.log('[DEBUG] ProtectedRoute: Verificando permissão...');
      const token = localStorage.getItem('token');
      console.log('[DEBUG] ProtectedRoute: Token encontrado:', token ? 'SIM' : 'NÃO');
      console.log('[DEBUG] ProtectedRoute: allowedRoles:', allowedRoles);
      
      if (!token) {
        console.log('[DEBUG] ProtectedRoute: Nenhum token, redirecionando para login...');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[DEBUG] ProtectedRoute: Fazendo requisição para /users/perfil...');
        const response = await axios.get(`${API_BASE}/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[DEBUG] ProtectedRoute: Resposta do perfil:', response.data);
        
        const userRole = response.data.id_cargo;
        console.log('[DEBUG] ProtectedRoute: Cargo do usuário (id_cargo):', userRole);
        console.log('[DEBUG] ProtectedRoute: Tipo do cargo:', typeof userRole);
        
        // Debug detalhado da verificação de permissão
        console.log('[DEBUG] ProtectedRoute: Verificando permissão:', {
          userRole,
          userRoleString: String(userRole),
          userRoleNumber: Number(userRole),
          allowedRoles,
          allowedRolesTypes: allowedRoles.map(role => ({value: role, type: typeof role})),
          strictIncludes: allowedRoles.includes(userRole),
          numberIncludes: allowedRoles.includes(Number(userRole)),
          stringIncludes: allowedRoles.includes(String(userRole))
        });
        
        // Se não há roles específicas ou se o user tem uma das roles permitidas
        if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
          console.log('[DEBUG] ProtectedRoute: Permissão concedida!');
          setHasPermission(true);
        } else {
          console.log('[DEBUG] ProtectedRoute: Permissão negada! Usuário não tem cargo permitido.');
          toast.error('Não tem permissão para acessar esta página.');
        }
      } catch (error) {
        console.error('[DEBUG] ProtectedRoute: Erro ao verificar permissão:', error);
        console.error('[DEBUG] ProtectedRoute: Status do erro:', error.response?.status);
        console.error('[DEBUG] ProtectedRoute: Dados do erro:', error.response?.data);
        toast.error('Erro ao verificar permissões.');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [allowedRoles]);

  if (isLoading) {
    console.log('[DEBUG] ProtectedRoute: Ainda carregando...');
    return <div>Carregando...</div>;
  }

  if (!localStorage.getItem('token')) {
    console.log('[DEBUG] ProtectedRoute: Sem token, redirecionando para login...');
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission) {
    console.log('[DEBUG] ProtectedRoute: Sem permissão, redirecionando para /...');
    return <Navigate to="/" replace />;
  }

  console.log('[DEBUG] ProtectedRoute: Renderizando componente protegido...');
  return children;
};

export default ProtectedRoute;