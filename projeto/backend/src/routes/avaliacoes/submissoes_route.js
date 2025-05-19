const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { uploadAvaliacaoConteudo, handleUploadErrors } = require('../../middleware/upload_middleware');
const { submitSubmissao, getSubmissoes, getSubmissoesByPasta, getTrabalhoById, getTrabalhosByPastaECurso } = require('../../controllers/avaliacoes/submissoes_ctrl');

// Submeter ficheiro de avaliação
router.post( '/', auth, uploadAvaliacaoConteudo, handleUploadErrors, submitSubmissao);

// Mostrar todas as submissões de um curso (query string ?id_curso=)
router.get('/', auth, getSubmissoes);

// Mostrar submissões de uma pasta específica
router.get('/pasta/:pastaId', auth, getSubmissoesByPasta);


router.get('/:id', auth, getTrabalhoById);
router.get('/curso/:cursoId/pasta/:pastaId', auth, getTrabalhosByPastaECurso);

module.exports = router;
