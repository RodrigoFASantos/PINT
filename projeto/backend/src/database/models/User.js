const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

// Criação do modelo de utilizador
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
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, //Garante que o email seja único
  },
  telefone: {
    type: DataTypes.STRING(9),
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'AVATAR.png'
  },
  foto_capa: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'CAPA.png'
  },  
  primeiro_login: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Começa sempre como 1, para forçar a troca da password no 1º login
  },
  // Novos campos adicionados
  morada: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  distrito: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  freguesia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  codigo_postal: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: "utilizadores",
  timestamps: false, //Evita criar colunas createdAt e updatedAt
});

module.exports = User;