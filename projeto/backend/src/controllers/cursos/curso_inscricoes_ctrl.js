const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const { sequelize } = require("../../config/db");


// Obter todas as inscrições
const getAllInscricoes = async (req, res) => {
  try {
    const inscricoes = await Inscricao_Curso.findAll({
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email']
        },
        {
          model: Curso,
          as: "curso",
          attributes: ['id_curso', 'nome', 'tipo']
        }
      ]
    });
    res.json(inscricoes);
  } catch (error) {
    console.error("Erro ao procurar inscrições:", error);
    res.status(500).json({ message: "Erro ao procurar inscrições" });
  }
};

// Função para verificar se um utilizador está inscrito num curso específico
const verificarInscricao = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const id_utilizador = req.user.id_utilizador;

    if (!id_curso) {
      return res.status(400).json({ message: "ID do curso é obrigatório" });
    }

    // Procurar inscrição ativa do utilizador no curso específico
    const inscricao = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso,
        estado: "inscrito" // Apenas inscrições ativas
      }
    });

    // Retornar se o utilizador está inscrito ou não
    return res.json({
      inscrito: !!inscricao,
      inscricao: inscricao ? {
        id: inscricao.id_inscricao,
        data_inscricao: inscricao.data_inscricao
      } : null
    });
  } catch (error) {
    console.error("Erro ao verificar inscrição:", error);
    res.status(500).json({
      message: "Erro ao verificar inscrição",
      error: error.message
    });
  }
};

// Obter inscrições de um curso específico (apenas para gestores ou formador)
const getInscricoesPorCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    if (req.user.id_cargo !== 1 && req.user.id_utilizador !== curso.id_formador) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso, estado: "inscrito" },
      include: [
        { model: User, as: "utilizador", attributes: ["id_utilizador", "nome", "email"] }
      ],
      order: [["data_inscricao", "DESC"]]
    });

    res.json(inscricoes);
  } catch (error) {
    console.error("Erro ao procurar inscrições do curso:", error);
    res.status(500).json({ message: "Erro ao procurar inscrições do curso" });
  }
};



// Criar uma nova inscrição
const createInscricao = async (req, res) => {
  try {
    const { id_utilizador, id_curso, motivacao, expectativas } = req.body;

    // Verificações de permissão e dados
    if (req.user.id_utilizador != id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({
        message: "Não pode inscrever outros utilizadores em cursos"
      });
    }

    if (!id_utilizador || !id_curso) {
      return res.status(400).json({
        message: "ID do utilizador e ID do curso são obrigatórios"
      });
    }

    // Verificar se já está inscrito
    const inscricaoExistente = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso,
        estado: "inscrito"
      }
    });

    if (inscricaoExistente) {
      return res.status(400).json({
        message: "Já está inscrito neste curso"
      });
    }

    // Obter detalhes do curso e atualizar vagas
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificações do curso
    if (!curso.ativo) {
      return res.status(400).json({
        message: "Este curso não está disponível para inscrições"
      });
    }

    // Verificar data
    const dataAtual = new Date();
    if (dataAtual > new Date(curso.data_inicio)) {
      return res.status(400).json({
        message: "O período de inscrição deste curso já encerrou"
      });
    }

    // Atualizar vagas se necessário
    if (curso.tipo === "sincrono" && curso.vagas) {
      if (curso.vagas <= 0) {
        return res.status(400).json({
          message: "Não há vagas disponíveis para este curso"
        });
      }

      // Atualizar vagas
      curso.vagas = curso.vagas - 1;
      await curso.save();
    }

    // Criar inscrição
    const novaInscricao = await Inscricao_Curso.create({
      id_utilizador,
      id_curso,
      motivacao: motivacao || null,
      expectativas: expectativas || null,
      data_inscricao: new Date(),
      estado: "inscrito"
    });

    // Resposta
    res.status(201).json({
      message: "Inscrição realizada com sucesso!",
      inscricao: novaInscricao,
      vagasRestantes: curso.vagas
    });

  } catch (error) {
    console.error("Erro ao criar inscrição:", error);

    // Verificar erro de conexão
    if (error.name?.includes('SequelizeConnection')) {
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro de conexão com a base de dados"
      });
    }

    res.status(500).json({
      message: "Erro no servidor ao processar inscrição.",
      error: error.message
    });
  }
};

