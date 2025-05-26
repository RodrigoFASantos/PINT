const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Quiz = sequelize.define("quizzes", {
  id_quiz: {
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
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  tempo_limite: {
    type: DataTypes.INTEGER,
    allowNull: true, // Tempo em minutos (null = sem limite)
  },
  tempo_limite_inicio: {
    type: DataTypes.DATE,
    allowNull: true, // Quando o tempo limite foi definido/alterado
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: "quizzes",
  timestamps: false,
});

module.exports = Quiz;