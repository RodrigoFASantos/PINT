import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
/* import CriarUser from "./pages/criarUtilizador"; */
import Login from "./pages/login";
import Home from "./pages/home";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login />} />
        {/* <Route path="/criarUtilizador" element={<CriarUser />} /> */}

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          {/* Adiciona aqui outras páginas protegidas */}
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
