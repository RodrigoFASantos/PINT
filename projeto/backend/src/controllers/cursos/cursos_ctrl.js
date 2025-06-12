const User = require("../../database/models/User");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const Topico_Area = require("../../database/models/Topico_Area");
const Curso = require("../../database/models/Curso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Curso_Topicos = require("../../database/models/Curso_Topicos");
const PastaCurso = require("../../database/models/PastaCurso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const uploadUtils = require('../../middleware/upload');
const { sequelize } = require("../../config/db");
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Importando o controller de notificações diretamente
const notificacaoController = require('../notificacoes/notificacoes_ctrl');
const { get } = require("http");

// Obter todos os cursos com paginação
const getAllCursos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Parâmetros de filtro opcionais
    const { categoria, area, formador, search, tipo, estado, ativo, vagas, topico } = req.query;

    // Construir condições de filtro
    const where = {};

    if (categoria) {
      where.id_categoria = parseInt(categoria, 10);
    }

    if (area) {
      where.id_area = parseInt(area, 10);
    }

    if (formador) {
      where.id_formador = parseInt(formador, 10);
    }

    if (search) {
      where.nome = { [Op.iLike]: `%${search}%` };
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (ativo !== undefined) {
      where.ativo = ativo === 'false' ? false : true;
    }

    if (vagas) {
      where.vagas = { [Op.gte]: parseInt(vagas, 10) };
    }

    if (topico) {
      where.id_topico_area = parseInt(topico, 10);
      console.log(`Filtrando cursos por tópico id: ${parseInt(topico, 10)}`);
    }

    // Definir os modelos a incluir
    const includeModels = [
      {
        model: User,
        as: "formador",
        attributes: ['id_utilizador', 'nome', 'email']
      },
      {
        model: Area,
        as: "area"
      },
      {
        model: Categoria,
        as: "categoria"
      }
    ];

    // Adicionar Topico_Area se ele existir e estiver sendo usado
    try {
      if (Topico_Area) {
        includeModels.push({
          model: Topico_Area,
          as: "Topico_Area"
        });
      }
    } catch (err) {
      console.error("Aviso: O modelo Topico_Area não pôde ser incluído: ", err.message);
    }

    const { count, rows } = await Curso.findAndCountAll({
      where,
      offset,
      limit,
      order: [['data_inicio', 'DESC']],
      include: includeModels
    });

    // Se não houver cursos e não há filtros, tentar buscar todos os cursos
    if (rows.length === 0 && 
        !categoria && !area && !formador && !search && !tipo && !estado && !topico && ativo === undefined) {
      console.log("Não foram encontrados cursos com os filtros. Tentando sem filtros...");
      const todosOsCursos = await Curso.findAndCountAll({
        limit,
        offset,
        order: [['data_inicio', 'DESC']],
        include: includeModels
      });
      
      return res.json({
        cursos: todosOsCursos.rows,
        total: todosOsCursos.count,
        totalPages: Math.ceil(todosOsCursos.count / limit),
        currentPage: page
      });
    }

    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Erro ao procurar cursos:", error);
    res.status(500).json({ 
      message: "Erro ao procurar cursos",
      detalhes: error.message
    });
  }
};
// Função para obter cursos filtrados por categorias (para associação com formador)
const getCursosByCategoria = async (req, res) => {
  try {
    const { categorias } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!categorias) {
      return res.status(400).json({ message: "É necessário fornecer pelo menos uma categoria" });
    }

    // Converter a string de categorias em um array de IDs
    const categoriaIds = categorias.split(',').map(id => parseInt(id.trim()));

    // Procurar cursos que pertencem a essas categorias
    const { count, rows } = await Curso.findAndCountAll({
      where: {
        id_categoria: { [Op.in]: categoriaIds }
      },
      include: [
        {
          model: Categoria,
          as: "categoria"
        },
        {
          model: Area,
          as: "area"
        }
      ],
      offset,
      limit,
      order: [['nome', 'ASC']]
    });

    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Erro ao procurar cursos por categoria:", error);
    res.status(500).json({ message: "Erro ao procurar cursos por categoria" });
  }
};

