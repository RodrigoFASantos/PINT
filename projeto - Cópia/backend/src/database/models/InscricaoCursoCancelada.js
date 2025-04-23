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
    id_inscricao_original: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    data_inscricao: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    data_cancelamento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'cancelado',
    },
    motivacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expectativas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nota_final: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    certificado_gerado: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    horas_presenca: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
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