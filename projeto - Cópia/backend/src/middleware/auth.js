const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  console.log('🔍 Iniciando verificação de token');
  console.log('URL acessada:', req.url);
  
  const authHeader = req.headers['authorization'];
  console.log('Cabeçalho de autorização:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Token recebido:', token ? 'Sim' : 'Não');

  if (!token) {
    console.log('Nenhum token fornecido');
    return res.status(401).json({ message: 'Token não fornecido!' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'segredo', (err, user) => {
    if (err) {
      console.log('Erro na verificação do token:', err.message);
      return res.status(403).json({ message: 'Token inválido!' });
    }

    console.log('✅ Token validado com sucesso');
    console.log('Usuário autenticado:', user);

    if (!user.id_utilizador) {
      console.log('ID de usuário não encontrado no token');
    }

    req.user = user;
    next();
  });
}

// Exporta apenas a função verificarToken
module.exports = verificarToken;