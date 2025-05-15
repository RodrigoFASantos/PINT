const ChatMensagem = require("../../database/models/ChatMensagem");
const User = require("../../database/models/User");
const ChatInteracao = require("../../database/models/ChatInteracao");
const ChatDenuncia = require("../../database/models/ChatDenuncia");
const Topico_Area = require("../../database/models/Topico_Area");
const Categoria = require("../../database/models/Categoria");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const uploadUtils = require("../../utils/uploadUtils");

// Obter todos os comentários
const getAllComentarios = async (req, res) => {
  try {
    const { id } = req.params; // ID do tópico
    
    const comentarios = await ChatMensagem.findAll({
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
      order: [['data_criacao', 'ASC']]
    });
    
    // Garantir que todos os comentários têm um ID único
    const comentariosValidados = comentarios.map((comentario) => {
      const item = comentario.toJSON();
      if (!item.id_comentario) {
        item.id_comentario = item.id;
      }
      return item;
    });
    
    res.json({
      success: true,
      data: comentariosValidados
    });
  } catch (error) {
    console.error("Erro ao procurar comentários:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao procurar comentários", 
      error: error.message 
    });
  }
};

// Criar um novo comentário
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
    console.log(`Anexo recebido:`, req.file ? {
      nome: req.file.originalname,
      caminho: req.file.path,
      tipo: req.file.mimetype,
      tamanho: req.file.size
    } : 'Nenhum');

    // Verificar se o tópico existe e obter suas informações, incluindo categoria
    const topico = await Topico_Area.findOne({
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
      const { dirPath, conteudosPath } = uploadUtils.criarDiretoriosChat(categoriaSlug, topicoSlug);
      console.log(`Diretórios: dirPath=${dirPath}, conteudosPath=${conteudosPath}`);

      // Detalhes do ficheiro
      anexoNome = req.file.originalname;
      const fileExtension = path.extname(anexoNome);
      const newFileName = `${Date.now()}_${id_utilizador}${fileExtension}`;

      // Origem (onde o middleware salvou) e destino (onde queremos salvar)
      const sourceFile = req.file.path;
      console.log(`Arquivo original: ${sourceFile}`);

      // Criar diretório conteúdos se não existir
      const conteudosDirPath = path.join(dirPath, 'conteudos');
      if (!fs.existsSync(conteudosDirPath)) {
        try {
          fs.mkdirSync(conteudosDirPath, { recursive: true });
          console.log(`Diretório de conteúdos criado: ${conteudosDirPath}`);
        } catch (err) {
          console.error(`Erro ao criar diretório: ${err.message}`);
        }
      }

      const targetFile = path.join(conteudosDirPath, newFileName);
      console.log(`Destino do arquivo: ${targetFile}`);

      // Mover o ficheiro para o local correto
      try {
        const movido = uploadUtils.moverArquivo(sourceFile, targetFile);
        if (!movido) {
          console.error(`Erro ao mover arquivo de ${sourceFile} para ${targetFile}`);
          return res.status(500).json({
            success: false,
            message: 'Erro ao processar o ficheiro anexado'
          });
        }
        console.log(`Arquivo movido com sucesso para ${targetFile}`);
      } catch (error) {
        console.error(`Erro ao mover arquivo: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: `Erro ao mover o ficheiro anexado: ${error.message}`
        });
      }

      // Definir o caminho do anexo para o banco de dados
      anexoUrl = `${conteudosPath}/${newFileName}`;

      // Determinar o tipo do anexo
      const mimeType = req.file.mimetype;
      tipoAnexo = uploadUtils.getFileType(mimeType);

      console.log(`Tipo de anexo determinado: ${tipoAnexo}`);
      console.log(`Caminho guardado na BD: ${anexoUrl}`);
    }

    // Criar o comentário
    const dados = {
      id_topico: id,
      id_utilizador,
      texto,
      anexo_url: anexoUrl,
      anexo_nome: anexoNome,
      tipo_anexo: tipoAnexo,
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0
    };

    console.log('Criando comentário com dados:', dados);

    const novoComentario = await ChatMensagem.create(dados);
    console.log(`Comentário criado com ID: ${novoComentario.id || novoComentario.id_comentario}`);

    // Garantir que id_comentario está definido para compatibilidade com frontend
    if (!novoComentario.id_comentario && novoComentario.id) {
      novoComentario.id_comentario = novoComentario.id;
    }

    // Carregar informações do utilizador para retornar na resposta
    const comentarioComUtilizador = await ChatMensagem.findOne({
      where: {
        [Op.or]: [
          { id_comentario: novoComentario.id_comentario },
          { id: novoComentario.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Garantir que o objeto de resposta tem id_comentario
    const resposta = comentarioComUtilizador.toJSON();
    if (!resposta.id_comentario && resposta.id) {
      resposta.id_comentario = resposta.id;
    }

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id}`).emit('novoComentario', resposta);
      console.log('Evento novoComentario emitido via socket.io');
    } else {
      console.log('IO não disponível, comentário não será transmitido via socket');
    }

    res.status(201).json({
      success: true,
      message: 'Comentário criado com sucesso',
      data: resposta
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar comentário',
      error: error.message
    });
  }
};

