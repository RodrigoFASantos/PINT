const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const TopicoCurso = sequelize.define("topicos_curso", {
  id_topico: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "cursos",
      key: "id_curso",
    },
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
  tableName: "topicos_curso",
  timestamps: false,
});

module.exports = TopicoCurso;