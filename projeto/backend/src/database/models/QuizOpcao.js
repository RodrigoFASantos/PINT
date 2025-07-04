// =============================================================================
// MODELO: OPÇÕES DAS PERGUNTAS
// =============================================================================
// Define as opções de resposta para cada pergunta
// Marca quais são as opções corretas

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const QuizOpcao = sequelize.define("quiz_opcoes", {
  id_opcao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pergunta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "quiz_perguntas",
      key: "id_pergunta",
    },
    comment: "Pergunta à qual a opção pertence"
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Texto da opção de resposta"
  },
  correta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se é a opção correta"
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Ordem de apresentação da opção"
  }
}, {
  tableName: "quiz_opcoes",
  timestamps: false,
});

module.exports = QuizOpcao;