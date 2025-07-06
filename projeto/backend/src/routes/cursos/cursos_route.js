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

/**
 * Rotas para gestão completa do sistema de cursos
 * 
 * Versão corrigida com tratamento robusto de erros e compatibilidade
 * para resolver problemas de campos inexistentes na BD
 */

// =============================================================================
// MIDDLEWARE DE DEBUGGING PARA DESENVOLVIMENTO
// =============================================================================

/**
 * Middleware de logging para debug das rotas em desenvolvimento
 */
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    const userId = req.user?.id_utilizador || req.utilizador?.id_utilizador || 'Anónimo';
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();
    
    console.log(`🔍 [CURSOS] ${timestamp} - ${method} ${path} - Utilizador: ${userId}`);
    
    // Log de parâmetros relevantes para debugging
    if (Object.keys(req.query).length > 0) {
      console.log(`📋 [CURSOS] Query params:`, req.query);
    }
    
    if (req.file) {
      console.log(`📎 [CURSOS] Ficheiro enviado: ${req.file.originalname} (${req.file.size} bytes)`);
    }
    
    next();
  });
}

// =============================================================================
// MIDDLEWARE DE VALIDAÇÃO DE PARÂMETROS
// =============================================================================

/**
 * Middleware para validar IDs numéricos nos parâmetros
 */
router.param('id', (req, res, next, id) => {
  // Verificar se o ID é um número válido
  if (!/^\d+$/.test(id)) {
    console.warn(`⚠️ [CURSOS] ID inválido fornecido: ${id}`);
    return res.status(400).json({
      message: 'ID do curso deve ser um número válido',
      providedId: id,
      expected: 'número inteiro positivo',
      timestamp: new Date().toISOString()
    });
  }
  
  // Converter para número e validar range
  const numericId = parseInt(id, 10);
  if (numericId < 1 || numericId > 2147483647) {
    console.warn(`⚠️ [CURSOS] ID fora do range válido: ${numericId}`);
    return res.status(400).json({
      message: 'ID do curso fora do range válido',
      providedId: numericId,
      validRange: '1 - 2147483647',
      timestamp: new Date().toISOString()
    });
  }
  
  // ID válido, continuar processamento
  next();
});

// =============================================================================
// MIDDLEWARE ESPECIALIZADO PARA TRATAMENTO DE ERROS DE UPLOAD
// =============================================================================

/**
 * Middleware especializado para tratamento de erros de upload
 */
