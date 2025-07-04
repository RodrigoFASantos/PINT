// =============================================================================
// MODELO: ASSOCIAÇÕES PENDENTES DE FORMADORES
// =============================================================================
// Armazena temporariamente as especialidades solicitadas por utilizadores
// que se candidataram a formador mas ainda não foram aprovados

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
      model: "User_Pendente",
      key: "id",
    },
    unique: true,
    comment: "Utilizador pendente que fez a candidatura"
  },
  categorias: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: "Array com IDs das categorias nas quais se candidata (formato JSON)"
  },
  areas: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: "Array com IDs das áreas nas quais tem especialização (formato JSON)"
  },
  cursos: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: "Array com IDs dos cursos que pode lecionar (formato JSON)"
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação da candidatura"
  }
}, {
  tableName: "formador_associacoes_pendentes",
  timestamps: false
});

module.exports = FormadorAssociacoesPendentes;