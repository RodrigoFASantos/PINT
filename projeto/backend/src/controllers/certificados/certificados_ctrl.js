const User = require("../database/models/User");
const Curso = require("../database/models/Curso");
const Avaliacao = require("../database/models/Avaliacao");
const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const { generateCertificate } = require("../utils/certificateGenerator");

// Gerar certificado para um formando
const gerarCertificado = async (req, res) => {
  try {
    const { id_avaliacao } = req.params;

    const avaliacao = await Avaliacao.findByPk(id_avaliacao);
    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    // Verificar se já tem certificado gerado
    if (avaliacao.certificado) {
      return res.json({ 
        message: "Certificado já existente",
        url: avaliacao.url_certificado
      });
    }

    // Buscar informações do formando e curso
    const inscricao = await Inscricao_Curso.findByPk(avaliacao.id_inscricao);
    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    const formando = await User.findByPk(inscricao.id_utilizador);
    const curso = await Curso.findByPk(inscricao.id_curso);

    if (!formando || !curso) {
      return res.status(404).json({ message: "Formando ou curso não encontrado" });
    }

    // Gerar o certificado
    const certificado = await generateCertificate(formando, curso, avaliacao);

    // Atualizar a avaliação com a informação do certificado
    await avaliacao.update({
      certificado: true,
      url_certificado: certificado.url
    });

    res.json({
      message: "Certificado gerado com sucesso",
      url: certificado.url
    });
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    res.status(500).json({ message: "Erro ao gerar certificado" });
  }
};

// Buscar certificado existente
const getCertificado = async (req, res) => {
  try {
    const { id_avaliacao } = req.params;

    const avaliacao = await Avaliacao.findByPk(id_avaliacao);
    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    if (!avaliacao.certificado) {
      return res.status(404).json({ message: "Certificado não disponível" });
    }

    res.json({
      url: avaliacao.url_certificado
    });
  } catch (error) {
    console.error("Erro ao buscar certificado:", error);
    res.status(500).json({ message: "Erro ao buscar certificado" });
  }
};

module.exports = { gerarCertificado, getCertificado };