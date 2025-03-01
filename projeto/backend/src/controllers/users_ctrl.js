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





const createUser = async (req, res) => {
  try {
    const { id_cargo, nome, idade, email, telefone, password } = req.body;

    if (!id_cargo || !nome || !idade || !email || !telefone || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
    }

    //Insere o utilizador SEM definir manualmente id_utilizador (autoIncrement)
    const newUser = await User.create({
      id_cargo,
      nome,
      idade,
      email,
      telefone,
      password,
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
    res.json({ token, id_utilizador: user.id_utilizador, nome: user.nome });
  } catch (error) {
    res.status(500).json({ message: "Erro no login", error });
  }
};

module.exports = { getAllUsers, createUser, loginUser };
