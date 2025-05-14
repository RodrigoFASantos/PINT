const { Topico_Area, Categoria, ChatMensagem, User, Area } = require('../../database/associations');
const { sendTopicRequestEmail } = require('../../utils/Email_Criar_Topico');
const uploadUtils = require('../../middleware/upload');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Controller para obter todos os tópicos de categoria
const getAllTopicosCategoria = async (req, res) => {
  try {
    // Simplificamos a consulta para evitar problemas com a tabela de comentários
    const topicos = await Topico_Area.findAll({
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: topicos.length,
      data: topicos
    });
  } catch (error) {
    console.error('Erro ao procurar tópicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar tópicos',
      error: error.message
    });
  }
};

// Controller para obter todos os tópicos (geral)
const getAllTopicos = async (req, res) => {
  try {
    console.log('A iniciar busca de tópicos com includes completos...');
    
    // Abordagem mais robusta com includes e tratamento de erros
    const topicos = await Topico_Area.findAll({
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ['id_categoria', 'nome'],
          required: false
        },
        {
          model: Area,
          as: "area",
          attributes: ['id_area', 'nome'],
          required: false
        },
        {
          model: User,
          as: "criador",
          attributes: ['id_utilizador', 'nome', 'email'],
          required: false
        }
      ],
      order: [['data_criacao', 'DESC']]
    });
    
    console.log(`Encontrados ${topicos.length} tópicos com informações completas.`);
    
    // Converter para formato JSON plano com tratamento de valores nulos
    const topicosMapeados = topicos.map(topico => {
      const t = topico.get({ plain: true });
      
      // Adicionar campo id para compatibilidade com frontend
      t.id = t.id_topico;
      
      // Garantir que propriedades estejam sempre presentes
      if (!t.categoria) t.categoria = { nome: 'Não disponível' };
      if (!t.area) t.area = { nome: 'Não disponível' };
      if (!t.criador) t.criador = { nome: 'Utilizador desconhecido' };
      
      return t;
    });
    
    return res.status(200).json(topicosMapeados);
  } catch (error) {
    console.error('Erro ao listar tópicos:', error);
    console.error('Stack de erro completo:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar tópicos',
      error: error.message
    });
  }
};

// Controller para obter um tópico específico por ID
const getTopicoById = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await Topico_Area.findOne({
      where: { id_topico: id },
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id_categoria', 'nome']
        },
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
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
    console.error('Erro ao procurar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar tópico',
      error: error.message
    });
  }
};

