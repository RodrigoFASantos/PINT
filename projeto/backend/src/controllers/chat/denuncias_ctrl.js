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

// ========================================
// FUNÇÃO AUXILIAR PARA TRATAR ERROS DE FORMA CONSISTENTE
// ========================================
const handleError = (res, error, message, statusCode = 500) => {
  console.error(`❌ [DENUNCIAS] ${message}:`, error);
  console.error(`❌ [DENUNCIAS] Stack trace:`, error.stack);
  
  return res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// ========================================
// OBTER DENÚNCIAS DE TEMAS DO FÓRUM
// ========================================
const getForumTemaDenuncias = async (req, res) => {
  try {
    console.log('📋 [DENUNCIAS] Buscando denúncias de temas do fórum...');

    const denuncias = await ForumTemaDenuncia.findAll({
      include: [
        {
          model: User,
          as: 'denunciante',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil'],
          required: false // LEFT JOIN para evitar falhas se utilizador foi deletado
        },
        {
          model: ForumTema,
          as: 'tema',
          required: false, // LEFT JOIN para evitar falhas se tema foi deletado
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

    // Sanitizar dados para evitar erros com valores null/undefined
    const denunciasSanitizadas = denuncias.map(denuncia => {
      const denunciaJSON = denuncia.toJSON();
      
      // Garantir que denunciante existe
      if (!denunciaJSON.denunciante) {
        denunciaJSON.denunciante = {
          id_utilizador: null,
          nome: 'Utilizador removido',
          email: 'N/A',
          foto_perfil: null
        };
      }
      
      // Garantir que tema existe
      if (!denunciaJSON.tema) {
        denunciaJSON.tema = {
          titulo: 'Tema removido ou indisponível',
          texto: 'Conteúdo não disponível',
          data_criacao: denunciaJSON.data_denuncia,
          utilizador: {
            nome: 'Utilizador desconhecido'
          },
          topico: {
            titulo: 'Tópico desconhecido',
            categoria: {
              nome: 'Categoria desconhecida'
            }
          }
        };
      } else {
        // Garantir subcampos do tema
        if (!denunciaJSON.tema.utilizador) {
          denunciaJSON.tema.utilizador = { nome: 'Utilizador desconhecido' };
        }
        if (!denunciaJSON.tema.topico) {
          denunciaJSON.tema.topico = { 
            titulo: 'Tópico desconhecido',
            categoria: { nome: 'Categoria desconhecida' }
          };
        } else if (!denunciaJSON.tema.topico.categoria) {
          denunciaJSON.tema.topico.categoria = { nome: 'Categoria desconhecida' };
        }
      }
      
      return denunciaJSON;
    });

    console.log(`✅ [DENUNCIAS] Encontradas ${denuncias.length} denúncias de temas`);

    res.status(200).json({
      success: true,
      data: denunciasSanitizadas,
      total: denuncias.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao buscar denúncias de temas');
  }
};

// ========================================
// OBTER DENÚNCIAS DE COMENTÁRIOS DO FÓRUM  
// ========================================
const getForumComentarioDenuncias = async (req, res) => {
  try {
    console.log('📋 [DENUNCIAS] Buscando denúncias de comentários do fórum...');

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
              attributes: ['id_tema', 'titulo'],
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

    // Sanitizar dados
    const denunciasSanitizadas = denuncias.map(denuncia => {
      const denunciaJSON = denuncia.toJSON();
      
      // Garantir que denunciante existe
      if (!denunciaJSON.denunciante) {
        denunciaJSON.denunciante = {
          id_utilizador: null,
          nome: 'Utilizador removido',
          email: 'N/A',
          foto_perfil: null
        };
      }
      
      // Garantir que comentário existe
      if (!denunciaJSON.comentario) {
        denunciaJSON.comentario = {
          texto: 'Comentário removido ou indisponível',
          data_criacao: denunciaJSON.data_denuncia,
          utilizador: { nome: 'Utilizador desconhecido' },
          tema: {
            titulo: 'Tema desconhecido',
            topico: {
              titulo: 'Tópico desconhecido',
              categoria: { nome: 'Categoria desconhecida' }
            }
          }
        };
      } else {
        // Garantir subcampos do comentário
        if (!denunciaJSON.comentario.utilizador) {
          denunciaJSON.comentario.utilizador = { nome: 'Utilizador desconhecido' };
        }
        if (!denunciaJSON.comentario.tema) {
          denunciaJSON.comentario.tema = {
            titulo: 'Tema desconhecido',
            topico: {
              titulo: 'Tópico desconhecido',
              categoria: { nome: 'Categoria desconhecida' }
            }
          };
        } else {
          if (!denunciaJSON.comentario.tema.topico) {
            denunciaJSON.comentario.tema.topico = {
              titulo: 'Tópico desconhecido',
              categoria: { nome: 'Categoria desconhecida' }
            };
          } else if (!denunciaJSON.comentario.tema.topico.categoria) {
            denunciaJSON.comentario.tema.topico.categoria = { nome: 'Categoria desconhecida' };
          }
        }
      }
      
      return denunciaJSON;
    });

    console.log(`✅ [DENUNCIAS] Encontradas ${denuncias.length} denúncias de comentários`);

    res.status(200).json({
      success: true,
      data: denunciasSanitizadas,
      total: denuncias.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao buscar denúncias de comentários');
  }
};

// ========================================
// OBTER DENÚNCIAS DE MENSAGENS DE CHAT
// ========================================
const getChatDenuncias = async (req, res) => {
  try {
    console.log('📋 [DENUNCIAS] Buscando denúncias de mensagens de chat...');

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
      
      // Garantir que denunciante existe
      if (!denunciaJSON.denunciante) {
        denunciaJSON.denunciante = {
          id_utilizador: null,
          nome: 'Utilizador removido',
          email: 'N/A',
          foto_perfil: null
        };
      }
      
      // Garantir que mensagem existe
      if (!denunciaJSON.mensagem) {
        denunciaJSON.mensagem = {
          texto: 'Mensagem removida ou indisponível',
          data_criacao: denunciaJSON.data_denuncia,
          utilizador: { nome: 'Utilizador desconhecido' },
          topico: {
            titulo: 'Tópico desconhecido',
            categoria: { nome: 'Categoria desconhecida' }
          }
        };
      } else {
        // Garantir subcampos da mensagem
        if (!denunciaJSON.mensagem.utilizador) {
          denunciaJSON.mensagem.utilizador = { nome: 'Utilizador desconhecido' };
        }
        if (!denunciaJSON.mensagem.topico) {
          denunciaJSON.mensagem.topico = {
            titulo: 'Tópico desconhecido',
            categoria: { nome: 'Categoria desconhecida' }
          };
        } else if (!denunciaJSON.mensagem.topico.categoria) {
          denunciaJSON.mensagem.topico.categoria = { nome: 'Categoria desconhecida' };
        }
      }
      
      return denunciaJSON;
    });

    console.log(`✅ [DENUNCIAS] Encontradas ${denuncias.length} denúncias de chat`);

    res.status(200).json({
      success: true,
      data: denunciasSanitizadas,
      total: denuncias.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao buscar denúncias de mensagens de chat');
  }
};

// ========================================
// CRIAR DENÚNCIA DE TEMA
// ========================================
const criarForumTemaDenuncia = async (req, res) => {
  try {
    const { id_tema, motivo, descricao } = req.body;
    const id_denunciante = req.utilizador.id_utilizador;
    
    console.log(`📝 [DENUNCIAS] Criando denúncia para tema ID: ${id_tema}`);
    
    // Validar dados de entrada
    if (!id_tema || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'ID do tema e motivo são obrigatórios'
      });
    }
    
    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(id_tema);
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }
    
    // Verificar se o utilizador já denunciou este tema
    const denunciaExistente = await ForumTemaDenuncia.findOne({
      where: { 
        id_tema: id_tema, 
        id_denunciante: id_denunciante 
      }
    });
    
    if (denunciaExistente) {
      return res.status(409).json({
        success: false,
        message: 'Já denunciou este tema anteriormente'
      });
    }
    
    const denuncia = await ForumTemaDenuncia.create({
      id_tema,
      id_denunciante,
      motivo,
      descricao: descricao || null,
      data_denuncia: new Date(),
      resolvida: false
    });
    
    console.log(`✅ [DENUNCIAS] Denúncia de tema criada com sucesso, ID: ${denuncia.id_denuncia}`);
    
    res.status(201).json({
      success: true,
      message: 'Denúncia criada com sucesso',
      data: denuncia
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao criar denúncia de tema', 500);
  }
};

// ========================================
// OBTER TEMAS JÁ DENUNCIADOS PELO UTILIZADOR
// ========================================
const getUsuarioDenunciasTemas = async (req, res) => {
  try {
    const id_denunciante = req.utilizador.id_utilizador;
    
    console.log(`📋 [DENUNCIAS] Buscando temas denunciados pelo utilizador ID: ${id_denunciante}`);
    
    const denuncias = await ForumTemaDenuncia.findAll({
      where: { id_denunciante },
      attributes: ['id_tema', 'data_denuncia', 'resolvida'],
      order: [['data_denuncia', 'DESC']]
    });
    
    // Extrair apenas os IDs dos temas
    const temasDenunciados = denuncias.map(d => d.id_tema);
    
    console.log(`✅ [DENUNCIAS] Encontrados ${temasDenunciados.length} temas denunciados pelo utilizador`);
    
    res.status(200).json({
      success: true,
      data: temasDenunciados,
      total: temasDenunciados.length,
      detalhes: denuncias
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao buscar temas denunciados pelo utilizador');
  }
};

// ========================================
// RESOLVER DENÚNCIA DE TEMA
// ========================================
const resolverForumTemaDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao_tomada } = req.body;
    
    console.log(`🔧 [DENUNCIAS] Resolvendo denúncia de tema ID: ${id}`);
    
    if (!acao_tomada || acao_tomada.trim() === '') {
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
    
    if (denuncia.resolvida) {
      return res.status(400).json({
        success: false,
        message: 'Esta denúncia já foi resolvida'
      });
    }
    
    await denuncia.update({
      resolvida: true,
      acao_tomada: acao_tomada.trim(),
      data_resolucao: new Date(),
      resolvida_por: req.utilizador.id_utilizador
    });
    
    console.log(`✅ [DENUNCIAS] Denúncia de tema ID: ${id} resolvida com sucesso`);
    
    res.status(200).json({
      success: true,
      message: 'Denúncia resolvida com sucesso',
      data: denuncia
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao resolver denúncia de tema');
  }
};

// ========================================
// RESOLVER DENÚNCIA DE COMENTÁRIO
// ========================================
const resolverForumComentarioDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao_tomada } = req.body;
    
    console.log(`🔧 [DENUNCIAS] Resolvendo denúncia de comentário ID: ${id}`);
    
    if (!acao_tomada || acao_tomada.trim() === '') {
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
    
    if (denuncia.resolvida) {
      return res.status(400).json({
        success: false,
        message: 'Esta denúncia já foi resolvida'
      });
    }
    
    await denuncia.update({
      resolvida: true,
      acao_tomada: acao_tomada.trim(),
      data_resolucao: new Date(),
      resolvida_por: req.utilizador.id_utilizador
    });
    
    console.log(`✅ [DENUNCIAS] Denúncia de comentário ID: ${id} resolvida com sucesso`);
    
    res.status(200).json({
      success: true,
      message: 'Denúncia resolvida com sucesso',
      data: denuncia
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao resolver denúncia de comentário');
  }
};

// ========================================
// RESOLVER DENÚNCIA DE CHAT
// ========================================
const resolverChatDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao_tomada } = req.body;
    
    console.log(`🔧 [DENUNCIAS] Resolvendo denúncia de chat ID: ${id}`);
    
    if (!acao_tomada || acao_tomada.trim() === '') {
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
    
    if (denuncia.resolvida) {
      return res.status(400).json({
        success: false,
        message: 'Esta denúncia já foi resolvida'
      });
    }
    
    await denuncia.update({
      resolvida: true,
      acao_tomada: acao_tomada.trim(),
      data_resolucao: new Date(),
      resolvida_por: req.utilizador.id_utilizador
    });
    
    console.log(`✅ [DENUNCIAS] Denúncia de chat ID: ${id} resolvida com sucesso`);
    
    res.status(200).json({
      success: true,
      message: 'Denúncia resolvida com sucesso',
      data: denuncia
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao resolver denúncia de chat');
  }
};

// ========================================
// OCULTAR TEMA
// ========================================
const ocultarForumTema = async (req, res) => {
  try {
    const { id } = req.body;
    
    console.log(`🙈 [DENUNCIAS] Ocultando tema ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do tema é obrigatório'
      });
    }
    
    const tema = await ForumTema.findByPk(id);
    
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }
    
    await tema.update({ oculto: true });
    
    console.log(`✅ [DENUNCIAS] Tema ID: ${id} ocultado com sucesso`);
    
    // Resolver todas as denúncias relacionadas a este tema
    const denunciasAtualizadas = await ForumTemaDenuncia.update(
      { 
        resolvida: true, 
        acao_tomada: 'Conteúdo ocultado pelo administrador',
        data_resolucao: new Date(),
        resolvida_por: req.utilizador.id_utilizador
      },
      { 
        where: { 
          id_tema: id,
          resolvida: false 
        } 
      }
    );
    
    console.log(`✅ [DENUNCIAS] ${denunciasAtualizadas[0]} denúncias relacionadas foram resolvidas`);
    
    res.status(200).json({
      success: true,
      message: 'Tema ocultado com sucesso',
      denuncias_resolvidas: denunciasAtualizadas[0]
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao ocultar tema');
  }
};

// ========================================
// OCULTAR COMENTÁRIO
// ========================================
const ocultarForumComentario = async (req, res) => {
  try {
    const { id } = req.body;
    
    console.log(`🙈 [DENUNCIAS] Ocultando comentário ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do comentário é obrigatório'
      });
    }
    
    const comentario = await ForumComentario.findByPk(id);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }
    
    await comentario.update({ oculto: true });
    
    console.log(`✅ [DENUNCIAS] Comentário ID: ${id} ocultado com sucesso`);
    
    // Resolver todas as denúncias relacionadas a este comentário
    const denunciasAtualizadas = await ForumComentarioDenuncia.update(
      { 
        resolvida: true, 
        acao_tomada: 'Conteúdo ocultado pelo administrador',
        data_resolucao: new Date(),
        resolvida_por: req.utilizador.id_utilizador
      },
      { 
        where: { 
          id_comentario: id,
          resolvida: false 
        } 
      }
    );
    
    console.log(`✅ [DENUNCIAS] ${denunciasAtualizadas[0]} denúncias relacionadas foram resolvidas`);
    
    res.status(200).json({
      success: true,
      message: 'Comentário ocultado com sucesso',
      denuncias_resolvidas: denunciasAtualizadas[0]
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao ocultar comentário');
  }
};

// ========================================
// OCULTAR MENSAGEM DE CHAT
// ========================================
const ocultarChatMensagem = async (req, res) => {
  try {
    const { id } = req.body;
    
    console.log(`🙈 [DENUNCIAS] Ocultando mensagem de chat ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID da mensagem é obrigatório'
      });
    }
    
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
      tipo_anexo: null,
      editada: true,
      data_edicao: new Date()
    });
    
    console.log(`✅ [DENUNCIAS] Mensagem de chat ID: ${id} ocultada com sucesso`);
    
    // Resolver todas as denúncias relacionadas a esta mensagem
    const denunciasAtualizadas = await ChatDenuncia.update(
      { 
        resolvida: true, 
        acao_tomada: 'Conteúdo ocultado pelo administrador',
        data_resolucao: new Date(),
        resolvida_por: req.utilizador.id_utilizador
      },
      { 
        where: { 
          id_mensagem: id,
          resolvida: false 
        } 
      }
    );
    
    console.log(`✅ [DENUNCIAS] ${denunciasAtualizadas[0]} denúncias relacionadas foram resolvidas`);
    
    res.status(200).json({
      success: true,
      message: 'Mensagem ocultada com sucesso',
      denuncias_resolvidas: denunciasAtualizadas[0]
    });
    
  } catch (error) {
    handleError(res, error, 'Erro ao ocultar mensagem de chat');
  }
};

module.exports = {
  getForumTemaDenuncias,
  getForumComentarioDenuncias,
  criarForumTemaDenuncia,
  getUsuarioDenunciasTemas,
  getChatDenuncias,
  resolverForumTemaDenuncia,
  resolverForumComentarioDenuncia,
  resolverChatDenuncia,
  ocultarForumTema,
  ocultarForumComentario,
  ocultarChatMensagem
};