// Procurar curso por ID com detalhes
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador;

    // Procurar o curso com todas as relações
    const curso = await Curso.findByPk(id, {
      include: [
        {
          model: User,
          as: "formador",
          attributes: ['id_utilizador', 'nome', 'email']
        },
        {
          model: Area,
          as: "area"
        },
        {
          model: Categoria,
          as: "categoria"
        },
        {
          model: Curso_Topicos,
          as: "topicos",
          where: { ativo: true },
          required: false,
          order: [['ordem', 'ASC']]
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Crie uma cópia do curso para modificar
    const cursoComInscritos = curso.toJSON();

    // Verificar se o curso já terminou
    const dataAtual = new Date();
    const dataFimCurso = new Date(curso.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;

    // Adicionar estado de acesso para cursos terminados
    cursoComInscritos.terminado = cursoTerminado;

    // Se o curso terminou e um utilizador está a tentar aceder, verificar se está inscrito
    if (cursoTerminado && userId) {
      try {
        // Verificar se o utilizador está inscrito neste curso
        const inscricao = await Inscricao_Curso.findOne({
          where: {
            id_utilizador: userId,
            id_curso: id,
            estado: 'inscrito' // Considera apenas inscrições ativas
          }
        });

        // Adicionar logs para diagnóstico
        console.log(`A verificar inscrição para utilizador ${userId} no curso ${id}`);
        console.log(`Resultado da procura de inscrição:`, inscricao);

        // Indicar se o utilizador tem acesso ao curso
        cursoComInscritos.acessoPermitido = !!inscricao;
        console.log(`Acesso permitido: ${cursoComInscritos.acessoPermitido}`);
      } catch (error) {
        console.error("Erro ao verificar inscrição:", error);
        // Em caso de erro, vamos considerar que o utilizador não tem acesso
        cursoComInscritos.acessoPermitido = false;
      }
    } else if (cursoTerminado) {
      // Se não há utilizador autenticado e o curso terminou, não permitir acesso
      cursoComInscritos.acessoPermitido = false;
    } else {
      // Se o curso não terminou, permitir acesso
      cursoComInscritos.acessoPermitido = true;
    }

    // Adicionar contagem de inscrições ativas (código existente)
    try {
      if (curso.tipo === 'sincrono' && curso.vagas) {
        let where = { id_curso: id };

        try {
          const inscricao = await Inscricao_Curso.findOne({ where: { id_curso: id } });
          if (inscricao) {
            if ('ativo' in inscricao.dataValues) {
              where.ativo = true;
            } else if ('status' in inscricao.dataValues) {
              where.status = 'ativo';
            }
          }
        } catch (e) {
          console.log("Aviso: Não foi possível determinar coluna de estado de inscrição", e.message);
        }

        const inscricoesAtivas = await Inscricao_Curso.count({ where });
        cursoComInscritos.inscricoesAtivas = inscricoesAtivas;
      }
    } catch (inscricoesError) {
      console.error("Erro ao contar inscrições (não fatal):", inscricoesError);
      cursoComInscritos.inscricoesAtivas = 0;
    }

    res.json(cursoComInscritos);
  } catch (error) {
    console.error("Erro ao procurar curso:", error);
    res.status(500).json({ message: "Erro ao procurar curso", error: error.message });
  }
};

// Buscar tópico de área específico pelo ID
const getTopicoArea = async (req, res) => {
  try {
    const id = req.params.id;

    // Importar o modelo Topico_Area
    const Topico_Area = require("../../database/models/Topico_Area");

    // Buscar o tópico pelo ID
    const topico = await Topico_Area.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico de área não encontrado" });
    }

    // Retornar o tópico encontrado
    res.json(topico);
  } catch (error) {
    console.error("Erro ao buscar tópico de área:", error);
    res.status(500).json({ message: "Erro ao buscar tópico de área", error: error.message });
  }
};


// Função para criar um novo curso
const createCurso = async (req, res) => {
  try {
    console.log("A iniciar criação de curso");
    console.log("Dados recebidos:", req.body);

    const {
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim,
      id_formador, id_area, id_categoria, topicos, id_topico_categoria
    } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !tipo || !data_inicio || !data_fim || !id_area || !id_categoria || !duracao) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    // Validação adicional para id_topico_categoria
    if (!id_topico_categoria) {
      return res.status(400).json({ message: "É necessário selecionar um tópico para o curso!" });
    }

    // Verificar se já existe um curso com o mesmo nome
    const cursoExistente = await Curso.findOne({ where: { nome } });
    if (cursoExistente) {
      return res.status(400).json({
        message: "Já existe um curso com este nome. Por favor, escolha um nome diferente.",
        error: "NOME_DUPLICADO"
      });
    }

    // Criar diretórios para o curso
    const cursoSlug = uploadUtils.normalizarNome(nome);
    const cursoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);
    uploadUtils.ensureDir(cursoDir);
    const dirPath = `uploads/cursos/${cursoSlug}`;

    // Verificar se foi enviada uma imagem
    let imagemPath = null;
    if (req.file) {
      // Configurar o caminho da imagem para a base de dados
      imagemPath = `${dirPath}/capa.png`;
      console.log(`Caminho da imagem guardado na BD: ${imagemPath}`);
    }

    // Iniciar uma transação
    const t = await sequelize.transaction();

    try {
      // CORREÇÃO: Mapear id_topico_categoria para id_topico_area que é o nome correto no modelo
      const novoCurso = await Curso.create({
        nome,
        descricao,
        tipo,
        vagas: tipo === "sincrono" ? (parseInt(vagas, 10) + 1) : null,  // Adicionar +1 às vagas para o formador se for um curso síncrono
        data_inicio,
        data_fim,
        id_formador,
        id_area,
        id_categoria,
        id_topico_area: id_topico_categoria,
        imagem_path: imagemPath,
        dir_path: dirPath,
        duracao: parseInt(duracao, 10),
        ativo: true
      }, { transaction: t });

      // Se foram fornecidos tópicos, criar cada um deles
      if (topicos && Array.isArray(topicos) && topicos.length > 0) {
        for (let i = 0; i < topicos.length; i++) {
          await Curso_Topicos.create({
            nome: topicos[i].nome,
            id_curso: novoCurso.id_curso,
            ordem: i + 1,
            ativo: true
          }, { transaction: t });
        }
      }

      // Confirmar a transação
      await t.commit();

      console.log(`Curso criado com sucesso: ${novoCurso.id_curso} - ${novoCurso.nome}`);

      // Auto-inscrever o formador se for um curso síncrono com um formador
      if (tipo === "sincrono" && id_formador) {
        try {
          console.log(`A inscrever formador automaticamente (ID: ${id_formador}) no curso ${novoCurso.id_curso}`);

          // Criar inscrição para o formador
          await Inscricao_Curso.create({
            id_utilizador: id_formador,
            id_curso: novoCurso.id_curso,
            data_inscricao: new Date(),
            estado: "inscrito"
          });

          // Nota: Não precisamos diminuir o número de vagas para o formador
          // porque adicionamos +1 às vagas ao criar o curso

          console.log(`Formador inscrito com sucesso`);
        } catch (enrollError) {
          console.error("Erro ao inscrever formador:", enrollError);
          // Não falhar toda a operação se a inscrição do formador falhar
        }
      }

      // Notificar sobre o novo curso
      try {
        await notificacaoController.notificarNovoCurso(novoCurso);
        console.log("Notificação de curso criado enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de curso criado:", notificationError);
      }

      res.status(201).json({
        message: "Curso criado com sucesso!",
        curso: {
          id_curso: novoCurso.id_curso,
          nome: novoCurso.nome
        }
      });
    } catch (error) {
      // Reverter a transação em caso de erro
      await t.rollback();
      console.error("Erro específico na transação:", error);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    console.error("Stack trace completo:", error.stack);
    res.status(500).json({ message: "Erro no servidor ao criar curso.", error: error.message });
  }
};

// 🔧 FUNÇÃO UPDATECURSO CORRIGIDA COM RENOMEAÇÃO DE PASTA
const updateCurso = async (req, res) => {
  try {
    console.log("Update course request received:");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const id = req.params.id;
    const { 
      nome, descricao, tipo, vagas, duracao, data_inicio, data_fim, 
      id_formador, id_area, id_categoria, id_topico_area, ativo 
    } = req.body;

    // Procurar dados atuais do curso para comparação
    const cursoAtual = await Curso.findByPk(id, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    if (!cursoAtual) {
      console.log(`Course with ID ${id} not found`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    console.log(`Course found: ${cursoAtual.nome} (ID: ${id})`);

    // 🔧 NOVA LÓGICA: Verificar se o nome do curso mudou
    const nomeAtual = cursoAtual.nome;
    const novoNome = nome || nomeAtual;
    const nomeMudou = novoNome !== nomeAtual;

    console.log(`📝 Nome atual: "${nomeAtual}"`);
    console.log(`📝 Novo nome: "${novoNome}"`);
    console.log(`📝 Nome mudou? ${nomeMudou ? 'SIM' : 'NÃO'}`);

    // Determinar caminhos de pastas
    const cursoSlugAtual = uploadUtils.normalizarNome(nomeAtual);
    const novoCursoSlug = uploadUtils.normalizarNome(novoNome);
    
    const pastaAtual = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAtual);
    const novaPasta = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', novoCursoSlug);
    
    const dirPathAtual = cursoAtual.dir_path || `uploads/cursos/${cursoSlugAtual}`;
    const novoDirPath = `uploads/cursos/${novoCursoSlug}`;

    console.log(`📁 Pasta atual: ${pastaAtual}`);
    console.log(`📁 Nova pasta: ${novaPasta}`);

    // 🔧 PROCESSAR RENOMEAÇÃO DE PASTA SE NECESSÁRIO
    let pastaRenomeada = false;
    if (nomeMudou && fs.existsSync(pastaAtual)) {
      try {
        console.log(`🔄 Renomeando pasta de "${pastaAtual}" para "${novaPasta}"`);
        
        // Verificar se a nova pasta já existe
        if (fs.existsSync(novaPasta)) {
          console.log(`⚠️ Pasta de destino já existe: ${novaPasta}`);
          // Se já existe, vamos criar um nome único
          let contador = 1;
          let novaPastaUnica = `${novaPasta}_${contador}`;
          while (fs.existsSync(novaPastaUnica)) {
            contador++;
            novaPastaUnica = `${novaPasta}_${contador}`;
          }
          console.log(`📁 Usando nome único: ${novaPastaUnica}`);
          fs.renameSync(pastaAtual, novaPastaUnica);
          
          // Atualizar caminhos para o nome único
          const slugUnico = `${novoCursoSlug}_${contador}`;
          novoDirPath = `uploads/cursos/${slugUnico}`;
        } else {
          // Renomear normalmente
          fs.renameSync(pastaAtual, novaPasta);
        }
        
        pastaRenomeada = true;
        console.log(`✅ Pasta renomeada com sucesso!`);
      } catch (renameError) {
        console.error(`❌ Erro ao renomear pasta:`, renameError);
        // Continuar sem falhar, mas registar o erro
        pastaRenomeada = false;
      }
    }

    // 🔧 PROCESSAR NOVA IMAGEM
    let novaImagemPath = cursoAtual.imagem_path; // Manter imagem atual por defeito
    
    if (req.file) {
      // Usar o novo caminho de diretório (após possível renomeação)
      novaImagemPath = `${novoDirPath}/capa.png`;
      
      console.log(`📷 Nova imagem recebida. Caminho: ${novaImagemPath}`);
      console.log(`📷 Ficheiro original: ${req.file.originalname}`);
      console.log(`📷 Tamanho: ${req.file.size} bytes`);
    } else if (nomeMudou && cursoAtual.imagem_path) {
      // Se não há nova imagem mas o nome mudou, atualizar o caminho da imagem existente
      novaImagemPath = `${novoDirPath}/capa.png`;
      console.log(`📷 Atualizando caminho da imagem existente: ${novaImagemPath}`);
    }

    // Guardar os dados antigos para comparação (notificações)
    const dataInicioAntiga = cursoAtual.data_inicio;
    const dataFimAntiga = cursoAtual.data_fim;
    const formadorAntigo = cursoAtual.formador ? {
      id_utilizador: cursoAtual.formador.id_utilizador,
      nome: cursoAtual.formador.nome
    } : null;

    // Determinar o estado do curso com base nas datas atualizadas
    let novoEstado = cursoAtual.estado;
    if (data_inicio || data_fim) {
      const dataAtual = new Date();
      const novaDataInicio = data_inicio ? new Date(data_inicio) : new Date(cursoAtual.data_inicio);
      const novaDataFim = data_fim ? new Date(data_fim) : new Date(cursoAtual.data_fim);
      
      // Determinar estado com base nas novas datas
      if (novaDataFim < dataAtual) {
        novoEstado = 'terminado';
      } else if (novaDataInicio <= dataAtual) {
        novoEstado = 'em_curso';
      } else {
        novoEstado = 'planeado';
      }
      
      console.log(`Estado do curso determinado automaticamente: ${novoEstado}`);
    }

    // 🔧 ATUALIZAR CURSO NA BASE DE DADOS
    await cursoAtual.update({
      nome: novoNome,
      descricao: descricao || cursoAtual.descricao,
      tipo: tipo || cursoAtual.tipo,
      vagas: vagas || cursoAtual.vagas,
      data_inicio: data_inicio || cursoAtual.data_inicio,
      data_fim: data_fim || cursoAtual.data_fim,
      id_formador: id_formador || cursoAtual.id_formador,
      id_area: id_area || cursoAtual.id_area,
      id_categoria: id_categoria || cursoAtual.id_categoria,
      id_topico_area: id_topico_area || cursoAtual.id_topico_area,
      duracao: duracao !== undefined ? parseInt(duracao, 10) : cursoAtual.duracao,
      ativo: ativo !== undefined ? ativo : cursoAtual.ativo,
      estado: novoEstado,
      imagem_path: novaImagemPath, // ✅ Caminho da imagem atualizado
      dir_path: novoDirPath // ✅ Caminho do diretório atualizado
    });

    console.log(`✅ Curso atualizado com sucesso!`);
    console.log(`📝 Nome mudou: ${nomeMudou ? 'SIM' : 'NÃO'}`);
    console.log(`📁 Pasta renomeada: ${pastaRenomeada ? 'SIM' : 'NÃO'}`);
    console.log(`📷 Nova imagem: ${req.file ? 'SIM' : 'NÃO'}`);

    // Recarregar o curso atualizado com as suas relações
    const cursoAtualizado = await Curso.findByPk(id, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    // NOTIFICAÇÕES (código existente)
    
    // Verificar se o formador foi alterado
    if (id_formador && id_formador !== cursoAtual.id_formador) {
      try {
        await notificacaoController.notificarFormadorAlterado(
          cursoAtualizado,
          formadorAntigo,
          cursoAtualizado.formador
        );
        console.log("Notificação de alteração de formador enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de alteração de formador:", notificationError);
      }
    }

    // Verificar se as datas foram alteradas
    const dataInicioAlterada = data_inicio &&
      new Date(data_inicio).getTime() !== new Date(dataInicioAntiga).getTime();
    const dataFimAlterada = data_fim &&
      new Date(data_fim).getTime() !== new Date(dataFimAntiga).getTime();

    if (dataInicioAlterada || dataFimAlterada) {
      try {
        await notificacaoController.notificarDataCursoAlterada(
          cursoAtualizado,
          dataInicioAntiga,
          dataFimAntiga
        );
        console.log("Notificação de alteração de datas enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de alteração de datas:", notificationError);
      }
    }

    // Responder com sucesso
    return res.status(200).json({
      message: "Curso atualizado com sucesso",
      curso: cursoAtualizado,
      imagemAtualizada: !!req.file,
      pastaRenomeada: pastaRenomeada,
      nomeMudou: nomeMudou
    });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    return res.status(500).json({
      message: "Erro ao atualizar curso",
      error: error.message
    });
  }
};


// Nova função: Associar formador a um curso
const associarFormadorCurso = async (req, res) => {
  try {
    const { id_curso, id_formador } = req.body;

    if (!id_curso || !id_formador) {
      return res.status(400).json({ message: "É necessário fornecer o ID do curso e do formador" });
    }

    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se o utilizador é realmente um formador
    const formador = await User.findByPk(id_formador);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(400).json({ message: "O utilizador especificado não é um formador" });
    }

    // Verificar se o formador tem acesso à categoria/área do curso
    const categoriaDoFormador = await sequelize.query(
      `SELECT COUNT(*) as count FROM formador_categoria 
       WHERE id_formador = :id_formador AND id_categoria = :id_categoria`,
      {
        replacements: { id_formador, id_categoria: curso.id_categoria },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (categoriaDoFormador[0].count === '0') {
      return res.status(400).json({
        message: "O formador não está associado à categoria deste curso",
        categoriaId: curso.id_categoria
      });
    }

    // Guardar formador antigo para notificação
    const formadorAntigo = curso.id_formador ?
      await User.findByPk(curso.id_formador, { attributes: ['id_utilizador', 'nome'] }) : null;

    // Atualizar o curso com o novo formador
    curso.id_formador = id_formador;
    await curso.save();

    // Recarregar o curso para a notificação
    const cursoAtualizado = await Curso.findByPk(id_curso, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    // Notificar sobre a alteração do formador
    try {
      await notificacaoController.notificarFormadorAlterado(
        cursoAtualizado,
        formadorAntigo,
        formador
      );
      console.log("Notificação de alteração de formador enviada com sucesso");
    } catch (notificationError) {
      console.error("Erro ao enviar notificação de alteração de formador:", notificationError);
      // Continuar mesmo com erro na notificação
    }

    res.json({
      message: "Formador associado ao curso com sucesso",
      curso: {
        id_curso: curso.id_curso,
        nome: curso.nome,
        id_formador: curso.id_formador
      }
    });
  } catch (error) {
    console.error("Erro ao associar formador ao curso:", error);
    res.status(500).json({ message: "Erro ao associar formador ao curso", error: error.message });
  }
};

// Listar inscrições de um curso
const getInscricoesCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email', 'telefone']
        }
      ]
    });

    res.json(inscricoes);
  } catch (error) {
    console.error("Erro ao procurar inscrições do curso:", error);
    res.status(500).json({ message: "Erro ao procurar inscrições" });
  }
};

