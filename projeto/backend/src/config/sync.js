const sequelize = require("./db");
const User = require("../database/models/User");
const Cargo = require("../database/models/Cargo");

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true }); // Sincroniza a estrutura sem apagar os dados
    console.log("Base de dados sincronizada!");
  } catch (error) {
    console.error("Erro ao sincronizar a base de dados:", error);
  }
};

syncDB();
