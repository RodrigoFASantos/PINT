const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const User = require("../database/models/User");
const Curso = require("../database/models/Curso");
const { sendEnrollmentEmail } = require("../utils/emailService");
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
    console.error("Erro ao buscar inscrições:", error);
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
};

// Criar uma nova inscrição
const createInscricao = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id_utilizador, id_curso, motivacao, expectativas } = req.body;

    // Verificar se o usuário é quem diz ser (através do token)
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

    // Verificar se o usuário já está inscrito neste curso
    const inscricaoExistente = await Inscricao_Curso.findOne({
      where: {
        id_utilizador,
        id_curso,
        estado: "inscrito" // Apenas considerar inscrições ativas
      },
      transaction
    });

    if (inscricaoExistente) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Você já está inscrito neste curso" 
      });
    }

    // Obter detalhes do curso
    const curso = await Curso.findByPk(id_curso, { transaction });
    
    if (!curso) {
      await transaction.rollback();
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se o curso está ativo
    if (!curso.ativo) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Este curso não está disponível para inscrições" 
      });
    }

    // Verificar se o curso está em período de inscrição
    const dataAtual = new Date();
    if (dataAtual > new Date(curso.data_inicio)) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "O período de inscrição deste curso já encerrou" 
      });
    }

    // Se for curso síncrono, verificar se há vagas disponíveis
    if (curso.tipo === "sincrono" && curso.vagas) {
      // Contar inscrições atuais
      const inscricoesCount = await Inscricao_Curso.count({
        where: {
          id_curso,
          estado: "inscrito"
        },
        transaction
      });

      if (inscricoesCount >= curso.vagas) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: "Não há vagas disponíveis para este curso" 
        });
      }
    }

    // Criar a inscrição
    const novaInscricao = await Inscricao_Curso.create({
      id_utilizador,
      id_curso,
      motivacao: motivacao || null,
      expectativas: expectativas || null,
      data_inscricao: new Date(),
      estado: "inscrito"
    }, { transaction });

    // Buscar informações do usuário para enviar email
    const user = await User.findByPk(id_utilizador, { transaction });

    // Enviar email de confirmação de inscrição
    if (user && curso) {
      await sendEnrollmentEmail(user, curso).catch(error => {
        console.error("Erro ao enviar email de confirmação:", error);
        // Não interrompe o fluxo se o email falhar
      });
    }

    await transaction.commit();
    
    res.status(201).json({ 
      message: "Inscrição realizada com sucesso!", 
      inscricao: novaInscricao 
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao criar inscrição:", error);
    res.status(500).json({ 
      message: "Erro no servidor ao processar inscrição." 
    });
  }
};

// Cancelar uma inscrição
const cancelarInscricao = async (req, res) => {
  try {
    const { id } = req.params;
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

    // Atualizar o estado para "cancelado"
    inscricao.estado = "cancelado";
    await inscricao.save();

    res.json({ message: "Inscrição cancelada com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    res.status(500).json({ message: "Erro no servidor ao cancelar inscrição" });
  }
};

module.exports = { getAllInscricoes, createInscricao, cancelarInscricao };