// Função para eliminar curso com remoção da imagem e diretórios
const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão (id_cargo === 1 para administrador)
    if (req.user.id_cargo !== 1) {
      return res.status(403).json({
        message: "Não tem permissão para eliminar cursos"
      });
    }

    // Verificar se o curso existe antes de iniciar operações
    const curso = await Curso.findByPk(id);

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Guardar o caminho do diretório do curso
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    const cursoDir = curso.dir_path || `uploads/cursos/${cursoSlug}`;
    const cursoDirAbs = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);

    try {
      // Eliminar diretamente as inscrições
      const numInscricoesRemovidas = await Inscricao_Curso.destroy({
        where: { id_curso: id }
      });

      console.log(`Removidas ${numInscricoesRemovidas} inscrições do curso ${id}`);

      // Encontrar todas as pastas do curso através dos tópicos
      const topicos = await Curso_Topicos.findAll({
        where: { id_curso: id }
      });

      const topicoIds = topicos.map(topico => topico.id_topico);

      // Procurar todas as pastas dos tópicos
      const pastas = await PastaCurso.findAll({
        where: { id_topico: { [Op.in]: topicoIds } }
      });

      const pastaIds = pastas.map(pasta => pasta.id_pasta);

      // Eliminar os conteúdos das pastas
      if (pastaIds.length > 0) {
        await ConteudoCurso.destroy({
          where: { id_pasta: { [Op.in]: pastaIds } }
        });
        console.log(`Removidos conteúdos das pastas do curso ${id}`);
      }

      // Eliminar as pastas
      if (topicoIds.length > 0) {
        await PastaCurso.destroy({
          where: { id_topico: { [Op.in]: topicoIds } }
        });
        console.log(`Removidas pastas dos tópicos do curso ${id}`);
      }

      // Eliminar os tópicos
      await Curso_Topicos.destroy({
        where: { id_curso: id }
      });
      console.log(`Removidos tópicos do curso ${id}`);

      // Eliminar quaisquer conteúdos diretamente associados ao curso
      await ConteudoCurso.destroy({
        where: { id_curso: id }
      });
      console.log(`Removidos conteúdos diretos do curso ${id}`);

      // Eliminar o curso
      await curso.destroy();
      console.log(`Curso ${id} eliminado com sucesso`);

      // Remover o diretório do curso e todos os seus conteúdos
      if (fs.existsSync(cursoDirAbs)) {
        // Função recursiva para remover diretórios e ficheiros
        const removerDiretorioRecursivo = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((ficheiro) => {
              const caminhoCompleto = path.join(dir, ficheiro);
              if (fs.lstatSync(caminhoCompleto).isDirectory()) {
                // Se for diretório, chamar recursivamente
                removerDiretorioRecursivo(caminhoCompleto);
              } else {
                // Se for ficheiro, remover
                fs.unlinkSync(caminhoCompleto);
              }
            });
            // Remover o diretório vazio
            fs.rmdirSync(dir);
          }
        };

        removerDiretorioRecursivo(cursoDirAbs);
        console.log(`Diretório do curso removido: ${cursoDirAbs}`);
      } else {
        console.log(`Diretório não encontrado no caminho: ${cursoDirAbs}`);
      }

      // Retornar resposta de sucesso
      return res.json({
        message: "Curso eliminado com sucesso!",
        inscricoesRemovidas: numInscricoesRemovidas,
        diretorioRemovido: true
      });
    } catch (error) {
      console.error("Erro específico ao eliminar relações:", error);
      return res.status(500).json({
        message: "Erro ao eliminar relações do curso",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Erro geral ao eliminar curso:", error);
    return res.status(500).json({
      message: "Erro no servidor ao eliminar curso.",
      error: error.message
    });
  }
};

// Procurar cursos sugeridos para o utilizador
const getCursosSugeridos = async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;

    // Procurar inscrições do utilizador
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador }
    });

    const cursosInscritosIds = inscricoes.map(i => i.id_curso);

    let cursosSugeridos = [];

    if (inscricoes.length > 0) {
      // Procurar categorias e áreas dos cursos em que o utilizador está inscrito
      const cursosInscritos = await Curso.findAll({
        where: { id_curso: cursosInscritosIds }
      });

      const categoriasInscrito = [...new Set(cursosInscritos.map(c => c.id_categoria))];
      const areasInscrito = [...new Set(cursosInscritos.map(c => c.id_area))];

      // Procurar cursos sugeridos com exclusão
      cursosSugeridos = await Curso.findAll({
        where: {
          id_categoria: categoriasInscrito,
          id_area: { [Op.notIn]: areasInscrito },
          id_curso: { [Op.notIn]: cursosInscritosIds },
          vagas: { [Op.gt]: 0 },
          ativo: true
        },
        limit: 10,
        order: sequelize.literal('RANDOM()')
      });
    }

    // Se não houver cursos sugeridos (ou utilizador sem inscrições), mostrar cursos aleatórios
    if (cursosSugeridos.length === 0) {
      cursosSugeridos = await Curso.findAll({
        where: {
          id_curso: { [Op.notIn]: cursosInscritosIds },
          vagas: { [Op.gt]: 0 },
          ativo: true
        },
        limit: 10,
        order: sequelize.literal('RANDOM()')
      });
    }

    return res.json(cursosSugeridos);
  } catch (error) {
    console.error("Erro ao procurar cursos sugeridos:", error);
    res.status(500).json({ message: "Erro no servidor ao procurar cursos sugeridos." });
  }
};

