const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const verificarToken = require('../../middleware/auth');
const { getAllTrabalhos, createTrabalho } = require("../../controllers/trabalhos/trabalhos_ctrl");


// Configuração do upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/trabalhos/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get("/", getAllTrabalhos);
router.post("/", verificarToken, upload.single("ficheiro"), createTrabalho);

module.exports = router;