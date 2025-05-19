const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Trabalho_Entregue = sequelize.define("trabalhos_entregues", {
  id_trabalho: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // passa a guardar diretamente quem submeteu
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
  },

  // Curso
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
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

  // avaliaçao 0–20
  avaliacao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 20
    }
  },

  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "trabalhos_entregues",
  timestamps: false,
});

module.exports = Trabalho_Entregue;
