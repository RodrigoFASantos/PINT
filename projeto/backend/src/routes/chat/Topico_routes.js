const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");

const {
  createTopico,
  solicitarTopico,
  updateTopico,
  deleteTopico
} = require("../../controllers/chat/Topico_ctrl");

// Middleware para verificar autenticação
router.use(authMiddleware);

// Rotas para criar e manipular tópicos
router.post("/", autorizar([1, 2]), createTopico);
router.post("/solicitar", solicitarTopico);
router.put("/:id", autorizar([1, 2]), updateTopico);
router.delete("/:id", autorizar([1, 2]), deleteTopico);

module.exports = router;