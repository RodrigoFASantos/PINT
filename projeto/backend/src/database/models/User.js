const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define("utilizadores", {
  id_utilizador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_cargo: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(255), allowNull: false },
  idade: { type: DataTypes.INTEGER, allowNull: false },
  email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  telefone: { type: DataTypes.STRING(20), allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
}, { timestamps: false });

module.exports = User;
