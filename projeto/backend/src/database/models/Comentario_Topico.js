const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Comentario_Topico = sequelize.define("comentarios_topicos", {
  id_comentario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "topicos_categorias",
      key: "id_topico",
    },
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data_comentario: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "comentarios_topicos",
  timestamps: false,
});

module.exports = Comentario_Topico;