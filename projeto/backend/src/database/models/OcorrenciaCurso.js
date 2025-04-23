const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const OcorrenciaCurso = sequelize.define("ocorrencias_cursos", {
  id_ocorrencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_curso_original: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
  },
  id_curso_nova_ocorrencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  numero_edicao: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "ocorrencias_cursos",
  timestamps: false,
});

module.exports = OcorrenciaCurso;