const Topico_Area = require('../../database/models/Topico_Area');
const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const User = require('../../database/models/User');
const ChatMensagem = require('../../database/models/ChatMensagem');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

// Listar todos os tópicos com filtros por categoria e área
const listarTopico_Areas = async (req, res) => {
  try {
    const { categoria, area, busca } = req.query;
    
    const whereClause = { ativo: true };
    
    // Filtrar por categoria, se especificada
    if (categoria) {
      // Verificar se a categoria foi passada como ID ou nome
      if (isNaN(categoria)) {
        // Procurar ID da categoria pelo nome
        const categoriaEncontrada = await Categoria.findOne({
          where: { nome: categoria }
        });
        if (categoriaEncontrada) {
          whereClause.id_categoria = categoriaEncontrada.id;
        }
      } else {
        whereClause.id_categoria = categoria;
      }
    }
    
    // Filtrar por área, se especificada
    if (area) {
      // Verificar se a área foi passada como ID ou nome
      if (isNaN(area)) {
        // Procurar ID da área pelo nome
        const areaEncontrada = await Area.findOne({
          where: { nome: area }
        });
        if (areaEncontrada) {
          whereClause.id_area = areaEncontrada.id;
        }
      } else {
        whereClause.id_area = area;
      }
    }
    
    // Filtrar por texto de busca, se especificado
    if (busca) {
      whereClause[Op.or] = [
        { titulo: { [Op.iLike]: `%${busca}%` } },
        { descricao: { [Op.iLike]: `%${busca}%` } }
      ];
    }
    
    // Procurar tópicos com contagem de mensagens
    const Topico_Areas = await Topico_Area.findAll({
      where: whereClause,
      attributes: [
        'id', 'titulo', 'descricao', 'dataCriacao',
        [sequelize.literal('(SELECT COUNT(*) FROM chat_mensagens WHERE chat_mensagens.id_Topico_Area = "Topico_Area".id)'), 'comentarios']
      ],
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nome']
        }
      ],
      order: [['dataCriacao', 'DESC']]
    });
    
    return res.status(200).json(Topico_Areas);
  } catch (error) {
    console.error('Erro ao listar tópicos:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Obter detalhes de um tópico específico
const obterTopico_Area = async (req, res) => {
  try {
    const { id } = req.params;
    
    const Topico_Area = await Topico_Area.findByPk(id, {
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id', 'nome', 'email', 'avatar']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!Topico_Area) {
      return res.status(404).json({ mensagem: 'Tópico não encontrado' });
    }
    
    // Contar número de mensagens
    const comentarios = await ChatMensagem.count({
      where: { id_Topico_Area: id }
    });
    
    const Topico_AreaComComentarios = {
      ...Topico_Area.toJSON(),
      comentarios
    };
    
    return res.status(200).json(Topico_AreaComComentarios);
  } catch (error) {
    console.error('Erro ao obter tópico:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Criar novo tópico (apenas para gestores)
const criarTopico_Area = async (req, res) => {
  try {
    const userId = req.user.id;
    const { titulo, descricao, id_categoria, id_area } = req.body;
    
    // Verificar se o utilizador é gestor
    if (req.user.role !== 1 && req.user.role !== 2) { // Assumindo que role 1 = admin, 2 = gestor
      return res.status(403).json({ mensagem: 'Apenas gestores podem criar tópicos' });
    }
    
    // Validar dados
    if (!titulo || !id_categoria || !id_area) {
      return res.status(400).json({ mensagem: 'Título, categoria e área são obrigatórios' });
    }
    
    // Criar tópico
    const novoTopico_Area = await Topico_Area.create({
      titulo,
      descricao,
      id_categoria,
      id_area,
      id_criador: userId
    });
    
    // Procurar o tópico completo para retornar
    const Topico_AreaCompleto = await Topico_Area.findByPk(novoTopico_Area.id, {
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    return res.status(201).json(Topico_AreaCompleto);
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Atualizar um tópico (apenas para gestores ou criador)
const atualizarTopico_Area = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { titulo, descricao, ativo } = req.body;
    
    // Procurar tópico
    const Topico_Area = await Topico_Area.findByPk(id);
    if (!Topico_Area) {
      return res.status(404).json({ mensagem: 'Tópico não encontrado' });
    }
    
    // Verificar permissão (criador ou gestor/admin)
    if (Topico_Area.id_criador !== userId && req.user.role !== 1 && req.user.role !== 2) {
      return res.status(403).json({ mensagem: 'Sem permissão para atualizar este tópico' });
    }
    
    // Atualizar campos
    if (titulo) Topico_Area.titulo = titulo;
    if (descricao !== undefined) Topico_Area.descricao = descricao;
    if (ativo !== undefined && (req.user.role === 1 || req.user.role === 2)) {
      Topico_Area.ativo = ativo;
    }
    
    await Topico_Area.save();
    
    // Procurar tópico atualizado com dados relacionados
    const Topico_AreaAtualizado = await Topico_Area.findByPk(id, {
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    return res.status(200).json(Topico_AreaAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar tópico:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Excluir um tópico (apenas admin ou gestor)
const excluirTopico_Area = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se é admin ou gestor
    if (req.user.role !== 1 && req.user.role !== 2) {
      return res.status(403).json({ mensagem: 'Apenas administradores ou gestores podem excluir tópicos' });
    }
    
    // Procurar tópico
    const Topico_Area = await Topico_Area.findByPk(id);
    if (!Topico_Area) {
      return res.status(404).json({ mensagem: 'Tópico não encontrado' });
    }
    
    // Excluir todas as mensagens associadas
    await ChatMensagem.destroy({
      where: { id_Topico_Area: id }
    });
    
    // Excluir tópico
    await Topico_Area.destroy();
    
    return res.status(200).json({ mensagem: 'Tópico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tópico:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarTopico_Areas,
  obterTopico_Area,
  criarTopico_Area,
  atualizarTopico_Area,
  excluirTopico_Area
};