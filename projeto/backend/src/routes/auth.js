const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Criar um novo utilizador (registo)
router.post('/register', [
  body('nome').notEmpty(),
  body('email').isEmail(),
  body('senha').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ erros: errors.array() });
  }

  const { nome, email, senha } = req.body;

  try {
    // Verificar se o utilizador já existe
    const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ erro: 'Este email já está registado.' });
    }

    // Encriptar a senha antes de guardar
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir o utilizador na base de dados
    await pool.query('INSERT INTO utilizadores (nome, email, senha_hash) VALUES ($1, $2, $3)', 
      [nome, email, senhaHash]);

    res.status(201).json({ mensagem: 'Utilizador registado com sucesso!' });

  } catch (err) {
    console.error('Erro ao criar utilizador:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});



// Login do utilizador
router.post('/login', [
    body('email').isEmail(),
    body('senha').notEmpty()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erros: errors.array() });
    }
  
    const { email, senha } = req.body;
  
    try {
      // Buscar utilizador na base de dados
      const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
      }
  
      const utilizador = result.rows[0];
  
      // Verificar se a senha está correta
      const senhaValida = await bcrypt.compare(senha, utilizador.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
      }
  
      // Gerar um token JWT válido por 24h
      const token = jwt.sign({ id: utilizador.id, email: utilizador.email }, 'segredo_secreto', { expiresIn: '24h' });
  
      res.json({ mensagem: 'Login bem-sucedido!', token });
  
    } catch (err) {
      console.error('Erro no login:', err);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  });

  
module.exports = router;
