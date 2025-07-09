const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getAllCategorias, getCategoriaById, getAreasByCategoria, createCategoria, updateCategoria, deleteCategoria } = require('../../controllers/categorias/categorias_ctrl.js');

/**
 * Rotas para gestão de categorias de cursos
 * As categorias organizam os cursos em grupos temáticos
 */

// Listar todas as categorias disponíveis no sistema
// Acesso: Público (não requer autenticação)
router.get("/", getAllCategorias);

// Obter detalhes de uma categoria específica pelo seu ID
// Acesso: Público (não requer autenticação)
router.get("/:id", getCategoriaById);

// Listar todas as áreas associadas a uma categoria específica
// Acesso: Público (não requer autenticação)
router.get("/:id/areas", getAreasByCategoria);

// Criar uma nova categoria no sistema
// Acesso: Apenas Administradores (id_cargo: 1)
router.post("/", verificarToken, autorizar([1]), createCategoria);

// Atualizar os dados de uma categoria existente
// Acesso: Apenas Administradores (id_cargo: 1)
router.put("/:id", verificarToken, autorizar([1]), updateCategoria);

// Eliminar uma categoria do sistema
// Acesso: Apenas Administradores (id_cargo: 1)
router.delete("/:id", verificarToken, autorizar([1]), deleteCategoria);

module.exports = router;