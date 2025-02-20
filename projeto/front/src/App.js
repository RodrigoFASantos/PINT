import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CriarUser from "./pages/criarUtilizador";
import Login from "./pages/login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/criarUtilizador" element={<CriarUser />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
