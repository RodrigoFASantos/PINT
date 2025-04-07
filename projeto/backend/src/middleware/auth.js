// middleware/auth.js
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token não fornecido!' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido!' });

    if (!user.id_utilizador) {
      return res.status(403).json({ message: 'Token inválido! ID do utilizador não encontrado.' });
    }

    req.user = user;
    next();
  });
}

module.exports = verificarToken;