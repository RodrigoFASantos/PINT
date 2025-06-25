const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const QuizPergunta = sequelize.define("quiz_perguntas", {
  id_pergunta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_quiz: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quizzes",
      key: "id_quiz",
    },
  },
  pergunta: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM(
      "multipla_escolha",    // Múltiplas respostas possíveis
      "verdadeiro_falso",    // Múltiplas opções verdadeiro/falso
      "resposta_curta",      // Texto livre (futuro)
      "multipla_resposta"    // Múltiplas respostas corretas (futuro)
    ),
    allowNull: false,
    defaultValue: "multipla_escolha",
  },
  pontos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4, // 4 pontos por pergunta
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: "quiz_perguntas",
  timestamps: false,
});

module.exports = QuizPergunta;