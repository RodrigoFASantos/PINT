const Avaliacao = require("../../database/models/Avaliacao");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");

// Obter todas as avaliações com informações relacionadas
const getAllAvaliacoes = async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.findAll({
      include: [
        {
          model: Inscricao_Curso,
          as: "inscricao",
          include: [
            {
              model: User,
              as: "utilizador",
              attributes: ['id_utilizador', 'nome', 'email']
            },
            {
              model: Curso,
              as: "curso",
              attributes: ['id_curso', 'nome']
            }
          ]
        }
      ]
    });

    // Formatar os dados para a resposta
    const formattedAvaliacoes = avaliacoes.map(avaliacao => {
      const plainAvaliacao = avaliacao.get({ plain: true });
      return {
        id_avaliacao: plainAvaliacao.id_avaliacao,
        id_inscricao: plainAvaliacao.id_inscricao,
        nota: plainAvaliacao.nota,
        certificado: plainAvaliacao.certificado,
        horas_totais: plainAvaliacao.horas_totais,
        horas_presenca: plainAvaliacao.horas_presenca,
        data_criacao: plainAvaliacao.data_criacao,
        data_limite: plainAvaliacao.data_limite,
        aluno: plainAvaliacao.inscricao?.utilizador?.nome || 'Aluno desconhecido',
        email_aluno: plainAvaliacao.inscricao?.utilizador?.email || 'Email desconhecido',
        curso: plainAvaliacao.inscricao?.curso?.nome || 'Curso desconhecido'
      };
    });

    res.status(200).json(formattedAvaliacoes);
  } catch (error) {
    console.error("Erro ao procurar avaliações:", error);
    res.status(500).json({ message: "Erro ao procurar avaliações", error: error.message });
  }
};

// Criar uma nova avaliação
const createAvaliacao = async (req, res) => {
  try {
    const { id_inscricao, nota, certificado, horas_totais, horas_presenca, data_limite } = req.body;

    // Validação básica
    if (!id_inscricao || nota === undefined || horas_totais === undefined || horas_presenca === undefined) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    // Verificar se a inscrição existe
    const inscricao = await Inscricao_Curso.findByPk(id_inscricao);
    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada!" });
    }

    // Verificar se já existe uma avaliação para esta inscrição
    const avaliacaoExistente = await Avaliacao.findOne({
      where: { id_inscricao }
    });

    if (avaliacaoExistente) {
      return res.status(409).json({ 
        message: "Já existe uma avaliação para esta inscrição. Use o endpoint de atualização.",
        avaliacao: avaliacaoExistente
      });
    }

    // Criar a nova avaliação
    const novaAvaliacao = await Avaliacao.create({
      id_inscricao,
      nota,
      certificado: certificado || false,
      horas_totais,
      horas_presenca,
      data_limite: data_limite || null, // Novo campo
    });

    // Carregar informações completas com relacionamentos
    const avaliacaoCompleta = await Avaliacao.findByPk(novaAvaliacao.id_avaliacao, {
      include: [
        {
          model: Inscricao_Curso,
          as: "inscricao",
          include: [
            {
              model: User,
              as: "utilizador",
              attributes: ['id_utilizador', 'nome', 'email']
            },
            {
              model: Curso,
              as: "curso",
              attributes: ['id_curso', 'nome']
            }
          ]
        }
      ]
    });

    // Formatar a resposta
    const plainAvaliacao = avaliacaoCompleta.get({ plain: true });
    const formattedAvaliacao = {
      id_avaliacao: plainAvaliacao.id_avaliacao,
      id_inscricao: plainAvaliacao.id_inscricao,
      nota: plainAvaliacao.nota,
      certificado: plainAvaliacao.certificado,
      horas_totais: plainAvaliacao.horas_totais,
      horas_presenca: plainAvaliacao.horas_presenca,
      data_criacao: plainAvaliacao.data_criacao,
      data_limite: plainAvaliacao.data_limite,
      aluno: plainAvaliacao.inscricao?.utilizador?.nome || 'Aluno desconhecido',
      email_aluno: plainAvaliacao.inscricao?.utilizador?.email || 'Email desconhecido',
      curso: plainAvaliacao.inscricao?.curso?.nome || 'Curso desconhecido'
    };

    res.status(201).json({ 
      message: "Avaliação criada com sucesso!", 
      avaliacao: formattedAvaliacao 
    });
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    res.status(500).json({ message: "Erro no servidor ao criar avaliação.", error: error.message });
  }
};

