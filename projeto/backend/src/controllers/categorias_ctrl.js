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
    const { nome, imagem } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "O nome da categoria é obrigatório!" });
    }

    const novaCategoria = await Categoria.create({ nome, imagem });

    res.status(201).json({ message: "Categoria criada com sucesso!", categoria: novaCategoria });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ message: "Erro no servidor ao criar categoria." });
  }
};

// Atualizar categoria
const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, imagem } = req.body;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada!" });
    }

    categoria.nome = nome || categoria.nome;
    categoria.imagem = imagem || categoria.imagem;

    await categoria.save();

    res.json({ message: "Categoria atualizada com sucesso!", categoria });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ message: "Erro no servidor ao atualizar categoria." });
  }
};

// Apagar categoria
const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada!" });
    }

    await categoria.destroy();

    res.json({ message: "Categoria apagada com sucesso!" });
  } catch (error) {
    console.error("Erro ao apagar categoria:", error);
    res.status(500).json({ message: "Erro no servidor ao apagar categoria." });
  }
};

module.exports = { getAllCategorias, createCategoria, updateCategoria, deleteCategoria };
