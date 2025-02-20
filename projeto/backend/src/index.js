const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// Rotas de autenticação
app.use('/auth', authRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
