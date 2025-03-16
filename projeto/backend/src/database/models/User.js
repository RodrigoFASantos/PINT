const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define("utilizadores", {
  id_utilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, //Garante que o PostgreSQL gere automaticamente o ID
  },
  id_cargo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, //Garante que o email seja único
  },
  telefone: {
    type: DataTypes.STRING(9),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  primeiro_login: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Começa sempre como 1, para forçar a troca da password no 1º login
  }
}, {
  tableName: "utilizadores",
  timestamps: false, //Evita criar colunas createdAt e updatedAt
});

module.exports = User;
