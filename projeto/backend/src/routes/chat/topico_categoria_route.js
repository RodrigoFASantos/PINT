const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const roleMiddleware = require("../../middleware/role_middleware");
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

// Rota para criar um novo tópico (apenas gestores)
router.post(
  "/", 
  roleMiddleware(['admin', 'gestor']), // Apenas gestores e admins podem criar tópicos
  createTopico
);

// Rota para atualizar um tópico existente (apenas gestor que criou ou admin)
router.put(
  "/:id",
  roleMiddleware(['admin', 'gestor']),
  updateTopico
);

// Rota para excluir um tópico (apenas gestor que criou ou admin)
router.delete(
  "/:id",
  roleMiddleware(['admin', 'gestor']),
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