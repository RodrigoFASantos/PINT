// ==========================================
// 1. MIDDLEWARE DE TRATAMENTO DE ERROS
// ==========================================

const errorHandler = (err, req, res, next) => {
  console.error('=== ERRO ENCONTRADO ===');
  console.error('URL:', req.originalUrl);
  console.error('Método:', req.method);
  console.error('Erro:', err.message);
  console.error('Stack:', err.stack);
  
  // Erro de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }
  
  // Erro de constraint única do Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Já existe um registro com estes dados',
      errors: [err.message]
    });
  }
  
  // Erro de token JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      errors: ['Token de autenticação inválido']
    });
  }
  
  // Erro genérico
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      errors: [err.message] 
    })
  });
};

module.exports = errorHandler;

// ==========================================
// 2. MIDDLEWARE DE RATE LIMITING
// ==========================================
// Arquivo: middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

// Rate limit geral para APIs
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por window
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente mais tarde.',
    errors: ['Rate limit excedido']
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit específico para quiz (mais restritivo)
const quizRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por IP por minuto
  message: {
    success: false,
    message: 'Muitas tentativas de quiz. Aguarde um momento.',
    errors: ['Rate limit para quiz excedido']
  }
});

// Rate limit para submissão de quiz (muito restritivo)
const submitRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 submissões por IP por 5 minutos
  message: {
    success: false,
    message: 'Muitas submissões de quiz. Aguarde antes de tentar novamente.',
    errors: ['Limite de submissões excedido']
  }
});

module.exports = {
  generalRateLimit,
  quizRateLimit,
  submitRateLimit
};

// ==========================================
// 3. VALIDAÇÃO COM JOI
// ==========================================
// Arquivo: middleware/quizValidation.js

const Joi = require('joi');

// Schema para criação de quiz
const createQuizSchema = Joi.object({
  titulo: Joi.string()
    .required()
    .min(3)
    .max(255)
    .trim()
    .messages({
      'string.empty': 'Título é obrigatório',
      'string.min': 'Título deve ter pelo menos 3 caracteres',
      'string.max': 'Título deve ter no máximo 255 caracteres'
    }),
    
  descricao: Joi.string()
    .allow('')
    .max(1000)
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),
    
  tempo_limite: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.min': 'Tempo limite deve ser maior ou igual a 0',
      'number.integer': 'Tempo limite deve ser um número inteiro'
    }),
    
  ativo: Joi.boolean()
    .default(true),
    
  id_curso: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'ID do curso deve ser um número',
      'any.required': 'ID do curso é obrigatório'
    }),
    
  perguntas: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        pergunta: Joi.string()
          .required()
          .trim()
          .messages({
            'string.empty': 'Texto da pergunta é obrigatório'
          }),
          
        tipo: Joi.string()
          .valid('multipla_escolha', 'verdadeiro_falso', 'resposta_curta')
          .required()
          .messages({
            'any.only': 'Tipo de pergunta deve ser: multipla_escolha, verdadeiro_falso ou resposta_curta'
          }),
          
        pontos: Joi.number()
          .integer()
          .min(1)
          .default(1)
          .messages({
            'number.min': 'Pontos devem ser maior que 0'
          }),
          
        ordem: Joi.number()
          .integer()
          .min(1),
          
        opcoes: Joi.when('tipo', {
          is: 'resposta_curta',
          then: Joi.array().length(0),
          otherwise: Joi.when('tipo', {
            is: 'verdadeiro_falso',
            then: Joi.array()
              .length(2)
              .items(
                Joi.object({
                  texto: Joi.string().required().trim(),
                  correta: Joi.boolean().required(),
                  ordem: Joi.number().integer().min(1)
                })
              )
              .custom((value, helpers) => {
                const corretas = value.filter(op => op.correta);
                if (corretas.length !== 1) {
                  return helpers.error('custom.exactlyOneCorrect');
                }
                return value;
              })
              .messages({
                'custom.exactlyOneCorrect': 'Verdadeiro/Falso deve ter exatamente uma opção correta'
              }),
            otherwise: Joi.array()
              .min(2)
              .items(
                Joi.object({
                  texto: Joi.string().required().trim(),
                  correta: Joi.boolean().required(),
                  ordem: Joi.number().integer().min(1)
                })
              )
              .custom((value, helpers) => {
                const corretas = value.filter(op => op.correta);
                if (corretas.length !== 1) {
                  return helpers.error('custom.exactlyOneCorrect');
                }
                return value;
              })
              .messages({
                'array.min': 'Múltipla escolha deve ter pelo menos 2 opções',
                'custom.exactlyOneCorrect': 'Múltipla escolha deve ter exatamente uma opção correta'
              })
          })
        })
      })
    )
    .messages({
      'array.min': 'É necessário pelo menos uma pergunta'
    })
});

