// =============================================================================
// MODELO: UTILIZADORES PRINCIPAIS
// =============================================================================
// Define os utilizadores ativos no sistema (Admins, Formadores, Formandos)
// Inclui dados pessoais, localização e preferências de perfil

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define("utilizadores", {
  id_utilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "ID único gerado automaticamente pelo PostgreSQL"
  },
  id_cargo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Cargo/função do utilizador no sistema"
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Nome completo do utilizador"
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Idade do utilizador"
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: "Email único para autenticação"
  },
  telefone: {
    type: DataTypes.STRING(9),
    allowNull: true,
    comment: "Número de telefone (formato português)"
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Password encriptada com bcrypt"
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'AVATAR.png',
    comment: "Nome do ficheiro da foto de perfil"
  },
  foto_capa: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'CAPA.png',
    comment: "Nome do ficheiro da foto de capa"
  },  
  primeiro_login: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Flag que força alteração de password no primeiro login"
  },
  morada: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Endereço de residência"
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Cidade de residência"
  },
  distrito: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Distrito de residência"
  },
  freguesia: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Freguesia de residência"
  },
  codigo_postal: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: "Código postal (formato: XXXX-XXX)"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição pessoal/biografia do utilizador"
  }
}, {
  tableName: "utilizadores",
  timestamps: false,
});

module.exports = User;