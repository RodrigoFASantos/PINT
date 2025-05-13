const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

/**
 * Obter todas as categorias com paginação e filtros
 */
exports.getAllCategorias = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Calcular offset para paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir opções de consulta
    const options = {
      limit: parseInt(limit),
      offset,
      order: [['nome', 'ASC']]
    };
    
    // Adicionar filtragem por nome, se fornecido
    if (search) {
      options.where = {
        nome: {
          [Op.iLike]: `%${search}%`
        }
      };
    }
    
    // Realizar a consulta
    const { count, rows } = await Categoria.findAndCountAll(options);
    
    // Se solicitado, incluir contagem de áreas para cada categoria
    const categoriasComContagem = await Promise.all(rows.map(async (categoria) => {
      const areasCount = await Area.count({
        where: {
          id_categoria: categoria.id_categoria
        }
      });
      
      return {
        ...categoria.toJSON(),
        areas_count: areasCount
      };
    }));
    
    // Enviar resposta
    res.status(200).json({
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      current_page: parseInt(page),
      categorias: categoriasComContagem
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar categorias', 
      error: error.message 
    });
  }
};

/**
 * Obter uma categoria específica pelo ID
 */
exports.getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Obter áreas associadas
    const areas = await Area.findAll({
      where: {
        id_categoria: id
      }
    });
    
    res.status(200).json({
      success: true,
      categoria: {
        ...categoria.toJSON(),
        areas
      }
    });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categoria',
      error: error.message
    });
  }
};

/**
 * Criar uma nova categoria
 */
exports.createCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { nome } = req.body;
    
    // Validar dados de entrada
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório'
      });
    }
    
    // Verificar se já existe uma categoria com o mesmo nome
    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: {
          [Op.iLike]: nome
        }
      }
    });
    
    if (categoriaExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }
    
    // Criar a categoria
    const novaCategoria = await Categoria.create(
      { nome },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      categoria: novaCategoria
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar categoria',
      error: error.message
    });
  }
};

/**
 * Atualizar uma categoria existente
 */
exports.updateCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    // Validar dados de entrada
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório'
      });
    }
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Verificar se já existe outra categoria com o mesmo nome
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
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Já existe outra categoria com este nome'
      });
    }
    
    // Atualizar a categoria
    await categoria.update(
      { nome },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      categoria
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar categoria',
      error: error.message
    });
  }
};

/**
 * Excluir uma categoria
 */
exports.deleteCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Verificar se existem áreas associadas a esta categoria
    const areasAssociadas = await Area.count({
      where: {
        id_categoria: id
      }
    });
    
    if (areasAssociadas > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir a categoria pois existem áreas associadas'
      });
    }
    
    // Excluir a categoria
    await categoria.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Categoria excluída com sucesso'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir categoria',
      error: error.message
    });
  }
};