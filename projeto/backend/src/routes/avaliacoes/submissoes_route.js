const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { uploadAvaliacaoConteudo, handleUploadErrors } = require('../../middleware/upload_middleware');
const { 
    submitSubmissao, 
    getSubmissoes, 
    getSubmissoesByPasta, 
    getTrabalhoById, 
    getTrabalhosByPastaECurso, 
    getTrabalhosByPastaId 
} = require('../../controllers/avaliacoes/submissoes_ctrl');

// Submeter ficheiro de avaliação
router.post('/', auth, uploadAvaliacaoConteudo, handleUploadErrors, submitSubmissao);

// IMPORTANTES: Alterar a ordem das rotas - as mais específicas primeiro
// Rota para buscar por ID da pasta - esta precisa vir primeiro!
router.get('/submissoes-pasta', auth, getTrabalhosByPastaId);

// Rota alternativa para compatibilidade com o frontend existente
router.get('/pasta-id', auth, getTrabalhosByPastaId);

// Rota para buscar por curso e pasta normalizada
router.get('/curso/:cursoNome/pasta/:pastaNome', auth, getTrabalhosByPastaECurso);

// Mostrar submissões de uma pasta específica
router.get('/pasta/:pastaNome', auth, getSubmissoesByPasta);

// Buscar trabalho específico por ID
router.get('/:id([0-9]+)', auth, getTrabalhoById);

// Mostrar todas as submissões de um curso (query string ?id_curso=)
// Esta rota deve vir por último por ser mais genérica
router.get('/', auth, getSubmissoes);

module.exports = router;