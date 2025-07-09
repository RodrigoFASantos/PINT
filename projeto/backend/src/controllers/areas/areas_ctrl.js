const Area = require('../../database/models/Area');
const Categoria = require('../../database/models/Categoria');
const Topico_Area = require('../../database/models/Topico_Area');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

/**
 * CONTROLADOR PARA GESTÃO DE ÁREAS DE FORMAÇÃO
 * 
 * Este controlador gere o segundo nível da hierarquia educacional:
 * Categoria → Área → Tópico → Curso
 * 
 * Implementa todas as operações CRUD para áreas de formação, garantindo
 * a integridade referencial com categorias (nível superior) e tópicos
 * (nível inferior) na estrutura hierárquica do sistema.
 * 
 * REGRAS DE NEGÓCIO PRINCIPAIS:
 * - Cada área deve sempre pertencer a uma categoria válida
 * - Nome de área deve ser único dentro da mesma categoria
 * - Área só pode ser eliminada se não tiver tópicos dependentes
 * - Todas as operações críticas usam transações para consistência
 * - Respostas seguem formato estruturado para facilitar uso no frontend
 */

/**
 * Obter lista paginada de áreas com informações das categorias
 * 
 * Esta função retorna todas as áreas do sistema com paginação avançada,
 * filtros opcionais e contagem dinâmica de tópicos associados.
 * Inclui também informações completas das categorias pai para facilitar
 * a navegação hierárquica na interface.
 * 
 * @param {Request} req - Objeto de requisição HTTP
 * @param {Response} res - Objeto de resposta HTTP
 * 
 * Query Parameters aceites:
 * - page: Número da página (padrão: 1)
 * - limit: Itens por página (padrão: 10, máximo: 100)
 * - search: Filtro de busca por nome da área (busca parcial)
 * - categoria: ID da categoria para filtrar áreas específicas
 */
exports.getAllAreas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoria } = req.query;
    
    // Conversão e validação dos parâmetros de paginação
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    
    // Cálculo do offset para a consulta SQL paginada
    const offset = (pageNum - 1) * limitNum;
    
    // Configuração base da consulta com associação à categoria
    const options = {
      limit: limitNum,
      offset,
      order: [['nome', 'ASC']],
      include: [{
        model: Categoria,
        as: 'categoriaParent',
        attributes: ['id_categoria', 'nome'],
        required: true // INNER JOIN para garantir que só apareçam áreas com categoria válida
      }]
    };
    
    // Construção dinâmica dos filtros de pesquisa
    const where = {};
    
    // Filtro por nome da área - busca parcial insensível a maiúsculas/minúsculas
    if (search && search.trim()) {
      where.nome = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }
    
    // Filtro por categoria específica
    if (categoria && categoria.trim()) {
      where.id_categoria = categoria.trim();
    }
    
    // Aplicação dos filtros apenas se existirem
    if (Object.keys(where).length > 0) {
      options.where = where;
    }
    
    // Execução da consulta principal com contagem total
    const { count, rows } = await Area.findAndCountAll(options);
    
    // Log para debug da consulta de áreas
    console.log(`[AREAS] Consultadas ${rows.length} áreas de um total de ${count}`);
    
    // Adição da contagem de tópicos para cada área
    // Operação feita em paralelo para melhor performance
    const areasComContagem = await Promise.all(rows.map(async (area) => {
      try {
        // Contagem dos tópicos associados a esta área específica
        const topicosCount = await Topico_Area.count({
          where: { id_area: area.id_area }
        });
        
        // Log detalhado para debug
        console.log(`[AREAS] Área ID ${area.id_area} ("${area.nome}") tem ${topicosCount} tópico(s)`);
        
        // Retorno do objeto área com contagem e categoria incluídas
        return {
          ...area.toJSON(),
          topicos_count: topicosCount
        };
      } catch (error) {
        // Em caso de erro na contagem, registar e assumir 0 tópicos
        console.error(`[AREAS] Erro ao contar tópicos para área ${area.id_area}:`, error.message);
        return {
          ...area.toJSON(),
          topicos_count: 0
        };
      }
    }));

    // Log de verificação dos dados retornados
    console.log(`[AREAS] A retornar ${areasComContagem.length} áreas com contagens calculadas`);
    
    // Cálculo das informações de paginação
    const totalPaginas = Math.ceil(count / limitNum);
    
    // Resposta estruturada com todas as informações necessárias
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
    // Gestão de erros com log detalhado
    console.error('[AREAS] Erro ao buscar áreas:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao carregar áreas', 
      error: error.message 
    });
  }
};