const cancelarInscricao = async (req, res) => {
  let transaction;

  console.log("=== INÍCIO DA FUNÇÃO CANCELAR INSCRIÇÃO ===");
  console.log(`Data e hora: ${new Date().toISOString()}`);
  console.log(`Requisição recebida: ${JSON.stringify({
    params: req.params,
    body: req.body,
    user: req.user
  }, null, 2)}`);

  try {
    // Obter ID da inscrição e motivo do cancelamento
    const { id } = req.params;
    const { motivo_cancelamento } = req.body;

    console.log(`[1] Parâmetros extraídos:`);
    console.log(`- ID da inscrição: ${id}`);
    console.log(`- Motivo do cancelamento: ${motivo_cancelamento}`);

    // Verificar estado da conexão com a base de dados
    console.log("[2] A verificar estado da conexão com a base de dados...");
    try {
      await sequelize.authenticate();
      console.log("[2.1] Conexão com a base de dados está OK");
    } catch (dbError) {
      console.error("[2.2] ERRO na verificação da conexão:", dbError);
      console.error("Detalhes completos do erro:", JSON.stringify(dbError, null, 2));
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro de autenticação com a base de dados",
        details: dbError.message
      });
    }

    // Verificar configuração do Sequelize
    console.log("[3] A verificar configuração do Sequelize:");
    console.log(`- Dialeto: ${sequelize.getDialect()}`);
    console.log(`- Host: ${sequelize.config.host}`);
    console.log(`- Porta: ${sequelize.config.port}`);
    console.log(`- Base de dados: ${sequelize.config.database}`);
    console.log(`- Utilizador: ${sequelize.config.username}`);

    // Procurar inscrição com todos os detalhes necessários
    console.log(`[4] Procurar inscrição com ID ${id}...`);
    let inscricao;
    try {
      inscricao = await Inscricao_Curso.findByPk(id);
      console.log(`[4.1] Resultado da procura: ${inscricao ? "Encontrado" : "Não encontrado"}`);
      if (inscricao) {
        console.log(`- ID da inscrição: ${inscricao.id_inscricao}`);
        console.log(`- ID do utilizador: ${inscricao.id_utilizador}`);
        console.log(`- ID do curso: ${inscricao.id_curso}`);
        console.log(`- Estado atual: ${inscricao.estado}`);
        console.log(`- Data de inscrição: ${inscricao.data_inscricao}`);
      }
    } catch (findError) {
      console.error("[4.2] ERRO ao procurar inscrição:", findError);
      console.error("Detalhes completos do erro:", JSON.stringify(findError, null, 2));
      return res.status(500).json({
        message: "Erro ao procurar dados da inscrição",
        error: findError.message,
        details: JSON.stringify(findError)
      });
    }

    if (!inscricao) {
      console.log(`[5] Inscrição ID ${id} não encontrada`);
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    // Verificar permissão
    console.log(`[6] A verificar permissões...`);
    console.log(`- ID do utilizador requisitante: ${req.user.id_utilizador}`);
    console.log(`- ID do cargo do utilizador: ${req.user.id_cargo}`);
    console.log(`- ID do utilizador da inscrição: ${inscricao.id_utilizador}`);


    // Procurar o curso para verificar se o utilizador é o formador
    let curso;
    try {
      curso = await Curso.findByPk(inscricao.id_curso);
    } catch (findCursoError) {
      console.error("Erro ao procurar curso:", findCursoError);
      return res.status(500).json({
        message: "Erro ao verificar permissões",
        error: findCursoError.message
      });
    }
    // Verificar permissões: admin (cargo 1), formador do curso, ou o próprio inscrito
    const isAdmin = req.user.id_cargo === 1;
    const isFormadorDoCurso = req.user.id_cargo === 2 && curso && req.user.id_utilizador === curso.id_formador;
    const isProprioUtilizador = req.user.id_utilizador === inscricao.id_utilizador;

    if (!isAdmin && !isFormadorDoCurso && !isProprioUtilizador) {
      console.log(`[6.1] Acesso negado: Utilizador ${req.user.id_utilizador} a tentar cancelar inscrição de ${inscricao.id_utilizador}`);
      return res.status(403).json({
        message: "Não tem permissão para cancelar esta inscrição"
      });
    }
    console.log(`[6.2] Verificação de permissão bem-sucedida`);

    if (req.user.id_utilizador !== inscricao.id_utilizador && req.user.id_cargo !== 1) {
      console.log(`[6.1] Acesso negado: Utilizador ${req.user.id_utilizador} a tentar cancelar inscrição de ${inscricao.id_utilizador}`);
      return res.status(403).json({
        message: "Não tem permissão para cancelar esta inscrição"
      });
    }
    console.log(`[6.2] Verificação de permissão bem-sucedida`);

    // Verificar se já foi cancelada
    console.log(`[7] A verificar se a inscrição já foi cancelada...`);
    if (inscricao.estado === "cancelado") {
      console.log(`[7.1] Inscrição ID ${id} já foi cancelada anteriormente`);
      return res.status(400).json({
        message: "Esta inscrição já foi cancelada anteriormente."
      });
    }
    console.log(`[7.2] Verificação de estado bem-sucedida: inscrição não cancelada`);

    // Iniciar transação
    console.log("[8] A tentar iniciar transação...");
    try {
      transaction = await sequelize.transaction();
      console.log("[8.1] Transação iniciada com sucesso");
    } catch (transactionError) {
      console.error("[8.2] ERRO ao iniciar transação:", transactionError);
      console.error("Detalhes completos do erro:", JSON.stringify(transactionError, null, 2));
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro ao iniciar transação",
        details: transactionError.message
      });
    }

    try {
      // PARTE 1: Atualizar o estado da inscrição para "cancelado"
      console.log("[9] A atualizar estado da inscrição...");
      console.log(`- Estado anterior: ${inscricao.estado}`);
      console.log(`- Motivo do cancelamento: ${motivo_cancelamento}`);
      console.log(`- Data de cancelamento: ${new Date().toISOString()}`);

      try {
        inscricao.estado = "cancelado";
        inscricao.motivo_cancelamento = motivo_cancelamento;
        inscricao.data_cancelamento = new Date();

        await inscricao.save({ transaction });
        console.log("[9.1] Inscrição atualizada com sucesso");
      } catch (saveError) {
        console.error("[9.2] ERRO ao guardar inscrição:", saveError);
        console.error("Detalhes completos do erro:", JSON.stringify(saveError, null, 2));
        throw saveError;
      }

      // PARTE 2: Atualizar vagas do curso
      console.log(`[10] Procurar curso com ID ${inscricao.id_curso}...`);
      let curso;
      try {
        curso = await Curso.findByPk(inscricao.id_curso, { transaction });
        console.log(`[10.1] Resultado da procura: ${curso ? "Encontrado" : "Não encontrado"}`);
        if (curso) {
          console.log(`- ID do curso: ${curso.id_curso}`);
          console.log(`- Nome do curso: ${curso.nome}`);
          console.log(`- Vagas atuais: ${curso.vagas}`);
        }
      } catch (findCursoError) {
        console.error("[10.2] ERRO ao procurar curso:", findCursoError);
        console.error("Detalhes completos do erro:", JSON.stringify(findCursoError, null, 2));
        throw findCursoError;
      }

      if (curso && curso.vagas !== null) {
        console.log(`[11] A atualizar vagas do curso ${curso.id_curso}...`);
        console.log(`- Vagas antes: ${curso.vagas}`);
        console.log(`- Vagas depois: ${curso.vagas + 1}`);

        try {
          curso.vagas += 1;
          await curso.save({ transaction });
          console.log("[11.1] Vagas do curso atualizadas com sucesso");
        } catch (saveCursoError) {
          console.error("[11.2] ERRO ao guardar curso:", saveCursoError);
          console.error("Detalhes completos do erro:", JSON.stringify(saveCursoError, null, 2));
          throw saveCursoError;
        }
      } else {
        console.log(`[11.3] Vagas do curso não atualizadas: ${!curso ? "Curso não encontrado" : "Vagas é null"}`);
      }

      // Confirmar transação
      console.log("[12] A tentar confirmar transação...");
      try {
        await transaction.commit();
        console.log("[12.1] Transação confirmada com sucesso");
      } catch (commitError) {
        console.error("[12.2] ERRO ao confirmar transação:", commitError);
        console.error("Detalhes completos do erro:", JSON.stringify(commitError, null, 2));
        throw commitError;
      }

      // WebSocket (fora da transação)
      console.log("[13] A verificar disponibilidade do WebSocket...");
      if (req.io) {
        console.log(`[13.1] A enviar notificação WebSocket para user_${inscricao.id_utilizador}`);
        req.io.to(`user_${inscricao.id_utilizador}`).emit('inscricao_cancelada', {
          message: `A sua inscrição no curso "${curso ? curso.nome : 'ID: ' + inscricao.id_curso}" foi cancelada com sucesso.`,
          id_inscricao: inscricao.id_inscricao
        });
        console.log("[13.2] Notificação WebSocket enviada");
      } else {
        console.log("[13.3] WebSocket não disponível (req.io é undefined ou null)");
      }

      console.log("[14] A enviar resposta de sucesso");
      return res.json({
        message: "Inscrição cancelada com sucesso",
        inscricao_cancelada_id: inscricao.id_inscricao
      });

    } catch (error) {
      // Reverter a transação em caso de erro
      console.error("[15] ERRO durante o processamento:", error);
      console.error("Tipo de erro:", error.name);
      console.error("Mensagem de erro:", error.message);
      console.error("Stack trace:", error.stack);
      console.error("Detalhes completos do erro:", JSON.stringify(error, null, 2));

      if (transaction) {
        console.log("[15.1] A reverter transação...");
        try {
          await transaction.rollback();
          console.log("[15.2] Transação revertida com sucesso");
        } catch (rollbackError) {
          console.error("[15.3] ERRO ao reverter transação:", rollbackError);
          console.error("Detalhes completos do erro de rollback:", JSON.stringify(rollbackError, null, 2));
        }
      }
      throw error;
    }

  } catch (error) {
    console.error("[16] ERRO geral ao cancelar inscrição:", error);
    console.error("Tipo de erro:", error.name);
    console.error("Mensagem de erro:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("Detalhes completos do erro geral:", JSON.stringify(error, null, 2));

    // Verificar erro de conexão
    if (error.name && error.name.includes('SequelizeConnection')) {
      console.log("[16.1] Detetado erro de conexão com a base de dados");
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro de conexão com a base de dados",
        details: error.message
      });
    }

    // Verificar se é erro do Sequelize
    if (error.name && error.name.includes('Sequelize')) {
      console.log(`[16.2] Detetado erro do Sequelize: ${error.name}`);
      return res.status(500).json({
        message: "Erro ao processar cancelamento de inscrição",
        error: "Erro da base de dados",
        details: error.message,
        type: error.name
      });
    }

    console.log("[16.3] A enviar resposta de erro geral");
    return res.status(500).json({
      message: "Erro ao processar cancelamento de inscrição",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    console.log("=== FIM DA FUNÇÃO CANCELAR INSCRIÇÃO ===");
  }
};

