const express = require("express");
const router = express.Router();
const { getAllAreas, createArea } = require("../../controllers/users/areas_ctrl");

/**
 * Rotas para gestão de áreas
 * Permite listar e criar novas áreas de formação
 */

// Rota para obter todas as áreas disponíveis
router.get("/", getAllAreas);

// Rota para criar uma nova área
router.post("/", createArea);

module.exports = router;