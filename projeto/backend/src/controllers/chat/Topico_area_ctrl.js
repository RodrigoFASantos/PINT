const { Topico_Area, ChatMensagem, ChatInteracao, ChatDenuncia, User, Categoria, Area } = require('../../database/associations');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

/**
 * CONTROLADOR PARA SISTEMA UNIFICADO DE TÓPICOS DE CHAT E FÓRUM
 * 
 * Este controlador gere o sistema completo de discussão em tempo real,
 * combinando funcionalidades de fórum tradicional com chat dinâmico.
 * Permite a criação, gestão e moderação de tópicos de discussão organizados por categoria.
 */

// =============================================================================
// FUNÇÕES AUXILIARES PARA GESTÃO DE FICHEIROS
// =============================================================================

/**
 * Criar estrutura de diretórios para chat
 */
const createChatDirectoryStructure = (categoriaNome, topicoNome) => {
  try {
    const categoriaSlug = uploadUtils.normalizarNome(categoriaNome);
    const topicoSlug = uploadUtils.normalizarNome(topicoNome);
    
    return uploadUtils.criarDiretoriosChat(categoriaSlug, topicoSlug);
  } catch (error) {
    console.error('Erro ao criar estrutura de diretórios:', error);
    return null;
  }
};

/**
 * Mover ficheiro para localização definitiva
 */
const moveFile = (origem, destino) => {
  return uploadUtils.moverArquivo(origem, destino);
};

/**
 * Determinar tipo de ficheiro baseado no MIME type
 */
const getFileType = (mimetype) => {
  return uploadUtils.getFileType(mimetype);
};

// =============================================================================
// CONSULTA E NAVEGAÇÃO DE TÓPICOS
// =============================================================================

/**
 * Obter todos os tópicos com paginação, filtros e contagem
 * Similar à função getAllAreas do controlador de áreas
 * 
 * @param {Request} req - Requisição HTTP
 * @param {Response} res - Resposta HTTP
 */
const getAllTopicosCategoria = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoria, area, grouped } = req.query;
    
    // Converter para números e garantir valores válidos
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    
    // Calcular offset para paginação
    const offset = (pageNum - 1) * limitNum;
    
    // Configurar opções base da consulta
    const options = {
      where: { ativo: true },
      limit: limitNum,
      offset,
      order: [['data_criacao', 'DESC']],
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id_area', 'nome']
        },
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email']
        }
      ]
    };
    
    // Construir filtros dinâmicos
    const where = { ativo: true };
    
    // Filtro por título/descrição - busca parcial e insensível a maiúsculas
    if (search && search.trim()) {
      where[Op.or] = [
        { titulo: { [Op.iLike]: `%${search.trim()}%` } },
        { descricao: { [Op.iLike]: `%${search.trim()}%` } }
      ];
    }
    
    // Filtro por categoria específica
    if (categoria && categoria.trim()) {
      where.id_categoria = categoria.trim();
    }
    
    // Filtro por área específica
    if (area && area.trim()) {
      where.id_area = area.trim();
    }
    
    // Aplicar filtros se existirem
    if (Object.keys(where).length > 0) {
      options.where = where;
    }
    
    // Executar consulta com contagem total para paginação
    const { count, rows } = await Topico_Area.findAndCountAll(options);
    
    // Adicionar contagem de mensagens para cada tópico
    const topicosComContagem = await Promise.all(rows.map(async (topico) => {
      const mensagensCount = await ChatMensagem.count({
        where: {
          id_topico: topico.id_topico
        }
      });
      
      return {
        ...topico.toJSON(),
        mensagens_count: mensagensCount
      };
    }));
    
    // Calcular informações de paginação
    const totalPaginas = Math.ceil(count / limitNum);
    
    // Se é para agrupamento por categoria, organizar os dados
    if (grouped === 'true') {
      const topicosPorCategoria = {};
      
      topicosComContagem.forEach(topico => {
        const categoriaId = topico.id_categoria || 'sem_categoria';
        
        if (!topicosPorCategoria[categoriaId]) {
          topicosPorCategoria[categoriaId] = {
            id_categoria: categoriaId,
            nome: topico.categoria ? topico.categoria.nome : 'Sem categoria',
            topicos_categoria: []
          };
        }
        
        topicosPorCategoria[categoriaId].topicos_categoria.push(topico);
      });
      
      const categoriasComTopicos = Object.values(topicosPorCategoria);
      
      return res.status(200).json({
        success: true,
        data: categoriasComTopicos,
        total_categorias: categoriasComTopicos.length
      });
    }
    
    // Retornar resposta estruturada para listagem simples
    res.status(200).json({
      success: true,
      total: count,
      pages: totalPaginas,
      current_page: pageNum,
      data: topicosComContagem,
      pagination_info: {
        has_previous: pageNum > 1,
        has_next: pageNum < totalPaginas,
        items_per_page: limitNum,
        total_items: count,
        showing_items: topicosComContagem.length
      }
    });
  } catch (error) {
    console.error('Erro ao obter tópicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter tópicos',
      error: error.message
    });
  }
};

