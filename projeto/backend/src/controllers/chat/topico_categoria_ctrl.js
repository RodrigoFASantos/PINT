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
    console.error('Erro ao buscar tópicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tópicos',
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
    console.error('Erro ao buscar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tópico',
      error: error.message
    });
  }
};

// Controller para obter tópicos por categoria
const getTopicosByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;

    console.log(`Buscando tópicos para categoria ID: ${id_categoria}`);

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
    console.error(`Erro ao buscar tópicos para categoria ${req.params.id_categoria}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tópicos por categoria',
      error: error.message
    });
  }
};

// Controller para criar um novo tópico (apenas gestores e admins)
const createTopico = async (req, res) => {
  try {
    const { id_categoria, titulo, descricao } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log('Dados recebidos para criar tópico:', {
      id_categoria,
      titulo,
      descricao,
      id_utilizador,
      user: req.user // Log para debug - remover em produção
    });

    // Verificar se a categoria existe
    const categoriaExiste = await Categoria.findByPk(id_categoria);
    if (!categoriaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Criar o tópico
    const novoTopico = await Topico_Categoria.create({
      id_categoria,
      titulo,
      descricao,
      criado_por: id_utilizador,
      data_criacao: new Date()
    });

    console.log('Tópico criado com sucesso:', novoTopico.toJSON());

    // Notificar os usuários conectados via Socket.IO
    if (req.io) {
      req.io.emit('novoTopico', {
        id_topico: novoTopico.id_topico,
        titulo: novoTopico.titulo,
        id_categoria: novoTopico.id_categoria
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tópico criado com sucesso',
      data: novoTopico
    });
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tópico',
      error: error.message
    });
  }
};

// Controller para atualizar um tópico existente
const updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o usuário é o criador do tópico ou tem cargo 1 ou 2 (admin/gestor)
    if (topico.criado_por !== id_utilizador && req.user.id_cargo !== 1 && req.user.id_cargo !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para atualizar este tópico'
      });
    }

    // Atualizar o tópico
    await topico.update({
      titulo: titulo || topico.titulo,
      descricao: descricao || topico.descricao
    });

    // Notificar os usuários conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id}`).emit('topicoAtualizado', {
        id_topico: topico.id_topico,
        titulo: topico.titulo,
        descricao: topico.descricao
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tópico atualizado com sucesso',
      data: topico
    });
  } catch (error) {
    console.error('Erro ao atualizar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tópico',
      error: error.message
    });
  }
};

// Controller para excluir um tópico
const deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o usuário é o criador do tópico ou tem cargo 1 ou 2 (admin/gestor)
    if (topico.criado_por !== id_utilizador && req.user.id_cargo !== 1 && req.user.id_cargo !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para excluir este tópico'
      });
    }

    // Buscar todos os comentários do tópico para remover anexos
    const comentarios = await Comentario_Topico.findAll({
      where: { id_topico: id }
    });

    // Remover anexos dos comentários
    for (const comentario of comentarios) {
      if (comentario.anexo_url) {
        const filePath = path.join(uploadUtils.BASE_UPLOAD_DIR, comentario.anexo_url.replace(/^\/?(uploads|backend\/uploads)\//, ''));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Arquivo anexo removido: ${filePath}`);
          } catch (err) {
            console.error(`Erro ao remover anexo: ${err.message}`);
          }
        }
      }
    }

    // Excluir todos os comentários relacionados ao tópico
    await Comentario_Topico.destroy({
      where: { id_topico: id }
    });

    // Excluir o tópico
    await topico.destroy();

    // Notificar os usuários conectados via Socket.IO
    if (req.io) {
      req.io.emit('topicoExcluido', {
        id_topico: id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tópico excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir tópico',
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

    // Buscar comentários com paginação
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
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar comentários',
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

    console.log(`Enviando mensagem para tópico ${id} pelo usuário ${id_utilizador}`);
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
      console.log('Arquivo anexo recebido:', req.file);
      
      // Obter nomes para categorias e tópicos
      const categoriaNome = topico.categoria?.nome || 'sem_categoria';
      const topicoNome = topico.titulo || 'sem_titulo';

      // Usar as funções do uploadUtils para criar diretórios
      const categoriaSlug = uploadUtils.normalizarNome(categoriaNome);
      const topicoSlug = uploadUtils.normalizarNome(topicoNome);

      // Criar estrutura de diretórios para o chat
      const { dirPath, conteudosPath } = uploadUtils.criarDiretoriosChat(categoriaNome, topicoNome);

      // Detalhes do arquivo
      anexoNome = req.file.originalname;
      const fileExtension = path.extname(anexoNome);
      const newFileName = `${Date.now()}_${id_utilizador}${fileExtension}`;

      // Origem (onde o middleware salvou) e destino (onde queremos salvar)
      const sourceFile = req.file.path;
      const targetFile = path.join(dirPath, 'conteudos', newFileName);

      // Mover o arquivo para o local correto
      const movido = uploadUtils.moverArquivo(sourceFile, targetFile);
      if (!movido) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao mover o arquivo anexado'
        });
      }

      // Definir o caminho do anexo para o banco de dados
      anexoUrl = `${conteudosPath}/${newFileName}`;

      // Determinar o tipo do anexo
      const mimeType = req.file.mimetype;
      tipoAnexo = uploadUtils.getFileType(mimeType);
      
      console.log(`Arquivo movido com sucesso para ${targetFile}`);
      console.log(`Caminho salvo no BD: ${anexoUrl}`);
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

    // Carregar informações do usuário para retornar na resposta
    const comentarioComUsuario = await Comentario_Topico.findOne({
      where: { id_comentario: novoComentario.id_comentario },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar os usuários conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id}`).emit('novoComentario', comentarioComUsuario);
    }

    res.status(201).json({
      success: true,
      message: 'Comentário criado com sucesso',
      data: comentarioComUsuario
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

// Controller para avaliar um comentário (curtir/descurtir)
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

    // Verificar se o usuário já avaliou este comentário
    // Nota: Aqui você precisaria de uma tabela de relação para armazenar quem avaliou o quê
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

    // Notificar os usuários conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id_topico}`).emit('comentarioAvaliado', {
        id_comentario,
        likes: comentario.likes,
        dislikes: comentario.dislikes
      });
    }

    res.status(200).json({
      success: true,
      message: `Comentário ${tipo === 'like' ? 'curtido' : 'descurtido'} com sucesso`,
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
  createTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario,
  denunciarComentario
};