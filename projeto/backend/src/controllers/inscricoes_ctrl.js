const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const User = require("../database/models/User");
const Curso = require("../database/models/Curso");
const { sendEnrollmentEmail } = require("../utils/emailService");

// Obter todas as inscrições
const getAllInscricoes = async (req, res) => {
  try {
    const inscricoes = await Inscricao_Curso.findAll();
    res.json(inscricoes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
};

const createInscricao = async (req, res) => {
  try {
    const { id_utilizador, id_curso } = req.body;

    if (!id_utilizador || !id_curso) {
      return res.status(400).json({ message: "id_utilizador e id_curso são obrigatórios!" });
    }

    const novaInscricao = await Inscricao_Curso.create({
      id_utilizador,
      id_curso,
    });

    // Buscar informações do usuário e curso para o email
    const user = await User.findByPk(id_utilizador);
    const curso = await Curso.findByPk(id_curso);

    // Enviar email de confirmação de inscrição
    if (user && curso) {
      await sendEnrollmentEmail(user, curso);
    }

    res.status(201).json({ message: "Inscrição criada com sucesso!", inscricao: novaInscricao });
  } catch (error) {
    console.error("Erro ao criar inscrição:", error);
    res.status(500).json({ message: "Erro no servidor ao criar inscrição." });
  }
};

module.exports = { getAllInscricoes, createInscricao };
