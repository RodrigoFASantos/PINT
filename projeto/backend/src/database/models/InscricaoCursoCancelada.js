// src/models/InscricaoCursoCancelada.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const InscricaoCursoCancelada = sequelize.define(
  "inscricao_curso_cancelada",
  {
    id_inscricao_cancelada: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    data_cancelamento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    motivo_cancelamento: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    timestamps: false,
    tableName: "inscricao_curso_cancelada",
  }
);

module.exports = InscricaoCursoCancelada;