const { 
  ForumTemaDenuncia, 
  ForumComentarioDenuncia, 
  ChatDenuncia, 
  User, 
  ForumTema, 
  ForumComentario, 
  ChatMensagem,
  Topico_Area,
  Categoria
} = require('../../database/associations');

// Obter todas as denúncias de temas do fórum
const getForumTemaDenuncias = async (req, res) => {
  try {
    console.log('Buscando denúncias de temas do fórum');

    const denuncias = await ForumTemaDenuncia.findAll({
      include: [
        {
          model: User,
          as: 'denunciante',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        },
        {
          model: ForumTema,
          as: 'tema',
          include: [
            {
              model: User,
              as: 'utilizador',
              attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
            },
            {
              model: Topico_Area,
              as: 'topico',
              attributes: ['id_topico', 'titulo'],
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['id_categoria', 'nome']
                }
              ]
            }
          ]
        }
      ],
      order: [['data_denuncia', 'DESC']]
    });

    console.log(`Encontradas ${denuncias.length} denúncias de temas`);

    res.status(200).json({
      success: true,
      data: denuncias
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias de temas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar denúncias de temas',
      error: error.message
    });
  }
};

// Obter todas as denúncias de comentários do fórum// Dentro da função getForumComentarioDenuncias
const getForumComentarioDenuncias = async (req, res) => {
  try {
    console.log('Buscando denúncias de comentários do fórum');

    // Tornar a consulta mais robusta com required: false em todos os includes
    const denuncias = await ForumComentarioDenuncia.findAll({
      include: [
        {
          model: User,
          as: 'denunciante',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil'],
          required: false
        },
        {
          model: ForumComentario,
          as: 'comentario',
          required: false,
          include: [
            {
              model: User,
              as: 'utilizador',
              attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil'],
              required: false
            },
            {
              model: ForumTema,
              as: 'tema',
              required: false,
              include: [
                {
                  model: Topico_Area,
                  as: 'topico',
                  attributes: ['id_topico', 'titulo'],
                  required: false,
                  include: [
                    {
                      model: Categoria,
                      as: 'categoria',
                      attributes: ['id_categoria', 'nome'],
                      required: false
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [['data_denuncia', 'DESC']]
    });

    // Garantir que dados nulos sejam tratados corretamente
    const denunciasSanitizadas = denuncias.map(denuncia => {
      const denunciaJSON = denuncia.toJSON();
      
      // Garantir que não há acesso a propriedades de objetos nulos
      if (!denunciaJSON.comentario) {
        denunciaJSON.comentario = { texto: 'Comentário excluído ou indisponível' };
      }
      
      if (denunciaJSON.comentario && !denunciaJSON.comentario.tema) {
        denunciaJSON.comentario.tema = { titulo: 'Tema indisponível' };
      }
      
      return denunciaJSON;
    });

    console.log(`Encontradas ${denuncias.length} denúncias de comentários`);

    res.status(200).json({
      success: true,
      data: denunciasSanitizadas
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias de comentários:', error);
    console.error('Stack trace:', error.stack); // Adicionar stack trace para debug
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar denúncias de comentários',
      error: error.message
    });
  }
};


// Obter todas as denúncias de mensagens de chat
const getChatDenuncias = async (req, res) => {
  try {
    console.log('Buscando denúncias de mensagens de chat');

    const denuncias = await ChatDenuncia.findAll({
      include: [
        {
          model: User,
          as: 'denunciante',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil'],
          required: false
        },
        {
          model: ChatMensagem,
          as: 'mensagem',
          required: false,
          include: [
            {
              model: User,
              as: 'utilizador',
              attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil'],
              required: false
            },
            {
              model: Topico_Area,
              as: 'topico',
              attributes: ['id_topico', 'titulo'],
              required: false,
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['id_categoria', 'nome'],
                  required: false
                }
              ]
            }
          ]
        }
      ],
      order: [['data_denuncia', 'DESC']]
    });

    // Sanitizar dados
    const denunciasSanitizadas = denuncias.map(denuncia => {
      const denunciaJSON = denuncia.toJSON();
      
      if (!denunciaJSON.mensagem) {
        denunciaJSON.mensagem = { texto: 'Mensagem excluída ou indisponível' };
      }
      
      if (denunciaJSON.mensagem && !denunciaJSON.mensagem.topico) {
        denunciaJSON.mensagem.topico = { titulo: 'Tópico indisponível' };
      }
      
      return denunciaJSON;
    });

    console.log(`Encontradas ${denuncias.length} denúncias de mensagens de chat`);

    res.status(200).json({
      success: true,
      data: denunciasSanitizadas
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias de mensagens de chat:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar denúncias de mensagens de chat',
      error: error.message
    });
  }
};

// Resolver denúncia de tema
const resolverForumTemaDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao_tomada } = req.body;
    
    console.log(`Resolvendo denúncia de tema ID: ${id}`);
    
    if (!acao_tomada) {
      return res.status(400).json({
        success: false,
        message: 'A ação tomada é obrigatória'
      });
    }
    
    const denuncia = await ForumTemaDenuncia.findByPk(id);
    
    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denúncia não encontrada'
      });
    }
    
    await denuncia.update({
      resolvida: true,
      acao_tomada
    });
    
    console.log(`Denúncia de tema ID: ${id} resolvida com sucesso`);
    
    res.status(200).json({
      success: true,
      message: 'Denúncia resolvida com sucesso',
      data: denuncia
    });
  } catch (error) {
    console.error('Erro ao resolver denúncia de tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver denúncia de tema',
      error: error.message
    });
  }
};

