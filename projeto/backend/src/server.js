const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const userRouter = require('./routes/userRoute');

require('dotenv').config();

const app = express();
const port = 4000;//3000

app.use(express.json());
app.use(cors());

// Testar conexão ao PostgreSQL
pool.connect()
  .then(() => console.log('Conexão ao PostgreSQL estabelecida!'))
  .catch(err => console.error('Erro ao conectar ao PostgreSQL:', err));

app.use('/api/user', userRouter);

app.get('/', (req, res) => {
  res.send('API FUNCIONA');
});

app.listen(port, () => {
  console.log(`Servidor ativo em http://localhost:${port}`);
});
