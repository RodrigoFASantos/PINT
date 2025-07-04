const { Topico_Area, Categoria, User, ForumTema, ForumTemaInteracao, ForumTemaDenuncia, ForumComentario, ForumComentarioInteracao, ForumComentarioDenuncia } = require('../../database/associations');

const uploadUtils = require('../../middleware/upload');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Obter todos os temas de um tópico com paginação
const getTemasByTopico = async (req, res) => {
  try {
    const { topicoId } = req.params;
    const { filtro } = req.query; // 'recentes', 'likes', 'dislikes', 'comentarios'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(`Buscando temas para o tópico ID: ${topicoId}, filtro: ${filtro || 'nenhum'}, página: ${page}, limite: ${limit}`);

    // Verificar se o tópico existe
    const topico = await Topico_Area.findByPk(topicoId);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Determinar a ordenação com base no filtro
    let order = [['data_criacao', 'DESC']]; // Padrão: mais recentes

    if (filtro === 'likes') {
      order = [['likes', 'DESC'], ['data_criacao', 'DESC']];
    } else if (filtro === 'dislikes') {
      order = [['dislikes', 'DESC'], ['data_criacao', 'DESC']];
    } else if (filtro === 'comentarios') {
      order = [['comentarios', 'DESC'], ['data_criacao', 'DESC']];
    } else if (filtro === 'antigos') {
      order = [['data_criacao', 'ASC']];
    }

    // Buscar os temas com contagem total
    const { count, rows: temas } = await ForumTema.findAndCountAll({
      where: {
        id_topico: topicoId,
        oculto: false
      },
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
      ],
      order: order,
      limit,
      offset
    });

    console.log(`Encontrados ${count} temas para o tópico ${topicoId}, exibindo ${temas.length} na página ${page}`);

    res.status(200).json({
      success: true,
      data: temas,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar temas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar temas',
      error: error.message
    });
  }
};

// Obter um tema específico por ID
const getTemaById = async (req, res) => {
  try {
    const { temaId } = req.params;

    console.log(`Buscando tema ID: ${temaId}`);

    const tema = await ForumTema.findOne({
      where: {
        id_tema: temaId,
        oculto: false
      },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        },
        {
          model: Topico_Area,
          as: 'topico',
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id_categoria', 'nome']
            }
          ]
        }
      ]
    });

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: tema
    });
  } catch (error) {
    console.error('Erro ao buscar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tema',
      error: error.message
    });
  }
};

// Criar um novo tema
const createTema = async (req, res) => {
  try {
    const { topicoId } = req.params;
    const { titulo, texto } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Criando tema no tópico ${topicoId} pelo utilizador ${id_utilizador}`);
    console.log(`Título: ${titulo || 'Sem título'}`);
    console.log(`Texto: ${texto || 'Sem texto'}`);

    // Verificar se o tópico existe
    const topico = await Topico_Area.findOne({
      where: { id_topico: topicoId },
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

    // Verificar se há texto, título ou anexo
    if (!texto && !titulo && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer texto, título ou anexo para o tema'
      });
    }

    let anexoUrl = null;
    let anexoNome = null;
    let tipoAnexo = null;

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
      const newFileName = `tema_${Date.now()}_${id_utilizador}${fileExtension}`;

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
      anexoUrl = `uploads/chat/${categoriaSlug}/${topicoSlug}/conteudos/${newFileName}`;

      // Determinar o tipo do anexo
      const mimeType = req.file.mimetype;
      tipoAnexo = uploadUtils.getFileType(mimeType);

      console.log(`Tipo de anexo determinado: ${tipoAnexo}`);
      console.log(`Caminho guardado na BD: ${anexoUrl}`);
    }

    // Criar o tema
    const novoTema = await ForumTema.create({
      id_topico: topicoId,
      id_utilizador,
      titulo: titulo || null,
      texto: texto || null,
      anexo_url: anexoUrl,
      anexo_nome: anexoNome,
      tipo_anexo: tipoAnexo,
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0,
      comentarios: 0,
      foi_denunciado: false,
      oculto: false
    });

    console.log(`Tema criado com ID: ${novoTema.id_tema}`);

    // Buscar o tema com informações do utilizador
    const temaCompleto = await ForumTema.findOne({
      where: { id_tema: novoTema.id_tema },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${topicoId}`).emit('novoTema', temaCompleto);
      console.log('Evento novoTema emitido via socket.io');
    } else {
      console.log('IO não disponível, tema não será transmitido via socket');
    }

    res.status(201).json({
      success: true,
      message: 'Tema criado com sucesso',
      data: temaCompleto
    });
  } catch (error) {
    console.error('Erro ao criar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tema',
      error: error.message
    });
  }
};

