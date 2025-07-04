const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Middleware avançado para verificação de token JWT com complemento de email
 * Garante que o utilizador está autenticado e que o email está disponível
 * Se o email não estiver no token, procura na base de dados
 */

/**
 * Verifica token JWT e garante que o email do utilizador está disponível
 * @param {Object} req - Objecto de requisição HTTP
 * @param {Object} res - Objecto de resposta HTTP
 * @param {Function} next - Função para continuar para o próximo middleware
 */
const verificarTokenComEmail = async (req, res, next) => {
  try {
    // Extrair token do cabeçalho de autorização
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "Token não fornecido!" });
    }
    
    // Verificar validade do token JWT
    jwt.verify(token, process.env.JWT_SECRET || 'segredo', async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido!' });
      }

      // Adicionar dados do utilizador à requisição
      req.utilizador = decoded;
      
      // Se o email já está no token, continuar
      if (req.utilizador.email) {
        return next();
      }

      // Verificar se o email está no corpo da requisição
      if (req.body && req.body.email) {
        req.utilizador.email = req.body.email;
        return next();
      }
      
      // Verificar se o email está nos parâmetros de consulta
      if (req.query && req.query.email) {
        req.utilizador.email = req.query.email;
        return next();
      }

      // Procurar email na base de dados como último recurso
      try {
        const utilizador = await User.findByPk(req.utilizador.id_utilizador);
        
        if (utilizador && utilizador.email) {
          req.utilizador.email = utilizador.email;
          return next();
        } else {
          return res.status(400).json({ 
            message: "Email do utilizador não encontrado. Inicie sessão novamente." 
          });
        }
      } catch (dbError) {
        console.error('Erro ao procurar email do utilizador:', dbError.message);
        return res.status(500).json({ 
          message: "Erro interno ao identificar o utilizador." 
        });
      }
    });
  } catch (error) {
    console.error('Erro na verificação do token:', error.message);
    return res.status(401).json({ message: "Erro na autenticação" });
  }
};

module.exports = verificarTokenComEmail;