// Obter uma avaliação específica por ID
const getAvaliacaoById = async (req, res) => {
  try {
    const { id } = req.params;

    const avaliacao = await Avaliacao.findByPk(id, {
      include: [
        {
          model: Inscricao_Curso,
          as: "inscricao",
          include: [
            {
              model: User,
              as: "utilizador",
              attributes: ['id_utilizador', 'nome', 'email']
            },
            {
              model: Curso,
              as: "curso",
              attributes: ['id_curso', 'nome']
            }
          ]
        }
      ]
    });

    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada!" });
    }

    // Formatar a resposta
    const plainAvaliacao = avaliacao.get({ plain: true });
    const formattedAvaliacao = {
      id_avaliacao: plainAvaliacao.id_avaliacao,
      id_inscricao: plainAvaliacao.id_inscricao,
      nota: plainAvaliacao.nota,
      certificado: plainAvaliacao.certificado,
      horas_totais: plainAvaliacao.horas_totais,
      horas_presenca: plainAvaliacao.horas_presenca,
      data_criacao: plainAvaliacao.data_criacao,
      data_limite: plainAvaliacao.data_limite, // Novo campo
      aluno: plainAvaliacao.inscricao?.utilizador?.nome || 'Aluno desconhecido',
      email_aluno: plainAvaliacao.inscricao?.utilizador?.email || 'Email desconhecido',
      curso: plainAvaliacao.inscricao?.curso?.nome || 'Curso desconhecido'
    };

    res.status(200).json(formattedAvaliacao);
  } catch (error) {
    console.error("Erro ao procurar avaliação:", error);
    res.status(500).json({ message: "Erro ao procurar avaliação", error: error.message });
  }
};

// Atualizar uma avaliação existente
const updateAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota, certificado, horas_totais, horas_presenca, data_limite } = req.body;

    // Procurar a avaliação
    const avaliacao = await Avaliacao.findByPk(id);
    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada!" });
    }

    // Atualizar campos
    const dadosAtualizacao = {};
    if (nota !== undefined) dadosAtualizacao.nota = nota;
    if (certificado !== undefined) dadosAtualizacao.certificado = certificado;
    if (horas_totais !== undefined) dadosAtualizacao.horas_totais = horas_totais;
    if (horas_presenca !== undefined) dadosAtualizacao.horas_presenca = horas_presenca;
    if (data_limite !== undefined) dadosAtualizacao.data_limite = data_limite; // Novo campo

    // Aplicar atualização
    await avaliacao.update(dadosAtualizacao);

    // Procurar a avaliação atualizada com relacionamentos
    const avaliacaoAtualizada = await Avaliacao.findByPk(id, {
      include: [
        {
          model: Inscricao_Curso,
          as: "inscricao",
          include: [
            {
              model: User,
              as: "utilizador",
              attributes: ['id_utilizador', 'nome', 'email']
            },
            {
              model: Curso,
              as: "curso",
              attributes: ['id_curso', 'nome']
            }
          ]
        }
      ]
    });

    // Formatar a resposta
    const plainAvaliacao = avaliacaoAtualizada.get({ plain: true });
    const formattedAvaliacao = {
      id_avaliacao: plainAvaliacao.id_avaliacao,
      id_inscricao: plainAvaliacao.id_inscricao,
      nota: plainAvaliacao.nota,
      certificado: plainAvaliacao.certificado,
      horas_totais: plainAvaliacao.horas_totais,
      horas_presenca: plainAvaliacao.horas_presenca,
      data_criacao: plainAvaliacao.data_criacao,
      data_limite: plainAvaliacao.data_limite,
      aluno: plainAvaliacao.inscricao?.utilizador?.nome || 'Aluno desconhecido',
      email_aluno: plainAvaliacao.inscricao?.utilizador?.email || 'Email desconhecido',
      curso: plainAvaliacao.inscricao?.curso?.nome || 'Curso desconhecido'
    };

    res.status(200).json({ 
      message: "Avaliação atualizada com sucesso!", 
      avaliacao: formattedAvaliacao 
    });
  } catch (error) {
    console.error("Erro ao atualizar avaliação:", error);
    res.status(500).json({ message: "Erro no servidor ao atualizar avaliação.", error: error.message });
  }
};

// Apagar uma avaliação
const deleteAvaliacao = async (req, res) => {
  try {
    const { id } = req.params;

    // Procurar a avaliação
    const avaliacao = await Avaliacao.findByPk(id);
    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada!" });
    }

    // Excluir a avaliação
    await avaliacao.destroy();

    res.status(200).json({ message: "Avaliação excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir avaliação:", error);
    res.status(500).json({ message: "Erro no servidor ao excluir avaliação.", error: error.message });
  }
};

module.exports = { 
  getAllAvaliacoes, 
  createAvaliacao,
  getAvaliacaoById,
  updateAvaliacao,
  deleteAvaliacao
};