/**
 * Obter dados detalhados de um tópico específico
 */
const getTopicoById = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await Topico_Area.findOne({
      where: { id_topico: id, ativo: true },
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id_area', 'nome']
        }
      ]
    });

    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado ou inativo'
      });
    }
    
    // Estatísticas do tópico
    const estatisticas = await ChatMensagem.findOne({
      where: { id_topico: id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_mensagens'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('id_utilizador'))), 'participantes_unicos'],
        [sequelize.fn('MAX', sequelize.col('data_criacao')), 'ultima_atividade']
      ],
      raw: true
    });

    const topicoCompleto = {
      ...topico.toJSON(),
      estatisticas: {
        total_mensagens: parseInt(estatisticas?.total_mensagens) || 0,
        participantes_unicos: parseInt(estatisticas?.participantes_unicos) || 0,
        ultima_atividade: estatisticas?.ultima_atividade || null
      }
    };

    res.status(200).json({
      success: true,
      data: topicoCompleto
    });
  } catch (error) {
    console.error('Erro ao obter tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do tópico',
      error: error.message
    });
  }
};

/**
 * Obter tópicos filtrados por categoria específica
 */
const getTopicosByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const { area_id, busca, limit = 20, offset = 0 } = req.query;
    
    const whereClause = { 
      id_categoria: id_categoria,
      ativo: true 
    };
    
    if (area_id) whereClause.id_area = area_id;
    
    if (busca) {
      whereClause[Op.or] = [
        { titulo: { [Op.iLike]: `%${busca}%` } },
        { descricao: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    const { count, rows: topicos } = await Topico_Area.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id_area', 'nome']
        }
      ],
      attributes: [
        'id_topico', 'titulo', 'descricao', 'data_criacao',
        [sequelize.literal('(SELECT COUNT(*) FROM chat_mensagens WHERE chat_mensagens.id_topico = "topico_area".id_topico)'), 'total_mensagens']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['data_criacao', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: topicos,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < count
      }
    });
  } catch (error) {
    console.error('Erro ao obter tópicos por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter tópicos da categoria',
      error: error.message
    });
  }
};

// =============================================================================
// GESTÃO DE TÓPICOS (administradores e formadores)
// =============================================================================

/**
 * Criar novo tópico de discussão
 */
