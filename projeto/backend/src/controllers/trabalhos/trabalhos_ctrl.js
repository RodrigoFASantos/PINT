const Trabalho_Entregue = require("../../database/models/Trabalho_Entregue");

// Obter todos os trabalhos entregues
const getAllTrabalhos = async (req, res) => {
  try {
    const trabalhos = await Trabalho_Entregue.findAll();
    res.json(trabalhos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar trabalhos" });
  }
};

// Criar novo trabalho entregue
const createTrabalho = async (req, res) => {
  try {
    const { id_inscricao } = req.body;
    const ficheiro_path = req.file ? req.file.path : null;

    if (!id_inscricao || !ficheiro_path) {
      return res.status(400).json({ message: "ID de inscrição e ficheiro são obrigatórios!" });
    }

    const novoTrabalho = await Trabalho_Entregue.create({
      id_inscricao,
      ficheiro_path,
    });

    res.status(201).json({ message: "Trabalho entregue com sucesso!", trabalho: novoTrabalho });
  } catch (error) {
    console.error("Erro ao entregar trabalho:", error);
    res.status(500).json({ message: "Erro no servidor ao entregar trabalho." });
  }
};

module.exports = { getAllTrabalhos, createTrabalho };
