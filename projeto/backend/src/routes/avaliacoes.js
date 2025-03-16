const express = require("express");
const router = express.Router();
const { getAllAvaliacoes, createAvaliacao } = require("../controllers/avaliacoes_ctrl");

router.get("/avaliacoes", getAllAvaliacoes);
router.post("/avaliacoes", createAvaliacao);

module.exports = router;
