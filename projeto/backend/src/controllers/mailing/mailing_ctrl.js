const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Area = require("../../database/models/Area");
const { sendMailingList } = require("../../utils/emailService");

// Enviar divulgação de cursos para todos os usuários
const enviarDivulgacaoGeral = async (req, res) => {
  try {
    const { id_cursos } = req.body;
    
    if (!id_cursos || !Array.isArray(id_cursos) || id_cursos.length === 0) {
      return res.status(400).json({ message: "Selecione pelo menos um curso para divulgar" });
    }
    
    // Buscar cursos
    const cursos = await Curso.findAll({
      where: { id_curso: id_cursos },
      include: [{
        model: Area,
        as: "area"
      }]
    });
    
    if (cursos.length === 0) {
      return res.status(404).json({ message: "Nenhum curso encontrado com os IDs fornecidos" });
    }
    
    // Buscar todos os formandos
    const formandos = await User.findAll({
      where: { id_cargo: 3 } // ID 3 = Formando
    });
    
    if (formandos.length === 0) {
      return res.status(404).json({ message: "Nenhum formando encontrado para enviar a divulgação" });
    }
    
    // Enviar emails
    await sendMailingList(formandos, cursos);
    
    res.json({
      message: "Divulgação enviada com sucesso",
      total_enviados: formandos.length,
      cursos: cursos.map(c => c.nome)
    });
  } catch (error) {
    console.error("Erro ao enviar divulgação:", error);
    res.status(500).json({ message: "Erro ao enviar divulgação" });
  }
};

// Enviar divulgação de cursos por área de interesse
const enviarDivulgacaoPorArea = async (req, res) => {
  try {
    const { id_area } = req.params;
    const { id_cursos } = req.body;
    
    if (!id_cursos || !Array.isArray(id_cursos) || id_cursos.length === 0) {
      return res.status(400).json({ message: "Selecione pelo menos um curso para divulgar" });
    }
    
    // Buscar área
    const area = await Area.findByPk(id_area);
    if (!area) {
      return res.status(404).json({ message: "Área não encontrada" });
    }
    
    // Buscar cursos da área específica
    const cursos = await Curso.findAll({
      where: { 
        id_curso: id_cursos,
        id_area
      },
      include: [{
        model: Area,
        as: "area"
      }]
    });
    
    if (cursos.length === 0) {
      return res.status(404).json({ message: "Nenhum curso encontrado com os IDs fornecidos nesta área" });
    }
    
    // Buscar formandos com interesse na área (lógica simplificada - em uma implementação real, seria baseado em preferências do usuário)
    const formandos = await User.findAll({
      where: { id_cargo: 3 } // ID 3 = Formando
      // Em uma implementação real, adicionar filtro por área de interesse
    });
    
    if (formandos.length === 0) {
      return res.status(404).json({ message: "Nenhum formando encontrado com interesse nesta área" });
    }
    
    // Enviar emails
    await sendMailingList(formandos, cursos, area);
    
    res.json({
      message: "Divulgação por área enviada com sucesso",
      total_enviados: formandos.length,
      area: area.nome,
      cursos: cursos.map(c => c.nome)
    });
  } catch (error) {
    console.error("Erro ao enviar divulgação por área:", error);
    res.status(500).json({ message: "Erro ao enviar divulgação por área" });
  }
};

module.exports = {
  enviarDivulgacaoGeral,
  enviarDivulgacaoPorArea
};