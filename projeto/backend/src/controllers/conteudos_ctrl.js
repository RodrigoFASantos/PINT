const Conteudo = require("../database/models/Conteudo");

// Obter todos os conteúdos
const getAllConteudos = async (req, res) => {
  try {
    const conteudos = await Conteudo.findAll();
    res.json(conteudos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar conteúdos" });
  }
};

// Criar um novo conteúdo
const createConteudo = async (req, res) => {
  try {
    const { id_curso, tipo, descricao, url_ou_ficheiro } = req.body;

    if (!id_curso || !tipo || !url_ou_ficheiro) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novoConteudo = await Conteudo.create({
      id_curso,
      tipo,
      descricao,
      url_ou_ficheiro,
    });

    res.status(201).json({ message: "Conteúdo criado com sucesso!", conteudo: novoConteudo });
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);
    res.status(500).json({ message: "Erro no servidor ao criar conteúdo." });
  }
};

module.exports = { getAllConteudos, createConteudo };
