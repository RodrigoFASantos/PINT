const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  gerarCertificado,
  getCertificado,
  salvarCertificado,
  eliminarFicheiro,
  criarDiretorio,
  registrarCertificado,
  SalvarCertificado
} = require("../../controllers/certificados/certificados_ctrl");

router.post("/registrar", verificarToken, registrarCertificado);
router.post("/gerar-e-salvar", verificarToken, SalvarCertificado);
router.post("/salvar", verificarToken, upload.single('pdf'), salvarCertificado);
router.post("/criar-diretorio", verificarToken, criarDiretorio);
router.delete("/eliminar-ficheiro", verificarToken, eliminarFicheiro);

router.get("/:id_avaliacao", verificarToken, getCertificado);
router.post("/:id_avaliacao", verificarToken, gerarCertificado);

module.exports = router;