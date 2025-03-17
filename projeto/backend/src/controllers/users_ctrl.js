const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../database/models/User.js");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar utilizadores" });
  }
};

const getFormadores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 2 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar formadores" });
  }
};

const getFormandos = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 3 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar formandos" });
  }
};

const getGestores = async (req, res) => {
  try {
    const users = await User.findAll({ where: { id_cargo: 1 } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar gestores" });
  }
};

const createUser = async (req, res) => {
  try {
    const { id_cargo, nome, idade, email, telefone, password } = req.body;

    if (!id_cargo || !nome || !idade || !email || !telefone || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      id_cargo,
      nome,
      idade,
      email,
      telefone,
      password: hashedPassword,
      primeiro_login: 1,
    });

    res.status(201).json({ message: "Utilizador criado com sucesso!", user: newUser });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    res.status(500).json({ message: "Erro no servidor ao criar utilizador." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "Utilizador não encontrado!" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Credenciais inválidas!" });

    const token = jwt.sign({ id: user.id_utilizador, nome: user.nome }, "segredo", { expiresIn: "1h" });

    res.json({
      token,
      id_utilizador: user.id_utilizador,
      nome: user.nome,
      primeiro_login: user.primeiro_login
    });
  } catch (error) {
    res.status(500).json({ message: "Erro no login", error });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id_utilizador, nova_password } = req.body;

    if (!id_utilizador || !nova_password) {
      return res.status(400).json({ message: "ID do utilizador e nova password são obrigatórios!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nova_password, salt);

    await User.update(
      { password: hashedPassword, primeiro_login: 0 },
      { where: { id_utilizador } }
    );

    res.json({ message: "Password alterada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar password:", error);
    res.status(500).json({ message: "Erro no servidor ao alterar password." });
  }
};

module.exports = { getAllUsers, getFormadores, getFormandos, getGestores, createUser, loginUser, changePassword };
