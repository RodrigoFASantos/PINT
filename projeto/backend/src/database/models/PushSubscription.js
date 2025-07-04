// =============================================================================
// MODELO: SUBSCRIÇÕES PUSH
// =============================================================================
// Gere as subscrições de notificações push dos browsers dos utilizadores
// Permite envio de notificações mesmo quando a aplicação não está aberta

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const PushSubscription = sequelize.define("push_subscriptions", {
  id_subscription: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Utilizador que subscreveu as notificações"
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: "URL do endpoint push fornecido pelo browser"
  },
  p256dh: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: "Chave pública para encriptação das mensagens push"
  },
  auth: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: "Chave de autenticação para validação das mensagens"
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação da subscrição"
  }
}, {
  tableName: "push_subscriptions",
  timestamps: false,
});

module.exports = PushSubscription;