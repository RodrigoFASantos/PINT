const express = require("express");
const router = express.Router();
const { getAllTopicos, createTopico } = require("../controllers/topicos_ctrl");

router.get("/topicos", getAllTopicos);
router.post("/topicos", createTopico);

module.exports = router;
