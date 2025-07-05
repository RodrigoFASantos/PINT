const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const Avaliacao = require("../../database/models/Avaliacao");
const Formando_Presenca = require("../../database/models/Formando_Presenca");
const Curso_Presenca = require("../../database/models/Curso_Presenca");
const { sequelize } = require("../../config/db");
const emailService = require('../../utils/emailService');

/**
 * CONTROLADORES PARA GESTÃO COMPLETA DE INSCRIÇÕES EM CURSOS
 * 
 * Este módulo centraliza todas as operações relacionadas com inscrições
 * de utilizadores em cursos, incluindo criação, cancelamento, consulta
 * e gestão de vagas. Suporta diferentes tipos de curso (síncronos/assíncronos)
 * com regras de negócio específicas para cada modalidade.
 */

// =============================================================================
// CONSULTA E LISTAGEM DE INSCRIÇÕES
// =============================================================================

/**
 * Obter lista completa de todas as inscrições do sistema
 * 
 * Retorna todas as inscrições registadas com informação
 * dos utilizadores e cursos associados para fins administrativos.
 */
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
    res.status(500).json({ message: "Erro ao procurar inscrições" });
  }
};

/**
 * Verificar se utilizador está inscrito num curso específico
 * 
 * Confirma o estado de inscrição de um utilizador autenticado
 * num curso particular, retornando detalhes da inscrição se existir.
 * Esta função é essencial para determinar permissões de acesso.
 */
const verificarInscricao = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const id_utilizador = req.user.id_utilizador;

    if (!id_curso) {
      return res.status(400).json({ message: "ID do curso é obrigatório" });
    }

    // Procurar inscrição ativa do utilizador no curso
    const inscricao = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso,
        estado: "inscrito"
      }
    });

    return res.json({
      inscrito: !!inscricao,
      inscricao: inscricao ? {
        id: inscricao.id_inscricao,
        data_inscricao: inscricao.data_inscricao
      } : null
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao verificar inscrição",
      error: error.message
    });
  }
};

/**
 * Obter inscrições de um curso específico
 * 
 * Lista todos os utilizadores inscritos num curso particular.
 * Acesso restrito ao formador do curso ou administradores.
 */
const getInscricoesPorCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar permissões de acesso
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
    res.status(500).json({ message: "Erro ao procurar inscrições do curso" });
  }
};

/**
 * Obter histórico completo de inscrições do utilizador autenticado
 * 
 * Retorna todas as inscrições do utilizador atual com detalhes
 * dos cursos, incluindo informações de avaliação e progresso.
 * Calcula automaticamente as horas de presença quando necessário.
 */
const getMinhasInscricoes = async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador },
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
          ]
        },
        {
          model: Avaliacao,
          as: "avaliacao", 
          required: false,
          attributes: ['nota', 'horas_presenca', 'certificado', 'horas_totais']
        }
      ],
      order: [['data_inscricao', 'DESC']]
    });

    // Processar dados para formato do frontend
    const inscricoesFormatadas = await Promise.all(
      inscricoes.map(async (inscricao) => {
        const curso = inscricao.curso;
        const avaliacao = inscricao.avaliacao;

        // Calcular horas de presença se não estiver na avaliação
        let horasPresenca = avaliacao?.horas_presenca || 0;
        
        if (!horasPresenca || horasPresenca === 0) {
          try {
            // Buscar presenças do curso
            const presencasCurso = await Curso_Presenca.findAll({
              where: { id_curso: curso.id_curso }
            });

            const idsPresencasCurso = presencasCurso.map(p => p.id_curso_presenca);

            if (idsPresencasCurso.length > 0) {
              // Calcular horas totais de presença do utilizador
              const resultado = await sequelize.query(`
                SELECT COALESCE(SUM(fp.duracao), 0) as total 
                FROM formando_presenca fp 
                WHERE fp.id_curso_presenca IN (?) AND fp.id_utilizador = ?
              `, {
                replacements: [idsPresencasCurso, id_utilizador],
                type: sequelize.QueryTypes.SELECT
              });

              if (resultado && resultado[0]) {
                horasPresenca = Number(resultado[0].total) || 0;
              }
            }
          } catch (presencaError) {
            horasPresenca = 0;
          }
        }

        // Determinar status do curso baseado na avaliação
        let status = inscricao.estado || 'Inscrito';
        
        if (avaliacao && avaliacao.nota !== null && avaliacao.nota !== undefined) {
          status = 'Concluído';
        }

        return {
          cursoId: curso.id_curso,
          nomeCurso: curso.nome,
          categoria: curso.categoria?.nome || 'Não especificada',
          area: curso.area?.nome || 'Não especificada',
          dataInicio: curso.data_inicio,
          dataFim: curso.data_fim,
          cargaHoraria: curso.duracao,
          horasPresenca: horasPresenca,
          notaFinal: avaliacao?.nota || null,
          status: status,
          imagem_path: curso.imagem_path
        };
      })
    );

    res.json(inscricoesFormatadas);
    
  } catch (error) {
    res.status(500).json({ 
      message: "Erro ao buscar inscrições", 
      error: error.message 
    });
  }
};

