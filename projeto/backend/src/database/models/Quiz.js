// =============================================================================
// MODELO: QUIZZES
// =============================================================================
// Define os quizzes/testes de avaliação associados aos cursos
// Suporta limite de tempo e múltiplas tentativas

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
    comment: "Curso ao qual o quiz pertence"
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Título do quiz"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição e instruções do quiz"
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação do quiz"
  },
  tempo_limite: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Tempo limite em minutos (null = sem limite)"
  },
  tempo_limite_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data em que o tempo limite foi definido/alterado"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: "Indica se o quiz está ativo/disponível"
  }
}, {
  tableName: "quizzes",
  timestamps: false,
});

module.exports = Quiz;