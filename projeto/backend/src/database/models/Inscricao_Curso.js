const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Inscricao_Curso = sequelize.define("inscricoes_cursos", {
  id_inscricao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.ENUM("inscrito", "cancelado"),
    allowNull: false,
    defaultValue: "inscrito",
  }
}, {
  tableName: "inscricoes_cursos",
  timestamps: false,
});

module.exports = Inscricao_Curso;
