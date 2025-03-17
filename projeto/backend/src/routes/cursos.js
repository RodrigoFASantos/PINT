const express = require("express");
const router = express.Router();
const { getAllCursos, createCurso } = require("../controllers/cursos_ctrl");
const multer = require("multer");
const path = require("path");

// Configuração do upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/cursos/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get("/cursos", getAllCursos);
router.post("/cursos", upload.single("imagem"), createCurso);

module.exports = router;
