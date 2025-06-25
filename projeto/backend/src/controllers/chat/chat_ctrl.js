const ChatMensagem = require('../../database/models/ChatMensagem');
const Topico = require('../../database/models/Topico_Area');
const User = require('../../database/models/User');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const CAMINHO_PASTA_UPLOADS = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS);

// Configurar o multer para upload de ficheiros
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(BASE_UPLOAD_DIR, 'chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configuração para upload
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Função para obter o tipo de anexo
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'imagem';
  if (mimetype.startsWith('video/')) return 'video';
  return 'file';
};

// Obter todas as mensagens de um tópico
const getMensagens = async (req, res) => {
  try {
    const { topicoId } = req.params;

    // Verificar se o tópico existe
    const topico = await Topico.findByPk(topicoId);
    if (!topico) {
      return res.status(404).json({ mensagem: 'Tópico não encontrado' });
    }

    // Procurar mensagens com dados do utilizador
    const mensagens = await ChatMensagem.findAll({
      where: { id_topico: topicoId },
      order: [['dataCriacao', 'ASC']],
      include: [{
        model: User,
        as: 'utilizador',
        attributes: ['id', 'nome', 'email', 'avatar']
      }]
    });

    return res.status(200).json(mensagens);
  } catch (error) {
    console.error('Erro ao procurar mensagens:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Criar nova mensagem
const criarMensagem = async (req, res) => {
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
      anexoUrl = `/${CAMINHO_PASTA_UPLOADS}/chat/${req.file.filename}`;
      anexoNome = req.file.originalname;
      tipoAnexo = getFileType(req.file.mimetype);
    }

    // Criar a mensagem
    const novaMensagem = await ChatMensagem.create({
      id_topico: topicoId,
      id_utilizador: userId,
      texto,
      anexoUrl,
      anexoNome,
      tipoAnexo
    });

    // Procurar a mensagem com dados do utilizador para retornar
    const mensagemCompleta = await ChatMensagem.findByPk(novaMensagem.id, {
      include: [{
        model: User,
        as: 'utilizador',
        attributes: ['id', 'nome', 'email', 'avatar']
      }]
    });

    // Emitir evento para socket.io
    if (req.io) {
      req.io.to(`topico_${topicoId}`).emit('novaMensagem', mensagemCompleta);
    }

    return res.status(201).json(mensagemCompleta);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Excluir mensagem (apenas o próprio autor ou administrador)
const excluirMensagem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mensagemId } = req.params;

    // Procurar mensagem
    const mensagem = await ChatMensagem.findByPk(mensagemId);
    if (!mensagem) {
      return res.status(404).json({ mensagem: 'Mensagem não encontrada' });
    }

    // Verificar permissão (autor ou admin)
    if (mensagem.id_utilizador !== userId && req.user.role !== 1) {
      return res.status(403).json({ mensagem: 'Sem permissão para excluir esta mensagem' });
    }

    // Se tiver anexo, remover o ficheiro
    if (mensagem.anexoUrl) {
      const filePath = path.join(process.cwd(), mensagem.anexoUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Excluir a mensagem
    await mensagem.destroy();

    // Notificar outros utilizadores sobre a exclusão
    if (req.io) {
      req.io.to(`topico_${mensagem.id_topico}`).emit('mensagemExcluida', mensagemId);
    }

    return res.status(200).json({ mensagem: 'Mensagem excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

// Middleware para processamento de upload de ficheiros
const uploadAnexo = upload.single('anexo');

module.exports = {
  getMensagens,
  criarMensagem,
  excluirMensagem,
  uploadAnexo
};