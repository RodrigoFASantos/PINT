const { Topico_Categoria, Comentario_Topico, User, Categoria } = require('../../database/associations');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

// Função para criar estrutura de diretórios para chat
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

// Função para mover arquivo
const moveFile = (origem, destino) => {
  return uploadUtils.moverArquivo(origem, destino);
};

// Função para obter o tipo de arquivo
const getFileType = (mimetype) => {
  return uploadUtils.getFileType(mimetype);
};

// Controlador para obter detalhes de um tópico específico
const getTopico = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando tópico com ID: ${id}`);

    const topico = await Topico_Categoria.findOne({
      where: { id_topico: id },
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
        }
      ]
    });

    if (!topico) {
      console.log(`Tópico com ID ${id} não encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    console.log(`Tópico encontrado:`, topico);
    res.status(200).json({
      success: true,
      data: topico
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

// Controlador para obter todas as mensagens de um tópico
const getMensagens = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando mensagens para o tópico ID: ${id}`);

    const mensagens = await Comentario_Topico.findAll({
      where: { id_topico: id },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'ASC']]
    });

    console.log(`Encontradas ${mensagens.length} mensagens para o tópico ${id}`);

    res.status(200).json({
      success: true,
      data: mensagens
    });
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter mensagens do tópico',
      error: error.message
    });
  }
};

// Controlador para enviar uma nova mensagem num tópico
const enviarMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.user.id_utilizador || req.user.id;

    console.log(`Enviando mensagem para tópico ${id} pelo utilizador ${userId}`);
    console.log(`Texto da mensagem: ${texto}`);

    const topico = await Topico_Categoria.findByPk(id, {
      include: [{ model: Categoria, as: 'categoria' }]
    });

    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    const mensagemData = {
      id_topico: id,
      id_utilizador: userId,
      texto: texto || '',
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0,
      denuncias: 0
    };

    if (req.file) {
      console.log('Ficheiro detectado:', req.file.originalname);
      
      // Obter nomes para diretórios
      const categoriaNome = topico.categoria ? topico.categoria.nome : 'sem_categoria';
      const topicoNome = topico.titulo;
      
      // Criar estrutura de diretórios para o chat
      const chatPaths = createChatDirectoryStructure(categoriaNome, topicoNome);
      
      if (!chatPaths) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar estrutura de diretórios para o chat'
        });
      }

      // Gerar nome único para o arquivo
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}_${userId}${fileExtension}`;
      
      // Mover o arquivo para o destino
      const sourceFile = req.file.path;
      const targetFile = path.join(chatPaths.conteudosPath, fileName);
      
      const moveSuccessful = moveFile(sourceFile, targetFile);
      
      if (!moveSuccessful) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao mover o arquivo anexado'
        });
      }
      
      // Adicionar informações do arquivo à mensagem
      mensagemData.anexo_url = `${chatPaths.conteudosUrlPath}/${fileName}`;
      mensagemData.anexo_nome = req.file.originalname;
      mensagemData.tipo_anexo = getFileType(req.file.mimetype);
    }

    const novaMensagem = await Comentario_Topico.create(mensagemData);
    console.log(`Mensagem criada com ID: ${novaMensagem.id_comentario}`);

    const mensagemCompleta = await Comentario_Topico.findOne({
      where: { id_comentario: novaMensagem.id_comentario },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    if (req.io) {
      console.log(`Emitindo evento 'novoComentario' para tópico ${id}`);
      req.io.to(`topico_${id}`).emit('novoComentario', mensagemCompleta);
    }

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: mensagemCompleta
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
};

// Controlador para avaliar um comentário (gostar/não gostar)
const avaliarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { tipo } = req.body;
    const userId = req.user.id_utilizador || req.user.id;

    console.log(`Avaliando comentário ${idComentario} como ${tipo}`);

    if (!['like', 'dislike'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    const mensagem = await Comentario_Topico.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    if (tipo === 'like') {
      await mensagem.update({ likes: mensagem.likes + 1 });
    } else {
      await mensagem.update({ dislikes: mensagem.dislikes + 1 });
    }

    if (req.io) {
      req.io.to(`topico_${mensagem.id_topico}`).emit('comentarioAvaliado', {
        id_comentario: mensagem.id_comentario,
        likes: mensagem.likes,
        dislikes: mensagem.dislikes
      });
    }

    res.status(200).json({
      success: true,
      message: `Mensagem ${tipo === 'like' ? 'gostada' : 'não gostada'} com sucesso`,
      data: {
        likes: mensagem.likes,
        dislikes: mensagem.dislikes
      }
    });
  } catch (error) {
    console.error('Erro ao avaliar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar mensagem',
      error: error.message
    });
  }
};

// Controlador para denunciar uma mensagem
const denunciarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id_utilizador || req.user.id;

    console.log(`Denunciando comentário ${idComentario} por motivo: ${motivo}`);

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da denúncia é obrigatório'
      });
    }

    const mensagem = await Comentario_Topico.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    await mensagem.update({
      denuncias: mensagem.denuncias + 1,
      motivo_denuncia: motivo
    });

    if (req.io) {
      req.io.to('admin_channel').emit('comentarioDenunciado', {
        id_comentario: mensagem.id_comentario,
        id_topico: mensagem.id_topico,
        denuncias: mensagem.denuncias,
        motivo
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensagem denunciada com sucesso',
      data: {
        denuncias: mensagem.denuncias
      }
    });
  } catch (error) {
    console.error('Erro ao denunciar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao denunciar mensagem',
      error: error.message
    });
  }
};

// Exportar todas as funções no final do ficheiro
module.exports = {
  getTopico,
  getMensagens,
  enviarMensagem,
  avaliarMensagem,
  denunciarMensagem
};