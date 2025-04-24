const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const {
  getAllCursos,
  createCurso,
  getCursoById,
  getInscricoesCurso,
  updateCurso,
  deleteCurso
} = require("../../controllers/cursos/cursos_ctrl");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Filtro para aceitar apenas imagens PNG
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens PNG são permitidas!'), false);
  }
};

// Configuração do armazenamento de imagens do curso
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const nomeCurso = req.body.nome
      ? req.body.nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
      : Date.now().toString();

    // Usar path.join para criar caminhos de forma independente do SO
    const cursoDir = path.join('backend', 'uploads', 'cursos', nomeCurso);

    if (!fs.existsSync(cursoDir)) {
      fs.mkdirSync(cursoDir, { recursive: true });
    }

    cb(null, cursoDir);
  },
  filename: (req, file, cb) => {
    const nomeCurso = req.body.nome
      ? req.body.nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
      : Date.now().toString();

    const filename = `capa.png`;
    const cursoDir = path.join('backend', 'uploads', 'cursos', nomeCurso);
    const filePath = path.join(cursoDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    cb(null, filename);
  }
});

// Middleware do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// ========== ROTAS ==========

// Criar curso (com upload de imagem)
router.post("/", verificarToken, autorizar([1, 2]), upload.single("imagem"), createCurso);

// Listar todos os cursos
router.get("/", getAllCursos);

// Obter curso por ID
router.get("/:id", getCursoById);

// Atualizar curso (pode incluir nova imagem)
router.put("/:id", verificarToken, autorizar([1, 2]), upload.single("imagem"), updateCurso);

// Deletar curso
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

// Listar inscrições do curso
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

module.exports = router;
