import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Verifica tanto no localStorage quanto no sessionStorage
  const token = localStorage.getItem("token");
  
  // Só queremos verificar se existe um token
  return token ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;