// Editar um tema existente
const updateTema = async (req, res) => {
  try {
    const { temaId } = req.params;
    const { titulo, texto } = req.body;
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Editando tema ${temaId} pelo utilizador ${id_utilizador}`);

    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(temaId);
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Verificar permissão (apenas o autor ou administrador pode editar)
    if (tema.id_utilizador !== id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para editar este tema'
      });
    }

    // Atualizar campos do tema
    await tema.update({
      titulo: titulo !== undefined ? titulo : tema.titulo,
      texto: texto !== undefined ? texto : tema.texto
    });

    // Buscar tema atualizado com dados do utilizador
    const temaAtualizado = await ForumTema.findOne({
      where: { id_tema: temaId },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${tema.id_topico}`).emit('temaAtualizado', temaAtualizado);
    }

    res.status(200).json({
      success: true,
      message: 'Tema atualizado com sucesso',
      data: temaAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tema',
      error: error.message
    });
  }
};

// Excluir um tema
const deleteTema = async (req, res) => {
  try {
    const { temaId } = req.params;
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Excluindo tema ${temaId} pelo utilizador ${id_utilizador}`);

    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(temaId);
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Verificar permissão (apenas o autor ou administrador pode excluir)
    if (tema.id_utilizador !== id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para excluir este tema'
      });
    }

    // Excluir o tema (ou marcar como oculto para preservar dados)
    await tema.update({ oculto: true });
    // Para exclusão permanente: await tema.destroy();

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${tema.id_topico}`).emit('temaExcluido', { id_tema: temaId });
    }

    res.status(200).json({
      success: true,
      message: 'Tema excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir tema',
      error: error.message
    });
  }
};

// Avaliar um tema (like/dislike)
const avaliarTema = async (req, res) => {
  try {
    const { temaId } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Avaliando tema ${temaId} como ${tipo} pelo utilizador ${id_utilizador}`);

    // Verificar se o tipo é válido
    if (tipo !== 'like' && tipo !== 'dislike') {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(temaId);

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Verificar se o utilizador já avaliou este tema
    const interacaoExistente = await ForumTemaInteracao.findOne({
      where: {
        id_tema: temaId,
        id_utilizador
      }
    });

    if (interacaoExistente) {
      // Se o utilizador já avaliou com o mesmo tipo, remover a avaliação
      if (interacaoExistente.tipo === tipo) {
        await interacaoExistente.destroy();

        // Atualizar contadores
        if (tipo === 'like') {
          await tema.update({ likes: Math.max(0, tema.likes - 1) });
        } else {
          await tema.update({ dislikes: Math.max(0, tema.dislikes - 1) });
        }

        return res.json({
          success: true,
          message: `Avaliação "${tipo}" removida do tema`,
          data: {
            id_tema: temaId,
            likes: tipo === 'like' ? tema.likes - 1 : tema.likes,
            dislikes: tipo === 'dislike' ? tema.dislikes - 1 : tema.dislikes
          }
        });
      }

      // Se o utilizador já avaliou com tipo diferente, alterar o tipo
      else {
        await interacaoExistente.update({ tipo });

        // Atualizar contadores (incrementar o novo tipo, decrementar o antigo)
        if (tipo === 'like') {
          await tema.update({
            likes: tema.likes + 1,
            dislikes: Math.max(0, tema.dislikes - 1)
          });
        } else {
          await tema.update({
            likes: Math.max(0, tema.likes - 1),
            dislikes: tema.dislikes + 1
          });
        }
      }
    } else {
      // Se o utilizador não avaliou anteriormente, criar nova avaliação
      await ForumTemaInteracao.create({
        id_tema: temaId,
        id_utilizador,
        tipo,
        data_interacao: new Date()
      });

      // Atualizar contadores
      if (tipo === 'like') {
        await tema.update({ likes: tema.likes + 1 });
      } else {
        await tema.update({ dislikes: tema.dislikes + 1 });
      }
    }

    // Buscar tema atualizado
    const temaAtualizado = await ForumTema.findByPk(temaId);

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${tema.id_topico}`).emit('temaAvaliado', {
        id_tema: temaId,
        likes: temaAtualizado.likes,
        dislikes: temaAtualizado.dislikes
      });
    }

    res.json({
      success: true,
      message: `Tema avaliado como "${tipo}" com sucesso`,
      data: {
        id_tema: temaId,
        likes: temaAtualizado.likes,
        dislikes: temaAtualizado.dislikes
      }
    });

  } catch (error) {
    console.error('Erro ao avaliar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar tema',
      error: error.message
    });
  }
};

