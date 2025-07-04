// =============================================================================
// MODELO: NOTIFICAÇÕES POR UTILIZADOR
// =============================================================================
// Controla quais utilizadores receberam cada notificação
// Permite controlo individual de leitura e estado

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
    comment: "Notificação que foi enviada"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Utilizador que recebeu a notificação"
  },
  lida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se a notificação foi lida pelo utilizador"
  },
  data_leitura: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data e hora em que foi marcada como lida"
  }
}, {
  tableName: "notificacoes_utilizadores",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_notificacao', 'id_utilizador'],
      name: 'unique_notificacao_utilizador'
    }
  ]
});

module.exports = NotificacaoUtilizador;