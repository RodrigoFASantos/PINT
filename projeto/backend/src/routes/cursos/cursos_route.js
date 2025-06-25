const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const uploadUtils = require('../../middleware/upload');
const { 
  getAllCursos, getCursosByCategoria, getTopicoArea, createCurso, getCursoById, 
  getInscricoesCurso, updateCurso, deleteCurso, getCursosSugeridos,
  getTopicosCurso, createCurso_Topicos, updateCurso_Topicos, deleteCurso_Topicos
} = require("../../controllers/cursos/cursos_ctrl");

// Middleware de depuração para upload de ficheiros
const debugUpload = (req, res, next) => {
  console.log("Middleware de upload chamado");
  console.log("Método:", req.method);
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Chaves do corpo:", Object.keys(req.body));
  
  // Log após o multer processar
  const originalSend = res.send;
  res.send = function(data) {
    console.log("Ficheiro após multer:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path
    } : "Nenhum ficheiro");
    
    originalSend.call(this, data);
  };
  
  next();
};

// Rotas principais de cursos

// Criar novo curso apenas administradores e formadores
router.post("/", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), createCurso);

// Listar todos os cursos sem autenticação obrigatória para permitir navegação pública
router.get("/", getAllCursos);

// Obter cursos filtrados por categoria
router.get("/por-categoria", getCursosByCategoria);

// Obter cursos sugeridos para utilizador autenticado
router.get("/sugeridos", verificarToken, getCursosSugeridos);

// Obter tópico de área específico
router.get("/topico-area/:id", getTopicoArea);

// Obter curso específico por ID
router.get("/:id", getCursoById);

// Atualizar curso apenas administradores e formadores
router.put("/:id", 
  verificarToken, 
  autorizar([1, 2]), 
  debugUpload,
  uploadUtils.uploadCurso.single("imagem"), 
  (req, res, next) => {
    console.log("Após uploadCurso.single:");
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    next();
  },
  updateCurso
);

// Eliminar curso apenas administradores
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

// Obter inscrições de um curso específico apenas utilizadores autenticados
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

// Rotas para tópicos de cursos

// Obter tópicos de um curso
router.get("/:id/topicos", getTopicosCurso);

// Criar novo tópico para um curso utilizadores autenticados
router.post("/:id/topicos", verificarToken, autorizar([1, 2, 3]), createCurso_Topicos);

// Atualizar tópico específico utilizadores autenticados
router.put("/topicos/:id", verificarToken, autorizar([1, 2, 3]), updateCurso_Topicos);

// Eliminar tópico específico utilizadores autenticados
router.delete("/topicos/:id", verificarToken, autorizar([1, 2, 3]), deleteCurso_Topicos);

module.exports = router;