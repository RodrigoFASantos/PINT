const Curso = require("../database/models/Curso");

// Obter todos os cursos
const getAllCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll();
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar cursos" });
  }
};

// Criar um novo curso
const createCurso = async (req, res) => {
  try {
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area } = req.body;

    if (!nome || !tipo || !data_inicio || !data_fim || !id_area) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novoCurso = await Curso.create({
      nome,
      descricao,
      tipo,
      vagas: tipo === "sincrono" ? vagas : null, // Apenas define vagas para cursos síncronos
      data_inicio,
      data_fim,
      id_formador,
      id_area
    });

    res.status(201).json({ message: "Curso criado com sucesso!", curso: novoCurso });
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao criar curso." });
  }
};

module.exports = { getAllCursos, createCurso };