// Obter status de avaliação de um tema pelo utilizador atual
const getStatusAvaliacaoTema = async (req, res) => {
  try {
    const { temaId } = req.params;
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(temaId);
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Verificar se o utilizador já avaliou este tema
    const interacao = await ForumTemaInteracao.findOne({
      where: {
        id_tema: temaId,
        id_utilizador
      }
    });

    res.json({
      success: true,
      data: {
        avaliado: !!interacao,
        tipo: interacao ? interacao.tipo : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar status de avaliação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status de avaliação',
      error: error.message
    });
  }
};

// Denunciar um tema
const denunciarTema = async (req, res) => {
  try {
    const { temaId } = req.params;
    const { motivo, descricao } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Denúncia de tema ${temaId} por ${id_utilizador}: ${motivo}`);

    // Validação básica
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer um motivo para a denúncia'
      });
    }

    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(temaId);

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Verificar se o utilizador já denunciou este tema
    const denunciaExistente = await ForumTemaDenuncia.findOne({
      where: {
        id_tema: temaId,
        id_denunciante: id_utilizador
      }
    });

    if (denunciaExistente) {
      return res.status(400).json({
        success: false,
        message: ' já denunciou este tema anteriormente'
      });
    }

    // Criar a denúncia
    await ForumTemaDenuncia.create({
      id_tema: temaId,
      id_denunciante: id_utilizador,
      motivo,
      descricao: descricao || null,
      data_denuncia: new Date(),
      resolvida: false
    });

    // Marcar o tema como denunciado
    await tema.update({ foi_denunciado: true });

    // Notificar administradores via Socket.IO
    if (req.io) {
      req.io.to('admin_channel').emit('temaDenunciado', {
        id_tema: tema.id_tema,
        id_topico: tema.id_topico,
        motivo
      });
    }

    res.json({
      success: true,
      message: 'Tema denunciado com sucesso. Obrigado pela sua contribuição.'
    });

  } catch (error) {
    console.error('Erro ao denunciar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao denunciar tema',
      error: error.message
    });
  }
};

// Obter comentários de um tema com paginação e ordenação
const getComentariosByTema = async (req, res) => {
  try {
    const { temaId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const ordenacao = req.query.ordenacao || 'recentes'; // 'recentes', 'likes', 'antigos'

    console.log(`Buscando comentários para o tema ID: ${temaId}, página ${page}, ordenação: ${ordenacao}`);

    // Verificar se o tema existe
    const tema = await ForumTema.findByPk(temaId);
    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Definir ordenação
    let order;
    switch (ordenacao) {
      case 'likes':
        order = [['likes', 'DESC'], ['data_criacao', 'DESC']];
        break;
      case 'antigos':
        order = [['data_criacao', 'ASC']];
        break;
      case 'recentes':
      default:
        order = [['data_criacao', 'DESC']];
        break;
    }

    // Buscar os comentários com contagem total
    const { count, rows: comentarios } = await ForumComentario.findAndCountAll({
      where: {
        id_tema: temaId,
        oculto: false
      },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ],
      order: order,
      limit,
      offset
    });

    console.log(`Encontrados ${count} comentários para o tema ${temaId}, exibindo ${comentarios.length} na página ${page}`);

    res.status(200).json({
      success: true,
      data: comentarios,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar comentários',
      error: error.message
    });
  }
};

// Criar um novo comentário em um tema
const createComentario = async (req, res) => {
  try {
    const { temaId } = req.params;
    const { texto } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Criando comentário no tema ${temaId} pelo utilizador ${id_utilizador}`);
    console.log(`Texto: ${texto || 'Sem texto'}`);

    // Verificar se o tema existe
    const tema = await ForumTema.findOne({
      where: { id_tema: temaId },
      include: [
        {
          model: Topico_Area,
          as: 'topico',
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id_categoria', 'nome']
            }
          ]
        }
      ]
    });

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: 'Tema não encontrado'
      });
    }

    // Verificar se há texto ou anexo
    if (!texto && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer texto ou anexo para o comentário'
      });
    }

    let anexoUrl = null;
    let anexoNome = null;
    let tipoAnexo = null;

    // Processar anexo, se existir
    if (req.file) {
      console.log('Ficheiro anexo recebido:', req.file);

      // Obter nomes para categorias e tópicos
      const categoriaNome = tema.topico.categoria?.nome || 'sem_categoria';
      const topicoNome = tema.topico.titulo || 'sem_titulo';

      // Usar as funções do uploadUtils para criar diretórios
      const categoriaSlug = uploadUtils.normalizarNome(categoriaNome);
      const topicoSlug = uploadUtils.normalizarNome(topicoNome);

      // Criar estrutura de diretórios para o chat
      const { dirPath, conteudosPath } = uploadUtils.criarDiretoriosChat(categoriaSlug, topicoSlug);
      console.log(`Diretórios: dirPath=${dirPath}, conteudosPath=${conteudosPath}`);

      // Detalhes do ficheiro
      anexoNome = req.file.originalname;
      const fileExtension = path.extname(anexoNome);
      const newFileName = `comentario_${Date.now()}_${id_utilizador}${fileExtension}`;

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
      anexoUrl = `uploads/chat/${categoriaSlug}/${topicoSlug}/conteudos/${newFileName}`;

      // Determinar o tipo do anexo
      const mimeType = req.file.mimetype;
      tipoAnexo = uploadUtils.getFileType(mimeType);

      console.log(`Tipo de anexo determinado: ${tipoAnexo}`);
      console.log(`Caminho guardado na BD: ${anexoUrl}`);
    }

    // Criar o comentário
    const novoComentario = await ForumComentario.create({
      id_tema: temaId,
      id_utilizador,
      texto: texto || null,
      anexo_url: anexoUrl,
      anexo_nome: anexoNome,
      tipo_anexo: tipoAnexo,
      data_criacao: new Date(),
      likes: 0,
      dislikes: 0,
      foi_denunciado: false,
      oculto: false
    });

    console.log(`Comentário criado com ID: ${novoComentario.id_comentario}`);

    // Incrementar o contador de comentários do tema
    await tema.update({
      comentarios: tema.comentarios + 1
    });

    // Buscar o comentário com informações do utilizador
    const comentarioCompleto = await ForumComentario.findOne({
      where: { id_comentario: novoComentario.id_comentario },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`tema_${temaId}`).emit('novoComentario', comentarioCompleto);
      console.log('Evento novoComentario emitido via socket.io');
      
      // Também notificar no canal do tópico para manter contadores atualizados
      req.io.to(`topico_${tema.id_topico}`).emit('comentarioAdicionado', {
        id_tema: temaId,
        comentarios: tema.comentarios + 1
      });
    } else {
      console.log('IO não disponível, comentário não será transmitido via socket');
    }

    res.status(201).json({
      success: true,
      message: 'Comentário criado com sucesso',
      data: comentarioCompleto
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar comentário',
      error: error.message
    });
  }
};

