const Area = require('../../database/models/Area');
const Categoria = require('../../database/models/Categoria');
const Curso = require('../../database/models/Curso');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

/**
 * Obter todas as áreas com paginação e filtros
 */
exports.getAllAreas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoria } = req.query;
    
    // Calcular offset para paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir opções de consulta
    const options = {
      limit: parseInt(limit),
      offset,
      order: [['nome', 'ASC']],
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    };
    
    // Adicionar filtros se fornecidos
    const where = {};
    
    if (search) {
      where.nome = {
        [Op.iLike]: `%${search}%`
      };
    }
    
    if (categoria) {
      where.id_categoria = categoria;
    }
    
    if (Object.keys(where).length > 0) {
      options.where = where;
    }
    
    // Realizar a consulta
    const { count, rows } = await Area.findAndCountAll(options);
    
    // Se solicitado, incluir contagem de cursos para cada área
    const areasComContagem = await Promise.all(rows.map(async (area) => {
      const cursosCount = await Curso.count({
        where: {
          id_area: area.id_area
        }
      });
      
      return {
        ...area.toJSON(),
        cursos_count: cursosCount
      };
    }));
    
    // Enviar resposta
    res.status(200).json({
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      current_page: parseInt(page),
      areas: areasComContagem
    });
  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar áreas', 
      error: error.message 
    });
  }
};

/**
 * Obter todas as áreas de uma categoria específica
 */
exports.getAreasByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Buscar áreas da categoria
    const areas = await Area.findAll({
      where: {
        id_categoria
      },
      order: [['nome', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      categoria,
      areas
    });
  } catch (error) {
    console.error('Erro ao buscar áreas por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar áreas por categoria',
      error: error.message
    });
  }
};

/**
 * Obter uma área específica pelo ID
 */
exports.getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const area = await Area.findByPk(id, {
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    if (!area) {
      return res.status(404).json({ 
        success: false, 
        message: 'Área não encontrada' 
      });
    }
    
    // Obter cursos associados
    const cursos = await Curso.findAll({
      where: {
        id_area: id
      },
      attributes: ['id_curso', 'nome', 'estado']
    });
    
    res.status(200).json({
      success: true,
      area: {
        ...area.toJSON(),
        cursos
      }
    });
  } catch (error) {
    console.error('Erro ao buscar área:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar área',
      error: error.message
    });
  }
};

/**
 * Criar uma nova área
 */
exports.createArea = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { nome, id_categoria } = req.body;
    
    // Validar dados de entrada
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da área é obrigatório'
      });
    }
    
    if (!id_categoria) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A categoria é obrigatória'
      });
    }
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Verificar se já existe uma área com o mesmo nome na mesma categoria
    const areaExistente = await Area.findOne({
      where: {
        nome: {
          [Op.iLike]: nome
        },
        id_categoria
      }
    });
    
    if (areaExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Já existe uma área com este nome nesta categoria'
      });
    }
    
    // Criar a área
    const novaArea = await Area.create(
      { nome, id_categoria },
      { transaction }
    );
    
    await transaction.commit();
    
    // Buscar a área com a relação de categoria para retornar
    const areaComCategoria = await Area.findByPk(novaArea.id_area, {
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Área criada com sucesso',
      area: areaComCategoria
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar área:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar área',
      error: error.message
    });
  }
};

/**
 * Atualizar uma área existente
 */
exports.updateArea = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nome, id_categoria } = req.body;
    
    // Validar dados de entrada
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da área é obrigatório'
      });
    }
    
    if (!id_categoria) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A categoria é obrigatória'
      });
    }
    
    // Verificar se a área existe
    const area = await Area.findByPk(id);
    
    if (!area) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Verificar se já existe outra área com o mesmo nome na mesma categoria
    const areaExistente = await Area.findOne({
      where: {
        nome: {
          [Op.iLike]: nome
        },
        id_categoria,
        id_area: {
          [Op.ne]: id
        }
      }
    });
    
    if (areaExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Já existe outra área com este nome nesta categoria'
      });
    }
    
    // Atualizar a área
    await area.update(
      { nome, id_categoria },
      { transaction }
    );
    
    await transaction.commit();
    
    // Buscar a área atualizada com a relação de categoria para retornar
    const areaAtualizada = await Area.findByPk(id, {
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    res.status(200).json({
      success: true,
      message: 'Área atualizada com sucesso',
      area: areaAtualizada
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao atualizar área:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar área',
      error: error.message
    });
  }
};

/**
 * Excluir uma área
 */
exports.deleteArea = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificar se a área existe
    const area = await Area.findByPk(id);
    
    if (!area) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }
    
    // Verificar se existem cursos associados a esta área
    const cursosAssociados = await Curso.count({
      where: {
        id_area: id
      }
    });
    
    if (cursosAssociados > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir a área pois existem cursos associados'
      });
    }
    
    // Excluir a área
    await area.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Área excluída com sucesso'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao excluir área:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir área',
      error: error.message
    });
  }
};