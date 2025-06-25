const ChatMensagem = require("../../database/models/ChatMensagem");
const User = require("../../database/models/User");
const ChatInteracao = require("../../database/models/ChatInteracoes"); // Modelo correto para interações
const ChatDenuncia = require("../../database/models/ChatDenuncia");

// Função para avaliar um comentário com like ou dislike
const avaliarComentario = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'
    
    console.log(`[AVALIACAO] Recebida requisição para avaliar comentário ${idComentario} como ${tipo}`);
    
    // Validar tipo de avaliação recebido
    if (!['like', 'dislike'].includes(tipo)) {
      console.log(`[AVALIACAO] Tipo inválido: ${tipo}`);
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike".'
      });
    }
    
    // Obter ID do utilizador autenticado do middleware
    const id_utilizador = req.utilizador?.id_utilizador || req.utilizador?.id;
    
    if (!id_utilizador) {
      console.error('[AVALIACAO] Utilizador não encontrado no req.utilizador:', req.utilizador);
      return res.status(401).json({
        success: false,
        message: 'Utilizador não autenticado'
      });
    }
    
    console.log(`[AVALIACAO] Utilizador ${id_utilizador} avaliando comentário ${idComentario} como ${tipo}`);
    
    // Verificar se o comentário existe na base de dados
    const comentario = await ChatMensagem.findByPk(idComentario);
    
    if (!comentario) {
      console.log(`[AVALIACAO] Comentário ${idComentario} não encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }
    
    console.log(`[AVALIACAO] Comentário encontrado: ID=${comentario.id}, likes=${comentario.likes}, dislikes=${comentario.dislikes}`);
    
    // Verificar se o utilizador já tem uma interação com este comentário
    const interacaoExistente = await ChatInteracao.findOne({
      where: {
        id_mensagem: idComentario,
        id_utilizador
      }
    });
    
    console.log(`[AVALIACAO] Interação existente:`, interacaoExistente ? `Tipo: ${interacaoExistente.tipo}` : 'Nenhuma');
    
    let novoLikes = comentario.likes;
    let novoDislikes = comentario.dislikes;
    
    if (interacaoExistente) {
      // Se utilizador já avaliou com o mesmo tipo, remover avaliação (toggle)
      if (interacaoExistente.tipo === tipo) {
        console.log(`[AVALIACAO] Removendo avaliação existente do tipo ${tipo}`);
        await interacaoExistente.destroy();
        
        // Decrementar contador apropriado
        if (tipo === 'like') {
          novoLikes = Math.max(0, comentario.likes - 1);
        } else {
          novoDislikes = Math.max(0, comentario.dislikes - 1);
        }
        
        await comentario.update({ 
          likes: novoLikes, 
          dislikes: novoDislikes 
        });
        
        console.log(`[AVALIACAO] Avaliação removida. Novos contadores: likes=${novoLikes}, dislikes=${novoDislikes}`);
        
        return res.json({
          success: true,
          message: `Avaliação "${tipo}" removida do comentário`,
          data: {
            id_comentario: idComentario,
            likes: novoLikes,
            dislikes: novoDislikes
          }
        });
      } 
      
      // Se utilizador já avaliou com tipo diferente, alterar tipo
      else {
        console.log(`[AVALIACAO] Alterando tipo de ${interacaoExistente.tipo} para ${tipo}`);
        await interacaoExistente.update({ tipo });
        
        // Atualizar contadores: incrementar novo tipo, decrementar tipo anterior
        if (tipo === 'like') {
          novoLikes = comentario.likes + 1;
          novoDislikes = Math.max(0, comentario.dislikes - 1);
        } else {
          novoLikes = Math.max(0, comentario.likes - 1);
          novoDislikes = comentario.dislikes + 1;
        }
      }
    } else {
      // Utilizador não avaliou anteriormente, criar nova interação
      console.log(`[AVALIACAO] Criando nova interação do tipo ${tipo}`);
      await ChatInteracao.create({
        id_mensagem: idComentario,
        id_utilizador,
        tipo,
        data_interacao: new Date()
      });
      
      // Incrementar contador apropriado
      if (tipo === 'like') {
        novoLikes = comentario.likes + 1;
      } else {
        novoDislikes = comentario.dislikes + 1;
      }
    }
    
    // Atualizar comentário com novos contadores
    await comentario.update({ 
      likes: novoLikes, 
      dislikes: novoDislikes 
    });
    
    console.log(`[AVALIACAO] Comentário atualizado. Novos contadores: likes=${novoLikes}, dislikes=${novoDislikes}`);
    
    res.json({
      success: true,
      message: `Comentário avaliado como "${tipo}" com sucesso`,
      data: {
        id_comentario: idComentario,
        likes: novoLikes,
        dislikes: novoDislikes
      }
    });
    
  } catch (error) {
    console.error('[AVALIACAO] Erro ao avaliar comentário:', error);
    console.error('[AVALIACAO] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar comentário',
      error: error.message
    });
  }
};

// Função para denunciar um comentário por conteúdo inadequado
const denunciarComentario = async (req, res) => {
  try {
    const { idComentario } = req.params;
    const { motivo, descricao } = req.body;
    
    console.log(`[DENUNCIA] Recebida requisição para denunciar comentário ${idComentario}`);
    
    // Validar que foi fornecido um motivo para a denúncia
    if (!motivo) {
      console.log('[DENUNCIA] Motivo não fornecido');
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer um motivo para a denúncia'
      });
    }
    
    // Obter ID do utilizador autenticado do middleware
    const id_utilizador = req.utilizador?.id_utilizador || req.utilizador?.id;
    
    if (!id_utilizador) {
      console.error('[DENUNCIA] Utilizador não encontrado no req.utilizador:', req.utilizador);
      return res.status(401).json({
        success: false,
        message: 'Utilizador não autenticado'
      });
    }
    
    console.log(`[DENUNCIA] Utilizador ${id_utilizador} denunciando comentário ${idComentario} por: ${motivo}`);
    
    // Verificar se o comentário existe
    const comentario = await ChatMensagem.findByPk(idComentario);
    
    if (!comentario) {
      console.log(`[DENUNCIA] Comentário ${idComentario} não encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }
    
    // Verificar se utilizador já denunciou este comentário
    const denunciaExistente = await ChatDenuncia.findOne({
      where: {
        id_mensagem: idComentario,
        id_denunciante: id_utilizador
      }
    });
    
    if (denunciaExistente) {
      console.log(`[DENUNCIA] Utilizador ${id_utilizador} já denunciou o comentário ${idComentario}`);
      return res.status(400).json({
        success: false,
        message: 'Você já denunciou este comentário anteriormente'
      });
    }
    
    // Criar registo da denúncia na base de dados
    await ChatDenuncia.create({
      id_mensagem: idComentario,
      id_denunciante: id_utilizador,
      motivo,
      descricao: descricao || null,
      data_denuncia: new Date(),
      resolvida: false
    });
    
    // Marcar comentário como tendo sido denunciado
    await comentario.update({ foi_denunciada: true });
    
    console.log(`[DENUNCIA] Denúncia criada com sucesso para comentário ${idComentario}`);
    
    res.json({
      success: true,
      message: 'Comentário denunciado com sucesso. Obrigado pela sua contribuição.'
    });
    
  } catch (error) {
    console.error('[DENUNCIA] Erro ao denunciar comentário:', error);
    console.error('[DENUNCIA] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao denunciar comentário',
      error: error.message
    });
  }
};

module.exports = {
  avaliarComentario,
  denunciarComentario
};