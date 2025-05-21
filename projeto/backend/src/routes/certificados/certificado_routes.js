const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getCertificado,
  eliminarFicheiro,
  criarDiretorio,
  registarCertificado,
  SalvarCertificado,
  verificarHorasFormador
} = require("../../controllers/certificados/certificados_ctrl");

router.post("/registar", verificarToken, registarCertificado);
router.post("/salvar-do-frontend", verificarToken, upload.single('pdfCertificado'), SalvarCertificado);
router.post("/criar-diretorio", verificarToken, criarDiretorio);
router.delete("/eliminar-ficheiro", verificarToken, eliminarFicheiro);

// Verificar horas do formador
router.get('/verificar-horas-formador/:cursoId', verificarHorasFormador);

router.get("/:id_avaliacao", verificarToken, getCertificado);

module.exports = router;