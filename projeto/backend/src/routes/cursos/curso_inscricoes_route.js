const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const {
  getAllInscricoes,
  getInscricoesPorCurso,
  createInscricao,
  cancelarInscricao,
  getInscricoesUtilizador,
  getMinhasInscricoes,
  verificarInscricao
} = require("../../controllers/cursos/curso_inscricoes_ctrl");

/**
 * ROTAS PARA GESTÃO COMPLETA DE INSCRIÇÕES EM CURSOS
 * 
 * Versão corrigida com melhor tratamento de erros e debugging robusto
 */

// =============================================================================
// MIDDLEWARE DE DEBUGGING PARA DESENVOLVIMENTO
// =============================================================================
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const userId = req.user?.id_utilizador || req.utilizador?.id_utilizador || 'Anónimo';
    const userRole = req.user?.id_cargo || req.utilizador?.id_cargo || 'N/A';
    
    console.log(`🔍 [INSCRICOES-ROUTE] ${timestamp} - ${req.method} ${req.path}`);
    console.log(`👤 [INSCRICOES-ROUTE] Utilizador: ${userId} (Cargo: ${userRole})`);
    
    if (Object.keys(req.params).length > 0) {
      console.log(`📋 [INSCRICOES-ROUTE] Parâmetros:`, req.params);
    }
    
    if (Object.keys(req.query).length > 0) {
      console.log(`🔍 [INSCRICOES-ROUTE] Query params:`, req.query);
    }
    
    next();
  });
}

// =============================================================================
// MIDDLEWARE DE VALIDAÇÃO DE PARÂMETROS MELHORADO
// =============================================================================

