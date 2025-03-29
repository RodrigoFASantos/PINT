const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token não fornecido!' });

  jwt.verify(token, 'segredo', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido!' });

    req.user = user; // guarda os dados do utilizador no request
    next();
  });
}

module.exports = verificarToken;
