const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso_Topicos = sequelize.define("curso_topico", {
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
      model: "curso",
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
  arquivo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  dir_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  }
}, {
  tableName: "curso_topico",
  timestamps: false,
});

module.exports = Curso_Topicos;