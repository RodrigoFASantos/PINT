const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { createPasta, getPastasByTopico, getPastaById, updatePasta, deletePasta } = require("../../controllers/cursos/curso_pastas_ctrl");

/**
 * Rotas para gestão de pastas dentro dos cursos
 * As pastas organizam os conteúdos por tópicos, facilitando a navegação
 */

// Obter todas as pastas de um tópico específico, incluindo os seus conteúdos
// Acesso: Utilizadores autenticados
router.get("/topico/:id_topico", verificarToken, getPastasByTopico);

// Criar uma nova pasta para organizar conteúdos
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.post("/", verificarToken, autorizar([1, 2]), createPasta);

// Obter detalhes de uma pasta específica pelo seu ID
// Acesso: Utilizadores autenticados
router.get("/:id", verificarToken, getPastaById);

// Atualizar informações de uma pasta existente
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.put("/:id", verificarToken, autorizar([1, 2]), updatePasta);

// Eliminar uma pasta do sistema
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.delete("/:id", verificarToken, autorizar([1, 2]), deletePasta);

module.exports = router;