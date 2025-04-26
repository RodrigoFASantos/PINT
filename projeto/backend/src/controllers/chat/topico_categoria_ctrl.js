const Topico_Categoria = require('../../database/models/Topico_Categoria');
const Comentario_Topico = require('../../database/models/Comentario_Topico');
const User = require('../../database/models/User');
const Categoria = require('../../database/models/Categoria');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');

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
    const id_utilizador = req.user.id; // ID do usuário autenticado

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

    // Notificar os usuários conectados via Socket.IO
    req.io.emit('novoTopico', {
      id_topico: novoTopico.id_topico,
      titulo: novoTopico.titulo,
      id_categoria: novoTopico.id_categoria
    });

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
    const id_utilizador = req.user.id; // ID do usuário autenticado

    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o usuário é o criador do tópico ou admin
    if (topico.criado_por !== id_utilizador && req.user.cargo !== 'admin') {
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
    req.io.to(`topico_${id}`).emit('topicoAtualizado', {
      id_topico: topico.id_topico,
      titulo: topico.titulo,
      descricao: topico.descricao
    });

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
    const id_utilizador = req.user.id; // ID do usuário autenticado

    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o usuário é o criador do tópico ou admin
    if (topico.criado_por !== id_utilizador && req.user.cargo !== 'admin') {
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
        const filePath = path.join(__dirname, '../../../', comentario.anexo_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
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
    req.io.emit('topicoExcluido', {
      id_topico: id
    });

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
// Versão que mantém a funcionalidade e corrige o caminho dos arquivos
const createComentario = async (req, res) => {
  try {
    const { id } = req.params; // ID do tópico
    const { texto } = req.body;
    const id_utilizador = req.user.id_utilizador; // ID do usuário autenticado
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
      // Obter nome da categoria e do tópico
      const nomeCategoria = (topico.categoria?.nome || 'sem_categoria')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
        
      const nomeTopico = (topico.titulo || 'sem_titulo')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();

      // Criar diretórios necessários
      const baseDir = path.join(__dirname, '../../../uploads/chat');
      const categoriaDir = path.join(baseDir, nomeCategoria);
      const topicoDir = path.join(categoriaDir, nomeTopico);
      
      // Criar estrutura de pastas
      if (!fs.existsSync(categoriaDir)) {
        fs.mkdirSync(categoriaDir, { recursive: true });
      }
      
      if (!fs.existsSync(topicoDir)) {
        fs.mkdirSync(topicoDir, { recursive: true });
      }
      
      // Detalhes do arquivo
      anexoNome = req.file.originalname;
      const fileExtension = path.extname(anexoNome);
      const newFileName = `${Date.now()}_${id_utilizador}${fileExtension}`;
      
      // Origem (onde o middleware salvou) e destino (onde queremos salvar)
      const sourceFile = path.join(__dirname, '../../../', req.file.path);
      const targetFile = path.join(topicoDir, newFileName);
      
      // Se o arquivo original existir, mover para o novo local
      if (fs.existsSync(sourceFile)) {
        // Ler o arquivo original
        const fileContent = fs.readFileSync(sourceFile);
        
        // Escrever no novo local
        fs.writeFileSync(targetFile, fileContent);
        
        // Remover arquivo original
        fs.unlinkSync(sourceFile);
        
        // Definir o novo caminho para o banco de dados
        anexoUrl = `uploads/chat/${nomeCategoria}/${nomeTopico}/${newFileName}`;
      } else {
        // Se não conseguirmos mover, usar o caminho original
        console.log('Arquivo original não encontrado, mantendo caminho original');
        anexoUrl = req.file.path;
      }
      
      // Determinar o tipo do anexo
      const mimeType = req.file.mimetype;
      if (mimeType.startsWith('image/')) {
        tipoAnexo = 'imagem';
      } else if (mimeType.startsWith('video/')) {
        tipoAnexo = 'video';
      } else {
        tipoAnexo = 'file';
      }
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
    req.io.to(`topico_${id}`).emit('novoComentario', comentarioComUsuario);

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
    const id_utilizador = req.user.id;

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
    req.io.to(`topico_${id_topico}`).emit('comentarioAvaliado', {
      id_comentario,
      likes: comentario.likes,
      dislikes: comentario.dislikes
    });

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
    const id_utilizador = req.user.id;

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

    // Se implementar uma tabela para armazenar denúncias com detalhes:
    // await Denuncia.create({
    //   id_comentario,
    //   id_utilizador,
    //   motivo,
    //   data_denuncia: new Date()
    // });

    // Notificar administradores via Socket.IO (canal privado de admins)
    req.io.to('admin_channel').emit('comentarioDenunciado', {
      id_comentario,
      id_topico,
      denuncias: comentario.denuncias,
      motivo
    });

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