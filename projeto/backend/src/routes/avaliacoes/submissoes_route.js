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

/**
 * Rotas para gestão de submissões de trabalhos
 * Permite submeter e consultar trabalhos organizados por curso e pasta
 * 
 * IMPORTANTE: As rotas estão ordenadas da mais específica para a mais genérica
 * para evitar conflitos de roteamento
 */

// === SUBMISSÃO DE TRABALHOS ===

// Submeter novo ficheiro de avaliação
router.post('/', auth, uploadAvaliacaoConteudo, handleUploadErrors, submitSubmissao);

// === CONSULTA DE TRABALHOS (ordenadas por especificidade) ===

// Obter trabalho específico por ID (deve ser a primeira rota de consulta)
router.get('/:id([0-9]+)', auth, getTrabalhoById);

// Obter trabalhos por ID da pasta
router.get('/submissoes-pasta', auth, getTrabalhosByPastaId);

// Rota alternativa para compatibilidade
router.get('/pasta-id', auth, getTrabalhosByPastaId);

// Obter trabalhos por curso e pasta normalizada
router.get('/curso/:cursoNome/pasta/:pastaNome', auth, getTrabalhosByPastaECurso);

// Obter submissões de uma pasta específica
router.get('/pasta/:pastaNome', auth, getSubmissoesByPasta);

// Obter todas as submissões de um curso (deve ser a última rota)
router.get('/', auth, getSubmissoes);

module.exports = router;