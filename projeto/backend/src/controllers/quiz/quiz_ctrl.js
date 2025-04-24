// src/controllers/quiz_ctrl.js
const sequelize = require('../../../config/db');

// Funções do controlador
const getAllQuizzes = async (req, res) => {
  try {
    // Buscar quizzes de uma forma compatível com PostgreSQL
    const [quizzes] = await sequelize.query('SELECT * FROM quizzes');
    return res.json(quizzes);
  } catch (error) {
    console.error('Erro ao buscar quizzes:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar quizzes',
      error: error.message 
    });
  }
};

const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const [quiz] = await sequelize.query(
      'SELECT * FROM quizzes WHERE id = $1',
      {
        bind: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz não encontrado' });
    }
    
    return res.json(quiz);
  } catch (error) {
    console.error('Erro ao buscar quiz por ID:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar quiz',
      error: error.message 
    });
  }
};

// Implementar as funções restantes que são importadas nas rotas
const createQuiz = async (req, res) => {
  try {
    const { titulo, descricao, perguntas } = req.body;
    
    // Iniciar transação
    const t = await sequelize.transaction();
    
    try {
      // Criar quiz
      const [quizId] = await sequelize.query(
        `INSERT INTO quizzes (titulo, descricao, id_criador, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
        {
          bind: [titulo, descricao, req.user.id_utilizador],
          type: sequelize.QueryTypes.INSERT,
          transaction: t
        }
      );
      
      // Se existirem perguntas, adicioná-las
      if (perguntas && perguntas.length > 0) {
        for (const pergunta of perguntas) {
          const [perguntaId] = await sequelize.query(
            `INSERT INTO perguntas (id_quiz, texto, pontos, created_at, updated_at) 
             VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
            {
              bind: [quizId[0].id, pergunta.texto, pergunta.pontos || 1],
              type: sequelize.QueryTypes.INSERT,
              transaction: t
            }
          );
          
          // Adicionar opções
          if (pergunta.opcoes && pergunta.opcoes.length > 0) {
            for (const opcao of pergunta.opcoes) {
              await sequelize.query(
                `INSERT INTO opcoes (id_pergunta, texto, correta, created_at, updated_at) 
                 VALUES ($1, $2, $3, NOW(), NOW())`,
                {
                  bind: [perguntaId[0].id, opcao.texto, opcao.correta || false],
                  type: sequelize.QueryTypes.INSERT,
                  transaction: t
                }
              );
            }
          }
        }
      }
      
      await t.commit();
      
      return res.status(201).json({
        message: 'Quiz criado com sucesso',
        id: quizId[0].id
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar quiz:', error);
    return res.status(500).json({ 
      message: 'Erro ao criar quiz',
      error: error.message 
    });
  }
};

const iniciarQuiz = async (req, res) => {
  try {
    const { id_quiz } = req.params;
    const id_utilizador = req.user.id_utilizador;
    
    // Verificar se o quiz existe
    const [quiz] = await sequelize.query(
      'SELECT * FROM quizzes WHERE id = $1',
      {
        bind: [id_quiz],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz não encontrado' });
    }
    
    // Verificar se o utilizador já iniciou este quiz
    const [respostaExistente] = await sequelize.query(
      'SELECT * FROM respostas_quiz WHERE id_quiz = $1 AND id_utilizador = $2 AND estado = $3',
      {
        bind: [id_quiz, id_utilizador, 'em_andamento'],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (respostaExistente) {
      return res.status(400).json({ 
        message: 'Você já iniciou este quiz',
        id_resposta: respostaExistente.id
      });
    }
    
    // Criar nova entrada para a resposta do quiz
    const [novaResposta] = await sequelize.query(
      `INSERT INTO respostas_quiz (id_quiz, id_utilizador, estado, pontuacao, data_inicio, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) RETURNING id`,
      {
        bind: [id_quiz, id_utilizador, 'em_andamento', 0],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    // Buscar a primeira pergunta do quiz
    const [primeiraPergunta] = await sequelize.query(
      'SELECT id, texto FROM perguntas WHERE id_quiz = $1 ORDER BY id ASC LIMIT 1',
      {
        bind: [id_quiz],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    return res.status(200).json({
      message: 'Quiz iniciado com sucesso',
      id_resposta: novaResposta[0].id,
      pergunta_atual: primeiraPergunta || null
    });
  } catch (error) {
    console.error('Erro ao iniciar quiz:', error);
    return res.status(500).json({ 
      message: 'Erro ao iniciar quiz',
      error: error.message 
    });
  }
};

const responderPergunta = async (req, res) => {
  try {
    const { id_resposta_quiz, id_pergunta, id_opcao } = req.body;
    const id_utilizador = req.user.id_utilizador;
    
    // Verificar se a resposta do quiz existe e pertence ao utilizador
    const [respostaQuiz] = await sequelize.query(
      'SELECT * FROM respostas_quiz WHERE id = $1 AND id_utilizador = $2',
      {
        bind: [id_resposta_quiz, id_utilizador],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!respostaQuiz) {
      return res.status(404).json({ message: 'Resposta de quiz não encontrada ou não pertence ao utilizador' });
    }
    
    if (respostaQuiz.estado !== 'em_andamento') {
      return res.status(400).json({ message: 'Este quiz já foi finalizado' });
    }
    
    // Verificar se a pergunta pertence ao quiz
    const [pergunta] = await sequelize.query(
      'SELECT * FROM perguntas WHERE id = $1 AND id_quiz = $2',
      {
        bind: [id_pergunta, respostaQuiz.id_quiz],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!pergunta) {
      return res.status(404).json({ message: 'Pergunta não encontrada ou não pertence a este quiz' });
    }
    
    // Verificar se a opção pertence à pergunta
    const [opcao] = await sequelize.query(
      'SELECT * FROM opcoes WHERE id = $1 AND id_pergunta = $2',
      {
        bind: [id_opcao, id_pergunta],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!opcao) {
      return res.status(404).json({ message: 'Opção não encontrada ou não pertence a esta pergunta' });
    }
    
    // Gravar resposta do utilizador
    await sequelize.query(
      `INSERT INTO respostas_pergunta (id_resposta_quiz, id_pergunta, id_opcao, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW())`,
      {
        bind: [id_resposta_quiz, id_pergunta, id_opcao],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    // Atualizar pontuação se a resposta estiver correta
    if (opcao.correta) {
      await sequelize.query(
        'UPDATE respostas_quiz SET pontuacao = pontuacao + $1 WHERE id = $2',
        {
          bind: [pergunta.pontos, id_resposta_quiz],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }
    
    // Buscar próxima pergunta
    const [proximaPergunta] = await sequelize.query(
      `SELECT p.id, p.texto 
       FROM perguntas p 
       WHERE p.id_quiz = $1 AND p.id > $2 
       AND NOT EXISTS (
         SELECT 1 FROM respostas_pergunta rp 
         WHERE rp.id_resposta_quiz = $3 AND rp.id_pergunta = p.id
       )
       ORDER BY p.id ASC LIMIT 1`,
      {
        bind: [respostaQuiz.id_quiz, id_pergunta, id_resposta_quiz],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    return res.status(200).json({
      message: 'Resposta registada com sucesso',
      correta: opcao.correta,
      proxima_pergunta: proximaPergunta || null,
      finalizado: !proximaPergunta
    });
  } catch (error) {
    console.error('Erro ao responder pergunta:', error);
    return res.status(500).json({ 
      message: 'Erro ao responder pergunta',
      error: error.message 
    });
  }
};

const finalizarQuiz = async (req, res) => {
  try {
    const { id_resposta } = req.params;
    const id_utilizador = req.user.id_utilizador;
    
    // Verificar se a resposta do quiz existe e pertence ao utilizador
    const [respostaQuiz] = await sequelize.query(
      'SELECT * FROM respostas_quiz WHERE id = $1 AND id_utilizador = $2',
      {
        bind: [id_resposta, id_utilizador],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!respostaQuiz) {
      return res.status(404).json({ message: 'Resposta de quiz não encontrada ou não pertence ao utilizador' });
    }
    
    if (respostaQuiz.estado !== 'em_andamento') {
      return res.status(400).json({ message: 'Este quiz já foi finalizado' });
    }
    
    // Atualizar estado da resposta do quiz
    await sequelize.query(
      'UPDATE respostas_quiz SET estado = $1, data_fim = NOW(), updated_at = NOW() WHERE id = $2',
      {
        bind: ['concluido', id_resposta],
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    // Buscar todas as respostas para calcular estatísticas
    const [respostas] = await sequelize.query(
      `SELECT rp.id_pergunta, p.texto as pergunta_texto, o.id as id_opcao, o.texto as opcao_texto, o.correta
       FROM respostas_pergunta rp
       JOIN perguntas p ON p.id = rp.id_pergunta
       JOIN opcoes o ON o.id = rp.id_opcao
       WHERE rp.id_resposta_quiz = $1`,
      {
        bind: [id_resposta],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // Calcular número de respostas corretas
    const totalPerguntas = await sequelize.query(
      'SELECT COUNT(*) FROM perguntas WHERE id_quiz = $1',
      {
        bind: [respostaQuiz.id_quiz],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const respostasCorretas = respostas.filter(r => r.correta).length;
    const totalPontos = respostaQuiz.pontuacao;
    
    return res.status(200).json({
      message: 'Quiz finalizado com sucesso',
      resultados: {
        pontuacao: totalPontos,
        respostas_corretas: respostasCorretas,
        total_perguntas: parseInt(totalPerguntas[0].count),
        percentual: Math.round((respostasCorretas / parseInt(totalPerguntas[0].count)) * 100)
      },
      respostas: respostas
    });
  } catch (error) {
    console.error('Erro ao finalizar quiz:', error);
    return res.status(500).json({ 
      message: 'Erro ao finalizar quiz',
      error: error.message 
    });
  }
};

// Exportar todas as funções requeridas pelas rotas
module.exports = {
  getAllQuizzes,
  createQuiz,
  getQuizById,
  iniciarQuiz,
  responderPergunta,
  finalizarQuiz
};