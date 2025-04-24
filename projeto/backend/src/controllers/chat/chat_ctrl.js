const ChatMensagem = require('../../database/models/ChatMensagem');
const Topico = require('../../database/models/Topico');
const User = require('../../database/models/User');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configurar o multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/chat');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Garantir nome único usando UUID
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Função para obter o tipo de anexo
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'imagem';
  if (mimetype.startsWith('video/')) return 'video';
  return 'file';
};

// Configuração para upload
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Controlador do chat
const chatController = {
  // Obter todas as mensagens de um tópico
  getMensagens: async (req, res) => {
    try {
      const { topicoId } = req.params;
      
      // Verificar se o tópico existe
      const topico = await Topico.findByPk(topicoId);
      if (!topico) {
        return res.status(404).json({ mensagem: 'Tópico não encontrado' });
      }
      
      // Buscar mensagens com dados do usuário
      const mensagens = await ChatMensagem.findAll({
        where: { id_topico: topicoId },
        order: [['dataCriacao', 'ASC']],
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email', 'avatar']
        }]
      });
      
      return res.status(200).json(mensagens);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Criar nova mensagem
  criarMensagem: async (req, res) => {
    try {
      const userId = req.user.id;
      const { topicoId, texto } = req.body;
      
      // Verificar se o tópico existe
      const topico = await Topico.findByPk(topicoId);
      if (!topico) {
        return res.status(404).json({ mensagem: 'Tópico não encontrado' });
      }
      
      let anexoUrl = null;
      let anexoNome = null;
      let tipoAnexo = null;
      
      // Processar anexo, se existir
      if (req.file) {
        anexoUrl = `/uploads/chat/${req.file.filename}`;
        anexoNome = req.file.originalname;
        tipoAnexo = getFileType(req.file.mimetype);
      }
      
      // Criar a mensagem
      const novaMensagem = await ChatMensagem.create({
        id_topico: topicoId,
        id_usuario: userId,
        texto,
        anexoUrl,
        anexoNome,
        tipoAnexo
      });
      
      // Buscar a mensagem com dados do usuário para retornar
      const mensagemCompleta = await ChatMensagem.findByPk(novaMensagem.id, {
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id', 'nome', 'email', 'avatar']
        }]
      });
      
      // Emitir evento para socket.io (será implementado no server.js)
      if (req.io) {
        req.io.to(`topico_${topicoId}`).emit('novaMensagem', mensagemCompleta);
      }
      
      return res.status(201).json(mensagemCompleta);
    } catch (error) {
      console.error('Erro ao criar mensagem:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Excluir mensagem (apenas o próprio autor ou administrador)
  excluirMensagem: async (req, res) => {
    try {
      const userId = req.user.id;
      const { mensagemId } = req.params;
      
      // Buscar mensagem
      const mensagem = await ChatMensagem.findByPk(mensagemId);
      if (!mensagem) {
        return res.status(404).json({ mensagem: 'Mensagem não encontrada' });
      }
      
      // Verificar permissão (autor ou admin)
      if (mensagem.id_usuario !== userId && req.user.role !== 1) {
        return res.status(403).json({ mensagem: 'Sem permissão para excluir esta mensagem' });
      }
      
      // Se tiver anexo, remover o arquivo
      if (mensagem.anexoUrl) {
        const filePath = path.join(__dirname, '../../', mensagem.anexoUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Excluir a mensagem
      await mensagem.destroy();
      
      // Notificar outros usuários sobre a exclusão
      if (req.io) {
        req.io.to(`topico_${mensagem.id_topico}`).emit('mensagemExcluida', mensagemId);
      }
      
      return res.status(200).json({ mensagem: 'Mensagem excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Middleware para processamento de upload de arquivos
  uploadAnexo: upload.single('anexo')
};

module.exports = chatController;