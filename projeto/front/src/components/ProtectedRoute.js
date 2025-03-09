import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const user = JSON.parse(localStorage.getItem("user")); // Verifica se há um utilizador autenticado

  return user ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