const tratarErrosUpload = (err, req, res, next) => {
  console.log('🔍 [UPLOAD] A processar erro de upload:', err.code || err.message);
  
  // === ERROS ESPECÍFICOS DO MULTER ===
  
  // Ficheiro excede o tamanho máximo configurado (15MB)
  if (err.code === 'LIMIT_FILE_SIZE') {
    console.error('❌ [UPLOAD] Ficheiro demasiado grande para o limite definido');
    return res.status(400).json({
      message: 'Ficheiro demasiado grande. O tamanho máximo permitido é 15MB.',
      error: 'LIMIT_FILE_SIZE',
      maxSize: '15MB',
      hint: 'Tenta comprimir a imagem ou usar um formato mais eficiente como WebP.',
      timestamp: new Date().toISOString()
    });
  }
  
  // Campo de ficheiro não esperado na requisição
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    console.error('❌ [UPLOAD] Campo de ficheiro inesperado:', err.field);
    return res.status(400).json({
      message: `Campo de ficheiro inesperado: "${err.field}". Apenas o campo "imagem" é aceite.`,
      error: 'LIMIT_UNEXPECTED_FILE',
      field: err.field,
      expectedField: 'imagem',
      timestamp: new Date().toISOString()
    });
  }
  
  // Tipo de ficheiro não suportado
  if (err.message && err.message.includes('Tipo de ficheiro não permitido')) {
    console.error('❌ [UPLOAD] Tipo de ficheiro inválido');
    return res.status(400).json({
      message: err.message,
      error: 'INVALID_FILE_TYPE',
      allowedTypes: ['JPEG', 'PNG', 'GIF', 'WebP', 'SVG', 'BMP', 'TIFF'],
      hint: 'Usa uma imagem nos formatos suportados: JPEG, PNG, GIF, WebP, SVG, BMP ou TIFF.',
      timestamp: new Date().toISOString()
    });
  }
  
  // Outros erros relacionados com limites do Multer
  if (err.code && err.code.startsWith('LIMIT_')) {
    console.error('❌ [UPLOAD] Erro de limite Multer:', err.code);
    return res.status(400).json({
      message: 'Erro no upload do ficheiro devido a limitações do servidor',
      error: err.code,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Erros personalizados do sistema
  if (err.message && err.message.includes('formato não suportado')) {
    console.error('❌ [UPLOAD] Formato de ficheiro não suportado');
    return res.status(400).json({
      message: 'Formato de ficheiro não suportado para imagens de curso',
      error: 'UNSUPPORTED_FORMAT',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Passar erros não relacionados com upload para o handler seguinte
  console.log('⏭️ [UPLOAD] Erro não relacionado com upload, a passar adiante');
  next(err);
};

// =============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO ROBUSTO
// =============================================================================

/**
 * ✅ CORRIGIDO: Middleware personalizado para garantir autenticação robusta
 */
const verificarAutenticacaoRobusta = (req, res, next) => {
  // Para rotas que não requerem autenticação, pular verificação
  if (req.path === '/' || req.path.startsWith('/por-categoria') || req.path.includes('/topico-area/')) {
    return next();
  }

  verificarToken(req, res, (err) => {
    if (err) {
      console.error('❌ [CURSOS-ROUTE] Erro no middleware de autenticação:', err.message);
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
      console.error('❌ [CURSOS-ROUTE] Nenhum utilizador definido após verificação do token');
      return res.status(401).json({
        message: "Dados de utilizador não disponíveis após autenticação",
        error: "USER_DATA_MISSING",
        timestamp: new Date().toISOString()
      });
    }

    const userId = user.id_utilizador || user.id;
    if (!userId) {
      console.error('❌ [CURSOS-ROUTE] ID do utilizador não encontrado no token');
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

    console.log('✅ [CURSOS-ROUTE] Autenticação robusta confirmada para utilizador:', userId);
    next();
  });
};

// =============================================================================
// MIDDLEWARE DE TIMEOUT PARA OPERAÇÕES PESADAS
// =============================================================================

/**
 * Middleware para definir timeout em operações que podem demorar
 */
const setTimeoutForHeavyOperations = (req, res, next) => {
  req.setTimeout(30000, () => {
    console.error('❌ [CURSOS-ROUTE] Timeout na operação');
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
// OPERAÇÕES PRINCIPAIS DE GESTÃO DE CURSOS
// =============================================================================

/**
 * Listar todos os cursos disponíveis
 * GET /cursos
 * Acesso: Público (sem autenticação necessária)
 */
router.get("/", setTimeoutForHeavyOperations, getAllCursos);

/**
 * Obter cursos filtrados por categoria específica
 * GET /cursos/por-categoria?categorias=1,2,3
 * Acesso: Público
 */
router.get("/por-categoria", setTimeoutForHeavyOperations, getCursosByCategoria);

/**
 * ✅ ROTA CRÍTICA CORRIGIDA: Obter sugestões personalizadas de cursos
 * GET /cursos/sugeridos
 * Acesso: Utilizadores autenticados
 */
router.get("/sugeridos", 
  verificarAutenticacaoRobusta, 
  setTimeoutForHeavyOperations,
  (req, res, next) => {
    console.log('🎯 [CURSOS-ROUTE] Rota de sugestões chamada');
    console.log('📋 [CURSOS-ROUTE] Utilizador:', {
      id: req.user?.id_utilizador || req.utilizador?.id_utilizador || 'N/A',
      cargo: req.user?.id_cargo || req.utilizador?.id_cargo || 'N/A'
    });
    next();
  }, 
  getCursosSugeridos
);

/**
 * Obter informações de tópico de área específico
 * GET /cursos/topico-area/:id
 * Acesso: Público
 */
router.get("/topico-area/:id", getTopicoArea);

/**
 * Criar novo curso com possibilidade de upload de imagem
 * POST /cursos
 * Acesso: Administradores (1) e Formadores (2)
 */
router.post("/", 
  verificarAutenticacaoRobusta, 
  autorizar([1, 2]), 
  uploadUtils.uploadCurso.single("imagem"), 
  tratarErrosUpload,
  createCurso
);

/**
 * Obter detalhes completos de um curso específico
 * GET /cursos/:id
 * Acesso: Público (com verificações de acesso para cursos terminados)
 */
router.get("/:id", (req, res, next) => {
  // Tentar autenticação, mas não falhar se não estiver autenticado
  if (req.headers.authorization) {
    verificarToken(req, res, (err) => {
      if (err) {
        console.warn('⚠️ [CURSOS-ROUTE] Falha na autenticação opcional:', err.message);
        req.user = null; // Definir como null para continuar sem autenticação
        req.utilizador = null;
      } else {
        // ✅ CORRIGIDO: Garantir compatibilidade dupla
        const user = req.user || req.utilizador;
        if (user) {
          if (!req.user && req.utilizador) req.user = req.utilizador;
          if (!req.utilizador && req.user) req.utilizador = req.user;
        }
      }
      next();
    });
  } else {
    req.user = null; // Sem token, continuar sem autenticação
    req.utilizador = null;
    next();
  }
}, getCursoById);

/**
 * Atualizar dados de curso existente
 * PUT /cursos/:id
 * Acesso: Administradores (1) e Formadores (2)
 */
router.put("/:id", 
  verificarAutenticacaoRobusta, 
  autorizar([1, 2]), 
  uploadUtils.uploadCurso.single("imagem"), 
  tratarErrosUpload,
  updateCurso
);

/**
 * Eliminar curso do sistema
 * DELETE /cursos/:id
 * Acesso: Apenas Administradores (1)
 */
router.delete("/:id", verificarAutenticacaoRobusta, autorizar([1]), deleteCurso);

/**
 * Obter lista de inscrições ativas num curso
 * GET /cursos/:id/inscricoes
 * Acesso: Utilizadores autenticados
 */
router.get("/:id/inscricoes", 
  verificarAutenticacaoRobusta, 
  setTimeoutForHeavyOperations,
  getInscricoesCurso
);

// =============================================================================
// GESTÃO DE TÓPICOS E ESTRUTURA ORGANIZACIONAL DO CURSO
// =============================================================================

/**
 * Obter estrutura completa de tópicos de um curso
 * GET /cursos/:id/topicos
 * Acesso: Público
 */
router.get("/:id/topicos", getTopicosCurso);

/**
 * Criar novo tópico para organização do conteúdo
 * POST /cursos/:id/topicos
 * Acesso: Administradores (1), Formadores (2) e Estudantes (3)
 */
router.post("/:id/topicos", 
  verificarAutenticacaoRobusta, 
  autorizar([1, 2, 3]), 
  createCurso_Topicos
);

/**
 * Atualizar tópico existente
 * PUT /cursos/topicos/:id
 * Acesso: Administradores (1), Formadores (2) e Estudantes (3)
 */
router.put("/topicos/:id", 
  verificarAutenticacaoRobusta, 
  autorizar([1, 2, 3]), 
  updateCurso_Topicos
);

/**
 * Eliminar tópico específico
 * DELETE /cursos/topicos/:id
 * Acesso: Administradores (1), Formadores (2) e Estudantes (3)
 */
router.delete("/topicos/:id", 
  verificarAutenticacaoRobusta, 
  autorizar([1, 2, 3]), 
  deleteCurso_Topicos
);

// =============================================================================
// ROTAS DE TESTE E DIAGNÓSTICO (APENAS DESENVOLVIMENTO)
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * Rota de teste para verificar funcionalidade de upload
   */
  router.post("/test/upload", 
    verificarAutenticacaoRobusta,
    uploadUtils.uploadCurso.single("imagem"),
    tratarErrosUpload,
    (req, res) => {
      res.json({
        message: "Upload de teste bem-sucedido",
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        } : null,
        timestamp: new Date().toISOString()
      });
    }
  );

  /**
   * Rota de teste para notificações WebSocket
   */
  router.post("/test/notification", verificarAutenticacaoRobusta, (req, res) => {
    const { userId, message } = req.body;
    const currentUserId = req.user?.id_utilizador || req.utilizador?.id_utilizador;
    
    if (req.io) {
      req.io.to(`user_${userId || currentUserId}`).emit('nova_notificacao', {
        titulo: "🧪 Teste de Notificação",
        mensagem: message || "Esta é uma notificação de teste do sistema de cursos!",
        tipo: "teste",
        data: new Date(),
        isTest: true
      });
      
      res.json({
        message: "Notificação de teste enviada",
        targetUser: userId || currentUserId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        message: "WebSocket não disponível",
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Rota de teste para verificar autenticação
   */
  router.get("/test/auth", verificarAutenticacaoRobusta, (req, res) => {
    const user = req.user || req.utilizador;
    res.json({
      message: "Autenticação de cursos a funcionar corretamente",
      timestamp: new Date().toISOString(),
      authenticatedUser: {
        id: user?.id_utilizador || user?.id,
        role: user?.id_cargo,
        name: user?.nome || 'N/A',
        email: user?.email || 'N/A'
      },
      compatibility: {
        hasReqUser: !!req.user,
        hasReqUtilizador: !!req.utilizador,
        bothSet: !!(req.user && req.utilizador)
      }
    });
  });

  /**
   * Rota de teste para base de dados
   */
  router.get("/test/database", async (req, res) => {
    try {
      const { sequelize } = require("../../config/db");
      
      // Teste de conectividade
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
        connectionInfo: {
          dialect: sequelize.getDialect(),
          version: sequelize.getDatabaseVersion ? await sequelize.getDatabaseVersion() : 'N/A'
        }
      });
    } catch (error) {
      console.error('❌ [CURSOS-ROUTE] Erro na conexão de teste:', error.message);
      res.status(500).json({
        message: "Erro na conexão com base de dados",
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * Rota para testar campos da base de dados
   */
  router.get("/test/fields", async (req, res) => {
    try {
      const { sequelize } = require("../../config/db");
      const Curso = require("../../database/models/Curso");
      const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
      
      // Obter informações sobre os campos das tabelas
      const cursoFields = Object.keys(Curso.rawAttributes);
      const inscricaoFields = Object.keys(Inscricao_Curso.rawAttributes);
      
      res.json({
        message: "Informações dos campos das tabelas",
        timestamp: new Date().toISOString(),
        tables: {
          curso: {
            fields: cursoFields,
            hasTimestamps: Curso.options.timestamps,
            tableName: Curso.tableName
          },
          inscricao_curso: {
            fields: inscricaoFields,
            hasTimestamps: Inscricao_Curso.options.timestamps,
            tableName: Inscricao_Curso.tableName
          }
        }
      });
    } catch (error) {
      console.error('❌ [CURSOS-ROUTE] Erro ao obter informações dos campos:', error.message);
      res.status(500).json({
        message: "Erro ao obter informações dos campos",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
}

// =============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS ESPECÍFICO PARA CURSOS
// =============================================================================

/**
 * Aplicar middleware de tratamento de erros de upload
 */
router.use(tratarErrosUpload);

/**
 * ✅ MELHORADO: Handler de erro específico para operações de cursos
 */
router.use((err, req, res, next) => {
  console.error('❌ [CURSOS] Erro não tratado na rota de cursos:', err.message);
  console.error('📍 [CURSOS] Stack trace:', err.stack);
  console.error('🌐 [CURSOS] Contexto:', {
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    userId: req.user?.id_utilizador || req.utilizador?.id_utilizador || 'Anónimo',
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  // Classificar tipo de erro para resposta apropriada
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let errorType = 'UNKNOWN_ERROR';
  let suggestion = 'Tenta novamente mais tarde';
  
  // Erros de validação
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Dados inválidos fornecidos';
    errorType = 'VALIDATION_ERROR';
    suggestion = 'Verifica os dados do formulário e tenta novamente';
  }
  
  // Erros de violação de constraints
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Conflito: Já existe um registo com estes dados';
    errorType = 'DUPLICATE_ENTRY';
    suggestion = 'Verifica se já não existe um curso com este nome';
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
  
  // Só enviar resposta se ainda não foi enviada
  if (!res.headersSent) {
    res.status(statusCode).json({
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
    });
  }
});

module.exports = router;