// Editar um comentário
const updateComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const { texto } = req.body;
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Editando comentário ${comentarioId} pelo utilizador ${id_utilizador}`);

    // Verificar se o comentário existe
    const comentario = await ForumComentario.findByPk(comentarioId);
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar permissão (apenas o autor ou administrador pode editar)
    if (comentario.id_utilizador !== id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para editar este comentário'
      });
    }

    // Atualizar campos do comentário
    await comentario.update({
      texto: texto !== undefined ? texto : comentario.texto
    });

    // Buscar comentário atualizado com dados do utilizador
    const comentarioAtualizado = await ForumComentario.findOne({
      where: { id_comentario: comentarioId },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email', 'foto_perfil']
        }
      ]
    });

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`tema_${comentario.id_tema}`).emit('comentarioAtualizado', comentarioAtualizado);
    }

    res.status(200).json({
      success: true,
      message: 'Comentário atualizado com sucesso',
      data: comentarioAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar comentário',
      error: error.message
    });
  }
};

// Excluir um comentário
const deleteComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Excluindo comentário ${comentarioId} pelo utilizador ${id_utilizador}`);

    // Verificar se o comentário existe
    const comentario = await ForumComentario.findByPk(comentarioId);
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar permissão (apenas o autor ou administrador pode excluir)
    if (comentario.id_utilizador !== id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para excluir este comentário'
      });
    }

    // Obter o tema relacionado para atualizar o contador
    const tema = await ForumTema.findByPk(comentario.id_tema);
    
    // Excluir o comentário (ou marcar como oculto para preservar dados)
    await comentario.update({ oculto: true });
    // Para exclusão permanente: await comentario.destroy();

    // Atualizar o contador de comentários no tema
    if (tema) {
      await tema.update({
        comentarios: Math.max(0, tema.comentarios - 1)
      });
    }

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`tema_${comentario.id_tema}`).emit('comentarioExcluido', { id_comentario: comentarioId });
      
      if (tema) {
        // Também notificar no canal do tópico para manter contadores atualizados
        req.io.to(`topico_${tema.id_topico}`).emit('comentarioRemovido', {
          id_tema: tema.id_tema,
          comentarios: Math.max(0, tema.comentarios - 1)
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Comentário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir comentário',
      error: error.message
    });
  }
};

