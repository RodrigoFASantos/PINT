const Cargo = require("../../database/models/Cargo.js");

const getAllCargos = async (req, res) => {
    try {
      const cargo = await Cargo.findAll();
      res.json(cargo);
    } catch (error) {
      res.status(500).json({ message: "Erro ao procurar Cargos" });
    }
};

const createCargo = async (req, res) => {
    try {
      const { id_cargo, descricao } = req.body;
  
      if (!id_cargo || !descricao) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
      }
      
  
      const newCargo = await Cargo.create({
        id_cargo,
        descricao,
      });
  
      res.status(201).json({ message: "Cargo criado com sucesso!", cargo: newCargo });
    } catch (error) {
      console.error("Erro ao criar cargo:", error);
      res.status(500).json({ message: "Erro no servidor ao criar cargo." });
    }
  };

  module.exports = { getAllCargos, createCargo };