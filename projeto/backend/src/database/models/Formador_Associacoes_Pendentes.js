const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const FormadorAssociacoesPendentes = sequelize.define("formador_associacoes_pendentes", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pendente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: '"User_Pendente"',
      key: "id",
    },
    unique: true
  },
  categorias: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  areas: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  cursos: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "formador_associacoes_pendentes",
  timestamps: false
});

module.exports = FormadorAssociacoesPendentes;