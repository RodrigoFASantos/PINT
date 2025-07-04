// =============================================================================
// MODELO: INTERAÇÕES DO CHAT (LIKES/DISLIKES)
// =============================================================================
// Regista as interações dos utilizadores com as mensagens de chat
// Cada utilizador pode dar apenas um like ou dislike por mensagem

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatInteracao = sequelize.define('chat_interacoes', {
  id_interacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_mensagem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_mensagens',
      key: 'id'
    },
    comment: "Mensagem que recebeu a interação"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    },
    comment: "Utilizador que fez a interação"
  },
  tipo: {
    type: DataTypes.ENUM('like', 'dislike'),
    allowNull: false,
    comment: "Tipo de interação (like ou dislike)"
  },
  data_interacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora da interação"
  }
}, {
  tableName: 'chat_interacoes',
  timestamps: false,
  indexes: [
    {
      name: 'idx_chat_interacoes_mensagem',
      fields: ['id_mensagem']
    },
    {
      name: 'idx_chat_interacoes_utilizador',
      fields: ['id_utilizador']
    }
  ],
  // Restrição única: cada utilizador só pode ter uma interação por mensagem
  uniqueKeys: {
    unique_user_message: {
      fields: ['id_mensagem', 'id_utilizador']
    }
  }
});

module.exports = ChatInteracao;