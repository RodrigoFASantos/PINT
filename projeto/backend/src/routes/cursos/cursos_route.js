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


const debugUpload = (req, res, next) => {
  console.log("🔍 [UPLOAD DEBUG] Middleware chamado");
  console.log("🔍 [UPLOAD DEBUG] Method:", req.method);
  console.log("🔍 [UPLOAD DEBUG] Content-Type:", req.headers['content-type']);
  console.log("🔍 [UPLOAD DEBUG] Body keys:", Object.keys(req.body));
  
  // Log após o multer processar
  const originalSend = res.send;
  res.send = function(data) {
    console.log("📤 [UPLOAD DEBUG] File após multer:", req.file ? {
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


// Rotas de cursos
router.post("/", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), createCurso);
router.get("/", getAllCursos);
router.get("/por-categoria", getCursosByCategoria);
router.get("/sugeridos", verificarToken, getCursosSugeridos);
router.get("/topico-area/:id", getTopicoArea);
router.get("/:id", getCursoById);

router.put("/:id", 
  verificarToken, 
  autorizar([1, 2]), 
  debugUpload,
  uploadUtils.uploadCurso.single("imagem"), 
  (req, res, next) => {
    console.log("🔄 [ROUTE DEBUG] Após uploadCurso.single:");
    console.log("📁 [ROUTE DEBUG] req.file:", req.file);
    console.log("📝 [ROUTE DEBUG] req.body:", req.body);
    next();
  },
  updateCurso
);

router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

// Rotas para tópicos de cursos
router.get("/:id/topicos", getTopicosCurso);
router.post("/:id/topicos", verificarToken, autorizar([1, 2, 3]), createCurso_Topicos);
router.put("/topicos/:id", verificarToken, autorizar([1, 2, 3]), updateCurso_Topicos);
router.delete("/topicos/:id", verificarToken, autorizar([1, 2, 3]), deleteCurso_Topicos);

module.exports = router;