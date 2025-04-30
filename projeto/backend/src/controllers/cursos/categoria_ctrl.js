const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const { Op } = require('sequelize');

// Obter todas as categorias
const getAllCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      order: [['nome', 'ASC']]
    });
    res.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ message: "Erro ao buscar categorias", error: error.message });
  }
};

// Obter categoria por ID
const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    res.json(categoria);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    res.status(500).json({ message: "Erro ao buscar categoria", error: error.message });
  }
};

// Obter áreas por categoria
const getAreasByCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }
    
    // Buscar áreas que pertencem à categoria
    const areas = await Area.findAll({
      where: { id_categoria: id },
      order: [['nome', 'ASC']]
    });
    
    res.json(areas);
  } catch (error) {
    console.error(`Erro ao buscar áreas da categoria ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao buscar áreas da categoria", error: error.message });
  }
};

// Criar categoria (apenas admin)
const createCategoria = async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "Nome da categoria é obrigatório" });
    }

    // Verificar se já existe uma categoria com este nome
    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: {
          [Op.iLike]: nome // Busca case-insensitive
        }
      }
    });

    if (categoriaExistente) {
      return res.status(400).json({ message: "Já existe uma categoria com este nome" });
    }

    const novaCategoria = await Categoria.create({
      nome,
      descricao: descricao || ""
    });

    res.status(201).json({
      message: "Categoria criada com sucesso",
      categoria: novaCategoria
    });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ message: "Erro ao criar categoria", error: error.message });
  }
};

// Atualizar categoria
const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    // Se o nome está sendo alterado, verificar se já existe outra categoria com este nome
    if (nome && nome !== categoria.nome) {
      const categoriaExistente = await Categoria.findOne({
        where: {
          nome: {
            [Op.iLike]: nome
          },
          id_categoria: {
            [Op.ne]: id
          }
        }
      });

      if (categoriaExistente) {
        return res.status(400).json({ message: "Já existe outra categoria com este nome" });
      }
    }

    // Atualizar campos
    if (nome) categoria.nome = nome;
    if (descricao !== undefined) categoria.descricao = descricao;

    await categoria.save();

    res.json({
      message: "Categoria atualizada com sucesso",
      categoria
    });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ message: "Erro ao atualizar categoria", error: error.message });
  }
};

// Deletar categoria
const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se existem áreas associadas a esta categoria
    const areasAssociadas = await Area.count({
      where: { id_categoria: id }
    });

    if (areasAssociadas > 0) {
      return res.status(400).json({
        message: "Não é possível excluir esta categoria pois existem áreas associadas a ela",
        areasCount: areasAssociadas
      });
    }

    const resultado = await Categoria.destroy({
      where: { id_categoria: id }
    });

    if (resultado === 0) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    res.json({ message: "Categoria excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    res.status(500).json({ message: "Erro ao excluir categoria", error: error.message });
  }
};

module.exports = {
  getAllCategorias,
  getCategoriaById,
  getAreasByCategoria,
  createCategoria,
  updateCategoria,
  deleteCategoria
};