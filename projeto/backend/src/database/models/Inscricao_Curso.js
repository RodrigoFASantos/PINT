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
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  certificado_gerado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  horas_presenca: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: "inscricoes_cursos",
  timestamps: false,
});

// Definir relações
const User = require("./User");
const Curso = require("./Curso");

Inscricao_Curso.belongsTo(User, {
  foreignKey: "id_utilizador",
  as: "utilizador"
});

Inscricao_Curso.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

module.exports = Inscricao_Curso;