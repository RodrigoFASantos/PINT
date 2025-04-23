const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const ConteudoCurso = sequelize.define("curso_topico_pasta_conteudo", {
  id_conteudo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['file', 'link', 'video']]
    }
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  arquivo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  id_pasta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso_topico_pasta", // Changed to match the tableName in PastaCurso
      key: "id_pasta",
    },
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso", // Changed to match tableName in Curso
      key: "id_curso",
    },
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: "curso_topico_pasta_conteudo", // Left as is since it's already correct
  timestamps: false,
});

module.exports = ConteudoCurso;