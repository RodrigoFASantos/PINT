// =============================================================================
// MODELO: SESSÕES DE PRESENÇA DOS CURSOS
// =============================================================================
// Define as sessões específicas dos cursos síncronos onde se regista presença
// Cada sessão tem um código único para validação de presenças

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso_Presenca = sequelize.define("curso_presenca", {
  id_curso_presenca: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Curso ao qual a sessão pertence"
  },
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "Data de início da sessão"
  },
  data_fim: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "Data de fim da sessão"
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: "Hora de início da sessão"
  },
  hora_fim: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: "Hora de fim da sessão"
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: "Código único para validação de presença (gerado pelo formador)"
  },
}, {
  tableName: "curso_presenca",
  timestamps: false,
});

module.exports = Curso_Presenca;