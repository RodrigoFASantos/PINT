import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CriarUser from "./pages/criarUtilizador";
import Login from "./pages/login";
import Home from "./pages/home";
import CriarCurso from './pages/criarCurso';
import ProtectedRoute from "./components/ProtectedRoute";
import Cursos from './pages/cursos';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/Cursos" element={<Cursos />} />
          <Route path="/criarUtilizador" element={<CriarUser />} />
          <Route path="/criarCurso" element={<CriarCurso />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
