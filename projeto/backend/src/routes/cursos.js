const express = require("express");
const router = express.Router();

const verificarToken = require('../middleware/auth');
const autorizar = require('../middleware/autorizar');

const { getAllCursos, createCurso, getCursoById, getInscricoesCurso, updateCurso, deleteCurso } = require("../controllers/cursos_ctrl");
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

// Rota GET para listar todos os cursos
router.get("/", getAllCursos);

// Rota POST para criar curso (com upload de imagem)
router.post("/", verificarToken, autorizar([1, 2]), upload.single("imagem"), createCurso);

// Rotas para operações específicas em um curso
router.get("/:id", getCursoById);
router.put("/:id", verificarToken, autorizar([1, 2]), updateCurso);
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

// Rota para listar inscrições de um curso
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

module.exports = router;