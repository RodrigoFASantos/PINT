const express = require("express");
const router = express.Router();
const verificarToken = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");
const uploadUtils = require('../../middleware/upload');

// Importar controladores dos dois sistemas
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
} = require("../../controllers/chat/Topico_area_ctrl");

const { denunciarMensagem } = require("../../controllers/chat/Topicos_Chat_ctrl");

/**
 * ROTAS PARA SISTEMA UNIFICADO DE TÓPICOS DE CHAT E FÓRUM
 * 
 * Este módulo gere um sistema completo de discussão em tempo real,
 * combinando funcionalidades de fórum tradicional com chat dinâmico.
 * Permite a criação, gestão e moderação de tópicos de discussão organizados por categoria.
 */

// Aplicar autenticação obrigatória a todas as rotas
router.use(verificarToken);

// =============================================================================
// CONSULTA E NAVEGAÇÃO DE TÓPICOS
// =============================================================================

/**
 * Obter todos os tópicos organizados por categoria
 * 
 * Retorna uma estrutura hierárquica de tópicos agrupados por categoria,
 * facilitando a navegação temática e descoberta de conteúdos relevantes.
 * 
 * @route GET /
 * @query {string} busca - Texto para busca nos tópicos
 * @query {number} categoria_id - Filtrar por categoria específica
 * @query {number} area_id - Filtrar por área específica
 * @access Todos os utilizadores autenticados
 */
router.get("/", getAllTopicosCategoria);

/**
 * Obter dados detalhados de um tópico específico
 * 
 * Fornece informação completa sobre um tópico, incluindo metadados,
 * estatísticas de participação e dados do criador.
 * 
 * @route GET /:id
 * @param {number} id - Identificador único do tópico
 * @access Todos os utilizadores autenticados
 */
router.get("/:id", getTopicoById);

/**
 * Obter tópicos filtrados por categoria específica
 * 
 * Permite a consulta focada de tópicos dentro de uma categoria particular,
 * otimizando a experiência de navegação temática.
 * 
 * @route GET /categoria/:id_categoria
 * @param {number} id_categoria - Identificador da categoria
 * @query {number} area_id - Filtrar também por área
 * @query {string} busca - Texto para busca
 * @query {number} limit - Limite de resultados (padrão: 20)
 * @query {number} offset - Deslocamento para paginação (padrão: 0)
 * @access Todos os utilizadores autenticados
 */
router.get("/categoria/:id_categoria", getTopicosByCategoria);

// =============================================================================
// GESTÃO DE TÓPICOS (administradores e formadores)
// =============================================================================

/**
 * Criar novo tópico de discussão
 * 
 * Permite a criação de novos temas de discussão organizados por categoria,
 * com definição de título, descrição e configurações de moderação.
 * 
 * @route POST /
 * @body {string} titulo - Título do tópico (obrigatório)
 * @body {string} descricao - Descrição detalhada do tópico
 * @body {number} id_categoria - ID da categoria (obrigatório)
 * @body {number} id_area - ID da área (obrigatório)
 * @access Administradores (1) e Formadores (2)
 */
router.post("/", autorizar([1, 2]), createTopico);

/**
 * Atualizar tópico existente
 * 
 * Permite modificação de título, descrição, categoria e configurações
 * de um tópico já criado, mantendo o histórico de discussão.
 * 
 * @route PUT /:id
 * @param {number} id - Identificador do tópico a atualizar
 * @body {string} titulo - Novo título do tópico
 * @body {string} descricao - Nova descrição do tópico
 * @body {boolean} ativo - Estado ativo do tópico (apenas admin/formador)
 * @body {number} id_categoria - Nova categoria
 * @body {number} id_area - Nova área
 * @access Criador do tópico, Administradores (1) e Formadores (2)
 */
router.put("/:id", autorizar([1, 2]), updateTopico);

/**
 * Eliminar tópico e todo o seu conteúdo
 * 
 * Remove permanentemente um tópico e todas as discussões associadas.
 * Esta operação é irreversível e requer privilégios elevados.
 * 
 * @route DELETE /:id
 * @param {number} id - Identificador do tópico a eliminar
 * @access Administradores (1) apenas
 */
router.delete("/:id", autorizar([1]), deleteTopico);

// =============================================================================
// SISTEMA DE COMENTÁRIOS E DISCUSSÃO
// =============================================================================

/**
 * Obter todos os comentários de um tópico específico
 * 
 * Lista as mensagens e respostas aninhadas de um tópico,
 * incluindo avaliações, anexos e estado de moderação.
 * 
 * @route GET /:id/comentarios
 * @param {number} id - Identificador do tópico
 * @query {number} limit - Número de comentários por página (padrão: 50)
 * @query {number} offset - Deslocamento para paginação (padrão: 0)
 * @query {string} ordem - Ordem dos comentários: ASC ou DESC (padrão: ASC)
 * @access Todos os utilizadores autenticados
 */
router.get("/:id/comentarios", getComentariosByTopico);

/**
 * Criar novo comentário com possibilidade de anexar ficheiros
 * 
 * Permite adicionar mensagens a um tópico com suporte para anexos
 * de diferentes tipos: imagens, documentos, vídeos e áudio.
 * 
 * @route POST /:id/comentarios
 * @param {number} id - Identificador do tópico
 * @body {string} texto - Conteúdo textual do comentário
 * @files {file} anexo - Ficheiro opcional a anexar (até 15MB)
 * @access Todos os utilizadores autenticados
 */
router.post("/:id/comentarios", uploadUtils.uploadChat.single("anexo"), createComentario);

// =============================================================================
// SISTEMA DE INTERAÇÃO E MODERAÇÃO
// =============================================================================

/**
 * Avaliar comentário (gosto/não gosto)
 * 
 * Sistema de classificação comunitária que permite aos utilizadores
 * expressar aprovação ou desaprovação sobre comentários específicos.
 * Suporta toggle (clicar novamente remove a avaliação).
 * 
 * @route POST /:id_topico/comentarios/:id_comentario/avaliar
 * @param {number} id_topico - Identificador do tópico
 * @param {number} id_comentario - Identificador do comentário
 * @body {string} tipo - Tipo de avaliação: "like" ou "dislike"
 * @access Todos os utilizadores autenticados
 */
router.post("/:id_topico/comentarios/:id_comentario/avaliar", avaliarComentario);

/**
 * Denunciar comentário por conteúdo inadequado
 * 
 * Sistema de moderação comunitária que permite reportar conteúdo
 * impróprio, spam ou que viole as regras de conduta da plataforma.
 * 
 * @route POST /comentario/:idComentario/denunciar
 * @param {number} idComentario - Identificador do comentário a denunciar
 * @body {string} motivo - Motivo da denúncia (obrigatório)
 * @body {string} descricao - Descrição detalhada da infração (opcional)
 * @access Todos os utilizadores autenticados
 */
router.post("/comentario/:idComentario/denunciar", denunciarMensagem);

module.exports = router;