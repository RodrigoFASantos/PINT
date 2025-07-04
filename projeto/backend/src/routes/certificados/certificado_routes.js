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
  verificarHorasFormador,
  obterInformacoesCertificado
} = require("../../controllers/certificados/certificados_ctrl");

/**
 * Rotas para gestão de certificados
 * Permite gerar, registar e consultar certificados de conclusão de cursos
 */

// === GESTÃO DE CERTIFICADOS ===

// Registar novo certificado no sistema
router.post("/registar", verificarToken, registarCertificado);

// Guardar certificado gerado no frontend como ficheiro PDF
router.post("/salvar-do-frontend", verificarToken, upload.single('pdfCertificado'), SalvarCertificado);

// === GESTÃO DE FICHEIROS ===

// Criar diretório para armazenamento de certificados
router.post("/criar-diretorio", verificarToken, criarDiretorio);

// Eliminar ficheiro de certificado
router.delete("/eliminar-ficheiro", verificarToken, eliminarFicheiro);

// === CONSULTA DE INFORMAÇÕES ===

// Verificar horas de formação de um formador num curso
router.get('/verificar-horas-formador/:cursoId', verificarHorasFormador);

// Obter informações completas do certificado (incluindo datas)
router.get('/informacoes/:cursoId/:utilizadorId', verificarToken, obterInformacoesCertificado);

// === OBTENÇÃO DE CERTIFICADOS ===

// Obter certificado por avaliação específica
router.get("/:id_avaliacao", verificarToken, getCertificado);

module.exports = router;