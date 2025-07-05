const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

/**
 * Controlador para gestão de categorias de formação
 * 
 * Contém todas as funções para manipular categorias de formação,
 * incluindo operações CRUD com validações e gestão de transacções
 * para garantir a integridade dos dados.
 */

/**
 * Obter todas as categorias com paginação, filtros e contagem de áreas
 * 
 * @param {Request} req - Requisição HTTP
 * @param {Response} res - Resposta HTTP
 */
exports.getAllCategorias = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Converter para números e garantir valores válidos
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    
    // Calcular offset para paginação
    const offset = (pageNum - 1) * limitNum;
    
    // Configurar opções base da consulta
    const options = {
      limit: limitNum,
      offset,
      order: [['nome', 'ASC']]
    };
    
    // Construir filtros dinâmicos
    const where = {};
    
    // Filtro por nome - busca parcial e insensível a maiúsculas
    if (search && search.trim()) {
      where.nome = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }
    
    // Aplicar filtros se existirem
    if (Object.keys(where).length > 0) {
      options.where = where;
    }
    
    // Executar consulta com contagem total para paginação
    const { count, rows } = await Categoria.findAndCountAll(options);
    
    // Adicionar contagem de áreas para cada categoria
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
    
    // Calcular informações de paginação
    const totalPaginas = Math.ceil(count / limitNum);
    
    // Retornar resposta estruturada
    res.status(200).json({
      success: true,
      total: count,
      pages: totalPaginas,
      current_page: pageNum,
      categorias: categoriasComContagem,
      pagination_info: {
        has_previous: pageNum > 1,
        has_next: pageNum < totalPaginas,
        items_per_page: limitNum,
        total_items: count,
        showing_items: categoriasComContagem.length
      }
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
 * Obter dados detalhados de uma categoria específica
 * 
 * @param {Request} req - Requisição HTTP com id da categoria
 * @param {Response} res - Resposta HTTP
 */
exports.getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar categoria pelo ID
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Obter áreas associadas à categoria
    const areas = await Area.findAll({
      where: {
        id_categoria: id
      },
      attributes: ['id_area', 'nome'],
      order: [['nome', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      categoria: {
        ...categoria.toJSON(),
        areas,
        total_areas: areas.length
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
 * Criar uma nova categoria de formação
 * 
 * @param {Request} req - Requisição HTTP com dados da nova categoria
 * @param {Response} res - Resposta HTTP
 */
exports.createCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { nome } = req.body;
    
    // Validação dos dados obrigatórios
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório e não pode estar vazio'
      });
    }
    
    // Verificar duplicação de nome
    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: {
          [Op.iLike]: nome.trim()
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
    
    // Criar a nova categoria
    const novaCategoria = await Categoria.create(
      { nome: nome.trim() },
      { transaction }
    );
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      categoria: {
        ...novaCategoria.toJSON(),
        areas_count: 0
      }
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
 * Actualizar uma categoria existente
 * 
 * @param {Request} req - Requisição HTTP com ID da categoria e novos dados
 * @param {Response} res - Resposta HTTP
 */
exports.updateCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    // Validação dos dados obrigatórios
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório e não pode estar vazio'
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
    
    // Verificar duplicação de nome (excluindo a própria categoria)
    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: {
          [Op.iLike]: nome.trim()
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
    
    // Actualizar a categoria
    await categoria.update(
      { nome: nome.trim() },
      { transaction }
    );
    
    await transaction.commit();
    
    // Obter contagem de áreas para a resposta
    const areasCount = await Area.count({
      where: {
        id_categoria: id
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Categoria actualizada com sucesso',
      categoria: {
        ...categoria.toJSON(),
        areas_count: areasCount
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao actualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao actualizar categoria',
      error: error.message
    });
  }
};

/**
 * Eliminar uma categoria de formação
 * 
 * @param {Request} req - Requisição HTTP com ID da categoria a eliminar
 * @param {Response} res - Resposta HTTP
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
    
    // Verificar se existem áreas associadas
    const areasAssociadas = await Area.count({
      where: {
        id_categoria: id
      }
    });
    
    if (areasAssociadas > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Não é possível eliminar a categoria pois existem ${areasAssociadas} área(s) associada(s). Remove primeiro as áreas desta categoria.`
      });
    }
    
    // Guardar nome da categoria para confirmação
    const nomeCategoria = categoria.nome;
    
    // Eliminar a categoria
    await categoria.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: `Categoria "${nomeCategoria}" eliminada com sucesso`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao eliminar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar categoria',
      error: error.message
    });
  }
};