/**
 * Obter áreas de uma categoria específica
 * 
 * Esta função retorna todas as áreas pertencentes a uma categoria específica,
 * muito útil para seletores em cascata e navegação hierárquica na interface.
 * É frequentemente usada quando o utilizador seleciona uma categoria e precisa
 * das áreas correspondentes para o próximo nível da hierarquia.
 * 
 * @param {Request} req - Requisição HTTP com id_categoria nos parâmetros
 * @param {Response} res - Resposta HTTP com áreas da categoria
 */
exports.getAreasByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    
    // Verificação da existência da categoria antes de procurar áreas
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Busca de áreas da categoria específica, ordenadas por nome
    const areas = await Area.findAll({
      where: {
        id_categoria
      },
      order: [['nome', 'ASC']]
    });
    
    console.log(`[AREAS] Encontradas ${areas.length} áreas para categoria ${id_categoria} ("${categoria.nome}")`);
    
    // Resposta com categoria e suas áreas
    res.status(200).json({
      success: true,
      categoria,
      areas,
      total_areas: areas.length
    });
    
  } catch (error) {
    console.error('[AREAS] Erro ao buscar áreas por categoria:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar áreas por categoria',
      error: error.message
    });
  }
};

/**
 * Obter dados detalhados de uma área específica
 * 
 * Esta função retorna informações completas de uma área específica,
 * incluindo dados da categoria pai e lista completa de tópicos associados.
 * É útil para páginas de detalhes e para verificação de dependências
 * antes de operações como edição ou eliminação.
 * 
 * @param {Request} req - Requisição HTTP com ID da área nos parâmetros
 * @param {Response} res - Resposta HTTP com dados completos da área
 */
exports.getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca da área com informações da categoria pai
    const area = await Area.findByPk(id, {
      include: [{
        model: Categoria,
        as: 'categoriaParent',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    // Validação da existência da área
    if (!area) {
      return res.status(404).json({ 
        success: false, 
        message: 'Área não encontrada' 
      });
    }
    
    // Busca dos tópicos associados à área
    const topicos = await Topico_Area.findAll({
      where: {
        id_area: id
      },
      attributes: ['id_topico', 'titulo', 'ativo'],
      order: [['titulo', 'ASC']]
    });
    
    console.log(`[AREAS] Área ${id} consultada com ${topicos.length} tópicos`);
    
    // Resposta com dados completos da área
    res.status(200).json({
      success: true,
      area: {
        ...area.toJSON(),
        topicos,
        total_topicos: topicos.length
      }
    });
    
  } catch (error) {
    console.error('[AREAS] Erro ao buscar área por ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar área',
      error: error.message
    });
  }
};

/**
 * Criar nova área de formação
 * 
 * Esta função cria uma nova área associada a uma categoria existente,
 * com validação rigorosa de unicidade do nome dentro da categoria.
 * Usa transações para garantir consistência e integridade dos dados.
 * 
 * @param {Request} req - Requisição HTTP com dados da nova área
 * @param {Response} res - Resposta HTTP com área criada
 */
exports.createArea = async (req, res) => {
  // Iniciar transação para garantir operação atómica
  const transaction = await sequelize.transaction();
  
  try {
    const { nome, id_categoria } = req.body;
    
    // Validação obrigatória do nome da área
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da área é obrigatório e não pode estar vazio'
      });
    }
    
    // Validação obrigatória da categoria
    if (!id_categoria) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A categoria é obrigatória'
      });
    }
    
    // Verificação da existência da categoria especificada
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria especificada não foi encontrada'
      });
    }
    
    // Verificação de duplicação de nome dentro da mesma categoria
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
    
    // Criação da nova área dentro da transação
    const novaArea = await Area.create(
      { 
        nome: nome.trim(),
        id_categoria 
      },
      { transaction }
    );
    
    // Confirmação da transação
    await transaction.commit();
    
    // Busca da área criada com informações da categoria
    const areaComCategoria = await Area.findByPk(novaArea.id_area, {
      include: [{
        model: Categoria,
        as: 'categoriaParent',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    console.log(`[AREAS] Nova área criada: ID ${novaArea.id_area} - "${novaArea.nome}" na categoria ${id_categoria}`);
    
    // Resposta de sucesso com área criada
    res.status(201).json({
      success: true,
      message: 'Área criada com sucesso',
      area: areaComCategoria
    });
    
  } catch (error) {
    // Rollback da transação em caso de erro
    await transaction.rollback();
    console.error('[AREAS] Erro ao criar área:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar área',
      error: error.message
    });
  }
};

/**
 * Atualizar área existente
 * 
 * Esta função permite atualizar dados de uma área existente, incluindo
 * mudança de categoria. Mantém todas as validações de unicidade e
 * integridade referencial através de transações.
 * 
 * @param {Request} req - Requisição HTTP com ID da área e novos dados
 * @param {Response} res - Resposta HTTP com área atualizada
 */
exports.updateArea = async (req, res) => {
  // Iniciar transação para operação atómica
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nome, id_categoria } = req.body;
    
    console.log(`[AREAS] A atualizar área ID ${id} com dados:`, { nome, id_categoria });

    // Validação obrigatória do nome
    if (!nome || nome.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O nome da área é obrigatório e não pode estar vazio'
      });
    }
    
    // Validação obrigatória da categoria
    if (!id_categoria) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A categoria é obrigatória'
      });
    }
    
    // Verificação da existência da área a atualizar
    const area = await Area.findByPk(id);
    
    if (!area) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }
    
    // Verificação da existência da nova categoria
    const categoria = await Categoria.findByPk(id_categoria);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Nova categoria especificada não foi encontrada'
      });
    }
    
    // Verificação de duplicação de nome na categoria (excluindo a própria área)
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
    
    // Atualização da área dentro da transação
    await area.update(
      { 
        nome: nome.trim(),
        id_categoria 
      },
      { transaction }
    );
    
    // Confirmação da transação
    await transaction.commit();
    
    // Busca da área atualizada com informações da categoria
    const areaAtualizada = await Area.findByPk(id, {
      include: [{
        model: Categoria,
        as: 'categoriaParent',
        attributes: ['id_categoria', 'nome']
      }]
    });
    
    console.log(`[AREAS] Área atualizada: ID ${id} - novo nome: "${nome.trim()}" - nova categoria: ${id_categoria}`);
    
    // Resposta com área atualizada
    res.status(200).json({
      success: true,
      message: 'Área atualizada com sucesso',
      area: areaAtualizada
    });
    
  } catch (error) {
    // Rollback da transação em caso de erro
    await transaction.rollback();
    console.error('[AREAS] Erro ao atualizar área:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar área',
      error: error.message
    });
  }
};

