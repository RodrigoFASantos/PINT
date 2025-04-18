const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Inscricao_Curso_Cancelada = sequelize.define("inscricoes_cursos_canceladas", {
  id_inscricao_cancelada: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_inscricao_original: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  },
  data_cancelamento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "cancelado",
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
  },
  motivo_cancelamento: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: "inscricoes_cursos_canceladas",
  timestamps: false,
});

// Definir relações
const User = require("./User");
const Curso = require("./Curso");

Inscricao_Curso_Cancelada.belongsTo(User, {
  foreignKey: "id_utilizador",
  as: "utilizador"
});

Inscricao_Curso_Cancelada.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "curso"
});

module.exports = Inscricao_Curso_Cancelada;