const createTopico = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.utilizador.id_utilizador || req.user.id_utilizador;
    const userRole = req.utilizador.id_cargo || req.user.id_cargo;
    const { titulo, descricao, id_categoria, id_area } = req.body;
    
    // Verificar permissões
    if (userRole !== 1 && userRole !== 2) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores e formadores podem criar tópicos'
      });
    }
    
    // Validar dados obrigatórios
    if (!titulo || titulo.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O título do tópico é obrigatório e não pode estar vazio'
      });
    }
    
    if (!id_categoria) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A categoria é obrigatória'
      });
    }
    
    if (!id_area) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A área é obrigatória'
      });
    }
    
    // Verificar se categoria e área existem
    const [categoria, area] = await Promise.all([
      Categoria.findByPk(id_categoria),
      Area.findByPk(id_area)
    ]);
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Categoria especificada não foi encontrada'
      });
    }
    
    if (!area) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Área especificada não foi encontrada'
      });
    }
    
    // Verificar duplicação de título na mesma área
    const topicoExistente = await Topico_Area.findOne({
      where: {
        titulo: {
          [Op.iLike]: titulo.trim()
        },
        id_area,
        ativo: true
      }
    });
    
    if (topicoExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Já existe um tópico com este título nesta área'
      });
    }
    
    // Criar o novo tópico
    const novoTopico = await Topico_Area.create({
      titulo: titulo.trim(),
      descricao: descricao ? descricao.trim() : '',
      id_categoria,
      id_area,
      criado_por: userId,
      data_criacao: new Date(),
      ativo: true
    }, { transaction });
    
    await transaction.commit();
    
    // Buscar tópico criado com informações completas
    const topicoCompleto = await Topico_Area.findByPk(novoTopico.id_topico, {
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id_area', 'nome']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Tópico criado com sucesso',
      data: topicoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tópico',
      error: error.message
    });
  }
};

/**
 * Atualizar tópico existente
 */
const updateTopico = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.utilizador.id_utilizador || req.user.id_utilizador;
    const userRole = req.utilizador.id_cargo || req.user.id_cargo;
    const { titulo, descricao, ativo, id_categoria, id_area } = req.body;
    
    // Buscar tópico
    const topico = await Topico_Area.findByPk(id);
    if (!topico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }
    
    // Verificar permissões (criador, administrador ou formador)
    if (topico.criado_por !== userId && userRole !== 1 && userRole !== 2) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para actualizar este tópico'
      });
    }
    
    // Validação dos dados obrigatórios
    if (titulo && titulo.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'O título do tópico não pode estar vazio'
      });
    }
    
    // Preparar dados de actualização
    const updateData = {};
    if (titulo) updateData.titulo = titulo.trim();
    if (descricao !== undefined) updateData.descricao = descricao.trim();
    if (id_categoria) updateData.id_categoria = id_categoria;
    if (id_area) updateData.id_area = id_area;
    
    // Apenas administradores e formadores podem alterar status ativo
    if (ativo !== undefined && (userRole === 1 || userRole === 2)) {
      updateData.ativo = ativo;
    }
    
    // Verificar duplicação de título se foi alterado
    if (titulo && titulo.trim() !== topico.titulo) {
      const topicoExistente = await Topico_Area.findOne({
        where: {
          titulo: {
            [Op.iLike]: titulo.trim()
          },
          id_area: id_area || topico.id_area,
          id_topico: {
            [Op.ne]: id
          },
          ativo: true
        }
      });
      
      if (topicoExistente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Já existe outro tópico com este título nesta área'
        });
      }
    }
    
    // Actualizar tópico
    await topico.update(updateData, { transaction });
    
    await transaction.commit();
    
    // Buscar tópico actualizado
    const topicoAtualizado = await Topico_Area.findByPk(id, {
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id_area', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'Tópico actualizado com sucesso',
      data: topicoAtualizado
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao actualizar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao actualizar tópico',
      error: error.message
    });
  }
};

/**
 * Eliminar tópico e todo o seu conteúdo
 */
