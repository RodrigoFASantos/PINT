const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Trabalho_Entregue = sequelize.define("trabalhos_entregues", {
  id_trabalho: {
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
  ficheiro_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  data_entrega: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  avaliacao: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: "trabalhos_entregues",
  timestamps: false,
});

module.exports = Trabalho_Entregue;