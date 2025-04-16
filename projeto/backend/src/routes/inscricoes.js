const express = require("express");
const router = express.Router();
const { 
  getAllInscricoes, 
  createInscricao, 
  cancelarInscricao,
  getInscricoesUtilizador 
} = require("../controllers/inscricoes_ctrl");
const verificarToken = require('../middleware/auth');

// Rota para buscar todas as inscrições (protegida para administradores)
router.get("/", verificarToken, (req, res, next) => {
  if (req.user && req.user.id_cargo === 1) { // Cargo 1 = Gestor/Administrador
    next();
  } else {
    res.status(403).json({ message: "Acesso não autorizado" });
  }
}, getAllInscricoes);

// Rota para buscar inscrições do utilizador logado
router.get("/minhas-inscricoes", verificarToken, getInscricoesUtilizador);

// Rota para criar uma inscrição (requer autenticação)
router.post("/", verificarToken, createInscricao);

// Rota para cancelar uma inscrição
router.delete("/:id", verificarToken, cancelarInscricao);

module.exports = router;