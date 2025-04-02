const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log("TOKEN RECEBIDO:", token); // <- ADICIONA ISTO PARA VER SE O TOKEN CHEGA!

  console.log("Token recebido e verificado");
  console.log("Usuário autenticado com ID:", user.id);

  if (!token) return res.status(401).json({ message: 'Token não fornecido!' });

  // No arquivo auth.js
jwt.verify(token, 'segredo', (err, user) => {
  if (err) return res.status(403).json({ message: 'Token inválido!' });

  // Verifica se o campo id existe no token decodificado
  if (!user.id) {
    return res.status(403).json({ message: 'Token inválido! ID do usuário não encontrado.' });
  }
  
  req.user = user;
  next();
});

}


module.exports = verificarToken;
