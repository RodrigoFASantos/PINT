// config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Cria uma nova instância do Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'softskills_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Função para testar a conexão com o banco de dados
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
};