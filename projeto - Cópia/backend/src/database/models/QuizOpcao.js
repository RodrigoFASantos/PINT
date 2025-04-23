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
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: "quiz_opcoes",
  timestamps: false,
});

module.exports = QuizOpcao;