import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CriarUser from "./pages/criarUtilizador";
import Login from "./components/login";
import Home from "./components/home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/criarUtilizador" element={<CriarUser />} />
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
