const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'PINT',
  password: 'R0dr3g02oo4',
  port: 5432,
});


pool.connect()
  .then(() => console.log('Conexão ao PostgreSQL estabelecida!'))
  .catch(err => console.error('Erro ao conectar ao PostgreSQL:', err));

module.exports = pool;

