const { Sequelize } = require("sequelize");
require("dotenv").config();
const pg = require('pg');

/**
 * Configuração da ligação à base de dados PostgreSQL
 * 
 * Utiliza variáveis de ambiente para configuração:
 * - DB_DATABASE: Nome da base de dados
 * - DB_USER: Utilizador da base de dados  
 * - DB_PASSWORD: Palavra-passe
 * - DB_HOST: Servidor da base de dados
 * - DB_PORT: Porto de ligação (padrão: 5432)
 */
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectModule: pg,
    dialectOptions: {
      ssl: false,
      connectTimeout: 60000
    },
    pool: {
      max: 5,          // Máximo de ligações simultâneas
      min: 0,          // Mínimo de ligações no pool
      acquire: 60000,  // Tempo máximo para obter ligação (ms)
      idle: 10000      // Tempo máximo de inatividade (ms)
    }
  }
);

/**
 * Testa a ligação à base de dados
 * @returns {boolean} true se a ligação for bem-sucedida, false caso contrário
 */
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

// Exportar o sequelize como módulo principal para compatibilidade
module.exports = sequelize;

// Exportar funções auxiliares como propriedades
module.exports.testConnection = testConnection;
module.exports.sequelize = sequelize;