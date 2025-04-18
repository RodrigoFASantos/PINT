const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: "postgres", 
    port: process.env.DB_PORT || 5432,
    logging: false,
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

// Mantém a compatibilidade com código existente e exportamos o sequelize diretamente como o módulo padrão
module.exports = sequelize;

// Exportamos as funções auxiliares como propriedades
module.exports.testConnection = testConnection;
module.exports.sequelize = sequelize;