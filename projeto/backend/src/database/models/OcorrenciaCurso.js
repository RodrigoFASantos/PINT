// =============================================================================
// MODELO: OCORRÊNCIAS DE CURSOS
// =============================================================================
// Gere as diferentes edições/ocorrências de um mesmo curso
// Permite criar novas edições baseadas em cursos anteriores

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
    comment: "Curso original que serviu de base"
  },
  id_curso_nova_ocorrencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Nova edição/ocorrência criada"
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação da nova ocorrência"
  },
  numero_edicao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Número sequencial da edição (1ª, 2ª, 3ª edição, etc.)"
  }
}, {
  tableName: "ocorrencias_cursos",
  timestamps: false,
});

module.exports = OcorrenciaCurso;