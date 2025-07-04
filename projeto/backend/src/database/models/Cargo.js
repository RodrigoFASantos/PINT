// =============================================================================
// MODELO: CARGOS DOS UTILIZADORES
// =============================================================================
// Define os diferentes cargos/funções no sistema (Admin, Formador, Formando, etc.)

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Cargo = sequelize.define("cargos", {
  id_cargo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Descrição do cargo (ex: Administrador, Formador, Formando)"
  },
}, { 
  tableName: "cargos",
  timestamps: false 
});

module.exports = Cargo;