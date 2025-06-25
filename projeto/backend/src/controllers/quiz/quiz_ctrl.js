const Quiz = require("../../database/models/Quiz");
const QuizPergunta = require("../../database/models/QuizPergunta");
const QuizOpcao = require("../../database/models/QuizOpcao");
const QuizResposta = require("../../database/models/QuizResposta");
const QuizRespostaDetalhe = require("../../database/models/QuizRespostaDetalhe");
const Curso = require("../../database/models/Curso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const User = require("../../database/models/User");

// Utilitário para resposta padronizada
const createResponse = (success, message, data = null, errors = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (errors) response.errors = errors;
  return response;
};

// Função para verificar se um quiz expirou
const verificarExpiracaoQuiz = (quiz) => {
  if (!quiz.tempo_limite || !quiz.tempo_limite_inicio) {
    return false; // Sem limite de tempo
  }
  
  const agora = new Date();
  const inicioTempo = new Date(quiz.tempo_limite_inicio);
  const tempoLimiteMs = quiz.tempo_limite * 60 * 1000; // Converter minutos para milissegundos
  const tempoExpiracao = new Date(inicioTempo.getTime() + tempoLimiteMs);
  
  return agora > tempoExpiracao;
};

// Função para criar resposta automática com nota 0 para quizzes expirados
const criarRespostaAutomatica = async (quiz, inscricao, transaction = null) => {
  try {
    // Verificar se já existe resposta
    const respostaExistente = await QuizResposta.findOne({
      where: {
        id_quiz: quiz.id_quiz,
        id_inscricao: inscricao.id_inscricao
      },
      transaction
    });

    if (respostaExistente) {
      return respostaExistente;
    }

    // Criar resposta com nota 0
    const novaResposta = await QuizResposta.create({
      id_quiz: quiz.id_quiz,
      id_inscricao: inscricao.id_inscricao,
      data_inicio: new Date(),
      data_conclusao: new Date(),
      nota: 0.0, // Garantir que é número
      completo: true
    }, { transaction });

    console.log(`Resposta automática criada com nota 0 para quiz ${quiz.id_quiz}, inscrição ${inscricao.id_inscricao}`);
    return novaResposta;
  } catch (error) {
    console.error('Erro ao criar resposta automática:', error);
    throw error;
  }
};

// Obter notas de quizzes por curso para avaliação
const getNotasQuizzesPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    
    console.log(`=== OBTER NOTAS QUIZZES CURSO ${cursoId} ===`);
    
    // Verificar se o curso existe e é assíncrono
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json(createResponse(false, 'Curso não encontrado'));
    }
    
    if (curso.tipo !== 'assincrono') {
      return res.status(400).json(createResponse(false, 'Este endpoint é apenas para cursos assíncronos'));
    }
    
    // Buscar todos os quizzes do curso
    const quizzes = await Quiz.findAll({
      where: { id_curso: cursoId },
      attributes: ['id_quiz', 'titulo'],
      order: [['data_criacao', 'ASC']]
    });
    
    console.log(`Encontrados ${quizzes.length} quizzes no curso`);
    
    // Buscar todas as inscrições do curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso: cursoId },
      include: [
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email']
        }
      ]
    });
    
    console.log(`Encontradas ${inscricoes.length} inscrições no curso`);
    
    // Buscar todas as respostas completas dos quizzes do curso
    const respostas = await QuizResposta.findAll({
      where: { completo: true },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          where: { id_curso: cursoId },
          attributes: ['id_quiz', 'titulo']
        },
        {
          model: Inscricao_Curso,
          as: 'inscricao',
          include: [
            {
              model: User,
              as: 'utilizador',
              attributes: ['id_utilizador', 'nome', 'email']
            }
          ]
        }
      ]
    });
    
    console.log(`Encontradas ${respostas.length} respostas completas`);
    
    // Organizar dados por formando
    const dadosPorFormando = {};
    
    // Inicializar todos os formandos inscritos
    inscricoes.forEach(inscricao => {
      if (inscricao.utilizador) {
        const userId = inscricao.utilizador.id_utilizador;
        dadosPorFormando[userId] = {
          formando: {
            id_utilizador: inscricao.utilizador.id_utilizador,
            nome: inscricao.utilizador.nome,
            email: inscricao.utilizador.email
          },
          quizzes: [],
          media: 0,
          total_quizzes: quizzes.length,
          quizzes_completos: 0
        };
      }
    });
    
    // Processar respostas
    respostas.forEach(resposta => {
      const userId = resposta.inscricao.utilizador.id_utilizador;
      
      if (dadosPorFormando[userId]) {
        const nota = parseFloat(resposta.nota) || 0;
        
        dadosPorFormando[userId].quizzes.push({
          id_quiz: resposta.quiz.id_quiz,
          titulo: resposta.quiz.titulo,
          nota: nota,
          data_conclusao: resposta.data_conclusao
        });
        
        dadosPorFormando[userId].quizzes_completos++;
      }
    });
    
    // Calcular médias
    Object.keys(dadosPorFormando).forEach(userId => {
      const formando = dadosPorFormando[userId];
      
      if (formando.quizzes_completos > 0) {
        const somaNotas = formando.quizzes.reduce((soma, quiz) => soma + quiz.nota, 0);
        formando.media = parseFloat((somaNotas / formando.quizzes_completos).toFixed(2));
      }
      
      // Ordenar quizzes por título
      formando.quizzes.sort((a, b) => a.titulo.localeCompare(b.titulo));
    });
    
    // Converter para array e ordenar por nome do formando
    const resultado = Object.values(dadosPorFormando)
      .sort((a, b) => a.formando.nome.localeCompare(b.formando.nome));
    
    console.log(`Dados processados para ${resultado.length} formandos`);
    
    return res.json(createResponse(true, 'Notas de quizzes carregadas com sucesso', resultado));
    
  } catch (error) {
    console.error('Erro ao obter notas de quizzes por curso:', error);
    return res.status(500).json(createResponse(false, 'Erro ao obter notas de quizzes', null, [error.message]));
  }
};

