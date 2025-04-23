const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const QuizResposta = sequelize.define("quiz_respostas", {
  id_resposta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_inscricao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "inscricoes_cursos",
      key: "id_inscricao",
    },
  },
  id_quiz: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quizzes",
      key: "id_quiz",
    },
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  data_conclusao: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  completo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
  tableName: "quiz_respostas",
  timestamps: false,
});

module.exports = QuizResposta;