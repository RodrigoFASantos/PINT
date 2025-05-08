/**
 * Middleware para verificar token e garantir que o email do utilizador esteja disponível
 * Este ficheiro deve ser colocado na pasta utils
 */

const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Middleware para verificar token e adicionar o email do utilizador ao objeto req.utilizador
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 * @param {Function} next - Função para passar para o próximo middleware
 */
const verificarTokenComEmail = async (req, res, next) => {
  try {
    console.log('🔍 A iniciar verificação de token com complemento de email');
    
    // URL acedida para registo
    const url = req.originalUrl;
    console.log('URL acedida:', url);
    
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
      console.log('Utilizador autenticado:', decoded);
      
      // Adicionar dados do utilizador à requisição
      req.utilizador = decoded;
      
      // Se o utilizador já tiver email no token, não precisamos consultar o banco
      if (req.utilizador.email) {
        console.log('Email já presente no token:', req.utilizador.email);
        return next();
      }

      // Verificar se o email está no body ou query
      if (req.body && req.body.email) {
        console.log('Email encontrado no body da requisição:', req.body.email);
        req.utilizador.email = req.body.email;
        return next();
      }
      
      if (req.query && req.query.email) {
        console.log('Email encontrado na query:', req.query.email);
        req.utilizador.email = req.query.email;
        return next();
      }

      // COMPLEMENTO: Procurar email do utilizador no banco de dados como último recurso
      try {
        console.log('A procurar email na base de dados para o utilizador ID:', req.utilizador.id_utilizador);
        const utilizador = await User.findByPk(req.utilizador.id_utilizador);
        
        if (utilizador && utilizador.email) {
          console.log('Email do utilizador obtido da base de dados:', utilizador.email);
          // Adicionar email ao objeto req.utilizador
          req.utilizador.email = utilizador.email;
          return next();
        } else {
          console.log('⚠️ Não foi possível encontrar o email do utilizador na base de dados');
          return res.status(400).json({ 
            message: "Email do utilizador não encontrado. Por favor, forneça o email ou inicie sessão novamente." 
          });
        }
      } catch (dbError) {
        console.error('Erro ao procurar email do utilizador:', dbError);
        return res.status(500).json({ 
          message: "Erro interno ao tentar identificar o utilizador. Por favor, tente novamente." 
        });
      }
    });
  } catch (error) {
    console.error('❗ Erro na verificação do token:', error);
    return res.status(401).json({ message: "Erro na autenticação" });
  }
};

module.exports = verificarTokenComEmail;