/**
 * Middleware para validar IDs numéricos nos parâmetros
 */
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    console.warn(`⚠️ [INSCRICOES-ROUTE] ID inválido fornecido: ${id}`);
    return res.status(400).json({
      message: 'ID deve ser um número válido',
      providedId: id,
      expected: 'número inteiro positivo',
      timestamp: new Date().toISOString()
    });
  }
  
  const numericId = parseInt(id, 10);
  if (numericId < 1 || numericId > 2147483647) {
    console.warn(`⚠️ [INSCRICOES-ROUTE] ID fora do range válido: ${numericId}`);
    return res.status(400).json({
      message: 'ID fora do range válido',
      providedId: numericId,
      validRange: '1 - 2147483647',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

/**
 * Middleware para validar IDs de curso nos parâmetros
 */
router.param('id_curso', (req, res, next, id_curso) => {
  if (!/^\d+$/.test(id_curso)) {
    console.warn(`⚠️ [INSCRICOES-ROUTE] ID do curso inválido: ${id_curso}`);
    return res.status(400).json({
      message: 'ID do curso deve ser um número válido',
      providedId: id_curso,
      expected: 'número inteiro positivo',
      timestamp: new Date().toISOString()
    });
  }
  
  const numericId = parseInt(id_curso, 10);
  if (numericId < 1 || numericId > 2147483647) {
    console.warn(`⚠️ [INSCRICOES-ROUTE] ID do curso fora do range: ${numericId}`);
    return res.status(400).json({
      message: 'ID do curso fora do range válido',
      providedId: numericId,
      validRange: '1 - 2147483647',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

// =============================================================================
// MIDDLEWARE DE VERIFICAÇÃO DE AUTENTICAÇÃO ROBUSTO
// =============================================================================

/**
 * Middleware personalizado para garantir que a autenticação funciona
 * ✅ CORRIGIDO: Suporte para ambos os formatos de req.user
 */
const verificarAutenticacaoRobusta = (req, res, next) => {
  // Primeiro, executar o middleware padrão
  verificarToken(req, res, (err) => {
    if (err) {
      console.error('❌ [INSCRICOES-ROUTE] Erro no middleware de autenticação:', err.message);
      return res.status(401).json({
        message: "Erro de autenticação",
        error: "TOKEN_VERIFICATION_FAILED",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
      });
    }

    // ✅ CORRIGIDO: Verificar ambos os formatos possíveis
    const user = req.user || req.utilizador;
    if (!user) {
      console.error('❌ [INSCRICOES-ROUTE] Nenhum utilizador definido após verificação do token');
      return res.status(401).json({
        message: "Dados de utilizador não disponíveis após autenticação",
        error: "USER_DATA_MISSING",
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se os campos essenciais estão presentes
    const userId = user.id_utilizador || user.id;
    if (!userId) {
      console.error('❌ [INSCRICOES-ROUTE] ID do utilizador não encontrado no token');
      return res.status(401).json({
        message: "ID do utilizador não encontrado no token de autenticação",
        error: "USER_ID_MISSING",
        timestamp: new Date().toISOString()
      });
    }

    // ✅ CORRIGIDO: Garantir compatibilidade dupla
    if (!req.user && req.utilizador) {
      req.user = req.utilizador;
    }
    if (!req.utilizador && req.user) {
      req.utilizador = req.user;
    }

    console.log('✅ [INSCRICOES-ROUTE] Autenticação robusta confirmada para utilizador:', userId);
    next();
  });
};

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE TIMEOUTS
// =============================================================================

/**
 * Middleware para definir timeout nas requisições mais pesadas
 */
const setTimeoutForHeavyOperations = (req, res, next) => {
  // Definir timeout de 30 segundos para operações pesadas
  req.setTimeout(30000, () => {
    console.error('❌ [INSCRICOES-ROUTE] Timeout na operação');
    if (!res.headersSent) {
      res.status(408).json({
        message: "Operação demorou muito tempo para completar",
        error: "REQUEST_TIMEOUT",
        timestamp: new Date().toISOString()
      });
    }
  });
  next();
};

// =============================================================================
// OPERAÇÕES ADMINISTRATIVAS
// =============================================================================

/**
 * Listar todas as inscrições do sistema (visão administrativa completa)
 */
router.get("/", 
  verificarAutenticacaoRobusta, 
  autorizar([1]), 
  setTimeoutForHeavyOperations,
  getAllInscricoes
);

// =============================================================================
// GESTÃO DE INSCRIÇÕES PELO UTILIZADOR
// =============================================================================

/**
 * Criar nova inscrição num curso disponível
 */
router.post("/", 
  verificarAutenticacaoRobusta, 
  createInscricao
);

/**
 * Consultar inscrições de um utilizador específico
 */
router.get("/usuario", 
  verificarAutenticacaoRobusta, 
  setTimeoutForHeavyOperations,
  getInscricoesUtilizador
);

/**
 * ✅ ROTA CRÍTICA CORRIGIDA: Consultar as próprias inscrições do utilizador autenticado
 * 
 * Esta era uma das rotas que estava a causar o erro 500.
 * Agora tem autenticação robusta e tratamento de erros melhorado.
 */
router.get("/minhas-inscricoes", 
  verificarAutenticacaoRobusta, 
  setTimeoutForHeavyOperations,
  (req, res, next) => {
    console.log('🎯 [INSCRICOES-ROUTE] Rota minhas-inscricoes chamada');
    console.log('📋 [INSCRICOES-ROUTE] Utilizador autenticado:', {
      id: req.user?.id_utilizador || req.utilizador?.id_utilizador,
      cargo: req.user?.id_cargo || req.utilizador?.id_cargo,
      nome: req.user?.nome || req.utilizador?.nome || 'N/A'
    });
    
    // Adicionar headers para melhor debugging
    res.set({
      'X-Request-ID': req.headers['x-request-id'] || `req-${Date.now()}`,
      'X-Timestamp': new Date().toISOString()
    });
    
    next();
  }, 
  getMinhasInscricoes
);

// =============================================================================
// CONSULTAS ESPECÍFICAS POR CURSO
// =============================================================================

/**
 * Listar todas as inscrições de um curso específico
 */
router.get("/curso/:id_curso", 
  verificarAutenticacaoRobusta, 
  setTimeoutForHeavyOperations,
  getInscricoesPorCurso
);

/**
 * ✅ ROTA CRÍTICA CORRIGIDA: Verificar se o utilizador atual está inscrito num curso específico
 */
router.get("/verificar/:id_curso", 
  verificarAutenticacaoRobusta, 
  (req, res, next) => {
    console.log('🎯 [INSCRICOES-ROUTE] Rota de verificação de inscrição chamada');
    console.log('📋 [INSCRICOES-ROUTE] Dados da verificação:', {
      id_curso: req.params.id_curso,
      utilizador: req.user?.id_utilizador || req.utilizador?.id_utilizador,
      path: req.path,
      originalUrl: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Verificar se o ID do curso é válido
    const id_curso = req.params.id_curso;
    if (!id_curso || !/^\d+$/.test(id_curso)) {
      console.error('❌ [INSCRICOES-ROUTE] ID do curso inválido na verificação:', id_curso);
      return res.status(400).json({
        message: "ID do curso inválido para verificação",
        providedId: id_curso,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ [INSCRICOES-ROUTE] Validações de rota passaram, a proceder para controlador');
    next();
  }, 
  verificarInscricao
);

// =============================================================================
// OPERAÇÕES DE CANCELAMENTO
// =============================================================================

/**
 * Cancelar inscrição específica
 */
router.patch("/cancelar-inscricao/:id", 
  verificarAutenticacaoRobusta, 
  cancelarInscricao
);

// =============================================================================
// ROTAS DE TESTE E DIAGNÓSTICO (APENAS DESENVOLVIMENTO)
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * Rota de teste para verificar se o sistema de inscrições está funcional
   */
  router.get("/test/health", verificarAutenticacaoRobusta, (req, res) => {
    const user = req.user || req.utilizador;
    res.json({
      message: "Sistema de inscrições operacional",
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id_utilizador || user?.id || 'N/A',
        role: user?.id_cargo || 'N/A',
        name: user?.nome || 'N/A'
      },
      environment: process.env.NODE_ENV,
      routes: {
        minhasInscricoes: '/api/inscricoes/minhas-inscricoes',
        verificarInscricao: '/api/inscricoes/verificar/:id_curso',
        criarInscricao: '/api/inscricoes'
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    });
  });

  /**
   * Rota de teste para verificar conectividade com base de dados
   */
  router.get("/test/database", verificarAutenticacaoRobusta, async (req, res) => {
    try {
      const { sequelize } = require("../../config/db");
      
      // Teste básico de conectividade
      await sequelize.authenticate();
      
      // Teste de query simples
      const result = await sequelize.query('SELECT 1 as test', { 
        type: sequelize.QueryTypes.SELECT 
      });
      
      res.json({
        message: "Conexão com base de dados bem-sucedida",
        timestamp: new Date().toISOString(),
        database: "Conectado",
        testQuery: result,
        user: req.user?.id_utilizador || req.utilizador?.id_utilizador,
        connectionPool: {
          idle: sequelize.connectionManager.pool.idle.length,
          used: sequelize.connectionManager.pool.used.length
        }
      });
    } catch (error) {
      console.error('❌ [INSCRICOES-ROUTE] Erro na conexão de teste:', error.message);
      res.status(500).json({
        message: "Erro na conexão com base de dados",
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * Rota de teste para validar o middleware de autenticação
   */
  router.get("/test/auth", verificarAutenticacaoRobusta, (req, res) => {
    const user = req.user || req.utilizador;
    res.json({
      message: "Autenticação a funcionar corretamente",
      timestamp: new Date().toISOString(),
      authenticatedUser: {
        id: user?.id_utilizador || user?.id,
        role: user?.id_cargo,
        name: user?.nome || 'N/A',
        email: user?.email || 'N/A'
      },
      tokenInfo: {
        hasToken: !!req.headers.authorization,
        tokenType: req.headers.authorization ? req.headers.authorization.split(' ')[0] : 'N/A',
        tokenLength: req.headers.authorization ? req.headers.authorization.length : 0
      },
      requestInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        url: req.originalUrl
      }
    });
  });

  /**
   * Rota para testar erros e logging
   */
  router.get("/test/error", (req, res) => {
    const testError = new Error("Erro de teste para verificação de logging");
    testError.code = "TEST_ERROR";
    testError.status = 418; // I'm a teapot
    
    console.error('🧪 [INSCRICOES-ROUTE] Erro de teste gerado:', testError.message);
    
    res.status(418).json({
      message: "Erro de teste gerado com sucesso",
      error: testError.message,
      timestamp: new Date().toISOString(),
      testInfo: "Este é um erro controlado para testar o sistema de logging"
    });
  });
}

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS ESPECÍFICO
// =============================================================================

/**
 * Handler de erro específico para operações de inscrições
 * ✅ MELHORADO: Classificação mais detalhada de erros
 */
router.use((err, req, res, next) => {
  console.error('❌ [INSCRICOES-ROUTE] Erro não tratado na rota de inscrições:', err.message);
  console.error('📍 [INSCRICOES-ROUTE] Stack trace:', err.stack);
  console.error('🌐 [INSCRICOES-ROUTE] Contexto da requisição:', {
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.method === 'POST' ? req.body : 'N/A',
    userId: req.user?.id_utilizador || req.utilizador?.id_utilizador || 'N/A',
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });
  
  // Classificar tipo de erro de forma mais granular
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let errorType = 'UNKNOWN_ERROR';
  let suggestion = 'Tenta novamente mais tarde';
  
  // Erros de validação
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Dados inválidos fornecidos';
    errorType = 'VALIDATION_ERROR';
    suggestion = 'Verifica os dados enviados e tenta novamente';
  }
  
  // Erros de violação de constraints
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Conflito: Já existe um registo com estes dados';
    errorType = 'DUPLICATE_ENTRY';
    suggestion = 'Verifica se já não estás inscrito neste curso';
  }
  
  // Erros de autorização
  if (err.name === 'UnauthorizedError' || err.message.includes('authorization')) {
    statusCode = 401;
    message = 'Acesso não autorizado';
    errorType = 'AUTH_ERROR';
    suggestion = 'Faz login novamente';
  }
  
  // Erros de base de dados
  if (err.name && err.name.startsWith('Sequelize')) {
    statusCode = 500;
    message = 'Erro na base de dados';
    errorType = 'DATABASE_ERROR';
    suggestion = 'Problema temporário na base de dados. Tenta novamente em alguns minutos';
  }

  // Erros de conexão
  if (err.message && (err.message.includes('connection') || err.code === 'ECONNRESET')) {
    statusCode = 503;
    message = 'Serviço temporariamente indisponível';
    errorType = 'CONNECTION_ERROR';
    suggestion = 'Verifica a tua ligação à internet e tenta novamente';
  }
  
  // Erros de timeout
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    statusCode = 408;
    message = 'Operação demorou muito tempo';
    errorType = 'TIMEOUT_ERROR';
    suggestion = 'A operação demorou muito tempo. Tenta novamente';
  }
  
  // Resposta estruturada do erro
  const errorResponse = {
    message: message,
    error: errorType,
    suggestion: suggestion,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] || `err-${Date.now()}`,
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        originalMessage: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      }
    })
  };
  
  // Só enviar resposta se ainda não foi enviada
  if (!res.headersSent) {
    res.status(statusCode).json(errorResponse);
  }
});

module.exports = router;