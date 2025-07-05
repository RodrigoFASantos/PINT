const Area = require('../../database/models/Area');
const Categoria = require('../../database/models/Categoria');
const Curso = require('../../database/models/Curso');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

/**
 * Controlador para gestão de áreas de formação
 * 
 * Contém todas as funções para manipular áreas de formação,
 * incluindo operações CRUD com validações e gestão de transacções
 * para garantir a integridade dos dados.
 */

/**
 * Obter todas as áreas com paginação, filtros e contagem de cursos
 * 
 * @param {Request} req - Requisição HTTP
 * @param {Response} res - Resposta HTTP
 */
exports.getAllAreas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoria } = req.query;
    
    // Converter para números e garantir valores válidos
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    
    // Calcular offset para paginação
    const offset = (pageNum - 1) * limitNum;
    
    // Configurar opções base da consulta
    const options = {
      limit: limitNum,
      offset,
      order: [['nome', 'ASC']],
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    };
    
    // Construir filtros dinâmicos
    const where = {};
    
    // Filtro por nome - busca parcial e insensível a maiúsculas
    if (search && search.trim()) {
      where.nome = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }
    
    // Filtro por categoria específica
    if (categoria && categoria.trim()) {
      where.id_categoria = categoria.trim();
    }
    
    // Aplicar filtros se existirem
    if (Object.keys(where).length > 0) {
      options.where = where;
    }
    
    // Executar consulta com contagem total para paginação
    const { count, rows } = await Area.findAndCountAll(options);
    
    // Adicionar contagem de cursos para cada área
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
    
    // Calcular informações de paginação
    const totalPaginas = Math.ceil(count / limitNum);
    
    // Retornar resposta estruturada
    res.status(200).json({
      success: true,
      total: count,
      pages: totalPaginas,
      current_page: pageNum,
      areas: areasComContagem,
      pagination_info: {
        has_previous: pageNum > 1,
        has_next: pageNum < totalPaginas,
        items_per_page: limitNum,
        total_items: count,
        showing_items: areasComContagem.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar áreas', 
      error: error.message 
    });
  }
};

/**
 * Obter todas as áreas de uma categoria específica
 * 
 * @param {Request} req - Requisição HTTP com id_categoria nos parâmetros
 * @param {Response} res - Resposta HTTP
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
    
    // Buscar áreas da categoria ordenadas por nome
    const areas = await Area.findAll({
      where: {
        id_categoria
      },
      order: [['nome', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      categoria,
      areas,
      total_areas: areas.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar áreas por categoria',
      error: error.message
    });
  }
};

/**
 * Obter dados detalhados de uma área específica
 * 
 * @param {Request} req - Requisição HTTP com id da área
 * @param {Response} res - Resposta HTTP
 */
exports.getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar área com informações da categoria
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
    
    // Obter cursos associados à área
    const cursos = await Curso.findAll({
      where: {
        id_area: id
      },
      attributes: ['id_curso', 'nome', 'estado'],
      order: [['nome', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      area: {
        ...area.toJSON(),
        cursos,
        total_cursos: cursos.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar área',
      error: error.message
    });
  }
};

/**
 * Criar uma nova área de formação
 * 
 * @param {Request} req - Requisição HTTP com dados da nova área
 * @param {Response} res - Resposta HTTP
 */
exports.createArea = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { nome, id_categoria } = req.body;
    
    // Validação dos dados obrigatórios
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da área é obrigatório e não pode estar vazio'
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
        message: 'Categoria especificada não foi encontrada'
      });
    }
    
    // Verificar duplicação de nome na mesma categoria
    const areaExistente = await Area.findOne({
      where: {
        nome: {
          [Op.iLike]: nome.trim()
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
    
    // Criar a nova área
    const novaArea = await Area.create(
      { 
        nome: nome.trim(),
        id_categoria 
      },
      { transaction }
    );
    
    await transaction.commit();
    
    // Buscar área criada com informações da categoria
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
    res.status(500).json({
      success: false,
      message: 'Erro ao criar área',
      error: error.message
    });
  }
};

/**
 * Actualizar uma área existente
 * 
 * @param {Request} req - Requisição HTTP com ID da área e novos dados
 * @param {Response} res - Resposta HTTP
 */
exports.updateArea = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nome, id_categoria } = req.body;
    
    // Validação dos dados obrigatórios
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da área é obrigatório e não pode estar vazio'
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
    
    // Verificar se a nova categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Nova categoria especificada não foi encontrada'
      });
    }
    
    // Verificar duplicação de nome (excluindo a própria área)
    const areaExistente = await Area.findOne({
      where: {
        nome: {
          [Op.iLike]: nome.trim()
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
    
    // Actualizar a área
    await area.update(
      { 
        nome: nome.trim(),
        id_categoria 
      },
      { transaction }
    );
    
    await transaction.commit();
    
    // Buscar área actualizada com informações da categoria
    const areaAtualizada = await Area.findByPk(id, {
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    res.status(200).json({
      success: true,
      message: 'Área actualizada com sucesso',
      area: areaAtualizada
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Erro ao actualizar área',
      error: error.message
    });
  }
};

/**
 * Eliminar uma área de formação
 * 
 * @param {Request} req - Requisição HTTP com ID da área a eliminar
 * @param {Response} res - Resposta HTTP
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
    
    // Verificar se existem cursos associados
    const cursosAssociados = await Curso.count({
      where: {
        id_area: id
      }
    });
    
    if (cursosAssociados > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Não é possível eliminar a área pois existem ${cursosAssociados} curso(s) associado(s). Remove primeiro os cursos desta área.`
      });
    }
    
    // Guardar nome da área para confirmação
    const nomeArea = area.nome;
    
    // Eliminar a área
    await area.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: `Área "${nomeArea}" eliminada com sucesso`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar área',
      error: error.message
    });
  }
};