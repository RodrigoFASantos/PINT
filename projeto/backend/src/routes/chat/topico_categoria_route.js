const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");
const upload = require('../../middleware/upload_middleware');
const {
  getAllTopicosCategoria,
  getTopicoById,
  getTopicosByCategoria,
  createTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario,
  denunciarComentario
} = require("../../controllers/chat/topico_categoria_ctrl");

// Middleware para verificar autenticação
router.use(authMiddleware);

// Rota para obter todas as categorias com seus tópicos
router.get("/", getAllTopicosCategoria);

// Rota para obter um tópico específico por ID
router.get("/:id", getTopicoById);

// Rota para obter tópicos por categoria
router.get("/categoria/:id_categoria", getTopicosByCategoria);

// Rota para criar um novo tópico
router.post(
  "/", 
  autorizar([1, 2]), 
  createTopico
);

// Rota para atualizar um tópico existente
router.put(
  "/:id",
  autorizar([1, 2]), 
  updateTopico
);

// Rota para excluir um tópico
router.delete(
  "/:id",
  autorizar([1, 2]), 
  deleteTopico
);

// Rota para obter todos os comentários de um tópico
router.get("/:id/comentarios", getComentariosByTopico);

// Rota para criar um novo comentário em um tópico
router.post(
  "/:id/comentarios",
  upload.single('anexo'), // Middleware para upload de arquivos
  createComentario
);

// Rota para curtir/descurtir um comentário
router.post("/:id_topico/comentarios/:id_comentario/avaliar", avaliarComentario);

// Rota para denunciar um comentário
router.post("/:id_topico/comentarios/:id_comentario/denunciar", denunciarComentario);

module.exports = router;