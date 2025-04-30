/**
 * Middleware para verificar token e garantir que o email do usuário esteja disponível
 * Este arquivo deve ser colocado na pasta utils
 */

const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Middleware para verificar token e adicionar o email do usuário ao objeto req.user
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 * @param {Function} next - Função para passar para o próximo middleware
 */
const verificarTokenComEmail = async (req, res, next) => {
  try {
    console.log('🔍 Iniciando verificação de token com complemento de email');
    
    // URL acessada para log
    const url = req.originalUrl;
    console.log('URL acessada:', url);
    
    // Verificar cabeçalho de autorização
    const authHeader = req.headers['authorization']; // Usando colchetes como no auth.js original
    console.log('Cabeçalho de autorização:', authHeader);
    
    // Extrair token (mesmo formato que o auth.js original)
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Token recebido:', token ? 'Sim' : 'Não');
    
    if (!token) {
      console.log('❌ Token não encontrado no cabeçalho');
      return res.status(401).json({ message: "Token não fornecido!" });
    }
    
    // Verificar token JWT usando callback como no auth.js original
    jwt.verify(token, process.env.JWT_SECRET || 'segredo', async (err, decoded) => {
      if (err) {
        console.log('Erro na verificação do token:', err.message);
        return res.status(403).json({ message: 'Token inválido!' });
      }

      console.log('✅ Token validado com sucesso');
      console.log('Usuário autenticado:', decoded);
      
      // Adicionar dados do usuário à requisição
      req.user = decoded;
      
      // Se o usuário já tiver email no token, não precisamos consultar o banco
      if (req.user.email) {
        console.log('Email já presente no token:', req.user.email);
        return next();
      }

      // Verificar se o email está no body ou query
      if (req.body && req.body.email) {
        console.log('Email encontrado no body da requisição:', req.body.email);
        req.user.email = req.body.email;
        return next();
      }
      
      if (req.query && req.query.email) {
        console.log('Email encontrado na query:', req.query.email);
        req.user.email = req.query.email;
        return next();
      }

      // COMPLEMENTO: Buscar email do usuário no banco de dados como último recurso
      try {
        console.log('Buscando email no banco de dados para o usuário ID:', req.user.id_utilizador);
        const usuario = await User.findByPk(req.user.id_utilizador);
        
        if (usuario && usuario.email) {
          console.log('Email do usuário obtido do banco de dados:', usuario.email);
          // Adicionar email ao objeto req.user
          req.user.email = usuario.email;
          return next();
        } else {
          console.log('⚠️ Não foi possível encontrar o email do usuário no banco de dados');
          return res.status(400).json({ 
            message: "Email do usuário não encontrado. Por favor, forneça o email ou faça login novamente." 
          });
        }
      } catch (dbError) {
        console.error('Erro ao buscar email do usuário:', dbError);
        return res.status(500).json({ 
          message: "Erro interno ao tentar identificar o usuário. Por favor, tente novamente." 
        });
      }
    });
  } catch (error) {
    console.error('❗ Erro na verificação do token:', error);
    return res.status(401).json({ message: "Erro na autenticação" });
  }
};

module.exports = verificarTokenComEmail;