// Resolver denúncia de comentário
const resolverForumComentarioDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao_tomada } = req.body;
    
    console.log(`Resolvendo denúncia de comentário ID: ${id}`);
    
    if (!acao_tomada) {
      return res.status(400).json({
        success: false,
        message: 'A ação tomada é obrigatória'
      });
    }
    
    const denuncia = await ForumComentarioDenuncia.findByPk(id);
    
    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denúncia não encontrada'
      });
    }
    
    await denuncia.update({
      resolvida: true,
      acao_tomada
    });
    
    console.log(`Denúncia de comentário ID: ${id} resolvida com sucesso`);
    
    res.status(200).json({
      success: true,
      message: 'Denúncia resolvida com sucesso',
      data: denuncia
    });
  } catch (error) {
    console.error('Erro ao resolver denúncia de comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver denúncia de comentário',
      error: error.message
    });
  }
};

// Resolver denúncia de mensagem de chat
const resolverChatDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao_tomada } = req.body;
    
    console.log(`Resolvendo denúncia de mensagem de chat ID: ${id}`);
    
    if (!acao_tomada) {
      return res.status(400).json({
        success: false,
        message: 'A ação tomada é obrigatória'
      });
    }
    
    const denuncia = await ChatDenuncia.findByPk(id);
    
    if (!denuncia) {
      return res.status(404).json({
        success: false,
        message: 'Denúncia não encontrada'
      });
    }
    
    await denuncia.update({
      resolvida: true,
      acao_tomada
    });
    
    console.log(`Denúncia de mensagem de chat ID: ${id} resolvida com sucesso`);
    
    res.status(200).json({
      success: true,
      message: 'Denúncia resolvida com sucesso',
      data: denuncia
    });
  } catch (error) {
    console.error('Erro ao resolver denúncia de mensagem de chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver denúncia de mensagem de chat',
      error: error.message
    });
  }
};

// Ocultar tema
const ocultarForumTema = async (req, res) => {
  try {
    const { id } = req.body;
    
    console.log(`Ocultando tema ID: ${id}`);
    
    const tema = await ForumTema.findByPk(id);
    
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }
    
    await tema.update({ oculto: true });
    
    console.log(`Tema ID: ${id} ocultado com sucesso`);
    
    // Atualizar todas as denúncias relacionadas a este tema
    await ForumTemaDenuncia.update(
      { 
        resolvida: true, 
        acao_tomada: 'Conteúdo ocultado pelo administrador' 
      },
      { 
        where: { 
          id_tema: id,
          resolvida: false 
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Tema ocultado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao ocultar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao ocultar tema',
      error: error.message
    });
  }
};

// Ocultar comentário
const ocultarForumComentario = async (req, res) => {
  try {
    const { id } = req.body;
    
    console.log(`Ocultando comentário ID: ${id}`);
    
    const comentario = await ForumComentario.findByPk(id);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }
    
    await comentario.update({ oculto: true });
    
    console.log(`Comentário ID: ${id} ocultado com sucesso`);
    
    // Atualizar todas as denúncias relacionadas a este comentário
    await ForumComentarioDenuncia.update(
      { 
        resolvida: true, 
        acao_tomada: 'Conteúdo ocultado pelo administrador' 
      },
      { 
        where: { 
          id_comentario: id,
          resolvida: false 
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Comentário ocultado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao ocultar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao ocultar comentário',
      error: error.message
    });
  }
};

// Ocultar mensagem de chat
const ocultarChatMensagem = async (req, res) => {
  try {
    const { id } = req.body;
    
    console.log(`Ocultando mensagem de chat ID: ${id}`);
    
    const mensagem = await ChatMensagem.findByPk(id);
    
    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }
    
    await mensagem.update({ 
      texto: '[Mensagem removida pelo administrador]',
      anexo_url: null,
      anexo_nome: null,
      tipo_anexo: null
    });
    
    console.log(`Mensagem de chat ID: ${id} ocultada com sucesso`);
    
    // Atualizar todas as denúncias relacionadas a esta mensagem
    await ChatDenuncia.update(
      { 
        resolvida: true, 
        acao_tomada: 'Conteúdo ocultado pelo administrador' 
      },
      { 
        where: { 
          id_mensagem: id,
          resolvida: false 
        } 
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Mensagem ocultada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao ocultar mensagem de chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao ocultar mensagem de chat',
      error: error.message
    });
  }
};

module.exports = {
  getForumTemaDenuncias,
  getForumComentarioDenuncias,
  getChatDenuncias,
  resolverForumTemaDenuncia,
  resolverForumComentarioDenuncia,
  resolverChatDenuncia,
  ocultarForumTema,
  ocultarForumComentario,
  ocultarChatMensagem
};