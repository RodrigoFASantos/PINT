const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  console.log('🔍 A iniciar verificação de token');
  console.log('URL acedida:', req.url);

  const authHeader = req.headers['authorization'];
  console.log('Cabeçalho de autorização:', authHeader ? 'PRESENTE' : 'AUSENTE');

  const token = authHeader && authHeader.split(' ')[1];

  console.log('Token recebido:', token ? 'Sim' : 'Não');

  if (!token) {
    console.log('Nenhum token fornecido');
    return res.status(401).json({ message: 'Token não fornecido!' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'segredo', (err, utilizador) => {
    if (err) {
      console.log('Erro na verificação do token:', err.message);
      
      // Mensagens específicas para diferentes tipos de erro
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expirado. Faz login novamente.',
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

    console.log('✅ Token validado com sucesso');
    console.log('Utilizador autenticado:', {
      id_utilizador: utilizador.id_utilizador,
      email: utilizador.email,
      id_cargo: utilizador.id_cargo
    });

    // Verificar se o token contém os campos essenciais
    if (!utilizador.id_utilizador || !utilizador.id_cargo) {
      console.log('⚠️ Token não contém campos obrigatórios:', {
        id_utilizador: utilizador.id_utilizador,
        id_cargo: utilizador.id_cargo
      });
      return res.status(401).json({ 
        message: 'Token malformado - campos obrigatórios em falta',
        code: 'MALFORMED_TOKEN'
      });
    }

    // Normalizar o objeto utilizador para compatibilidade
    req.user = utilizador; // Para compatibilidade com código novo
    req.utilizador = utilizador; // Para compatibilidade com código existente

    next();
  });
}

// Exporta apenas a função verificarToken
module.exports = verificarToken;