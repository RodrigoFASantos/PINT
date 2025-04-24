const Area = require("../../database/models/Area");

// Obter todas as áreas
const getAllAreas = async (req, res) => {
  try {
    const areas = await Area.findAll();
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar áreas" });
  }
};

// Criar uma nova área
const createArea = async (req, res) => {
  try {
    const { nome, id_categoria } = req.body;

    if (!nome || !id_categoria) {
      return res.status(400).json({ message: "Nome e id_categoria são obrigatórios!" });
    }

    const novaArea = await Area.create({ nome, id_categoria });

    res.status(201).json({ message: "Área criada com sucesso!", area: novaArea });
  } catch (error) {
    console.error("Erro ao criar área:", error);
    res.status(500).json({ message: "Erro no servidor ao criar área." });
  }
};

module.exports = { getAllAreas, createArea };
