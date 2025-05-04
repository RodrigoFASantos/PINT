const { Topico_Categoria, Categoria } = require('../../database/associations');
const { sendTopicRequestEmail } = require('../../utils/Email_Criar_Topico');

const createTopico = async (req, res) => {
  try {
    const userId = req.user.id_utilizador || req.user.id;
    const { id_categoria, titulo, descricao } = req.body;

    // Validação básica dos dados de entrada
    if (!id_categoria || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Categoria e título do tópico são obrigatórios',
      });
    }

    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
    }

    console.log(`Criando tópico "${titulo}" na categoria ${id_categoria} pelo utilizador ${userId}`);

    // CORREÇÃO: Usar criado_por em vez de id_utilizador
    const novoTopico = await Topico_Categoria.create({
      id_categoria: id_categoria,
      criado_por: userId,           
      titulo: titulo,
      descricao: descricao || '',
      data_criacao: new Date()
      // Remover comentarios: 0, se esse campo não existir no modelo
    });

    // Retornar o tópico criado
    return res.status(201).json({
      success: true,
      message: 'Tópico criado com sucesso',
      data: novoTopico,
    });
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar tópico',
      error: error.message,
    });
  }
};
  
  // Controlador para solicitar a criação de um novo tópico (para usuários não admin/gestor)
  const solicitarTopico = async (req, res) => {
    try {
      const userId = req.user.id_utilizador || req.user.id;
      const { id_categoria, titulo, descricao } = req.body;
  
      if (!id_categoria || !titulo) {
        return res.status(400).json({
          success: false,
          message: 'Categoria e título do tópico são obrigatórios',
        });
      }
  
      // Verificar se a categoria existe para obter o nome
      const categoria = await Categoria.findByPk(id_categoria);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada',
        });
      }
  
      // Dados do solicitante (usuário atual)
      const solicitanteNome = req.user.nome || req.user.name || 'Usuário';
      const solicitanteEmail = req.user.email;
  
      console.log(`Solicitação de novo tópico "${titulo}" na categoria ${id_categoria} por utilizador ${userId}`);
  
      // Enviar email de solicitação ao administrador
      await sendTopicRequestEmail(categoria.nome, titulo, descricao, { nome: solicitanteNome, email: solicitanteEmail });
  
      // Responder sucesso da solicitação (email enviado)
      return res.status(200).json({
        success: true,
        message: 'Solicitação de criação de tópico enviada com sucesso. Aguarde aprovação do administrador.',
      });
    } catch (error) {
      console.error('Erro ao solicitar criação de tópico:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao solicitar criação de tópico',
        error: error.message,
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



// Exportar todas as funções no final do ficheiro
module.exports = {
    createTopico,
    solicitarTopico,
    updateTopico,
    deleteTopico
  };