const Categoria = require("../database/models/Categoria");

// Obter todas as categorias
const getAllCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar categorias" });
  }
};

// Criar uma nova categoria
const createCategoria = async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "O nome da categoria é obrigatório!" });
    }

    const novaCategoria = await Categoria.create({ nome });

    res.status(201).json({ message: "Categoria criada com sucesso!", categoria: novaCategoria });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ message: "Erro no servidor ao criar categoria." });
  }
};

module.exports = { getAllCategorias, createCategoria };
