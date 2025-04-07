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
  },
  id_pergunta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quiz_perguntas",
      key: "id_pergunta",
    },
  },
  resposta_texto: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  id_opcao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "quiz_opcoes",
      key: "id_opcao",
    },
  },
  correta: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  pontos_obtidos: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  }
}, {
  tableName: "quiz_respostas_detalhes",
  timestamps: false,
});

module.exports = QuizRespostaDetalhe;