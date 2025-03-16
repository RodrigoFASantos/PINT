const express = require("express");
const router = express.Router();
const { getAllTrabalhos, createTrabalho } = require("../controllers/trabalhos_ctrl");

router.get("/trabalhos", getAllTrabalhos);
router.post("/trabalhos", createTrabalho);

module.exports = router;
