const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const InscricaoCursoCancelada = sequelize.define(
  "inscricao_curso_cancelada",
  {
    id_cancelamento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_inscricao_original: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "inscricoes_cursos",
        key: "id_inscricao",
      },
    },
    id_utilizador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "utilizadores",
        key: "id_utilizador",
      },
    },
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cursos",
        key: "id_curso",
      },
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
      type: DataTypes.DECIMAL(5, 2), // Changed from FLOAT to match other models
      allowNull: true,
    },
    certificado_gerado: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    horas_presenca: {
      type: DataTypes.INTEGER, // Changed from FLOAT to match other models
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