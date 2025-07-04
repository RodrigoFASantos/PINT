// =============================================================================
// MODELO: UTILIZADORES PENDENTES
// =============================================================================
// Armazena temporariamente dados de utilizadores que se registaram
// mas ainda aguardam aprovação dos administradores

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcrypt');

const User_Pendente = sequelize.define('User_Pendente', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_cargo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Cargo pretendido pelo utilizador"
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Nome completo do candidato"
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Idade do candidato"
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Email para registo (deve ser único)"
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Telefone de contacto"
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Password encriptada automaticamente"
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Token único para validação do registo"
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "Data de expiração do pedido de registo"
  }
}, {
  tableName: "User_Pendente",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Hook para encriptar automaticamente a password antes de guardar
User_Pendente.beforeCreate(async (userPendente) => {
  if (userPendente.password) {
    const salt = await bcrypt.genSalt(10);
    userPendente.password = await bcrypt.hash(userPendente.password, salt);
  }
});

module.exports = User_Pendente;