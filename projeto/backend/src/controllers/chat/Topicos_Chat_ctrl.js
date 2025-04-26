const { Topico_Categoria, Comentario_Topico, User, Categoria } = require('../../database/associations');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

/**
 * Obter detalhes de um tópico
 */
exports.getTopico = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando tópico com ID: ${id}`);

    const topico = await Topico_Categoria.findOne({
      where: { id_topico: id },
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id', 'nome', 'email', 'foto_perfil']
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

/**
 * Obter mensagens de um tópico
 */
exports.getMensagens = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando mensagens para o tópico ID: ${id}`);
    
    const mensagens = await Comentario_Topico.findAll({
      where: { id_topico: id },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id', 'nome', 'email', 'foto_perfil']
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

/**
 * Enviar mensagem em um tópico
 */
exports.enviarMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.user.id;
    
    console.log(`Enviando mensagem para tópico ${id} pelo usuário ${userId}`);
    console.log(`Texto da mensagem: ${texto}`);
    
    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }
    
    // Dados da mensagem
    const mensagemData = {
      id_topico: id,
      id_utilizador: userId,
      texto: texto || '',
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0
    };
    
    // Se tiver arquivo anexo
    if (req.file) {
      console.log('Arquivo detectado:', req.file.originalname);
      
      // Criar pasta para arquivos do chat se não existir
      const uploadDir = path.join(__dirname, '../../../uploads/chat');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}_${userId}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Salvar o arquivo
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Adicionar informações do anexo à mensagem
      mensagemData.anexo_url = `uploads/chat/${fileName}`;
      mensagemData.anexo_nome = req.file.originalname;
      
      // Determinar o tipo de anexo
      const mimeType = req.file.mimetype.split('/')[0];
      if (mimeType === 'image') {
        mensagemData.tipo_anexo = 'imagem';
      } else if (mimeType === 'video') {
        mensagemData.tipo_anexo = 'video';
      } else {
        mensagemData.tipo_anexo = 'file';
      }
    }
    
    // Criar a mensagem no banco de dados
    const novaMensagem = await Comentario_Topico.create(mensagemData);
    console.log(`Mensagem criada com ID: ${novaMensagem.id_comentario}`);
    
    // Buscar a mensagem com dados do usuário
    const mensagemCompleta = await Comentario_Topico.findOne({
      where: { id_comentario: novaMensagem.id_comentario },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id', 'nome', 'email', 'foto_perfil']
        }
      ]
    });
    
    // Emitir evento para o socket.io se disponível
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

/**
 * Avaliar uma mensagem (curtir/descurtir)
 */
exports.avaliarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'
    const userId = req.user.id;
    
    console.log(`Avaliando comentário ${idComentario} como ${tipo}`);
    
    if (!['like', 'dislike'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }
    
    // Verificar se a mensagem existe
    const mensagem = await Comentario_Topico.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }
    
    // Atualizar contadores de likes/dislikes
    if (tipo === 'like') {
      await mensagem.update({ likes: mensagem.likes + 1 });
    } else {
      await mensagem.update({ dislikes: mensagem.dislikes + 1 });
    }
    
    res.status(200).json({
      success: true,
      message: `Mensagem ${tipo === 'like' ? 'curtida' : 'descurtida'} com sucesso`
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

/**
 * Denunciar uma mensagem
 */
exports.denunciarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id;
    
    console.log(`Denunciando comentário ${idComentario} por motivo: ${motivo}`);
    
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da denúncia é obrigatório'
      });
    }
    
    // Verificar se a mensagem existe
    const mensagem = await Comentario_Topico.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }
    
    // Em uma implementação real, você salvaria a denúncia em uma tabela específica
    // Por simplicidade, vamos apenas marcar a mensagem como denunciada
    await mensagem.update({ 
      denunciada: true,
      motivo_denuncia: motivo
    });
    
    res.status(200).json({
      success: true,
      message: 'Mensagem denunciada com sucesso'
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