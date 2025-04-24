const Topico = require('../../models/Topico');
const Categoria = require('../../models/Categoria');
const Area = require('../../models/Area');
const User = require('../../models/User');
const ChatMensagem = require('../../models/ChatMensagem');
const { Op } = require('sequelize');
const sequelize = require('../../../config/db');

const topicoController = {
  // Listar todos os tópicos com filtros por categoria e área
  listarTopicos: async (req, res) => {
    try {
      const { categoria, area, busca } = req.query;
      
      const whereClause = { ativo: true };
      
      // Filtrar por categoria, se especificada
      if (categoria) {
        // Verificar se a categoria foi passada como ID ou nome
        if (isNaN(categoria)) {
          // Buscar ID da categoria pelo nome
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
          // Buscar ID da área pelo nome
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
      
      // Buscar tópicos com contagem de mensagens
      const topicos = await Topico.findAll({
        where: whereClause,
        attributes: [
          'id', 'titulo', 'descricao', 'dataCriacao',
          [sequelize.literal('(SELECT COUNT(*) FROM chat_mensagens WHERE chat_mensagens.id_topico = "Topico".id)'), 'comentarios']
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
      
      return res.status(200).json(topicos);
    } catch (error) {
      console.error('Erro ao listar tópicos:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Obter detalhes de um tópico específico
  obterTopico: async (req, res) => {
    try {
      const { id } = req.params;
      
      const topico = await Topico.findByPk(id, {
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
      
      if (!topico) {
        return res.status(404).json({ mensagem: 'Tópico não encontrado' });
      }
      
      // Contar número de mensagens
      const comentarios = await ChatMensagem.count({
        where: { id_topico: id }
      });
      
      const topicoComComentarios = {
        ...topico.toJSON(),
        comentarios
      };
      
      return res.status(200).json(topicoComComentarios);
    } catch (error) {
      console.error('Erro ao obter tópico:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Criar novo tópico (apenas para gestores)
  criarTopico: async (req, res) => {
    try {
      const userId = req.user.id;
      const { titulo, descricao, id_categoria, id_area } = req.body;
      
      // Verificar se o usuário é gestor
      if (req.user.role !== 1 && req.user.role !== 2) { // Assumindo que role 1 = admin, 2 = gestor
        return res.status(403).json({ mensagem: 'Apenas gestores podem criar tópicos' });
      }
      
      // Validar dados
      if (!titulo || !id_categoria || !id_area) {
        return res.status(400).json({ mensagem: 'Título, categoria e área são obrigatórios' });
      }
      
      // Criar tópico
      const novoTopico = await Topico.create({
        titulo,
        descricao,
        id_categoria,
        id_area,
        id_criador: userId
      });
      
      // Buscar o tópico completo para retornar
      const topicoCompleto = await Topico.findByPk(novoTopico.id, {
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
      
      return res.status(201).json(topicoCompleto);
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Atualizar um tópico (apenas para gestores ou criador)
  atualizarTopico: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { titulo, descricao, ativo } = req.body;
      
      // Buscar tópico
      const topico = await Topico.findByPk(id);
      if (!topico) {
        return res.status(404).json({ mensagem: 'Tópico não encontrado' });
      }
      
      // Verificar permissão (criador ou gestor/admin)
      if (topico.id_criador !== userId && req.user.role !== 1 && req.user.role !== 2) {
        return res.status(403).json({ mensagem: 'Sem permissão para atualizar este tópico' });
      }
      
      // Atualizar campos
      if (titulo) topico.titulo = titulo;
      if (descricao !== undefined) topico.descricao = descricao;
      if (ativo !== undefined && (req.user.role === 1 || req.user.role === 2)) {
        topico.ativo = ativo;
      }
      
      await topico.save();
      
      // Buscar tópico atualizado com dados relacionados
      const topicoAtualizado = await Topico.findByPk(id, {
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
      
      return res.status(200).json(topicoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar tópico:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Excluir um tópico (apenas admin ou gestor)
  excluirTopico: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se é admin ou gestor
      if (req.user.role !== 1 && req.user.role !== 2) {
        return res.status(403).json({ mensagem: 'Apenas administradores ou gestores podem excluir tópicos' });
      }
      
      // Buscar tópico
      const topico = await Topico.findByPk(id);
      if (!topico) {
        return res.status(404).json({ mensagem: 'Tópico não encontrado' });
      }
      
      // Excluir todas as mensagens associadas
      await ChatMensagem.destroy({
        where: { id_topico: id }
      });
      
      // Excluir tópico
      await topico.destroy();
      
      return res.status(200).json({ mensagem: 'Tópico excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir tópico:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

module.exports = topicoController;