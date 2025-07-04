const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');

/**
 * Sistema completo de tratamento de erros, rate limiting e validação
 * Inclui middlewares para controlo de erro, limitação de requisições e validação de dados
 */

// ==========================================
// MIDDLEWARE DE TRATAMENTO DE ERROS GLOBAL
// ==========================================

/**
 * Middleware global para tratamento centralizado de erros
 * @param {Error} err - Objecto de erro
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('=== ERRO DETECTADO ===');
  console.error('URL:', req.originalUrl);
  console.error('Método:', req.method);
  console.error('Erro:', err.message);
  
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
      message: 'Já existe um registo com estes dados',
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

// ==========================================
// SISTEMA DE RATE LIMITING
// ==========================================

/**
 * Rate limit geral para todas as APIs
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente mais tarde.',
    errors: ['Limite de requisições excedido']
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limit específico para operações de quiz (mais restritivo)
 */
const quizRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requisições por minuto
  message: {
    success: false,
    message: 'Muitas tentativas de quiz. Aguarde um momento.',
    errors: ['Limite de quiz excedido']
  }
});

/**
 * Rate limit para submissão de quiz (muito restritivo)
 */
const submitRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 submissões por 5 minutos
  message: {
    success: false,
    message: 'Muitas submissões de quiz. Aguarde antes de tentar novamente.',
    errors: ['Limite de submissões excedido']
  }
});

// ==========================================
// SISTEMA DE VALIDAÇÃO COM JOI
// ==========================================

/**
 * Schema de validação para criação de quiz
 */
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
            'any.only': 'Tipo deve ser: multipla_escolha, verdadeiro_falso ou resposta_curta'
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
                'custom.exactlyOneCorrect': 'Verdadeiro/Falso deve ter exactamente uma opção correcta'
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
                'custom.exactlyOneCorrect': 'Múltipla escolha deve ter exactamente uma opção correcta'
              })
          })
        })
      })
    )
    .messages({
      'array.min': 'É necessário pelo menos uma pergunta'
    })
});

/**
 * Schema de validação para submissão de quiz
 */
const submitQuizSchema = Joi.object({
  respostas: Joi.object()
    .pattern(
      Joi.number().integer(), // ID da pergunta
      Joi.alternatives().try(
        Joi.number().integer(), // índice da opção seleccionada
        Joi.string(), // resposta de texto
        Joi.array().items(Joi.number().integer()) // múltiplas opções (futuro)
      )
    )
    .required()
    .messages({
      'object.base': 'Respostas devem ser um objecto',
      'any.required': 'Respostas são obrigatórias'
    })
});

/**
 * Middleware de validação para criação de quiz
 */
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

/**
 * Middleware de validação para submissão de quiz
 */
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

// ==========================================
// SISTEMA DE AUDITORIA E LOGGING
// ==========================================

// Garantir que o directório de logs existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Middleware de auditoria para registar acções importantes
 * @param {string} action - Tipo de acção a ser auditada
 * @returns {Function} Middleware de auditoria
 */
const auditLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Preparar entrada de log
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
      
      // Adicionar dados específicos baseado na acção
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
      
      // Escrever log no ficheiro
      const logFile = path.join(logsDir, `quiz-audit-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  errorHandler,
  generalRateLimit,
  quizRateLimit,
  submitRateLimit,
  validateCreateQuiz,
  validateSubmitQuiz,
  createQuizSchema,
  submitQuizSchema,
  auditLogger
};