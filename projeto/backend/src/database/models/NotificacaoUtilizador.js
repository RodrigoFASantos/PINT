const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const NotificacaoUtilizador = sequelize.define("notificacoes_utilizadores", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_notificacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "notificacoes",
      key: "id_notificacao",
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
  lida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  data_leitura: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: "notificacoes_utilizadores",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_notificacao', 'id_utilizador']
    }
  ]
});

module.exports = NotificacaoUtilizador;