const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT para proteger rotas
 * Verifica se o utilizador possui token válido antes de acedera recursos protegidos
 */

/**
 * Verifica a validade do token JWT nas requisições
 * @param {Object} req - Objecto de requisição HTTP
 * @param {Object} res - Objecto de resposta HTTP
 * @param {Function} next - Função para continuar para o próximo middleware
 */
function verificarToken(req, res, next) {
  // Extrair token do cabeçalho Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido!' });
  }

  // Verificar e descodificar o token JWT
  jwt.verify(token, process.env.JWT_SECRET || 'segredo', (err, utilizador) => {
    if (err) {
      // Tratar diferentes tipos de erro de token
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expirado. Faça login novamente.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Token inválido!',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(403).json({ 
          message: 'Token inválido!',
          code: 'TOKEN_ERROR'
        });
      }
    }

    // Verificar se o token contém os campos obrigatórios
    if (!utilizador.id_utilizador || !utilizador.id_cargo) {
      return res.status(401).json({ 
        message: 'Token malformado - campos obrigatórios em falta',
        code: 'MALFORMED_TOKEN'
      });
    }

    // Adicionar dados do utilizador ao objecto de requisição
    req.user = utilizador;       // Para compatibilidade com código novo
    req.utilizador = utilizador; // Para compatibilidade com código existente

    next();
  });
}

module.exports = verificarToken;