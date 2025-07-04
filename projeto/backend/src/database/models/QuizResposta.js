// =============================================================================
// MODELO: RESPOSTAS DOS QUIZZES
// =============================================================================
// Regista as tentativas de cada formando nos quizzes
// Controla tempo de início, conclusão e nota final


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
    comment: "Inscrição do formando que respondeu"
  },
  id_quiz: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quizzes",
      key: "id_quiz",
    },
    comment: "Quiz que foi respondido"
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora de início do quiz"
  },
  data_conclusao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data e hora de conclusão (null se ainda não terminado)"
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: "Nota final obtida (0.00 a 20.00)"
  },
  completo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o quiz foi totalmente completado"
  }
}, {
  tableName: "quiz_respostas",
  timestamps: false,
});

module.exports = QuizResposta;