// =============================================================================
// CRIAÇÃO E GESTÃO DE INSCRIÇÕES
// =============================================================================

/**
 * Criar nova inscrição em curso
 * 
 * Processa inscrição de utilizador em curso disponível,
 * incluindo validações de vagas, datas e permissões.
 * Suporta auto-inscrição e inscrições administrativas.
 */
const createInscricao = async (req, res) => {
  try {
    const { id_utilizador, id_curso, motivacao, expectativas } = req.body;

    // Determinar utilizador para inscrição
    const utilizadorParaInscrever = id_utilizador || req.user.id_utilizador;

    // Verificar permissões de inscrição
    if (req.user.id_cargo !== 1 && utilizadorParaInscrever != req.user.id_utilizador) {
      return res.status(403).json({
        message: "Não pode inscrever outros utilizadores em cursos"
      });
    }

    if (!utilizadorParaInscrever || !id_curso) {
      return res.status(400).json({
        message: "ID do utilizador e ID do curso são obrigatórios"
      });
    }

    // Verificar se já está inscrito
    const inscricaoExistente = await Inscricao_Curso.findOne({
      where: {
        id_utilizador: utilizadorParaInscrever,
        id_curso,
        estado: "inscrito"
      }
    });

    if (inscricaoExistente) {
      return res.status(400).json({
        message: "Já está inscrito neste curso"
      });
    }

    // Obter e validar dados do curso
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    if (!curso.ativo) {
      return res.status(400).json({
        message: "Este curso não está disponível para inscrições"
      });
    }

    // Verificar período de inscrição
    const dataAtual = new Date();
    if (dataAtual > new Date(curso.data_inicio)) {
      return res.status(400).json({
        message: "O período de inscrição deste curso já encerrou"
      });
    }

    // Gestão de vagas para cursos síncronos
    if (curso.tipo === "sincrono" && curso.vagas) {
      if (curso.vagas <= 0) {
        return res.status(400).json({
          message: "Não há vagas disponíveis para este curso"
        });
      }

      // Decrementar vagas disponíveis
      curso.vagas = curso.vagas - 1;
      await curso.save();
    }

    // Criar nova inscrição
    const novaInscricao = await Inscricao_Curso.create({
      id_utilizador: utilizadorParaInscrever,
      id_curso,
      motivacao: motivacao || null,
      expectativas: expectativas || null,
      data_inscricao: new Date(),
      estado: "inscrito"
    });

    // Preparar dados para notificação por email
    const utilizador = await User.findByPk(utilizadorParaInscrever);
    const cursoCompleto = await Curso.findByPk(id_curso, {
      include: [
        { model: User, as: 'formador', attributes: ['nome', 'email'] }
      ]
    });

    // Enviar email de confirmação (não falha a inscrição se houver erro)
    try {
      await emailService.sendCourseInscricaoEmail(utilizador, cursoCompleto);
    } catch (emailError) {
      // Email é opcional - continua mesmo com erro
    }

    res.status(201).json({
      message: "Inscrição realizada com sucesso!",
      inscricao: novaInscricao,
      vagasRestantes: curso.vagas
    });

  } catch (error) {
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

/**
 * Cancelar inscrição em curso
 * 
 * Processa cancelamento de inscrição com regras específicas
 * para diferentes tipos de utilizador e estados de curso.
 * Atualiza automaticamente as vagas disponíveis.
 */
const cancelarInscricao = async (req, res) => {
  let transaction;

  try {
    const { id } = req.params;
    const { motivo_cancelamento } = req.body;

    // Verificar estado da conexão com base de dados
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro de autenticação com a base de dados",
        details: dbError.message
      });
    }

    // Procurar inscrição a cancelar
    let inscricao;
    try {
      inscricao = await Inscricao_Curso.findByPk(id);
    } catch (findError) {
      return res.status(500).json({
        message: "Erro ao procurar dados da inscrição",
        error: findError.message
      });
    }

    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    // Verificar permissões para cancelamento
    let curso;
    try {
      curso = await Curso.findByPk(inscricao.id_curso);
    } catch (findCursoError) {
      return res.status(500).json({
        message: "Erro ao verificar permissões",
        error: findCursoError.message
      });
    }
    
    const isAdmin = req.user.id_cargo === 1;
    const isFormadorDoCurso = req.user.id_cargo === 2 && curso && req.user.id_utilizador === curso.id_formador;

    if (!isAdmin && !isFormadorDoCurso) {
      return res.status(403).json({
        message: "Apenas administradores e formadores do curso podem cancelar inscrições"
      });
    }

    // Verificar se já foi cancelada
    if (inscricao.estado === "cancelado") {
      return res.status(400).json({
        message: "Esta inscrição já foi cancelada anteriormente."
      });
    }

    // Iniciar transação para garantir consistência
    try {
      transaction = await sequelize.transaction();
    } catch (transactionError) {
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro ao iniciar transação",
        details: transactionError.message
      });
    }

    try {
      // Atualizar estado da inscrição
      inscricao.estado = "cancelado";
      inscricao.motivo_cancelamento = motivo_cancelamento;
      inscricao.data_cancelamento = new Date();

      await inscricao.save({ transaction });

      // Atualizar vagas do curso se aplicável
      curso = await Curso.findByPk(inscricao.id_curso, { transaction });

      if (curso && curso.vagas !== null) {
        curso.vagas += 1;
        await curso.save({ transaction });
      }

      // Confirmar transação
      await transaction.commit();

      // Notificação via WebSocket se disponível
      if (req.io) {
        req.io.to(`user_${inscricao.id_utilizador}`).emit('inscricao_cancelada', {
          message: `A sua inscrição no curso "${curso ? curso.nome : 'ID: ' + inscricao.id_curso}" foi cancelada.`,
          id_inscricao: inscricao.id_inscricao
        });
      }

      return res.json({
        message: "Inscrição cancelada com sucesso",
        inscricao_cancelada_id: inscricao.id_inscricao
      });

    } catch (error) {
      // Reverter transação em caso de erro
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          // Falha no rollback é registada mas não impede resposta
        }
      }
      throw error;
    }

  } catch (error) {
    if (error.name && error.name.includes('SequelizeConnection')) {
      return res.status(503).json({
        message: "Serviço temporariamente indisponível. Problemas com a base de dados.",
        error: "Erro de conexão com a base de dados",
        details: error.message
      });
    }

    if (error.name && error.name.includes('Sequelize')) {
      return res.status(500).json({
        message: "Erro ao processar cancelamento de inscrição",
        error: "Erro da base de dados",
        details: error.message,
        type: error.name
      });
    }

    return res.status(500).json({
      message: "Erro ao processar cancelamento de inscrição",
      error: error.message
    });
  }
};