// Schema para submissão de quiz
const submitQuizSchema = Joi.object({
  respostas: Joi.object()
    .pattern(
      Joi.number().integer(), // pergunta ID
      Joi.alternatives().try(
        Joi.number().integer(), // índice da opção selecionada
        Joi.string(), // resposta de texto
        Joi.array().items(Joi.number().integer()) // múltiplas opções (futuro)
      )
    )
    .required()
    .messages({
      'object.base': 'Respostas devem ser um objeto',
      'any.required': 'Respostas são obrigatórias'
    })
});

// Middleware de validação
const validateCreateQuiz = (req, res, next) => {
  const { error, value } = createQuizSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors
    });
  }
  
  req.body = value; // Usar dados validados e limpos
  next();
};

const validateSubmitQuiz = (req, res, next) => {
  const { error, value } = submitQuizSchema.validate(req.body, { 
    abortEarly: false 
  });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dados de submissão inválidos',
      errors
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateCreateQuiz,
  validateSubmitQuiz,
  createQuizSchema,
  submitQuizSchema
};

// ==========================================
// 4. MIDDLEWARE DE LOGGING/AUDITORIA
// ==========================================
// Arquivo: middleware/auditLogger.js

const fs = require('fs');
const path = require('path');

// Garantir que o diretório de logs existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da ação
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        user: req.user ? {
          id: req.user.id_utilizador,
          email: req.user.email,
          cargo: req.user.cargo
        } : null,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      };
      
      // Adicionar dados específicos baseado na ação
      if (action === 'QUIZ_CREATED' && res.statusCode === 201) {
        try {
          const responseData = JSON.parse(data);
          logEntry.quizId = responseData.data?.id_quiz;
          logEntry.quizTitle = responseData.data?.titulo;
        } catch (e) {
          // Ignorar erro de parsing
        }
      }
      
      if (action === 'QUIZ_SUBMITTED') {
        logEntry.quizId = req.params.id;
        if (res.statusCode === 200) {
          try {
            const responseData = JSON.parse(data);
            logEntry.score = responseData.data?.nota;
            logEntry.correctAnswers = responseData.data?.acertos;
          } catch (e) {
            // Ignorar erro de parsing
          }
        }
      }
      
      // Escrever log
      const logFile = path.join(logsDir, `quiz-audit-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      
      // Log no console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${action}:`, logEntry);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = auditLogger;

// ==========================================
// 5. ROTAS ATUALIZADAS COM MELHORIAS
// ==========================================

const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { generalRateLimit, quizRateLimit, submitRateLimit } = require('../../middleware/rateLimit');
const { validateCreateQuiz, validateSubmitQuiz } = require('../../middleware/quizValidation');
const auditLogger = require('../../middleware/auditLogger');

const { 
  getAllQuizzes, 
  createQuiz, 
  getQuizById, 
  updateQuiz,
  updateQuizCompleto,
  deleteQuiz,
  iniciarQuiz, 
  submeterQuiz,
} = require("../../controllers/quiz/quiz_ctrl");

// Aplicar rate limiting geral
router.use(generalRateLimit);

// Rotas abertas para todos utilizadores autenticados
router.get("/", verificarToken, getAllQuizzes);
router.get("/:id", verificarToken, getQuizById);

// Rotas para administradores e formadores com validação e auditoria
router.post("/", 
  verificarToken, 
  autorizar([1, 2]), 
  quizRateLimit,
  validateCreateQuiz,
  auditLogger('QUIZ_CREATED'),
  createQuiz
);

router.put("/:id", 
  verificarToken, 
  autorizar([1, 2]), 
  quizRateLimit,
  auditLogger('QUIZ_UPDATED'),
  updateQuiz
);

router.put("/:id/completo", 
  verificarToken, 
  autorizar([1, 2]), 
  quizRateLimit,
  validateCreateQuiz,
  auditLogger('QUIZ_UPDATED_COMPLETE'),
  updateQuizCompleto
);

router.delete("/:id", 
  verificarToken, 
  autorizar([1, 2]), 
  auditLogger('QUIZ_DELETED'),
  deleteQuiz
);

// Rotas para formandos fazerem quizzes com rate limiting específico
router.post("/:id_quiz/iniciar", 
  verificarToken, 
  autorizar([3]), 
  quizRateLimit,
  auditLogger('QUIZ_STARTED'),
  iniciarQuiz
);

router.post("/:id/submeter", 
  verificarToken, 
  autorizar([3]), 
  submitRateLimit,
  validateSubmitQuiz,
  auditLogger('QUIZ_SUBMITTED'),
  submeterQuiz
);

module.exports = router;