// Procurar inscrições do utilizador autenticado
const getInscricoesUtilizador = async (req, res) => {
  try {
    // Usar o ID do utilizador do token
    const id_utilizador = req.user.id_utilizador;

    // Procurar todas as inscrições do utilizador
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_utilizador,
        estado: 'inscrito' // Apenas inscrições ativas
      },
      include: [
        {
          model: Curso,
          as: "curso",
          include: [
            {
              model: Categoria,
              as: "categoria",
              attributes: ['nome']
            },
            {
              model: Area,
              as: "area",
              attributes: ['nome']
            }
          ],
          attributes: [
            'id_curso',
            'nome',
            'id_categoria',
            'id_area',
            'data_inicio',
            'data_fim',
            'tipo',
            'vagas'
          ]
        }
      ],
      order: [['data_inscricao', 'DESC']]
    });

    // Mapear para um formato mais amigável
    const inscricoesFormatadas = inscricoes.map(inscricao => {
      const curso = inscricao.curso;
      return {
        id: inscricao.id_inscricao,
        cursoId: curso.id_curso,
        nomeCurso: curso.nome,
        // Agora obtemos os nomes da categoria e área através das relações
        categoria: curso.categoria ? curso.categoria.nome : "N/A",
        area: curso.area ? curso.area.nome : "N/A",
        dataInicio: curso.data_inicio,
        dataFim: curso.data_fim,
        tipoCurso: curso.tipo,
        vagasTotais: curso.vagas,
        dataInscricao: inscricao.data_inscricao,
        status: calcularStatusCurso(curso)
      };
    });

    res.json(inscricoesFormatadas);
  } catch (error) {
    console.error("Erro ao procurar inscrições do utilizador:", error);
    res.status(500).json({
      message: "Erro ao procurar inscrições",
      error: error.message
    });
  }
};

// Função auxiliar para calcular o estado do curso
function calcularStatusCurso(curso) {
  const hoje = new Date();
  const dataInicio = new Date(curso.data_inicio);
  const dataFim = new Date(curso.data_fim);

  if (hoje < dataInicio) {
    return "Agendado";
  } else if (hoje >= dataInicio && hoje <= dataFim) {
    return "Em curso";
  } else {
    return "Terminado";
  }
}

// Método para remover todas as inscrições relacionadas a um curso específico
const removerInscricoesDoCurso = async (id_curso, transaction) => {
  try {
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      transaction
    });

    // Remover todas as inscrições relacionadas ao curso
    await Inscricao_Curso.destroy({
      where: { id_curso },
      transaction
    });

    return inscricoes.length; // Retorna o número de inscrições removidas
  } catch (error) {
    console.error(`Erro ao remover inscrições do curso ${id_curso}:`, error);
    throw error;
  }
};

module.exports = {
  getAllInscricoes,
  getInscricoesPorCurso,
  createInscricao,
  cancelarInscricao,
  getInscricoesUtilizador,
  removerInscricoesDoCurso,
  verificarInscricao
};