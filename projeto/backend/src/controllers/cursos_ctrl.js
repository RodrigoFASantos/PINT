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

// Criar um novo curso (recebe req.file da rota)
const createCurso = async (req, res) => {
  try {
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area } = req.body;
    const imagem = req.file ? req.file.path : null;

    if (!nome || !tipo || !data_inicio || !data_fim || !id_area) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novoCurso = await Curso.create({
      nome,
      descricao,
      tipo,
      vagas: tipo === "sincrono" ? vagas : null,
      data_inicio,
      data_fim,
      id_formador,
      id_area,
      imagem_path: imagem // Guardar o caminho na BD, tipo "uploads/cursos/1710618592334.png"
    });

    res.status(201).json({ message: "Curso criado com sucesso!", curso: novoCurso });
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao criar curso." });
  }
};

module.exports = { getAllCursos, createCurso };
