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
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  p256dh: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  auth: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "push_subscriptions",
  timestamps: false,
});

module.exports = PushSubscription;