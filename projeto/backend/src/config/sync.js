const sequelize = require("../config/db");
const User = require("../database/models/User");
const Cargo = require("../database/models/Cargo");

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Atualiza a estrutura sem perder dados
    console.log("Base de dados sincronizada!");
    process.exit();
  } catch (error) {
    console.error("Erro ao sincronizar base de dados:", error);
    process.exit(1);
  }
})();