/*TÓPICOS*/
// Obter tópicos de um curso
const getTopicosCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;

    const topicos = await Curso_Topicos.findAll({
      where: { id_curso, ativo: true },
      order: [['ordem', 'ASC']]
    });

    res.json(topicos);
  } catch (error) {
    console.error("Erro ao obter tópicos do curso:", error);
    res.status(500).json({ message: "Erro ao obter tópicos do curso" });
  }
};

// Criar um novo tópico para um curso
const createCurso_Topicos = async (req, res) => {
  try {
    const id_curso = req.params.id;
    const { nome, ordem } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "Nome do tópico é obrigatório" });
    }

    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Obter a ordem máxima atual
    const ultimaOrdem = await Curso_Topicos.max('ordem', {
      where: { id_curso }
    }) || 0;

    // Criar o tópico
    const novoTopico = await Curso_Topicos.create({
      nome,
      id_curso,
      ordem: ordem || ultimaOrdem + 1,
      ativo: true
    });

    res.status(201).json({
      message: "Tópico criado com sucesso",
      topico: novoTopico
    });
  } catch (error) {
    console.error("Erro ao criar tópico:", error);
    res.status(500).json({ message: "Erro ao criar tópico" });
  }
};

// Atualizar um tópico
const updateCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    const { nome, ordem, ativo } = req.body;

    // Verificar se o tópico existe
    const topico = await Curso_Topicos.findByPk(id_topico);
    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Atualizar o tópico
    await topico.update({
      nome: nome !== undefined ? nome : topico.nome,
      ordem: ordem !== undefined ? ordem : topico.ordem,
      ativo: ativo !== undefined ? ativo : topico.ativo
    });

    res.json({
      message: "Tópico atualizado com sucesso",
      topico
    });
  } catch (error) {
    console.error("Erro ao atualizar tópico:", error);
    res.status(500).json({ message: "Erro ao atualizar tópico" });
  }
};

// Eliminar um tópico
const deleteCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;

    // Verificar se o tópico existe
    const topico = await Curso_Topicos.findByPk(id_topico);
    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Verificar se há pastas associadas a este tópico
    const pastas = await PastaCurso.findAll({
      where: { id_topico }
    });

    if (pastas.length > 0) {
      // Em vez de eliminar, marcar como inativo
      await topico.update({ ativo: false });
      return res.json({
        message: "Tópico desativado com sucesso. Não foi possível eliminar pois possui pastas associadas.",
        desativado: true
      });
    }

    // Se não há pastas, eliminar o tópico
    await topico.destroy();

    res.json({ message: "Tópico eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar tópico:", error);
    res.status(500).json({ message: "Erro ao eliminar tópico" });
  }
};

module.exports = {
  getAllCursos,
  getCursosByCategoria,
  getTopicoArea,
  createCurso,
  getCursoById,
  getInscricoesCurso,
  updateCurso,
  deleteCurso,
  getCursosSugeridos,
  associarFormadorCurso,
  getTopicosCurso,
  createCurso_Topicos,
  updateCurso_Topicos,
  deleteCurso_Topicos
};