// Avaliar um comentário (like/dislike)
const avaliarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const { tipo } = req.body; // 'like' ou 'dislike'
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Avaliando comentário ${comentarioId} como ${tipo} pelo utilizador ${id_utilizador}`);

    // Verificar se o tipo é válido
    if (tipo !== 'like' && tipo !== 'dislike') {
      return res.status(400).json({
        success: false,
        message: 'Tipo de avaliação inválido. Use "like" ou "dislike"'
      });
    }

    // Verificar se o comentário existe
    const comentario = await ForumComentario.findByPk(comentarioId);
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar se o utilizador já avaliou este comentário
    const interacaoExistente = await ForumComentarioInteracao.findOne({
      where: {
        id_comentario: comentarioId,
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
            id_comentario: comentarioId,
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
      await ForumComentarioInteracao.create({
        id_comentario: comentarioId,
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
    const comentarioAtualizado = await ForumComentario.findByPk(comentarioId);

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`tema_${comentario.id_tema}`).emit('comentarioAvaliado', {
        id_comentario: comentarioId,
        likes: comentarioAtualizado.likes,
        dislikes: comentarioAtualizado.dislikes
      });
    }

    res.json({
      success: true,
      message: `Comentário avaliado como "${tipo}" com sucesso`,
      data: {
        id_comentario: comentarioId,
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

// Denunciar um comentário
const denunciarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const { motivo, descricao } = req.body;
    const id_utilizador = req.user.id_utilizador || req.user.id;

    console.log(`Denunciando comentário ${comentarioId} por ${id_utilizador}: ${motivo}`);

    // Validação básica
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer um motivo para a denúncia'
      });
    }

    // Verificar se o comentário existe
    const comentario = await ForumComentario.findByPk(comentarioId);
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    // Verificar se o utilizador já denunciou este comentário
    const denunciaExistente = await ForumComentarioDenuncia.findOne({
      where: {
        id_comentario: comentarioId,
        id_denunciante: id_utilizador
      }
    });

    if (denunciaExistente) {
      return res.status(400).json({
        success: false,
        message: ' já denunciou este comentário anteriormente'
      });
    }

    // Criar a denúncia
    await ForumComentarioDenuncia.create({
      id_comentario: comentarioId,
      id_denunciante: id_utilizador,
      motivo,
      descricao: descricao || null,
      data_denuncia: new Date(),
      resolvida: false
    });

    // Marcar o comentário como denunciado
    await comentario.update({ foi_denunciado: true });

    // Notificar administradores via Socket.IO
    if (req.io) {
      req.io.to('admin_channel').emit('comentarioDenunciado', {
        id_comentario: comentarioId,
        id_tema: comentario.id_tema,
        motivo
      });
    }

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
  getTemasByTopico,
  getTemaById,
  createTema,
  updateTema,
  deleteTema,
  avaliarTema,
  getStatusAvaliacaoTema,
  denunciarTema,
  getComentariosByTema,
  createComentario,
  updateComentario,
  deleteComentario,
  avaliarComentario,
  denunciarComentario
};