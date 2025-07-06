const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

/**
 * Controlador para gestão de categorias de formação
 * Implementa todas as operações CRUD com validações e contagem de áreas associadas
 */

/**
 * Obter lista paginada de categorias com contagem de áreas
 * Suporta paginação, filtros de pesquisa e ordenação alfabética
 */
exports.getAllCategorias = async (req, res) => {
  try {
    console.log('📋 [CATEGORIAS] Iniciando busca de categorias...');
    
    const { page = 1, limit = 10, search } = req.query;
    
    // Validação e conversão dos parâmetros de paginação
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    console.log(`📋 [CATEGORIAS] Parâmetros: página ${pageNum}, limite ${limitNum}, busca: "${search || 'sem filtro'}"`);
    
    // Configuração da consulta base
    const options = {
      limit: limitNum,
      offset,
      order: [['nome', 'ASC']],
      attributes: ['id_categoria', 'nome']
    };
    
    // Aplicar filtro de pesquisa se fornecido
    if (search && search.trim()) {
      options.where = {
        nome: {
          [Op.iLike]: `%${search.trim()}%`
        }
      };
      console.log(`📋 [CATEGORIAS] Aplicado filtro de pesquisa: "${search.trim()}"`);
    }
    
    // Buscar categorias com contagem total
    const { count, rows } = await Categoria.findAndCountAll(options);
    
    console.log(`📋 [CATEGORIAS] Encontradas ${rows.length} categorias de um total de ${count}`);
    
    // Buscar contagem de áreas para cada categoria de forma eficiente
    const categoriasComContagem = await Promise.all(
      rows.map(async (categoria) => {
        try {
          console.log(`🔍 [CATEGORIAS] A contar áreas para categoria ${categoria.id_categoria}: "${categoria.nome}"`);
          
          // Usar raw query para garantir que funciona independentemente do modelo
          const [resultados] = await sequelize.query(
            'SELECT COUNT(*) as total FROM areas WHERE id_categoria = :categoriaId',
            {
              replacements: { categoriaId: categoria.id_categoria },
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          const areasCount = parseInt(resultados.total) || 0;
          
          console.log(`✅ [CATEGORIAS] Categoria "${categoria.nome}" tem ${areasCount} área(s)`);
          
          return {
            id_categoria: categoria.id_categoria,
            nome: categoria.nome,
            areas_count: areasCount
          };
          
        } catch (error) {
          console.error(`❌ [CATEGORIAS] Erro ao contar áreas para categoria ${categoria.id_categoria}:`, error.message);
          
          // Em caso de erro, retornar 0 para manter a funcionalidade
          return {
            id_categoria: categoria.id_categoria,
            nome: categoria.nome,
            areas_count: 0
          };
        }
      })
    );
    
    // Calcular informações de paginação
    const totalPaginas = Math.ceil(count / limitNum);
    
    console.log(`📋 [CATEGORIAS] Resposta preparada com ${categoriasComContagem.length} categorias`);
    
    // Log detalhado do resultado para debug
    categoriasComContagem.forEach((cat, index) => {
      console.log(`📋 [CATEGORIAS] ${index + 1}. ${cat.nome} (ID: ${cat.id_categoria}) - ${cat.areas_count} área(s)`);
    });
    
    // Resposta estruturada
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
    console.error('❌ [CATEGORIAS] Erro ao buscar categorias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao carregar categorias', 
      error: error.message 
    });
  }
};

/**
 * Obter dados detalhados de uma categoria específica
 * Inclui lista completa de áreas associadas
 */
exports.getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 [CATEGORIAS] A buscar categoria com ID: ${id}`);
    
    // Buscar categoria pelo ID
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      console.log(`❌ [CATEGORIAS] Categoria com ID ${id} não encontrada`);
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Buscar áreas associadas à categoria
    const areas = await Area.findAll({
      where: { id_categoria: id },
      attributes: ['id_area', 'nome'],
      order: [['nome', 'ASC']]
    });
    
    console.log(`✅ [CATEGORIAS] Categoria "${categoria.nome}" encontrada com ${areas.length} área(s)`);
    
    res.status(200).json({
      success: true,
      categoria: {
        id_categoria: categoria.id_categoria,
        nome: categoria.nome,
        areas,
        total_areas: areas.length
      }
    });
    
  } catch (error) {
    console.error('❌ [CATEGORIAS] Erro ao buscar categoria por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar categoria',
      error: error.message
    });
  }
};

/**
 * Criar nova categoria de formação
 * Valida unicidade do nome e cria categoria dentro de transação
 */
exports.createCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { nome } = req.body;
    
    console.log(`➕ [CATEGORIAS] Tentativa de criar categoria: "${nome}"`);
    
    // Validar nome obrigatório
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      console.log('❌ [CATEGORIAS] Nome da categoria é obrigatório');
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório e não pode estar vazio'
      });
    }
    
    // Verificar se já existe categoria com o mesmo nome
    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: { [Op.iLike]: nome.trim() }
      }
    });
    
    if (categoriaExistente) {
      await transaction.rollback();
      console.log(`❌ [CATEGORIAS] Já existe categoria com nome "${nome.trim()}"`);
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }
    
    // Criar nova categoria
    const novaCategoria = await Categoria.create(
      { nome: nome.trim() },
      { transaction }
    );
    
    await transaction.commit();
    
    console.log(`✅ [CATEGORIAS] Categoria criada: ID ${novaCategoria.id_categoria} - "${novaCategoria.nome}"`);
    
    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      categoria: {
        id_categoria: novaCategoria.id_categoria,
        nome: novaCategoria.nome,
        areas_count: 0 // Nova categoria sempre começa com 0 áreas
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ [CATEGORIAS] Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar categoria',
      error: error.message
    });
  }
};

/**
 * Atualizar categoria existente
 * Valida existência e unicidade do novo nome
 */
exports.updateCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    console.log(`✏️ [CATEGORIAS] Tentativa de atualizar categoria ID ${id} para: "${nome}"`);
    
    // Validar nome obrigatório
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório e não pode estar vazio'
      });
    }
    
    // Verificar se categoria existe
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      await transaction.rollback();
      console.log(`❌ [CATEGORIAS] Categoria com ID ${id} não encontrada para atualização`);
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Verificar duplicação (excluindo a própria categoria)
    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: { [Op.iLike]: nome.trim() },
        id_categoria: { [Op.ne]: id }
      }
    });
    
    if (categoriaExistente) {
      await transaction.rollback();
      console.log(`❌ [CATEGORIAS] Já existe outra categoria com nome "${nome.trim()}"`);
      return res.status(400).json({
        success: false,
        message: 'Já existe outra categoria com este nome'
      });
    }
    
    // Atualizar categoria
    await categoria.update({ nome: nome.trim() }, { transaction });
    await transaction.commit();
    
    // Contar áreas atuais para incluir na resposta
    const [resultado] = await sequelize.query(
      'SELECT COUNT(*) as total FROM areas WHERE id_categoria = :categoriaId',
      {
        replacements: { categoriaId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const areasCount = parseInt(resultado.total) || 0;
    
    console.log(`✅ [CATEGORIAS] Categoria atualizada: ID ${id} - "${nome.trim()}" (${areasCount} área(s))`);
    
    res.status(200).json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      categoria: {
        id_categoria: categoria.id_categoria,
        nome: categoria.nome,
        areas_count: areasCount
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ [CATEGORIAS] Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar categoria',
      error: error.message
    });
  }
};

/**
 * Eliminar categoria de formação
 * Valida se não existem áreas associadas antes de eliminar
 */
exports.deleteCategoria = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    console.log(`🗑️ [CATEGORIAS] Tentativa de eliminar categoria com ID: ${id}`);
    
    // Verificar se categoria existe
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      await transaction.rollback();
      console.log(`❌ [CATEGORIAS] Categoria com ID ${id} não encontrada para eliminação`);
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Verificar se existem áreas associadas (CRÍTICO: bloquear eliminação se houver dependências)
    const [resultado] = await sequelize.query(
      'SELECT COUNT(*) as total FROM areas WHERE id_categoria = :categoriaId',
      {
        replacements: { categoriaId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const areasAssociadas = parseInt(resultado.total) || 0;
    
    if (areasAssociadas > 0) {
      await transaction.rollback();
      console.log(`❌ [CATEGORIAS] Categoria "${categoria.nome}" não pode ser eliminada - tem ${areasAssociadas} área(s) associada(s)`);
      return res.status(400).json({
        success: false,
        message: `Não é possível eliminar a categoria pois existem ${areasAssociadas} área(s) associada(s). Remove primeiro as áreas desta categoria ou reatribui-as a outra categoria.`
      });
    }
    
    const nomeCategoria = categoria.nome;
    
    // Eliminar categoria (só executa se não houver dependências)
    await categoria.destroy({ transaction });
    await transaction.commit();
    
    console.log(`✅ [CATEGORIAS] Categoria "${nomeCategoria}" eliminada com sucesso`);
    
    res.status(200).json({
      success: true,
      message: `Categoria "${nomeCategoria}" eliminada com sucesso`
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ [CATEGORIAS] Erro ao eliminar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar categoria',
      error: error.message
    });
  }
};