// Controller para obter tópicos por categoria
const getTopicosByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;

    console.log(`Procurando tópicos para categoria ID: ${id_categoria}`);

    // Primeiro, verificamos se a categoria existe
    const categoriaExiste = await Categoria.findByPk(id_categoria);
    if (!categoriaExiste) {
      console.log(`Categoria ID ${id_categoria} não encontrada`);
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Simplificando a consulta
    const topicos = await Topico_Area.findAll({
      where: { id_categoria },
      include: [
        {
          model: User,
          as: 'criador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'DESC']]
    });

    console.log(`Encontrados ${topicos.length} tópicos para a categoria ID ${id_categoria}`);

    res.status(200).json({
      success: true,
      count: topicos.length,
      data: topicos
    });
  } catch (error) {
    console.error(`Erro ao procurar tópicos para categoria ${req.params.id_categoria}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar tópicos por categoria',
      error: error.message
    });
  }
};

// Controller para criar um novo tópico
const createTopico = async (req, res) => {
  try {
    console.log('=== DADOS DA REQUISIÇÃO PARA CRIAR TÓPICO ===');
    console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.id_utilizador || req.user.id);
    console.log('================================');

    const userId = req.user.id_utilizador || req.user.id;
    const { id_categoria, id_area, titulo, descricao } = req.body;

    console.log(`Valores extraídos: id_categoria=${id_categoria}, id_area=${id_area}, titulo="${titulo}", desc="${descricao?.substring(0, 20)}..."`);

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

    console.log(`A criar tópico "${titulo}" na categoria ${id_categoria}${id_area ? ', área ' + id_area : ''} pelo utilizador ${userId}`);

    // Criar o tópico incluindo id_area
    const novoTopico = await Topico_Area.create({
      id_categoria: id_categoria,
      id_area: id_area || null,
      criado_por: userId,
      titulo: titulo,
      descricao: descricao || '',
      data_criacao: new Date()
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

// Solicitar a criação de um novo tópico (para formandos)
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

    // Dados do solicitante (utilizador atual)
    const solicitanteNome = req.user.nome || req.user.name || 'Utilizador';
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

// Atualizar um tópico existente
const updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tópico existe
    const topico = await Topico_Area.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o utilizador é o criador do tópico ou tem cargo 1 ou 2 (admin/gestor)
    if (topico.criado_por !== id_utilizador && req.user.id_cargo !== 1 && req.user.id_cargo !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para atualizar este tópico'
      });
    }

    // Atualizar o tópico
    await topico.update({
      titulo: titulo || topico.titulo,
      descricao: descricao || topico.descricao
    });

    // Notificar os utilizadores conectados via Socket.IO
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

// Remover um tópico
const deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tópico existe
    const topico = await Topico_Area.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o utilizador é o criador do tópico ou tem cargo 1 ou 2 (admin/gestor)
    if (topico.criado_por !== id_utilizador && req.user.id_cargo !== 1 && req.user.id_cargo !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para eliminar este tópico'
      });
    }

    // Verificar se o modelo ChatMensagem está disponível
    if (typeof ChatMensagem === 'undefined') {
      console.error('Modelo ChatMensagem não está definido');
      // Continuar mesmo sem poder eliminar comentários
    } else {
      try {
        // Procurar todos os comentários do tópico para remover anexos
        const comentarios = await ChatMensagem.findAll({
          where: { id_topico: id }
        });

        // Remover anexos dos comentários, se houver
        if (comentarios && comentarios.length > 0) {
          for (const comentario of comentarios) {
            if (comentario.anexo_url) {
              try {
                const filePath = path.join(
                  uploadUtils.BASE_UPLOAD_DIR || process.env.CAMINHO_PASTA_UPLOADS || 'uploads',
                  comentario.anexo_url.replace(/^\/?(uploads|backend\/uploads)\//, '')
                );

                if (fs.existsSync(filePath)) {
                  try {
                    fs.unlinkSync(filePath);
                    console.log(`Ficheiro anexo removido: ${filePath}`);
                  } catch (err) {
                    console.error(`Erro ao remover anexo: ${err.message}`);
                  }
                }
              } catch (error) {
                console.error('Erro ao processar anexo:', error);
                // Continuar mesmo com erro no processamento de anexos
              }
            }
          }
        }

        // Eliminar todos os comentários relacionados ao tópico
        await ChatMensagem.destroy({
          where: { id_topico: id }
        });
      } catch (error) {
        console.error('Erro ao eliminar comentários do tópico:', error);
        // Continuar mesmo com erro na eliminação de comentários
      }
    }

    // Eliminar o tópico
    await topico.destroy();

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.emit('topicoExcluido', {
        id_topico: id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tópico eliminado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar tópico',
      error: error.message
    });
  }
};

// Controller para obter todos os comentários de um tópico
const getComentariosByTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verificar se o tópico existe
    const topicoExiste = await Topico_Area.findByPk(id);
    if (!topicoExiste) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Listar explicitamente apenas as colunas que sabemos que existem no banco de dados
    // Remover 'denuncias' e 'motivo_denuncia' da seleção
    const { count, rows: comentarios } = await ChatMensagem.findAndCountAll({
      where: { id_topico: id },
      attributes: [
        'id', 
        'id_topico', 
        'id_utilizador', 
        'texto', 
        'anexo_url', 
        'anexo_nome', 
        'tipo_anexo', 
        'data_criacao', 
        'likes', 
        'dislikes', 
        'foi_denunciada', 
        'oculta'
      ],
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: [['data_criacao', 'ASC']], // Ordem cronológica (mais antigos primeiro)
      limit,
      offset
    });

    // Adicionar virtuais 'id_comentario' e mapear outras propriedades
    const comentariosProcessados = comentarios.map(comentario => {
      const c = comentario.toJSON();
      
      // Adicionar id_comentario como virtual para compatibilidade com frontend
      if (!c.id_comentario) {
        c.id_comentario = c.id;
      }
      
      // Adicionar denuncias como 0 para compatibilidade temporária
      c.denuncias = 0;
      
      return c;
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: comentariosProcessados
    });
  } catch (error) {
    console.error('Erro ao procurar comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao procurar comentários',
      error: error.message
    });
  }
};

// Controller para criar um novo comentário em um tópico
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
      dislikes: 0,
      foi_denunciada: false,
      oculta: false
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
      where: { id: novoComentario.id },
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
    
    // Adicionar campo 'denuncias' com valor 0 para compatibilidade
    resposta.denuncias = 0;

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

// Controller para avaliar um comentário (gostar/não gostar)
const avaliarComentario = async (req, res) => {
  try {
    const { id_topico, id_comentario } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tipo é válido
    if (tipo !== 'like' && tipo !== 'dislike') {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    // Verificar se o comentário existe
    const comentario = await ChatMensagem.findOne({
      where: {
        id_comentario,
        id_topico
      }
    });

    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar se o utilizador já avaliou este comentário
    // Nota: Aqui precisarias de uma tabela de relação para armazenar quem avaliou o quê
    // Por simplicidade, vamos apenas incrementar o contador

    if (tipo === 'like') {
      await comentario.update({
        likes: comentario.likes + 1
      });
    } else {
      await comentario.update({
        dislikes: comentario.dislikes + 1
      });
    }

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id_topico}`).emit('comentarioAvaliado', {
        id_comentario,
        likes: comentario.likes,
        dislikes: comentario.dislikes
      });
    }

    res.status(200).json({
      success: true,
      message: `Comentário ${tipo === 'like' ? 'gostado' : 'não gostado'} com sucesso`,
      data: {
        likes: comentario.likes,
        dislikes: comentario.dislikes
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

// Controller para denunciar um comentário
const denunciarComentario = async (req, res) => {
  try {
    const { id_topico, id_comentario } = req.params;
    const { motivo } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o comentário existe
    const comentario = await ChatMensagem.findOne({
      where: {
        id_comentario,
        id_topico
      }
    });

    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Incrementar contador de denúncias
    await comentario.update({
      denuncias: comentario.denuncias + 1
    });

    // Notificar administradores via Socket.IO (canal privado de admins)
    if (req.io) {
      req.io.to('admin_channel').emit('comentarioDenunciado', {
        id_comentario,
        id_topico,
        denuncias: comentario.denuncias,
        motivo
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comentário denunciado com sucesso',
      data: {
        denuncias: comentario.denuncias
      }
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
  getAllTopicosCategoria,
  getAllTopicos,
  getTopicoById,
  getTopicosByCategoria,
  createTopico,
  solicitarTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario,
  denunciarComentario
};