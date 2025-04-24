const express = require("express");
const router = express.Router();

const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');

const { getAllCursos, createCurso, getCursoById, getInscricoesCurso, updateCurso, deleteCurso } = require("../../controllers/cursos/cursos_ctrl");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração do upload para cursos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar diretório específico para o curso
    const nomeCurso = req.body.nome
      ? req.body.nome
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")
      : Date.now();

    const cursoDir = `uploads/cursos/${nomeCurso}`;
    
    // Criar diretório se não existir
    if (!fs.existsSync(cursoDir)) {
      fs.mkdirSync(cursoDir, { recursive: true });
    }
    
    cb(null, cursoDir);
  },
  filename: (req, file, cb) => {
    // Usar o nome do curso como nome do arquivo (convertendo para slug)
    const nomeCurso = req.body.nome
      ? req.body.nome
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")
      : Date.now(); // Fallback para timestamp se não houver nome

    // Verificar se já existe um arquivo com esse nome e removê-lo
    const filename = `capa.png`;
    const cursoDir = `uploads/cursos/${nomeCurso}`;
    const filePath = path.join(cursoDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    cb(null, filename);
  }
});

// Filtro para aceitar apenas imagens PNG
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens PNG são permitidas!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Rota GET para listar todos os cursos
router.get("/", getAllCursos);

// Rota POST para criar curso (com upload de imagem)
router.post("/", verificarToken, autorizar([1, 2]), upload.single("imagem"), createCurso);

// Rotas para operações específicas em um curso
router.get("/:id", getCursoById);
router.put("/:id", verificarToken, autorizar([1, 2]), upload.single("imagem"), updateCurso);
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

// Rota para listar inscrições de um curso
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

module.exports = router;