const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { uploadAvaliacaoConteudo, handleUploadErrors } = require('../../middleware/upload_middleware');
const { 
    submitSubmissao, 
    removeSubmissao,
    getSubmissoes, 
    getSubmissoesByPasta, 
    getTrabalhoById, 
    getTrabalhosByPastaECurso, 
    getTrabalhosByPastaId 
} = require('../../controllers/avaliacoes/submissoes_ctrl');

/**
 * Rotas para gestão de submissões de trabalhos académicos
 * 
 * Sistema organizado por cursos e pastas, permitindo:
 * - Submissão de ficheiros por formandos
 * - Remoção de submissões próprias (antes do prazo)
 * - Consulta de trabalhos por formadores
 * - Filtragem por diferentes critérios
 * 
 * IMPORTANTE: As rotas estão ordenadas da mais específica para a mais genérica
 * para evitar conflitos de roteamento no Express.js
 */

// === SUBMISSÃO DE TRABALHOS ===

/**
 * POST /
 * Submeter novo ficheiro de avaliação
 * 
 * Requer autenticação e upload de ficheiro.
 * O middleware uploadAvaliacaoConteudo processa o ficheiro,
 * handleUploadErrors trata erros de upload,
 * submitSubmissao grava na base de dados.
 */
router.post('/', auth, uploadAvaliacaoConteudo, handleUploadErrors, submitSubmissao);

// === REMOÇÃO DE SUBMISSÕES ===

/**
 * DELETE /:id
 * Remover submissão específica pelo ID
 * 
 * Apenas o próprio formando pode remover a sua submissão.
 * Validações aplicadas:
 * - Verificar se pertence ao utilizador autenticado
 * - Validar se o prazo de entrega ainda não expirou
 * - Remover ficheiro do sistema e registo da BD
 */
router.delete('/:id([0-9]+)', auth, removeSubmissao);

// === CONSULTA DE TRABALHOS (ordenadas por especificidade) ===

/**
 * GET /:id
 * Obter trabalho específico por ID numérico
 * 
 * Deve ser a primeira rota de consulta para evitar conflitos
 * com outras rotas que usem parâmetros dinâmicos.
 * Regex [0-9]+ garante que apenas números são aceites.
 */
router.get('/:id([0-9]+)', auth, getTrabalhoById);

/**
 * GET /submissoes-pasta
 * Obter trabalhos por ID da pasta (via query parameter)
 * 
 * Usado pelo frontend para carregar submissões de uma pasta específica.
 * Espera ?id_pasta=123 na query string.
 */
router.get('/submissoes-pasta', auth, getTrabalhosByPastaId);

/**
 * GET /pasta-id
 * Rota alternativa para compatibilidade com versões anteriores
 * 
 * Mantida para não quebrar integrações existentes.
 * Recomenda-se usar /submissoes-pasta em novos desenvolvimentos.
 */
router.get('/pasta-id', auth, getTrabalhosByPastaId);

/**
 * GET /curso/:cursoNome/pasta/:pastaNome
 * Obter trabalhos por nomes do curso e pasta
 * 
 * Útil quando se conhece apenas os nomes e não os IDs.
 * Faz lookup na base de dados para encontrar os registos correspondentes.
 */
router.get('/curso/:cursoNome/pasta/:pastaNome', auth, getTrabalhosByPastaECurso);

/**
 * GET /pasta/:pastaNome
 * Obter submissões de uma pasta específica pelo nome
 * 
 * Busca todas as submissões numa pasta independentemente do curso.
 * Pode retornar resultados de múltiplos cursos se existirem pastas
 * com o mesmo nome em cursos diferentes.
 */
router.get('/pasta/:pastaNome', auth, getSubmissoesByPasta);

/**
 * GET /
 * Obter submissões com filtros flexíveis via query parameters
 * 
 * Esta deve ser sempre a última rota GET para servir como catch-all.
 * Suporta filtros como ?id_curso=1&id_pasta=2&id_utilizador=3
 * O id_curso é obrigatório, os restantes são opcionais.
 */
router.get('/', auth, getSubmissoes);

module.exports = router;