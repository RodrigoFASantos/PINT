const Comentario_Topico = require("../database/models/Comentario_Topico");

// Obter todos os comentários
const getAllComentarios = async (req, res) => {
  try {
    const comentarios = await Comentario_Topico.findAll();
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar comentários" });
  }
};

// Criar um novo comentário
const createComentario = async (req, res) => {
  try {
    const { id_topico, id_utilizador, comentario } = req.body;

    if (!id_topico || !id_utilizador || !comentario) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    const novoComentario = await Comentario_Topico.create({
      id_topico,
      id_utilizador,
      comentario,
    });

    res.status(201).json({ message: "Comentário criado com sucesso!", comentario: novoComentario });
  } catch (error) {
    console.error("Erro ao criar comentário:", error);
    res.status(500).json({ message: "Erro no servidor ao criar comentário." });
  }
};

module.exports = { getAllComentarios, createComentario };
