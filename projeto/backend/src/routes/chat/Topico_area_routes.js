const express = require('express');
const router = express.Router();
const { 
  getAllTopicosCategoria,
  getTopicoById,
  getTopicosByCategoria,
  createTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario
} = require('../../controllers/chat/Topico_area_ctrl');
const authMiddleware = require('../../middleware/auth');

/**
 * Rotas para gestão de tópicos de área e comentários
 * Permite criar, consultar, editar e interagir com tópicos e comentários
 */

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// === GESTÃO DE TÓPICOS ===

// Listar todos os tópicos com filtros opcionais
router.get('/', getAllTopicosCategoria);

// Obter detalhes de um tópico específico
router.get('/:id', getTopicoById);

// Obter tópicos filtrados por categoria específica
router.get('/categoria/:id_categoria', getTopicosByCategoria);

// Criar novo tópico de discussão
router.post('/', createTopico);

// Atualizar tópico existente
router.put('/:id', updateTopico);

// Eliminar tópico e todo o seu conteúdo
router.delete('/:id', deleteTopico);

// === GESTÃO DE COMENTÁRIOS ===

// Obter comentários de um tópico específico
router.get('/:id/comentarios', getComentariosByTopico);

// Criar novo comentário em um tópico
router.post('/:id/comentarios', createComentario);

// === INTERAÇÃO COM COMENTÁRIOS ===

// Avaliar comentário (like/dislike)
router.post('/:id_topico/comentarios/:id_comentario/avaliar', avaliarComentario);

module.exports = router;