const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Cargo = sequelize.define("cargos", {
  id_cargo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descricao: { type: DataTypes.STRING(255), allowNull: false },
}, { timestamps: false });

module.exports = Cargo;
