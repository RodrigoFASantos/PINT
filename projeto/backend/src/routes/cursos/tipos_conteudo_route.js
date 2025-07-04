const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getAllTiposConteudo, createTipoConteudo, updateTipoConteudo, deleteTipoConteudo } = require("../../controllers/cursos/tipos_conteudo_ctrl");

/**
 * Rotas para gestão de tipos de conteúdo
 * Define as categorias disponíveis para classificar os materiais dos cursos
 * (ex: vídeo, documento, apresentação, exercício, etc.)
 */

// Listar todos os tipos de conteúdo disponíveis no sistema
// Acesso: Público (todos os utilizadores precisam consultar os tipos)
router.get("/", getAllTiposConteudo);

// Criar novo tipo de conteúdo
// Acesso: Apenas Administradores (id_cargo: 1)
router.post("/", verificarToken, autorizar([1]), createTipoConteudo);

// Atualizar tipo de conteúdo existente
// Acesso: Apenas Administradores (id_cargo: 1)
router.put("/:id", verificarToken, autorizar([1]), updateTipoConteudo);

// Eliminar tipo de conteúdo do sistema
// Acesso: Apenas Administradores (id_cargo: 1)
router.delete("/:id", verificarToken, autorizar([1]), deleteTipoConteudo);

module.exports = router;