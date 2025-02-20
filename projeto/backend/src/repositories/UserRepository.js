const pool = require('../config/database');

const UserRepository = {
  getUserByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    return result.rows[0];
  },

  insertUser: async (nome, email, senha_hash) => {
    const result = await pool.query(
      'INSERT INTO utilizadores (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING *',
      [nome, email, senha_hash]
    );
    return result.rows[0];
  }
};

module.exports = UserRepository;
