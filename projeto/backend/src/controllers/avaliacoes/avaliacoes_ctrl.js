const Avaliacao = require("../../database/models/Avaliacao");

// Obter todas as avaliações
const getAllAvaliacoes = async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.findAll();
    res.json(avaliacoes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar avaliações" });
  }
};

// Criar uma nova avaliação
const createAvaliacao = async (req, res) => {
  try {
    const { id_inscricao, nota, certificado, horas_totais, horas_presenca } = req.body;

    if (!id_inscricao || nota === undefined || horas_totais === undefined || horas_presenca === undefined) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novaAvaliacao = await Avaliacao.create({
      id_inscricao,
      nota,
      certificado: certificado || false,
      horas_totais,
      horas_presenca,
    });

    res.status(201).json({ message: "Avaliação criada com sucesso!", avaliacao: novaAvaliacao });
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    res.status(500).json({ message: "Erro no servidor ao criar avaliação." });
  }
};

module.exports = { getAllAvaliacoes, createAvaliacao };
