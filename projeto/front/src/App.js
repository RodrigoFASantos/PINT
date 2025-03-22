import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CriarUser from "./pages/criarUtilizador";
import Login from "./pages/login";
import Home from "./pages/home";
import CriarCurso from './pages/criarCurso';
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
          <Route path="/criarUtilizador" element={<CriarUser />} />
          <Route path="/criarCurso" element={<CriarCurso />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
