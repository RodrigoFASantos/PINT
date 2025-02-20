const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.json({ success: false, message: 'Login Não Autorizado!' });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userID = token_decode.id;
    next();
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Erro na autenticação' });
  }
};

module.exports = authMiddleware;
