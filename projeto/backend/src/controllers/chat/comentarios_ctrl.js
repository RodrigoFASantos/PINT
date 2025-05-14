const ChatMensagem = require("../../database/models/ChatMensagem");

// Obter todos os comentários
const getAllComentarios = async (req, res) => {
  try {
    const comentarios = await ChatMensagem.findAll();
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar comentários" });
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

module.exports = {
  getAllComentarios,
  createComentario
};