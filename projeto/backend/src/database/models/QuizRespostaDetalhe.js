// =============================================================================
// MODELO: DETALHES DAS RESPOSTAS
// =============================================================================
// Armazena as respostas específicas a cada pergunta
// Permite análise detalhada do desempenho do formando


const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const QuizRespostaDetalhe = sequelize.define("quiz_respostas_detalhes", {
  id_resposta_detalhe: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_resposta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quiz_respostas",
      key: "id_resposta",
    },
    comment: "Resposta geral à qual este detalhe pertence"
  },
  id_pergunta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quiz_perguntas",
      key: "id_pergunta",
    },
    comment: "Pergunta que foi respondida"
  },
  resposta_texto: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Resposta em texto livre (para perguntas abertas)"
  },
  id_opcao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "quiz_opcoes",
      key: "id_opcao",
    },
    comment: "Opção selecionada pelo formando (para múltipla escolha)"
  },
  correta: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: "Indica se a resposta está correta"
  },
  pontos_obtidos: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: "Pontos obtidos nesta pergunta específica"
  }
}, {
  tableName: "quiz_respostas_detalhes",
  timestamps: false,
});
module.exports = QuizRespostaDetalhe;