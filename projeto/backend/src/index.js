const express = require('express');
const pool = require('./config/database');

const app = express();
app.use(express.json());

// Rota para testar a conexão e listar os utilizadores
app.get('/utilizadores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM utilizadores');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar utilizadores:', err);
    res.status(500).json({ erro: 'Erro ao buscar utilizadores' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