// Obter todos os quizzes ou quizzes de um curso específico
const getAllQuizzes = async (req, res) => {
  try {
    const { id_curso } = req.query;
    const id_utilizador = req.user?.id_utilizador;
    
    const whereClause = {};
    if (id_curso) {
      whereClause.id_curso = id_curso;
    }

    const quizzes = await Quiz.findAll({
      where: whereClause,
      include: [
        {
          model: Curso,
          as: "curso",
          attributes: ['id_curso', 'nome', 'tipo']
        },
        {
          model: QuizPergunta,
          as: "perguntas",
          include: [
            {
              model: QuizOpcao,
              as: "opcoes",
              order: [['ordem', 'ASC']]
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ],
      order: [['data_criacao', 'DESC']]
    });

    // Se há utilizador, verificar estado dos quizzes e notas
    if (id_utilizador && id_curso) {
      // Buscar inscrição do utilizador
      const inscricao = await Inscricao_Curso.findOne({
        where: {
          id_utilizador,
          id_curso
        }
      });

      if (inscricao) {
        // Buscar respostas do utilizador
        const respostas = await QuizResposta.findAll({
          where: {
            id_inscricao: inscricao.id_inscricao
          }
        });

        const respostasMap = {};
        respostas.forEach(resp => {
          // Garantir que a nota seja um número
          if (resp.nota !== null && resp.nota !== undefined) {
            resp.nota = parseFloat(resp.nota);
          }
          respostasMap[resp.id_quiz] = resp;
        });

        // Processar cada quiz para determinar estado e criar respostas automáticas se necessário
        for (const quiz of quizzes) {
          const expirou = verificarExpiracaoQuiz(quiz);
          const resposta = respostasMap[quiz.id_quiz];

          // Adicionar informações de estado
          quiz.dataValues.expirou = expirou;
          quiz.dataValues.resposta_utilizador = resposta || null;

          // Se expirou e não tem resposta, criar resposta automática
          if (expirou && !resposta) {
            try {
              const respostaAutomatica = await criarRespostaAutomatica(quiz, inscricao);
              quiz.dataValues.resposta_utilizador = respostaAutomatica;
            } catch (error) {
              console.error(`Erro ao criar resposta automática para quiz ${quiz.id_quiz}:`, error);
            }
          }

          // Determinar estado do quiz
          if (resposta && resposta.completo) {
            quiz.dataValues.estado = 'concluido'; // Cinzento
          } else if (expirou) {
            quiz.dataValues.estado = 'expirado'; // Vermelho
          } else {
            quiz.dataValues.estado = 'disponivel'; // Verde
          }
        }
      }
    }

    return res.json(createResponse(true, 'Quizzes carregados com sucesso', quizzes));
  } catch (error) {
    console.error('Erro ao procurar quizzes:', error);
    return res.status(500).json(createResponse(false, 'Erro ao procurar quizzes', null, [error.message]));
  }
};

// Obter respostas do utilizador por curso
const getRespostasUtilizadorPorCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const id_utilizador = req.user.id_utilizador;
    
    console.log(`=== OBTER RESPOSTAS UTILIZADOR ===`);
    console.log(`Curso ID: ${id_curso}, Utilizador ID: ${id_utilizador}`);
    
    // Buscar inscrição do utilizador no curso
    const inscricao = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso
      }
    });

    if (!inscricao) {
      console.log('Inscrição não encontrada');
      return res.json(createResponse(true, 'Nenhuma inscrição encontrada', []));
    }

    // Buscar todas as respostas completas do utilizador para quizzes deste curso
    const respostas = await QuizResposta.findAll({
      where: {
        id_inscricao: inscricao.id_inscricao,
        completo: true
      },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          where: { id_curso },
          attributes: ['id_quiz', 'titulo']
        }
      ],
      attributes: ['id_resposta', 'id_quiz', 'nota', 'completo', 'data_conclusao']
    });

    // Garantir que as notas sejam números
    const respostasFormatadas = respostas.map(resposta => ({
      ...resposta.toJSON(),
      nota: resposta.nota !== null ? parseFloat(resposta.nota) : null
    }));

    console.log(`Encontradas ${respostasFormatadas.length} respostas completas`);

    return res.json(createResponse(true, 'Respostas carregadas com sucesso', respostasFormatadas));
  } catch (error) {
    console.error('Erro ao obter respostas do utilizador:', error);
    return res.status(500).json(createResponse(false, 'Erro ao obter respostas', null, [error.message]));
  }
};

