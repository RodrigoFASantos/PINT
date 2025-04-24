const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const InscricaoCursoCancelada = require("../../database/models/InscricaoCursoCancelada");
const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const { sendEnrollmentEmail } = require("../../utils/emailService");
const { sequelize } = require("../../../config/db");

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
    console.error("Erro ao buscar inscrições:", error);
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
};

// Função para verificar se um user está inscrito em um curso específico
const verificarInscricao = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const id_utilizador = req.user.id_utilizador;

    if (!id_curso) {
      return res.status(400).json({ message: "ID do curso é obrigatório" });
    }

    // Buscar inscrição ativa do usuário no curso específico
    const inscricao = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso,
        estado: "inscrito" // Apenas inscrições ativas
      }
    });

    // Retornar se o usuário está inscrito ou não
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

// Criar uma nova inscrição
const createInscricao = async (req, res) => {
  try {
    const { id_utilizador, id_curso, motivacao, expectativas } = req.body;

    // Verificações de permissão e dados
    if (req.user.id_utilizador != id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({ 
        message: "Você não pode inscrever outros usuários em cursos" 
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
        message: "Você já está inscrito neste curso" 
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
        message: "Serviço temporariamente indisponível. Problemas com o banco de dados.",
        error: "Erro de conexão com o banco de dados"
      });
    }
    
    res.status(500).json({ 
      message: "Erro no servidor ao processar inscrição.",
      error: error.message 
    });
  }
};

// Cancelar uma inscrição
const cancelarInscricao = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_cancelamento } = req.body; // Opcional: motivo do cancelamento
    
    const inscricao = await Inscricao_Curso.findByPk(id);

    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    // Verificar se o usuário é o dono da inscrição ou um gestor
    if (req.user.id_utilizador != inscricao.id_utilizador && req.user.id_cargo !== 1) {
      return res.status(403).json({ 
        message: "Você não tem permissão para cancelar esta inscrição" 
      });
    }

    // Iniciar transação para garantir a consistência dos dados
    const t = await sequelize.transaction();

    try {
      // Criar entrada na tabela de inscrições canceladas
      await InscricaoCursoCancelada.create({
        // Não definimos id_cancelamento pois é autoincrement
        id_inscricao_original: inscricao.id_inscricao,
        id_utilizador: inscricao.id_utilizador,
        id_curso: inscricao.id_curso,
        data_inscricao: inscricao.data_inscricao,
        data_cancelamento: new Date(),
        estado: "cancelado",
        motivacao: inscricao.motivacao,
        expectativas: inscricao.expectativas,
        nota_final: inscricao.nota_final,
        certificado_gerado: inscricao.certificado_gerado,
        horas_presenca: inscricao.horas_presenca,
        motivo_cancelamento: motivo_cancelamento || null
      }, { transaction: t });

      // Excluir a inscrição original
      await inscricao.destroy({ transaction: t });

      // Commit da transação
      await t.commit();

      // Caso o curso tenha limite de vagas, notificar usuários em lista de espera
      const curso = await Curso.findByPk(inscricao.id_curso);
      if (curso && curso.vagas !== null) {
        // Incrementar vaga disponível
        curso.vagas = curso.vagas + 1;
        await curso.save();
      }

      // Notificar o usuário via WebSocket (se disponível)
      if (req.io) {
        req.io.to(`user_${inscricao.id_utilizador}`).emit('inscricao_cancelada', {
          message: `Sua inscrição no curso "${curso ? curso.nome : 'ID: ' + inscricao.id_curso}" foi cancelada com sucesso.`,
          id_inscricao: id
        });
      }

      res.json({ 
        message: "Inscrição cancelada com sucesso",
        inscricao_cancelada_id: id
      });
    } catch (error) {
      // Em caso de erro, reverter a transação
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    res.status(500).json({ message: "Erro no servidor ao cancelar inscrição" });
  }
};

// Buscar inscrições do utilizador logado
const getInscricoesUtilizador = async (req, res) => {
  try {
    // Usar o ID do utilizador do token
    const id_utilizador = req.user.id_utilizador;

    // Buscar todas as inscrições do utilizador
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
    console.error("Erro ao buscar inscrições do utilizador:", error);
    res.status(500).json({ 
      message: "Erro ao buscar inscrições", 
      error: error.message 
    });
  }
};

// Função auxiliar para calcular o status do curso
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

module.exports = { getAllInscricoes, createInscricao, cancelarInscricao, getInscricoesUtilizador, removerInscricoesDoCurso, verificarInscricao };