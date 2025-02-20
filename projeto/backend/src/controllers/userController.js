const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  const { nome, email, password } = req.body;

  try {
    if (!nome || !email || !password) {
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios!' });
    }

    // Verificar se o utilizador já existe
    const existingUser = await UserRepository.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email já registado!' });
    }

    // Encriptar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar na base de dados
    const newUser = await UserRepository.insertUser(nome, email, hashedPassword);
    res.status(201).json({ success: true, message: 'Utilizador criado com sucesso!', user: newUser });

  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    res.status(500).json({ success: false, message: 'Erro ao registar utilizador' });
  }
};

module.exports = { registerUser };
