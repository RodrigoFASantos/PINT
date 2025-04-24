const InscricaoCursoCancelada = require("../database/models/InscricaoCursoCancelada");
const User = require("../database/models/User");
const Curso = require("../database/models/Curso");
const { Op, sequelize } = require("sequelize");

// Obter todas as inscrições canceladas
const getInscricoesCanceladas = async (req, res) => {
  try {
    // Verificar se o usuário é gestor
    if (req.user.id_cargo !== 1) {
      return res.status(403).json({
        message: "Você não tem permissão para acessar as inscrições canceladas"
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filtros opcionais
    const filtros = {};
    
    if (req.query.id_utilizador) {
      filtros.id_utilizador = req.query.id_utilizador;
    }
    
    if (req.query.id_curso) {
      filtros.id_curso = req.query.id_curso;
    }
    
    if (req.query.data_inicio && req.query.data_fim) {
      filtros.data_cancelamento = {
        [Op.between]: [new Date(req.query.data_inicio), new Date(req.query.data_fim)]
      };
    }

    const { count, rows } = await InscricaoCursoCancelada.findAndCountAll({
      where: filtros,
      limit,
      offset,
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ["id_utilizador", "nome", "email"]
        },
        {
          model: Curso,
          as: "curso",
          attributes: ["id_curso", "nome", "tipo"]
        }
      ],
      order: [["data_cancelamento", "DESC"]]
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      inscricoes: rows
    });
  } catch (error) {
    console.error("Erro ao buscar inscrições canceladas:", error);
    res.status(500).json({ message: "Erro no servidor ao obter inscrições canceladas" });
  }
};

// Obter uma inscrição cancelada específica
const getInscricaoCancelada = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inscricao = await InscricaoCursoCancelada.findByPk(id, {
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ["id_utilizador", "nome", "email"]
        },
        {
          model: Curso,
          as: "curso",
          attributes: ["id_curso", "nome", "tipo", "descricao"]
        }
      ]
    });

    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição cancelada não encontrada" });
    }

    // Verificar se o usuário é o dono da inscrição ou um gestor
    if (req.user.id_utilizador != inscricao.id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({ 
        message: "Você não tem permissão para visualizar esta inscrição cancelada" 
      });
    }

    res.json(inscricao);
  } catch (error) {
    console.error("Erro ao buscar inscrição cancelada:", error);
    res.status(500).json({ message: "Erro no servidor ao obter inscrição cancelada" });
  }
};

// Obter inscrições canceladas de um usuário específico
const getInscricoesCanceladasByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário é o próprio ou um gestor
    if (req.user.id_utilizador != userId && req.user.id_cargo !== 1) {
      return res.status(403).json({ 
        message: "Você não tem permissão para visualizar estas inscrições" 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await InscricaoCursoCancelada.findAndCountAll({
      where: { id_utilizador: userId },
      limit,
      offset,
      include: [
        {
          model: Curso,
          as: "curso",
          attributes: ["id_curso", "nome", "tipo", "descricao"]
        }
      ],
      order: [["data_cancelamento", "DESC"]]
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      inscricoes: rows
    });
  } catch (error) {
    console.error("Erro ao buscar inscrições canceladas do usuário:", error);
    res.status(500).json({ message: "Erro no servidor ao obter inscrições canceladas do usuário" });
  }
};

// Obter inscrições canceladas de um curso específico
const getInscricoesCanceladasByCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    
    // Verificar se o usuário é gestor ou formador do curso
    const curso = await Curso.findByPk(cursoId);
    
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }
    
    if (req.user.id_cargo !== 1 && req.user.id_utilizador != curso.id_formador) {
      return res.status(403).json({ 
        message: "Você não tem permissão para visualizar estas inscrições" 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await InscricaoCursoCancelada.findAndCountAll({
      where: { id_curso: cursoId },
      limit,
      offset,
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ["id_utilizador", "nome", "email"]
        }
      ],
      order: [["data_cancelamento", "DESC"]]
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      inscricoes: rows
    });
  } catch (error) {
    console.error("Erro ao buscar inscrições canceladas do curso:", error);
    res.status(500).json({ message: "Erro no servidor ao obter inscrições canceladas do curso" });
  }
};

// Obter estatísticas de cancelamentos
const getEstatisticasCancelamentos = async (req, res) => {
  try {
    // Verificar se o usuário é gestor
    if (req.user.id_cargo !== 1) {
      return res.status(403).json({
        message: "Você não tem permissão para acessar as estatísticas de cancelamentos"
      });
    }
    
    // Contagem total de cancelamentos
    const totalCancelamentos = await InscricaoCursoCancelada.count();
    
    // Cancelamentos por curso
    const cancelamentosPorCurso = await InscricaoCursoCancelada.findAll({
      attributes: ['id_curso', [sequelize.fn('COUNT', sequelize.col('id_cancelamento')), 'total']],
      include: [
        {
          model: Curso,
          as: "curso",
          attributes: ["nome"]
        }
      ],
      group: ['id_curso', 'curso.id_curso'],
      order: [[sequelize.literal('total'), 'DESC']],
      limit: 10
    });
    
    // Cancelamentos por mês (últimos 6 meses)
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 6);
    
    const cancelamentosPorMes = await InscricaoCursoCancelada.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('data_cancelamento')), 'mes'],
        [sequelize.fn('YEAR', sequelize.col('data_cancelamento')), 'ano'],
        [sequelize.fn('COUNT', sequelize.col('id_cancelamento')), 'total']
      ],
      where: {
        data_cancelamento: {
          [Op.gte]: dataLimite
        }
      },
      group: [
        sequelize.fn('MONTH', sequelize.col('data_cancelamento')),
        sequelize.fn('YEAR', sequelize.col('data_cancelamento'))
      ],
      order: [
        [sequelize.col('ano'), 'ASC'],
        [sequelize.col('mes'), 'ASC']
      ]
    });
    
    res.json({
      totalCancelamentos,
      cancelamentosPorCurso,
      cancelamentosPorMes
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas de cancelamentos:", error);
    res.status(500).json({ message: "Erro no servidor ao obter estatísticas de cancelamentos" });
  }
};

module.exports = {
  getInscricoesCanceladas,
  getInscricaoCancelada,
  getInscricoesCanceladasByUser,
  getInscricoesCanceladasByCurso,
  getEstatisticasCancelamentos
};