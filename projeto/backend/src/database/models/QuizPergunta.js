// =============================================================================
// MODELO: PERGUNTAS DOS QUIZZES
// =============================================================================
// Define as perguntas individuais dentro de cada quiz
// Suporta diferentes tipos de questões e pontuação customizada


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
    comment: "Quiz ao qual a pergunta pertence"
  },
  pergunta: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Texto da pergunta"
  },
  tipo: {
    type: DataTypes.ENUM(
      "multipla_escolha",    // Uma resposta correta
      "verdadeiro_falso",    // Múltiplas afirmações V/F
      "resposta_curta",      // Texto livre (futuro)
      "multipla_resposta"    // Múltiplas respostas corretas (futuro)
    ),
    allowNull: false,
    defaultValue: "multipla_escolha",
    comment: "Tipo de pergunta"
  },
  pontos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    comment: "Pontos atribuídos à pergunta (padrão: 4 pontos)"
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Ordem de apresentação da pergunta no quiz"
  }
}, {
  tableName: "quiz_perguntas",
  timestamps: false,
});

module.exports = QuizPergunta;