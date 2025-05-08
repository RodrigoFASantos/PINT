const { Sequelize } = require("sequelize");
require("dotenv").config();
const pg = require('pg');

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectModule: pg, // Força o uso do módulo pg
    dialectOptions: {
      ssl: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },

    dialectOptions: {
      connectTimeout: 60000
    }
  }
);

// Função para testar a conexão com a base de dados
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o base de dados estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar à base de dados:', error);
    return false;
  }
};

// Mantém a compatibilidade com código existente e exportamos o sequelize diretamente como o módulo padrão
module.exports = sequelize;

// Exportamos as funções auxiliares como propriedades
module.exports.testConnection = testConnection;
module.exports.sequelize = sequelize;