const deleteTopico = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userRole = req.utilizador.id_cargo || req.user.id_cargo;
    
    // Verificar permissões (apenas administradores)
    if (userRole !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem eliminar tópicos'
      });
    }
    
    // Buscar tópico
    const topico = await Topico_Area.findByPk(id);
    if (!topico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }
    
    // Contar mensagens e denúncias associadas
    const [totalMensagens, totalDenuncias] = await Promise.all([
      ChatMensagem.count({ where: { id_topico: id } }),
      ChatDenuncia.count({ 
        include: [{ 
          model: ChatMensagem, 
          as: 'mensagem', 
          where: { id_topico: id } 
        }] 
      })
    ]);
    
    // Eliminar denúncias associadas às mensagens do tópico
    if (totalDenuncias > 0) {
      await ChatDenuncia.destroy({
        include: [{ 
          model: ChatMensagem, 
          as: 'mensagem', 
          where: { id_topico: id } 
        }],
        transaction
      });
    }
    
    // Eliminar interações das mensagens
    await ChatInteracao.destroy({
      include: [{ 
        model: ChatMensagem, 
        as: 'mensagem', 
        where: { id_topico: id } 
      }],
      transaction
    });
    
    // Eliminar mensagens
    if (totalMensagens > 0) {
      await ChatMensagem.destroy({ 
        where: { id_topico: id },
        transaction 
      });
    }
    
    // Guardar nome do tópico para confirmação
    const nomeTopico = topico.titulo;
    
    // Eliminar tópico
    await topico.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: `Tópico "${nomeTopico}" eliminado com sucesso. ${totalMensagens} mensagens e ${totalDenuncias} denúncias também foram removidas.`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao eliminar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar tópico',
      error: error.message
    });
  }
};

// =============================================================================
// SISTEMA DE COMENTÁRIOS E DISCUSSÃO
// =============================================================================

/**
 * Obter todos os comentários de um tópico específico
 */
const getComentariosByTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0, ordem = 'ASC' } = req.query;
    
    // Verificar se tópico existe
    const topico = await Topico_Area.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }
    
    const { count, rows: mensagens } = await ChatMensagem.findAndCountAll({
      where: { 
        id_topico: id,
        oculta: false 
      },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['data_criacao', ordem.toUpperCase()]]
    });

    res.status(200).json({
      success: true,
      data: mensagens,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < count
      },
      topico: {
        id_topico: topico.id_topico,
        titulo: topico.titulo
      }
    });
  } catch (error) {
    console.error('Erro ao obter comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter comentários do tópico',
      error: error.message
    });
  }
};

/**
 * Criar novo comentário com possibilidade de anexar ficheiros
 */
const createComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.utilizador.id_utilizador || req.user.id_utilizador;

    // Verificar se o tópico existe e obter dados da categoria
    const topico = await Topico_Area.findByPk(id, {
      include: [{ 
        model: Categoria, 
        as: 'categoria',
        attributes: ['id_categoria', 'nome']
      }]
    });

    if (!topico || !topico.ativo) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado ou inativo'
      });
    }
    
    // Validar que há pelo menos texto ou anexo
    if (!texto && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer texto ou anexar um ficheiro'
      });
    }

    // Preparar dados base da mensagem
    const mensagemData = {
      id_topico: id,
      id_utilizador: userId,
      texto: texto || '',
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0,
      foi_denunciada: false,
      oculta: false
    };

    // Processar anexo se fornecido
    if (req.file) {
      const categoriaNome = topico.categoria ? topico.categoria.nome : 'sem_categoria';
      const topicoNome = topico.titulo;
      
      // Criar estrutura de diretórios específica para chat
      const chatPaths = createChatDirectoryStructure(categoriaNome, topicoNome);
      
      if (!chatPaths) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar estrutura de diretórios para o chat'
        });
      }

      // Gerar nome único para o ficheiro
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}_${userId}${fileExtension}`;
      
      // Transferir ficheiro para destino final
      const sourceFile = req.file.path;
      const targetFile = path.join(chatPaths.conteudosPath, fileName);
      
      const moveSuccessful = moveFile(sourceFile, targetFile);
      
      if (!moveSuccessful) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao mover o ficheiro anexado'
        });
      }
      
      // Adicionar informações do anexo à mensagem
      mensagemData.anexo_url = `${chatPaths.conteudosUrlPath}/${fileName}`;
      mensagemData.anexo_nome = req.file.originalname;
      mensagemData.tipo_anexo = getFileType(req.file.mimetype);
    }

    // Criar mensagem na base de dados
    const novaMensagem = await ChatMensagem.create(mensagemData);

    // Carregar mensagem completa com dados do utilizador
    const mensagemCompleta = await ChatMensagem.findOne({
      where: { id: novaMensagem.id },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar utilizadores conectados via WebSocket
    if (req.io) {
      req.io.to(`topico_${id}`).emit('novoComentario', mensagemCompleta);
    }

    res.status(201).json({
      success: true,
      message: 'Comentário criado com sucesso',
      data: mensagemCompleta
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar comentário',
      error: error.message
    });
  }
};

// =============================================================================
// SISTEMA DE INTERAÇÃO E MODERAÇÃO
// =============================================================================

/**
 * Avaliar comentário (gosto/não gosto)
 */
const avaliarComentario = async (req, res) => {
  try {
    const { id_topico, id_comentario } = req.params;
    const { tipo } = req.body;
    const userId = req.utilizador.id_utilizador || req.user.id_utilizador;

    // Validar tipo de avaliação
    if (!['like', 'dislike'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    // Procurar mensagem a avaliar
    const mensagem = await ChatMensagem.findOne({
      where: { 
        id: id_comentario,
        id_topico: id_topico
      }
    });
    
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar se utilizador já avaliou esta mensagem
    const interacaoExistente = await ChatInteracao.findOne({
      where: {
        id_mensagem: id_comentario,
        id_utilizador: userId
      }
    });

    let novaInteracao = null;
    
    if (interacaoExistente) {
      // Se a avaliação é a mesma, remover (toggle)
      if (interacaoExistente.tipo === tipo) {
        await interacaoExistente.destroy();
        // Decrementar contador
        if (tipo === 'like') {
          await mensagem.update({ likes: Math.max(0, mensagem.likes - 1) });
        } else {
          await mensagem.update({ dislikes: Math.max(0, mensagem.dislikes - 1) });
        }
      } else {
        // Alterar tipo de avaliação
        await interacaoExistente.update({ tipo });
        
        // Ajustar contadores
        if (tipo === 'like') {
          await mensagem.update({ 
            likes: mensagem.likes + 1,
            dislikes: Math.max(0, mensagem.dislikes - 1)
          });
        } else {
          await mensagem.update({ 
            dislikes: mensagem.dislikes + 1,
            likes: Math.max(0, mensagem.likes - 1)
          });
        }
        novaInteracao = interacaoExistente;
      }
    } else {
      // Criar nova interação
      novaInteracao = await ChatInteracao.create({
        id_mensagem: id_comentario,
        id_utilizador: userId,
        tipo,
        data_interacao: new Date()
      });
      
      // Incrementar contador apropriado
      if (tipo === 'like') {
        await mensagem.update({ likes: mensagem.likes + 1 });
      } else {
        await mensagem.update({ dislikes: mensagem.dislikes + 1 });
      }
    }

    // Recarregar mensagem para obter contadores atualizados
    await mensagem.reload();

    // Notificar via WebSocket
    if (req.io) {
      req.io.to(`topico_${id_topico}`).emit('comentarioAvaliado', {
        id_comentario: mensagem.id,
        likes: mensagem.likes,
        dislikes: mensagem.dislikes,
        utilizador_acao: userId,
        tipo_acao: novaInteracao ? tipo : 'removed'
      });
    }

    res.status(200).json({
      success: true,
      message: `Avaliação ${novaInteracao ? 'registada' : 'removida'} com sucesso`,
      data: {
        id_comentario: mensagem.id,
        likes: mensagem.likes,
        dislikes: mensagem.dislikes,
        user_interaction: novaInteracao ? tipo : null
      }
    });
  } catch (error) {
    console.error('Erro ao avaliar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar comentário',
      error: error.message
    });
  }
};

module.exports = {
  getAllTopicosCategoria,
  getTopicoById,
  getTopicosByCategoria,
  createTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario
};