/**
 * Eliminar área de formação
 * 
 * FUNÇÃO CRÍTICA COM VALIDAÇÃO DE INTEGRIDADE REFERENCIAL
 * 
 * Esta operação é irreversível e só pode ser executada se a área
 * não tiver tópicos dependentes. É fundamental para manter a
 * hierarquia do sistema intacta e evitar referências órfãs.
 * 
 * A validação de dependências é rigorosa:
 * - Verifica todos os tópicos associados à área
 * - Bloqueia eliminação se houver qualquer dependência
 * - Usa transações para garantir consistência total
 * 
 * @param {Request} req - Requisição HTTP com ID da área a eliminar
 * @param {Response} res - Resposta HTTP com resultado da operação
 */
exports.deleteArea = async (req, res) => {
  // Transação obrigatória para operação de eliminação
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verificação da existência da área
    const area = await Area.findByPk(id);
    
    if (!area) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Área não encontrada'
      });
    }
    
    // VALIDAÇÃO CRÍTICA: Verificar dependências (tópicos associados)
    const topicosAssociados = await Topico_Area.count({
      where: {
        id_area: id
      }
    });
    
    // Bloquear eliminação se houver tópicos dependentes
    if (topicosAssociados > 0) {
      await transaction.rollback();
      console.log(`[AREAS] Tentativa de eliminar área ${id} bloqueada - tem ${topicosAssociados} tópico(s) associado(s)`);
      return res.status(400).json({
        success: false,
        message: `Não é possível eliminar a área pois existem ${topicosAssociados} tópico(s) associado(s). Remove primeiro os tópicos desta área ou elimina-os (o que também removerá cursos e chats associados).`,
        dependencias: {
          topicos: topicosAssociados
        }
      });
    }
    
    // Guardar nome da área para confirmação na resposta
    const nomeArea = area.nome;
    
    // Eliminação da área (só executa se não houver dependências)
    await area.destroy({ transaction });
    
    // Confirmação da transação
    await transaction.commit();
    
    console.log(`[AREAS] Área eliminada com sucesso: "${nomeArea}" (ID: ${id})`);
    
    // Resposta de confirmação
    res.status(200).json({
      success: true,
      message: `Área "${nomeArea}" eliminada com sucesso`
    });
    
  } catch (error) {
    // Rollback obrigatório em caso de erro
    await transaction.rollback();
    console.error('[AREAS] Erro ao eliminar área:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar área',
      error: error.message
    });
  }
};