const express = require("express");
const router = express.Router();

const verificarToken = require('../middleware/auth');
const autorizar = require('../middleware/autorizar');
const { 
  createPasta, 
  getPastasByTopico, 
  getPastaById, 
  updatePasta, 
  deletePasta 
} = require("../controllers/pastas_curso_ctrl");

// Rota para obter todas as pastas de um tópico com seus conteúdos
router.get("/topico/:id_topico", verificarToken, getPastasByTopico);

// Rota para criar uma nova pasta
router.post("/", verificarToken, autorizar([1, 2]), createPasta);

// Rotas para operações com uma pasta específica
router.get("/:id", verificarToken, getPastaById);
router.put("/:id", verificarToken, autorizar([1, 2]), updatePasta);
router.delete("/:id", verificarToken, autorizar([1, 2]), deletePasta);

module.exports = router;