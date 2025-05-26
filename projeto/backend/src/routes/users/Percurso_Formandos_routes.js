const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { buscarSugestoesFormandos, getPercursoFormandos, getEstatisticasGerais } = require("../../controllers/users/Percurso_Formandos_ctrl");

// Rota para debug - verificar se o servidor está a responder
router.get("/debug-check", (req, res) => {
  res.status(200).json({ message: "API de percurso formandos está a funcionar!" });
});

// Rotas específicas
router.get("/estatisticas", verificarToken, getEstatisticasGerais);
router.get("/buscar-formandos", verificarToken, buscarSugestoesFormandos);
router.get("/admin/percurso-formandos", verificarToken, getPercursoFormandos);

// Rota de teste
router.get("/test", (req, res) => {
  res.status(200).json({ 
    message: "Rota de teste do percurso formandos funcionando!", 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;