// NOVA FUNÇÃO: Avaliar um comentário (like/dislike)
const avaliarComentario = async (req, res) => {
  try {
    const { id, idComentario } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'
    
    // Validar tipo de avaliação
    if (!['like', 'dislike'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike".'
      });
    }
    
    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;
    
    console.log(`Avaliando comentário ${idComentario} como ${tipo} pelo utilizador ${id_utilizador}`);
    
    // Verificar se o comentário existe
    const comentario = await ChatMensagem.findByPk(idComentario);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }
    
    // Verificar se o utilizador já avaliou este comentário
    const interacaoExistente = await ChatInteracao.findOne({
      where: {
        id_mensagem: idComentario,
        id_utilizador
      }
    });
    
    if (interacaoExistente) {
      // Se o utilizador já avaliou com o mesmo tipo, remover a avaliação
      if (interacaoExistente.tipo === tipo) {
        await interacaoExistente.destroy();
        
        // Atualizar contadores
        if (tipo === 'like') {
          await comentario.update({ likes: Math.max(0, comentario.likes - 1) });
        } else {
          await comentario.update({ dislikes: Math.max(0, comentario.dislikes - 1) });
        }
        
        return res.json({
          success: true,
          message: `Avaliação "${tipo}" removida do comentário`,
          data: {
            id_comentario: idComentario,
            likes: tipo === 'like' ? comentario.likes - 1 : comentario.likes,
            dislikes: tipo === 'dislike' ? comentario.dislikes - 1 : comentario.dislikes
          }
        });
      } 
      
      // Se o utilizador já avaliou com tipo diferente, alterar o tipo
      else {
        await interacaoExistente.update({ tipo });
        
        // Atualizar contadores (incrementar o novo tipo, decrementar o antigo)
        if (tipo === 'like') {
          await comentario.update({ 
            likes: comentario.likes + 1,
            dislikes: Math.max(0, comentario.dislikes - 1)
          });
        } else {
          await comentario.update({ 
            likes: Math.max(0, comentario.likes - 1),
            dislikes: comentario.dislikes + 1
          });
        }
      }
    } else {
      // Se o utilizador não avaliou anteriormente, criar nova avaliação
      await ChatInteracao.create({
        id_mensagem: idComentario,
        id_utilizador,
        tipo,
        data_interacao: new Date()
      });
      
      // Atualizar contadores
      if (tipo === 'like') {
        await comentario.update({ likes: comentario.likes + 1 });
      } else {
        await comentario.update({ dislikes: comentario.dislikes + 1 });
      }
    }
    
    // Buscar comentário atualizado
    const comentarioAtualizado = await ChatMensagem.findByPk(idComentario);
    
    res.json({
      success: true,
      message: `Comentário avaliado como "${tipo}" com sucesso`,
      data: {
        id_comentario: idComentario,
        likes: comentarioAtualizado.likes,
        dislikes: comentarioAtualizado.dislikes
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

// NOVA FUNÇÃO: Denunciar um comentário
const denunciarComentario = async (req, res) => {
  try {
    const { id, idComentario } = req.params;
    const { motivo, descricao } = req.body;
    
    // Validação básica
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer um motivo para a denúncia'
      });
    }
    
    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;
    
    console.log(`Denúncia de comentário ${idComentario} por ${id_utilizador}: ${motivo}`);
    
    // Verificar se o comentário existe
    const comentario = await ChatMensagem.findByPk(idComentario);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }
    
    // Verificar se o utilizador já denunciou este comentário
    const denunciaExistente = await ChatDenuncia.findOne({
      where: {
        id_mensagem: idComentario,
        id_denunciante: id_utilizador
      }
    });
    
    if (denunciaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Você já denunciou este comentário anteriormente'
      });
    }
    
    // Criar a denúncia
    await ChatDenuncia.create({
      id_mensagem: idComentario,
      id_denunciante: id_utilizador,
      motivo,
      descricao: descricao || null,
      data_denuncia: new Date(),
      resolvida: false
    });
    
    // Marcar o comentário como denunciado
    await comentario.update({ foi_denunciada: true });
    
    // Notificar administradores (opcional - implementar se necessário)
    
    res.json({
      success: true,
      message: 'Comentário denunciado com sucesso. Obrigado pela sua contribuição.'
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
  getAllComentarios,
  createComentario,
  avaliarComentario,
  denunciarComentario
};