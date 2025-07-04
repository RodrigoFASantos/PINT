const { Topico_Area, ChatMensagem, ChatInteracao, ChatDenuncia, User, Categoria, Area } = require('../../database/associations');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

/**
 * CONTROLADORES PARA SISTEMA DE CHAT E MENSAGENS DE TÓPICOS
 * 
 * Este módulo complementa o sistema de tópicos com funcionalidades
 * específicas de chat em tempo real, gestão de mensagens e moderação.
 * Fornece operações para interação dinâmica em tópicos de discussão
 * com suporte a anexos multimédia e sistema de denúncias.
 */

// =============================================================================
// FUNÇÕES AUXILIARES PARA GESTÃO DE FICHEIROS
// =============================================================================

/**
 * Criar estrutura de diretórios para chat
 * 
 * Organiza automaticamente os ficheiros de chat em pastas
 * hierárquicas baseadas na categoria e tópico da discussão.
 */
const createChatDirectoryStructure = (categoriaNome, topicoNome) => {
  try {
    const categoriaSlug = uploadUtils.normalizarNome(categoriaNome);
    const topicoSlug = uploadUtils.normalizarNome(topicoNome);
    
    return uploadUtils.criarDiretoriosChat(categoriaSlug, topicoSlug);
  } catch (error) {
    return null;
  }
};

/**
 * Mover ficheiro para localização definitiva
 * 
 * Transfere ficheiros da pasta temporária para o destino final
 * organizando-os na estrutura de pastas apropriada.
 */
const moveFile = (origem, destino) => {
  return uploadUtils.moverArquivo(origem, destino);
};

/**
 * Determinar tipo de ficheiro baseado no MIME type
 * 
 * Classifica ficheiros em categorias (imagem, documento, vídeo, etc.)
 * para facilitar o processamento e apresentação na interface.
 */
const getFileType = (mimetype) => {
  return uploadUtils.getFileType(mimetype);
};

// =============================================================================
// CONSULTA E NAVEGAÇÃO DE TÓPICOS
// =============================================================================

/**
 * Obter detalhes completos de um tópico específico
 * 
 * Retorna informações completas sobre um tópico incluindo
 * metadados, criador e informações da categoria associada.
 */
const getTopico = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await Topico_Area.findOne({
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
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do tópico',
      error: error.message
    });
  }
};

/**
 * Obter todas as mensagens de um tópico
 * 
 * Lista cronologicamente todas as mensagens de discussão
 * de um tópico específico incluindo informações dos autores.
 */
