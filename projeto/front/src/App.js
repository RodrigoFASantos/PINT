import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CriarUser from "./pages/criarUtilizador";
import Login from "../src/components/login";
import HomeFormando from "./components/homeFormando";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/criarUtilizador" element={<CriarUser />} />
        <Route path="/" element={<Login />} />
        <Route path="/hf" element={<HomeFormando />} />
      </Routes>
    </Router>
  );
}

export default App;