/**
 * Obter inscrições do utilizador autenticado com filtros
 * 
 * Lista inscrições ativas do utilizador atual com possibilidade
 * de filtrar por estado, tipo de curso ou período.
 */
const getInscricoesUtilizador = async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;

    // Procurar inscrições ativas
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_utilizador,
        estado: 'inscrito'
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
            'id_curso', 'nome', 'id_categoria', 'id_area',
            'data_inicio', 'data_fim', 'tipo', 'vagas'
          ]
        }
      ],
      order: [['data_inscricao', 'DESC']]
    });

    // Formatar dados para resposta
    const inscricoesFormatadas = inscricoes.map(inscricao => {
      const curso = inscricao.curso;
      return {
        id: inscricao.id_inscricao,
        cursoId: curso.id_curso,
        nomeCurso: curso.nome,
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
    res.status(500).json({
      message: "Erro ao procurar inscrições",
      error: error.message
    });
  }
};

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Calcular status atual de um curso baseado nas datas
 * 
 * Determina se o curso está agendado, em curso ou terminado
 * baseado na comparação com a data atual.
 */
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

/**
 * Remover todas as inscrições relacionadas a um curso específico
 * 
 * Função auxiliar para limpeza em cascata quando um curso é eliminado.
 * Utilizada internamente por outros controladores.
 */
const removerInscricoesDoCurso = async (id_curso, transaction) => {
  try {
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      transaction
    });

    await Inscricao_Curso.destroy({
      where: { id_curso },
      transaction
    });

    return inscricoes.length;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getMinhasInscricoes,
  getAllInscricoes,
  getInscricoesPorCurso,
  createInscricao,
  cancelarInscricao,
  getInscricoesUtilizador,
  removerInscricoesDoCurso,
  verificarInscricao
};