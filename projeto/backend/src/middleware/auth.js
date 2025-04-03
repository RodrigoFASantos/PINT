const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token não fornecido!' });

  jwt.verify(token, 'segredo', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido!' });

    // Verifica o campo certo do token (id_utilizador, não id!)
    if (!user.id_utilizador) {
      return res.status(403).json({ message: 'Token inválido! ID do utilizador não encontrado.' });
    }

    req.user = user;
    console.log("Token verificado:", user); // DEBUG
    next();
  });
}

module.exports = verificarToken;
