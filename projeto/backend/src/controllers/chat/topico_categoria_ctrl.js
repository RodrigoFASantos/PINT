const Topico_Categoria = require('../../database/models/Topico_Categoria');
const Comentario_Topico = require('../../database/models/Comentario_Topico');
const User = require('../../database/models/User');
const Categoria = require('../../database/models/Categoria');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const uploadUtils = require('../../middleware/upload');

// Controller para obter todos os tópicos de categoria
const getAllTopicosCategoria = async (req, res) => {
  try {
    // Simplificamos a consulta para evitar problemas com a tabela de comentários
    const topicos = await Topico_Categoria.findAll({
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: topicos.length,
      data: topicos
    });
  } catch (error) {
    console.error('Erro ao procurar tópicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar tópicos',
      error: error.message
    });
  }
};

// Controller para obter um tópico específico por ID
const getTopicoById = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await Topico_Categoria.findOne({
      where: { id_topico: id },
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: topico
    });
  } catch (error) {
    console.error('Erro ao procurar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar tópico',
      error: error.message
    });
  }
};

// Controller para obter tópicos por categoria
const getTopicosByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;

    console.log(`Procurando tópicos para categoria ID: ${id_categoria}`);

    // Primeiro, verificamos se a categoria existe
    const categoriaExiste = await Categoria.findByPk(id_categoria);
    if (!categoriaExiste) {
      console.log(`Categoria ID ${id_categoria} não encontrada`);
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Simplificando a consulta
    const topicos = await Topico_Categoria.findAll({
      where: { id_categoria },
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'DESC']]
    });

    console.log(`Encontrados ${topicos.length} tópicos para a categoria ID ${id_categoria}`);

    res.status(200).json({
      success: true,
      count: topicos.length,
      data: topicos
    });
  } catch (error) {
    console.error(`Erro ao procurar tópicos para categoria ${req.params.id_categoria}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar tópicos por categoria',
      error: error.message
    });
  }
};


// Controller para obter todos os comentários de um tópico
const getComentariosByTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verificar se o tópico existe
    const topicoExiste = await Topico_Categoria.findByPk(id);
    if (!topicoExiste) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Procurar comentários com paginação
    // CORREÇÃO: Alterando a ordenação para ASC (mais antigos primeiro)
    const { count, rows: comentarios } = await Comentario_Topico.findAndCountAll({
      where: { id_topico: id },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'ASC']], // CORRIGIDO: Ordem cronológica (mais antigos primeiro)
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: comentarios
    });
  } catch (error) {
    console.error('Erro ao procurar comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar comentários',
      error: error.message
    });
  }
};

// Controller para criar um novo comentário em um tópico
const createComentario = async (req, res) => {
  try {
    const { id } = req.params; // ID do tópico
    const { texto } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    let anexoUrl = null;
    let anexoNome = null;
    let tipoAnexo = null;

    console.log(`Enviando mensagem para tópico ${id} pelo utilizador ${id_utilizador}`);
    console.log(`Texto da mensagem: ${texto}`);

    // Verificar se o tópico existe e obter suas informações, incluindo categoria
    const topico = await Topico_Categoria.findOne({
      where: { id_topico: id },
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        }
      ]
    });

    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se há texto ou anexo
    if (!texto && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer texto ou anexo para o comentário'
      });
    }

    // Processar anexo, se existir
    if (req.file) {
      console.log('Ficheiro anexo recebido:', req.file);
      
      // Obter nomes para categorias e tópicos
      const categoriaNome = topico.categoria?.nome || 'sem_categoria';
      const topicoNome = topico.titulo || 'sem_titulo';

      // Usar as funções do uploadUtils para criar diretórios
      const categoriaSlug = uploadUtils.normalizarNome(categoriaNome);
      const topicoSlug = uploadUtils.normalizarNome(topicoNome);

      // Criar estrutura de diretórios para o chat
      const { dirPath, conteudosPath } = uploadUtils.criarDiretoriosChat(categoriaNome, topicoNome);

      // Detalhes do ficheiro
      anexoNome = req.file.originalname;
      const fileExtension = path.extname(anexoNome);
      const newFileName = `${Date.now()}_${id_utilizador}${fileExtension}`;

      // Origem (onde o middleware salvou) e destino (onde queremos salvar)
      const sourceFile = req.file.path;
      const targetFile = path.join(dirPath, 'conteudos', newFileName);

      // Mover o ficheiro para o local correto
      const movido = uploadUtils.moverArquivo(sourceFile, targetFile);
      if (!movido) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao mover o ficheiro anexado'
        });
      }

      // Definir o caminho do anexo para o banco de dados
      anexoUrl = `${conteudosPath}/${newFileName}`;

      // Determinar o tipo do anexo
      const mimeType = req.file.mimetype;
      tipoAnexo = uploadUtils.getFileType(mimeType);
      
      console.log(`Ficheiro movido com sucesso para ${targetFile}`);
      console.log(`Caminho guardado na BD: ${anexoUrl}`);
    }

    // Criar o comentário
    const novoComentario = await Comentario_Topico.create({
      id_topico: id,
      id_utilizador,
      texto,
      anexo_url: anexoUrl,
      anexo_nome: anexoNome,
      tipo_anexo: tipoAnexo,
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0,
      denuncias: 0
    });

    // Carregar informações do utilizador para retornar na resposta
    const comentarioComUtilizador = await Comentario_Topico.findOne({
      where: { id_comentario: novoComentario.id_comentario },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id}`).emit('novoComentario', comentarioComUtilizador);
    }

    res.status(201).json({
      success: true,
      message: 'Comentário criado com sucesso',
      data: comentarioComUtilizador
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

// Controller para avaliar um comentário (gostar/não gostar)
const avaliarComentario = async (req, res) => {
  try {
    const { id_topico, id_comentario } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tipo é válido
    if (tipo !== 'like' && tipo !== 'dislike') {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    // Verificar se o comentário existe
    const comentario = await Comentario_Topico.findOne({
      where: {
        id_comentario,
        id_topico
      }
    });

    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar se o utilizador já avaliou este comentário
    // Nota: Aqui precisarias de uma tabela de relação para armazenar quem avaliou o quê
    // Por simplicidade, vamos apenas incrementar o contador

    if (tipo === 'like') {
      await comentario.update({
        likes: comentario.likes + 1
      });
    } else {
      await comentario.update({
        dislikes: comentario.dislikes + 1
      });
    }

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id_topico}`).emit('comentarioAvaliado', {
        id_comentario,
        likes: comentario.likes,
        dislikes: comentario.dislikes
      });
    }

    res.status(200).json({
      success: true,
      message: `Comentário ${tipo === 'like' ? 'gostado' : 'não gostado'} com sucesso`,
      data: {
        likes: comentario.likes,
        dislikes: comentario.dislikes
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

// Controller para denunciar um comentário
const denunciarComentario = async (req, res) => {
  try {
    const { id_topico, id_comentario } = req.params;
    const { motivo } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o comentário existe
    const comentario = await Comentario_Topico.findOne({
      where: {
        id_comentario,
        id_topico
      }
    });

    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Incrementar contador de denúncias
    await comentario.update({
      denuncias: comentario.denuncias + 1
    });

    // Notificar administradores via Socket.IO (canal privado de admins)
    if (req.io) {
      req.io.to('admin_channel').emit('comentarioDenunciado', {
        id_comentario,
        id_topico,
        denuncias: comentario.denuncias,
        motivo
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comentário denunciado com sucesso',
      data: {
        denuncias: comentario.denuncias
      }
    });
  } catch (error) {
    console.error('Erro ao denunciar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao denunciar comentário',
      error: error.message
    });
  }
};



module.exports = {
  getAllTopicosCategoria,
  getTopicoById,
  getTopicosByCategoria,
  getComentariosByTopico,
  createComentario,
  avaliarComentario,
  denunciarComentario
};