const getMensagens = async (req, res) => {
  try {
    const { id } = req.params;

    const mensagens = await ChatMensagem.findAll({
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

    res.status(200).json({
      success: true,
      data: mensagens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter mensagens do tópico',
      error: error.message
    });
  }
};

// =============================================================================
// CRIAÇÃO E GESTÃO DE MENSAGENS
// =============================================================================

/**
 * Enviar nova mensagem num tópico
 * 
 * Processa criação de nova mensagem de chat com suporte
 * para anexos de ficheiros e notificações em tempo real via WebSocket.
 */
const enviarMensagem = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.utilizador.id_utilizador || req.user.id_utilizador;

    // Verificar se o tópico existe e obter dados da categoria
    const topico = await Topico_Area.findByPk(id, {
      include: [{ model: Categoria, as: 'categoria' }]
    });

    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Preparar dados base da mensagem
    const mensagemData = {
      id_topico: id,
      id_utilizador: userId,
      texto: texto || '',
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0,
      foi_denunciada: false,
      oculta: false
    };

    // Processar anexo se fornecido
    if (req.file) {
      // Obter nomes para organização de diretórios
      const categoriaNome = topico.categoria ? topico.categoria.nome : 'sem_categoria';
      const topicoNome = topico.titulo;
      
      // Criar estrutura de diretórios específica para chat
      const chatPaths = createChatDirectoryStructure(categoriaNome, topicoNome);
      
      if (!chatPaths) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar estrutura de diretórios para o chat'
        });
      }

      // Gerar nome único para o ficheiro
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}_${userId}${fileExtension}`;
      
      // Transferir ficheiro para destino final
      const sourceFile = req.file.path;
      const targetFile = path.join(chatPaths.conteudosPath, fileName);
      
      const moveSuccessful = moveFile(sourceFile, targetFile);
      
      if (!moveSuccessful) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao mover o arquivo anexado'
        });
      }
      
      // Adicionar informações do anexo à mensagem
      mensagemData.anexo_url = `${chatPaths.conteudosUrlPath}/${fileName}`;
      mensagemData.anexo_nome = req.file.originalname;
      mensagemData.tipo_anexo = getFileType(req.file.mimetype);
    }

    // Criar mensagem na base de dados
    const novaMensagem = await ChatMensagem.create(mensagemData);

    // Carregar mensagem completa com dados do utilizador
    const mensagemCompleta = await ChatMensagem.findOne({
      where: { id: novaMensagem.id },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar utilizadores conectados via WebSocket
    if (req.io) {
      req.io.to(`topico_${id}`).emit('novoComentario', mensagemCompleta);
    }

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: mensagemCompleta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
};

// =============================================================================
// SISTEMA DE INTERAÇÕES E MODERAÇÃO
// =============================================================================

/**
 * Avaliar mensagem (Like/Dislike)
 * 
 * Permite aos utilizadores expressar aprovação ou desaprovação
 * sobre mensagens específicas no sistema de chat.
 */
const avaliarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { tipo } = req.body;
    const userId = req.utilizador.id_utilizador || req.user.id_utilizador;

    // Validar tipo de avaliação
    if (!['like', 'dislike'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    // Procurar mensagem a avaliar
    const mensagem = await ChatMensagem.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    // Verificar se utilizador já avaliou esta mensagem
    const interacaoExistente = await ChatInteracao.findOne({
      where: {
        id_mensagem: idComentario,
        id_utilizador: userId
      }
    });

    if (interacaoExistente) {
      // Se a avaliação é a mesma, remover (toggle)
      if (interacaoExistente.tipo === tipo) {
        await interacaoExistente.destroy();
        // Decrementar contador
        if (tipo === 'like') {
          await mensagem.update({ likes: Math.max(0, mensagem.likes - 1) });
        } else {
          await mensagem.update({ dislikes: Math.max(0, mensagem.dislikes - 1) });
        }
      } else {
        // Alterar tipo de avaliação
        await interacaoExistente.update({ tipo });
        
        // Ajustar contadores
        if (tipo === 'like') {
          await mensagem.update({ 
            likes: mensagem.likes + 1,
            dislikes: Math.max(0, mensagem.dislikes - 1)
          });
        } else {
          await mensagem.update({ 
            dislikes: mensagem.dislikes + 1,
            likes: Math.max(0, mensagem.likes - 1)
          });
        }
      }
    } else {
      // Criar nova interação
      await ChatInteracao.create({
        id_mensagem: idComentario,
        id_utilizador: userId,
        tipo,
        data_interacao: new Date()
      });
      
      // Incrementar contador apropriado
      if (tipo === 'like') {
        await mensagem.update({ likes: mensagem.likes + 1 });
      } else {
        await mensagem.update({ dislikes: mensagem.dislikes + 1 });
      }
    }

    // Recarregar mensagem para obter contadores atualizados
    await mensagem.reload();

    // Notificar via WebSocket
    if (req.io) {
      req.io.to(`topico_${mensagem.id_topico}`).emit('comentarioAvaliado', {
        id_comentario: mensagem.id,
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
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar mensagem',
      error: error.message
    });
  }
};

/**
 * Denunciar mensagem por conteúdo inadequado
 * 
 * Sistema de moderação comunitária que permite reportar conteúdo
 * impróprio, spam ou que viole as regras de conduta da plataforma.
 * Regista a denúncia e notifica automaticamente os administradores.
 */
const denunciarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { motivo, descricao } = req.body;
    const id_utilizador = req.utilizador.id_utilizador || req.user.id_utilizador;

    // Validar dados obrigatórios
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da denúncia é obrigatório'
      });
    }

    // Verificar se a mensagem existe
    const mensagem = await ChatMensagem.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    // Verificar se utilizador já denunciou esta mensagem
    const denunciaExistente = await ChatDenuncia.findOne({
      where: {
        id_mensagem: idComentario,
        id_denunciante: id_utilizador
      }
    });

    if (denunciaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já denunciou esta mensagem anteriormente'
      });
    }

    // Criar registo de denúncia
    await ChatDenuncia.create({
      id_mensagem: idComentario,
      id_denunciante: id_utilizador,
      motivo,
      descricao: descricao || null,
      data_denuncia: new Date(),
      resolvida: false
    });

    // Marcar mensagem como denunciada
    await mensagem.update({
      foi_denunciada: true
    });

    // Notificar administradores via WebSocket
    if (req.io) {
      req.io.to('admin_channel').emit('comentarioDenunciado', {
        id_comentario: mensagem.id,
        id_topico: mensagem.id_topico,
        motivo
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensagem denunciada com sucesso. Obrigado pela sua contribuição.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao denunciar mensagem',
      error: error.message
    });
  }
};

// =============================================================================
// FUNCIONALIDADES AUXILIARES DE MODERAÇÃO
// =============================================================================

/**
 * Obter estatísticas de atividade de um tópico
 * 
 * Retorna métricas de participação e engagement
 * para análise de moderadores e administradores.
 */
const obterEstatisticasTopico = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o tópico existe
    const topico = await Topico_Area.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Calcular estatísticas básicas
    const totalMensagens = await ChatMensagem.count({
      where: { id_topico: id }
    });

    const participantesUnicos = await ChatMensagem.count({
      where: { id_topico: id },
      distinct: true,
      col: 'id_utilizador'
    });

    const mensagensComAnexos = await ChatMensagem.count({
      where: { 
        id_topico: id,
        anexo_url: { [require('sequelize').Op.ne]: null }
      }
    });

    const totalDenuncias = await ChatDenuncia.count({
      include: [{
        model: ChatMensagem,
        as: 'mensagem',
        where: { id_topico: id }
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        id_topico: id,
        titulo_topico: topico.titulo,
        total_mensagens: totalMensagens,
        participantes_unicos: participantesUnicos,
        mensagens_com_anexos: mensagensComAnexos,
        total_denuncias: totalDenuncias,
        media_mensagens_por_participante: participantesUnicos > 0 ? (totalMensagens / participantesUnicos).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do tópico',
      error: error.message
    });
  }
};

/**
 * Moderar mensagem (ocultar/mostrar)
 * 
 * Permite que moderadores ocultem temporariamente mensagens
 * inadequadas sem as eliminar permanentemente.
 */
const moderarMensagem = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { acao, motivo } = req.body; // acao: 'ocultar' ou 'mostrar'
    const userRole = req.utilizador.id_cargo || req.user.id_cargo;

    // Verificar permissões de moderação
    if (userRole !== 1 && userRole !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissões para moderar mensagens'
      });
    }

    // Procurar mensagem
    const mensagem = await ChatMensagem.findByPk(idComentario);
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    // Aplicar ação de moderação
    let novoEstado;
    if (acao === 'ocultar') {
      novoEstado = true;
    } else if (acao === 'mostrar') {
      novoEstado = false;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Ação inválida. Use "ocultar" ou "mostrar"'
      });
    }

    await mensagem.update({
      oculta: novoEstado
    });

    // Notificar via WebSocket
    if (req.io) {
      req.io.to(`topico_${mensagem.id_topico}`).emit('mensagemModerada', {
        id_comentario: mensagem.id,
        oculta: novoEstado,
        motivo: motivo || null
      });
    }

    res.status(200).json({
      success: true,
      message: `Mensagem ${acao === 'ocultar' ? 'ocultada' : 'exibida'} com sucesso`,
      data: {
        id_comentario: mensagem.id,
        oculta: novoEstado
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao moderar mensagem',
      error: error.message
    });
  }
};

module.exports = {
  getTopico,
  getMensagens,
  enviarMensagem,
  avaliarMensagem,
  denunciarMensagem,
  obterEstatisticasTopico,
  moderarMensagem
};