// Obter quiz por ID com todas as informações
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Carregando quiz ID: ${id}`);
    
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Curso,
          as: "curso",
          attributes: ['id_curso', 'nome', 'tipo']
        },
        {
          model: QuizPergunta,
          as: "perguntas",
          include: [
            {
              model: QuizOpcao,
              as: "opcoes",
              order: [['ordem', 'ASC']]
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ]
    });
    
    if (!quiz) {
      return res.status(404).json(createResponse(false, 'Quiz não encontrado'));
    }

    console.log(`Quiz encontrado: ${quiz.titulo}, Perguntas: ${quiz.perguntas?.length || 0}`);

    // Verificar se o quiz expirou
    const expirou = verificarExpiracaoQuiz(quiz);

    // Para a página de fazer quiz (formandos)
    if (req.query.formato === 'quiz') {
      // Se expirou, não permitir acesso
      if (expirou) {
        return res.status(400).json(createResponse(false, 'Este quiz já expirou'));
      }

      const quizFormatado = {
        id_quiz: quiz.id_quiz,
        titulo: quiz.titulo,
        descricao: quiz.descricao,
        tempo_limite: quiz.tempo_limite,
        tempo_limite_inicio: quiz.tempo_limite_inicio,
        ativo: quiz.ativo,
        data_criacao: quiz.data_criacao,
        curso: quiz.curso,
        expirou,
        perguntas: quiz.perguntas.map(pergunta => ({
          id: pergunta.id_pergunta,
          texto: pergunta.pergunta,
          tipo: pergunta.tipo,
          pontos: pergunta.pontos,
          opcoes: pergunta.opcoes.map(opcao => opcao.texto),
          // Retorna array com índices das opções corretas
          respostaCorreta: pergunta.opcoes
            .map((opcao, index) => opcao.correta ? index : -1)
            .filter(index => index !== -1),
          explicacao: pergunta.explicacao || null
        }))
      };
      return res.json(createResponse(true, 'Quiz carregado para realização', quizFormatado));
    }

    // Para edição (formadores/administradores) - retornar dados completos
    const quizCompleto = {
      id_quiz: quiz.id_quiz,
      titulo: quiz.titulo,
      descricao: quiz.descricao,
      tempo_limite: quiz.tempo_limite,
      tempo_limite_inicio: quiz.tempo_limite_inicio,
      ativo: quiz.ativo,
      data_criacao: quiz.data_criacao,
      curso: quiz.curso,
      expirou,
      perguntas: quiz.perguntas.map(pergunta => ({
        id_pergunta: pergunta.id_pergunta,
        pergunta: pergunta.pergunta,
        tipo: pergunta.tipo,
        pontos: pergunta.pontos,
        ordem: pergunta.ordem,
        opcoes: pergunta.opcoes.map(opcao => ({
          id_opcao: opcao.id_opcao,
          texto: opcao.texto,
          correta: opcao.correta,
          ordem: opcao.ordem
        }))
      }))
    };

    console.log('Retornando quiz completo para edição');
    return res.json(createResponse(true, 'Quiz carregado com sucesso', quizCompleto));
  } catch (error) {
    console.error('Erro ao procurar quiz por ID:', error);
    return res.status(500).json(createResponse(false, 'Erro ao procurar quiz', null, [error.message]));
  }
};

// Validar dados do quiz
const validarDadosQuiz = (titulo, id_curso, perguntas) => {
  const errors = [];

  if (!titulo || !titulo.trim()) {
    errors.push('Título é obrigatório');
  }

  if (!id_curso) {
    errors.push('ID do curso é obrigatório');
  }

  if (!perguntas || perguntas.length === 0) {
    errors.push('É necessário pelo menos uma pergunta');
  }

  if (perguntas) {
    perguntas.forEach((pergunta, index) => {
      if (!pergunta.pergunta || !pergunta.pergunta.trim()) {
        errors.push(`Pergunta ${index + 1}: Texto da pergunta é obrigatório`);
      }

      // APENAS multipla_escolha e verdadeiro_falso são aceites
      if (!['multipla_escolha', 'verdadeiro_falso'].includes(pergunta.tipo)) {
        errors.push(`Pergunta ${index + 1}: Tipo de pergunta inválido`);
      }

      // Ambos os tipos precisam de pelo menos 2 opções e pelo menos 1 correta
      if (!pergunta.opcoes || pergunta.opcoes.length < 2) {
        errors.push(`Pergunta ${index + 1}: Deve ter pelo menos 2 opções`);
      } else {
        const opcoesCorretas = pergunta.opcoes.filter(op => op.correta);
        if (opcoesCorretas.length === 0) {
          errors.push(`Pergunta ${index + 1}: Deve ter pelo menos 1 resposta marcada como correta`);
        }
      }
    });
  }

  return errors;
};

// Criar novo quiz
const createQuiz = async (req, res) => {
  let transaction;
  
  try {
    transaction = await Quiz.sequelize.transaction();
    const { titulo, descricao, tempo_limite, ativo, id_curso, perguntas } = req.body;
    
    console.log('=== INÍCIO CRIAÇÃO QUIZ ===');
    console.log('Dados recebidos:', { titulo, id_curso, tempo_limite, perguntasCount: perguntas?.length });
    
    // Validações
    const validationErrors = validarDadosQuiz(titulo, id_curso, perguntas);
    if (validationErrors.length > 0) {
      await transaction.rollback();
      return res.status(400).json(createResponse(false, 'Dados inválidos', null, validationErrors));
    }

    // Verificar se o curso existe e é assíncrono
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      await transaction.rollback();
      return res.status(404).json(createResponse(false, 'Curso não encontrado'));
    }

    if (curso.tipo !== 'assincrono') {
      await transaction.rollback();
      return res.status(400).json(createResponse(false, 'Quizzes só podem ser criados para cursos assíncronos'));
    }

    console.log('Curso validado:', curso.nome);

    // Definir tempo_limite_inicio se há tempo limite
    const tempoLimiteInicio = tempo_limite ? new Date() : null;

    // Criar o quiz
    const novoQuiz = await Quiz.create({
      titulo: titulo.trim(),
      descricao: descricao ? descricao.trim() : null,
      tempo_limite: tempo_limite || null,
      tempo_limite_inicio: tempoLimiteInicio,
      ativo: ativo !== undefined ? ativo : true,
      id_curso
    }, { transaction });

    console.log('Quiz criado com ID:', novoQuiz.id_quiz);
    console.log('Tempo limite início:', tempoLimiteInicio);

    // Criar perguntas e opções
    for (let i = 0; i < perguntas.length; i++) {
      const perguntaData = perguntas[i];
      
      console.log(`Criando pergunta ${i + 1}:`, perguntaData.pergunta?.substring(0, 50));
      
      const novaPergunta = await QuizPergunta.create({
        id_quiz: novoQuiz.id_quiz,
        pergunta: perguntaData.pergunta.trim(),
        tipo: perguntaData.tipo || 'multipla_escolha',
        pontos: perguntaData.pontos || 4, // Padrão 4 pontos por pergunta
        ordem: perguntaData.ordem || (i + 1)
      }, { transaction });

      console.log('Pergunta criada com ID:', novaPergunta.id_pergunta);

      // Criar opções
      if (perguntaData.opcoes && perguntaData.opcoes.length > 0) {
        for (let j = 0; j < perguntaData.opcoes.length; j++) {
          const opcaoData = perguntaData.opcoes[j];
          
          if (opcaoData.texto && opcaoData.texto.trim()) {
            const novaOpcao = await QuizOpcao.create({
              id_pergunta: novaPergunta.id_pergunta,
              texto: opcaoData.texto.trim(),
              correta: opcaoData.correta || false,
              ordem: opcaoData.ordem || (j + 1)
            }, { transaction });

            console.log(`Opção ${j + 1} criada com ID:`, novaOpcao.id_opcao);
          }
        }
      }
    }

    await transaction.commit();
    console.log('=== QUIZ CRIADO COM SUCESSO ===');

    // Carregar quiz completo para retornar
    const quizCompleto = await Quiz.findByPk(novoQuiz.id_quiz, {
      include: [
        {
          model: QuizPergunta,
          as: "perguntas",
          include: [
            {
              model: QuizOpcao,
              as: "opcoes",
              order: [['ordem', 'ASC']]
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ]
    });

    return res.status(201).json(createResponse(true, 'Quiz criado com sucesso', quizCompleto));
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('=== ERRO NA CRIAÇÃO DO QUIZ ===');
    console.error('Erro:', error);
    return res.status(500).json(createResponse(false, 'Erro ao criar quiz', null, [error.message]));
  }
};

// Atualizar apenas dados básicos do quiz (sem perguntas)
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tempo_limite, ativo } = req.body;

    console.log('=== INÍCIO ATUALIZAÇÃO BÁSICA QUIZ ===');
    console.log('Quiz ID:', id);
    console.log('Tempo limite alterado:', tempo_limite);

    const quiz = await Quiz.findByPk(id);
    if (!quiz) {
      return res.status(404).json(createResponse(false, 'Quiz não encontrado'));
    }

    // Se o tempo limite foi alterado, atualizar o tempo_limite_inicio
    const updateData = {
      titulo: titulo || quiz.titulo,
      descricao: descricao !== undefined ? descricao : quiz.descricao,
      ativo: ativo !== undefined ? ativo : quiz.ativo
    };

    if (tempo_limite !== undefined) {
      updateData.tempo_limite = tempo_limite;
      if (tempo_limite) {
        // Se definiu um tempo limite, atualizar o início
        updateData.tempo_limite_inicio = new Date();
        console.log('Novo tempo limite início:', updateData.tempo_limite_inicio);
      } else {
        // Se removeu o tempo limite, limpar o início
        updateData.tempo_limite_inicio = null;
      }
    }

    // Atualizar quiz
    await quiz.update(updateData);

    console.log('=== QUIZ ATUALIZADO COM SUCESSO ===');

    return res.json(createResponse(true, 'Quiz atualizado com sucesso', quiz));
  } catch (error) {
    console.error('=== ERRO NA ATUALIZAÇÃO BÁSICA DO QUIZ ===');
    console.error('Erro:', error);
    return res.status(500).json(createResponse(false, 'Erro ao atualizar quiz', null, [error.message]));
  }
};

// Atualizar quiz completo (dados + perguntas + opções)
const updateQuizCompleto = async (req, res) => {
  let transaction;
  
  try {
    transaction = await Quiz.sequelize.transaction();
    const { id } = req.params;
    const { titulo, descricao, tempo_limite, ativo, perguntas } = req.body;

    console.log('=== INÍCIO ATUALIZAÇÃO COMPLETA QUIZ ===');
    console.log('Quiz ID:', id);
    console.log('Dados recebidos:', { titulo, tempo_limite, perguntasCount: perguntas?.length });

    const quiz = await Quiz.findByPk(id);
    if (!quiz) {
      await transaction.rollback();
      return res.status(404).json(createResponse(false, 'Quiz não encontrado'));
    }

    // Validações se foram fornecidas perguntas
    if (perguntas && Array.isArray(perguntas)) {
      const validationErrors = validarDadosQuiz(titulo, quiz.id_curso, perguntas);
      if (validationErrors.length > 0) {
        await transaction.rollback();
        return res.status(400).json(createResponse(false, 'Dados inválidos', null, validationErrors));
      }
    }

    // Preparar dados para atualização
    const updateData = {
      titulo: titulo || quiz.titulo,
      descricao: descricao !== undefined ? descricao : quiz.descricao,
      ativo: ativo !== undefined ? ativo : quiz.ativo
    };

    // Se o tempo limite foi alterado, atualizar o tempo_limite_inicio
    if (tempo_limite !== undefined) {
      updateData.tempo_limite = tempo_limite;
      if (tempo_limite) {
        // Se definiu um tempo limite, atualizar o início para agora
        updateData.tempo_limite_inicio = new Date();
        console.log('Novo tempo limite início:', updateData.tempo_limite_inicio);
      } else {
        // Se removeu o tempo limite, limpar o início
        updateData.tempo_limite_inicio = null;
      }
    }

    // Atualizar dados básicos do quiz
    await quiz.update(updateData, { transaction });

    console.log('Dados básicos do quiz atualizados');

    // Se foram fornecidas perguntas, atualizar completamente
    if (perguntas && Array.isArray(perguntas)) {
      // Primeiro, eliminar todas as perguntas e opções existentes
      const perguntasExistentes = await QuizPergunta.findAll({
        where: { id_quiz: id },
        transaction
      });

      for (const perguntaExistente of perguntasExistentes) {
        // Eliminar opções da pergunta
        await QuizOpcao.destroy({
          where: { id_pergunta: perguntaExistente.id_pergunta },
          transaction
        });
      }

      // Eliminar perguntas
      await QuizPergunta.destroy({
        where: { id_quiz: id },
        transaction
      });

      console.log('Perguntas e opções antigas eliminadas');

      // Criar novas perguntas e opções
      for (let i = 0; i < perguntas.length; i++) {
        const perguntaData = perguntas[i];
        
        console.log(`Criando nova pergunta ${i + 1}:`, perguntaData.pergunta?.substring(0, 50));

        const novaPergunta = await QuizPergunta.create({
          id_quiz: id,
          pergunta: perguntaData.pergunta.trim(),
          tipo: perguntaData.tipo || 'multipla_escolha',
          pontos: perguntaData.pontos || 4, // Padrão 4 pontos por pergunta
          ordem: perguntaData.ordem || (i + 1)
        }, { transaction });

        console.log('Nova pergunta criada com ID:', novaPergunta.id_pergunta);

        // Criar opções
        if (perguntaData.opcoes && perguntaData.opcoes.length > 0) {
          for (let j = 0; j < perguntaData.opcoes.length; j++) {
            const opcaoData = perguntaData.opcoes[j];
            
            if (opcaoData.texto && opcaoData.texto.trim()) {
              const novaOpcao = await QuizOpcao.create({
                id_pergunta: novaPergunta.id_pergunta,
                texto: opcaoData.texto.trim(),
                correta: opcaoData.correta || false,
                ordem: opcaoData.ordem || (j + 1)
              }, { transaction });

              console.log(`Nova opção ${j + 1} criada com ID:`, novaOpcao.id_opcao);
            }
          }
        }
      }
    }

    await transaction.commit();
    console.log('=== QUIZ ATUALIZADO COM SUCESSO ===');

    // Carregar quiz atualizado completo
    const quizAtualizado = await Quiz.findByPk(id, {
      include: [
        {
          model: QuizPergunta,
          as: "perguntas",
          include: [
            {
              model: QuizOpcao,
              as: "opcoes",
              order: [['ordem', 'ASC']]
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ]
    });

    return res.json(createResponse(true, 'Quiz atualizado com sucesso', quizAtualizado));
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('=== ERRO NA ATUALIZAÇÃO COMPLETA DO QUIZ ===');
    console.error('Erro:', error);
    return res.status(500).json(createResponse(false, 'Erro ao atualizar quiz', null, [error.message]));
  }
};

// Eliminar quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Quiz.sequelize.transaction();

    try {
      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        await transaction.rollback();
        return res.status(404).json(createResponse(false, 'Quiz não encontrado'));
      }

      console.log(`Tentativa de eliminar quiz com ID: ${id}`);

      // Eliminar em cascata (opções, perguntas, respostas)
      const perguntas = await QuizPergunta.findAll({
        where: { id_quiz: id },
        transaction
      });

      console.log(`Encontradas ${perguntas.length} perguntas para eliminar`);

      for (const pergunta of perguntas) {
        // Eliminar detalhes das respostas primeiro
        await QuizRespostaDetalhe.destroy({
          where: { id_pergunta: pergunta.id_pergunta },
          transaction
        });
        
        // Eliminar opções
        await QuizOpcao.destroy({
          where: { id_pergunta: pergunta.id_pergunta },
          transaction
        });
      }

      // Eliminar perguntas
      await QuizPergunta.destroy({
        where: { id_quiz: id },
        transaction
      });

      // Eliminar respostas principais
      await QuizResposta.destroy({
        where: { id_quiz: id },
        transaction
      });

      // Eliminar quiz
      await quiz.destroy({ transaction });

      await transaction.commit();
      console.log(`Quiz ${id} eliminado com sucesso`);

      return res.json(createResponse(true, 'Quiz eliminado com sucesso'));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao eliminar quiz:', error);
    return res.status(500).json(createResponse(false, 'Erro ao eliminar quiz', null, [error.message]));
  }
};

// Iniciar tentativa de quiz
const iniciarQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const id_utilizador = req.user.id_utilizador;
    
    console.log(`=== INICIAR QUIZ ===`);
    console.log(`Quiz ID: ${id}, Utilizador ID: ${id_utilizador}`);
    
    // Verificar se o quiz existe e está ativo
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Curso,
          as: "curso"
        }
      ]
    });
    
    if (!quiz) {
      return res.status(404).json(createResponse(false, 'Quiz não encontrado'));
    }

    if (!quiz.ativo) {
      return res.status(400).json(createResponse(false, 'Quiz não está disponível'));
    }

    // Verificar se o quiz expirou
    const expirou = verificarExpiracaoQuiz(quiz);
    if (expirou) {
      return res.status(400).json(createResponse(false, 'Este quiz já expirou'));
    }

    console.log(`Quiz encontrado: ${quiz.titulo}`);

    // Verificar se o utilizador está inscrito no curso
    const inscricao = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso: quiz.id_curso
      }
    });

    if (!inscricao) {
      return res.status(403).json(createResponse(false, 'Precisa estar inscrito no curso para fazer este quiz'));
    }

    console.log(`Inscrição encontrada: ID ${inscricao.id_inscricao}`);

    // Verificar se já existe uma tentativa em andamento
    const tentativaExistente = await QuizResposta.findOne({
      where: {
        id_quiz: id,
        id_inscricao: inscricao.id_inscricao,
        completo: false
      }
    });

    if (tentativaExistente) {
      console.log(`Tentativa existente encontrada: ID ${tentativaExistente.id_resposta}`);
      return res.status(400).json(createResponse(false, 'Já tem uma tentativa em andamento para este quiz', {
        id_resposta: tentativaExistente.id_resposta
      }));
    }

    // Verificar se já completou o quiz
    const tentativaCompleta = await QuizResposta.findOne({
      where: {
        id_quiz: id,
        id_inscricao: inscricao.id_inscricao,
        completo: true
      }
    });

    if (tentativaCompleta) {
      console.log(`Quiz já foi completado: ID ${tentativaCompleta.id_resposta}`);
      return res.status(400).json(createResponse(false, 'Você já completou este quiz'));
    }

    // Criar nova tentativa
    const novaResposta = await QuizResposta.create({
      id_quiz: id,
      id_inscricao: inscricao.id_inscricao,
      data_inicio: new Date(),
      completo: false
    });

    console.log(`Nova tentativa criada: ID ${novaResposta.id_resposta}`);

    return res.status(201).json(createResponse(true, 'Quiz iniciado com sucesso', {
      id_resposta: novaResposta.id_resposta,
      tempo_limite: quiz.tempo_limite,
      tempo_limite_inicio: quiz.tempo_limite_inicio
    }));
  } catch (error) {
    console.error('Erro ao iniciar quiz:', error);
    return res.status(500).json(createResponse(false, 'Erro ao iniciar quiz', null, [error.message]));
  }
};
// Função para calcular a pontuação de uma pergunta
const calcularPontuacaoPergunta = (pergunta, respostaUtilizador) => {
  const opcoesCorretas = pergunta.opcoes
    .map((opcao, index) => opcao.correta ? index : -1)
    .filter(index => index !== -1);
  
  const respostasSelecionadas = Array.isArray(respostaUtilizador) ? 
    respostaUtilizador.map(r => parseInt(r)) : 
    [respostaUtilizador].filter(r => r !== null && r !== undefined).map(r => parseInt(r));

  console.log(`Calculando pontuação:`);
  console.log(`- Pergunta pontos: ${pergunta.pontos}`);
  console.log(`- Opções corretas: [${opcoesCorretas}]`);
  console.log(`- Respostas selecionadas: [${respostasSelecionadas}]`);

  if (opcoesCorretas.length === 0) {
    return { pontos: 0, correta: false };
  }

  // Contar quantas respostas corretas foram selecionadas
  const corretasSelecionadas = respostasSelecionadas.filter(r => opcoesCorretas.includes(r));
  
  // Calcular pontuação proporcional
  // Se selecionou 2 de 2 corretas = pontos completos
  // Se selecionou 1 de 2 corretas = metade dos pontos
  const pontosPorcentagem = corretasSelecionadas.length / opcoesCorretas.length;
  const pontosObtidos = pontosPorcentagem * pergunta.pontos;
  
  // Considerar correta apenas se acertou todas
  const totalmenteCorreta = corretasSelecionadas.length === opcoesCorretas.length && 
                           respostasSelecionadas.length === opcoesCorretas.length;

  console.log(`- Corretas selecionadas: ${corretasSelecionadas.length}/${opcoesCorretas.length}`);
  console.log(`- Pontos obtidos: ${pontosObtidos}`);
  console.log(`- Totalmente correta: ${totalmenteCorreta}`);

  return {
    pontos: pontosObtidos,
    correta: totalmenteCorreta
  };
};

// Submeter respostas do quiz
const submeterQuiz = async (req, res) => {
  const transaction = await QuizResposta.sequelize.transaction();
  
  try {
    const { id } = req.params; // id do quiz
    const { respostas } = req.body;
    const id_utilizador = req.user.id_utilizador;

    console.log(`=== SUBMETER QUIZ ===`);
    console.log(`Quiz ID: ${id}, Utilizador ID: ${id_utilizador}`);
    console.log(`Respostas recebidas:`, respostas);

    // Buscar o quiz para obter o id_curso
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: QuizPergunta,
          as: "perguntas",
          include: [
            {
              model: QuizOpcao,
              as: "opcoes",
              order: [['ordem', 'ASC']]
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ]
    });

    if (!quiz) {
      await transaction.rollback();
      return res.status(404).json(createResponse(false, 'Quiz não encontrado'));
    }

    // Verificar se o quiz expirou
    const expirou = verificarExpiracaoQuiz(quiz);
    if (expirou) {
      await transaction.rollback();
      return res.status(400).json(createResponse(false, 'Este quiz já expirou'));
    }

    console.log(`Quiz carregado: ${quiz.titulo}, ${quiz.perguntas.length} perguntas`);

    // Buscar inscrição do utilizador no curso do quiz
    const inscricao = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso: quiz.id_curso
      }
    });

    if (!inscricao) {
      await transaction.rollback();
      return res.status(404).json(createResponse(false, 'Inscrição no curso não encontrada'));
    }

    console.log(`Inscrição encontrada: ID ${inscricao.id_inscricao}`);

    // Buscar tentativa ativa
    const resposta = await QuizResposta.findOne({
      where: {
        id_quiz: id,
        id_inscricao: inscricao.id_inscricao,
        completo: false
      }
    });

    if (!resposta) {
      await transaction.rollback();
      return res.status(404).json(createResponse(false, 'Tentativa de quiz não encontrada ou já finalizada'));
    }

    console.log(`Tentativa ativa encontrada: ID ${resposta.id_resposta}`);

    let pontuacaoTotal = 0;
    let acertosTotais = 0;

    // Processar cada resposta com nova lógica de pontuação
    for (const [perguntaId, respostaUtilizador] of Object.entries(respostas)) {
      const pergunta = quiz.perguntas.find(p => p.id_pergunta == perguntaId);
      if (!pergunta) {
        console.log(`Pergunta não encontrada: ID ${perguntaId}`);
        continue;
      }

      console.log(`\n=== Processando pergunta ${pergunta.id_pergunta} ===`);

      // Calcular pontuação com nova lógica
      const resultado = calcularPontuacaoPergunta(pergunta, respostaUtilizador);
      
      pontuacaoTotal += resultado.pontos;
      if (resultado.correta) {
        acertosTotais++;
      }

      // Guardar detalhe da resposta
      const respostasSelecionadas = Array.isArray(respostaUtilizador) ? respostaUtilizador : [respostaUtilizador].filter(r => r !== null && r !== undefined);
      
      await QuizRespostaDetalhe.create({
        id_resposta: resposta.id_resposta,
        id_pergunta: pergunta.id_pergunta,
        resposta_texto: respostasSelecionadas.join(','),
        id_opcao: respostasSelecionadas.length > 0 ? 
          pergunta.opcoes[respostasSelecionadas[0]]?.id_opcao : null,
        correta: resultado.correta,
        pontos_obtidos: resultado.pontos
      }, { transaction });

      console.log(`Detalhe guardado - Pergunta ${pergunta.id_pergunta}: ${resultado.pontos} pontos (${resultado.correta ? 'TOTALMENTE CORRETA' : 'PARCIAL/INCORRETA'})`);
    }

    // Calcular nota final sobre 10
    const totalPontos = quiz.perguntas.reduce((sum, p) => sum + p.pontos, 0);
    const notaFinal = totalPontos > 0 ? (pontuacaoTotal / totalPontos) * 10 : 0;

    console.log(`\n=== RESULTADO FINAL ===`);
    console.log(`Pontuação total: ${pontuacaoTotal}/${totalPontos}`);
    console.log(`Nota final: ${notaFinal}/10`);
    console.log(`Acertos totais: ${acertosTotais}/${quiz.perguntas.length}`);

    // Atualizar resposta do quiz
    await resposta.update({
      data_conclusao: new Date(),
      nota: parseFloat((Math.round(notaFinal * 100) / 100).toFixed(2)), // Garantir que é número com 2 casas decimais
      completo: true
    }, { transaction });

    await transaction.commit();
    console.log('=== QUIZ SUBMETIDO COM SUCESSO ===');

    return res.json(createResponse(true, 'Quiz submetido com sucesso', {
      nota: parseFloat((Math.round(notaFinal * 10) / 10).toFixed(1)),
      pontos_obtidos: Math.round(pontuacaoTotal * 10) / 10, // Arredondar para 1 casa decimal
      pontos_totais: totalPontos,
      percentagem: totalPontos > 0 ? 
        Math.round((pontuacaoTotal / totalPontos) * 100) : 0,
      acertos_totais: acertosTotais,
      total_perguntas: quiz.perguntas.length
    }));

  } catch (error) {
    await transaction.rollback();
    console.error('=== ERRO AO SUBMETER QUIZ ===');
    console.error('Erro:', error);
    return res.status(500).json(createResponse(false, 'Erro ao submeter quiz', null, [error.message]));
  }
};

module.exports = {
  getAllQuizzes,
  createQuiz,
  getQuizById,
  updateQuiz,
  updateQuizCompleto,
  deleteQuiz,
  iniciarQuiz,
  submeterQuiz,
  getRespostasUtilizadorPorCurso,
  getNotasQuizzesPorCurso
};