require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // Definir para true se quiser ver os logs das queries
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexão ao PostgreSQL bem-sucedida!");
  } catch (error) {
    console.error("Erro ao conectar à base de dados:", error);
  }
};

testConnection();

module.exports = sequelize;
