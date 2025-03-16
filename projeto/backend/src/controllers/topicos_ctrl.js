const Topico_Categoria = require("../database/models/Topico_Categoria");

// Obter todos os tópicos
const getAllTopicos = async (req, res) => {
  try {
    const topicos = await Topico_Categoria.findAll();
    res.json(topicos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar tópicos" });
  }
};

// Criar um novo tópico
const createTopico = async (req, res) => {
  try {
    const { id_categoria, titulo, descricao, criado_por } = req.body;

    if (!id_categoria || !titulo || !criado_por) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novoTopico = await Topico_Categoria.create({
      id_categoria,
      titulo,
      descricao,
      criado_por,
    });

    res.status(201).json({ message: "Tópico criado com sucesso!", topico: novoTopico });
  } catch (error) {
    console.error("Erro ao criar tópico:", error);
    res.status(500).json({ message: "Erro no servidor ao criar tópico." });
  }
};

module.exports = { getAllTopicos, createTopico };
