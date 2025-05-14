const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");
const { uploadChatFile } = require('../../middleware/upload_middleware');

const {
  getAllTopicosCategoria,
  getAllTopicos,
  getTopicoById,
  getTopicosByCategoria,
  createTopico,
  solicitarTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario,
  denunciarComentario
} = require("../../controllers/chat/Topico_area_ctrl");

// Middleware para verificar autenticação
router.use(authMiddleware);

// Rotas gerais para tópicos
router.get("/", getAllTopicosCategoria);  // Mantém a rota original para compatibilidade
router.get("/todos", getAllTopicos);      // Nova rota para listar todos os tópicos com formato alternativo

// Rotas para manipulação de tópicos específicos
router.get("/:id", getTopicoById);
router.get("/categoria/:id_categoria", getTopicosByCategoria);

// Rotas para criar e manipular tópicos
router.post("/", autorizar([1, 2]), createTopico);
router.post("/solicitar", solicitarTopico);
router.put("/:id", autorizar([1, 2]), updateTopico);
router.delete("/:id", autorizar([1, 2]), deleteTopico);

// Rota para obter todos os comentários de um tópico
router.get("/:id/comentarios", getComentariosByTopico);

// Rota para criar um novo comentário em um tópico com upload de arquivo
router.post(
  "/:id/comentarios",
  uploadChatFile,
  createComentario
);

// Rotas para Comentários
router.post("/:id_topico/comentarios/:id_comentario/avaliar", avaliarComentario);
router.post("/:id_topico/comentarios/:id_comentario/denunciar", denunciarComentario);

module.exports = router;