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
    }
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  tipo: {
    type: DataTypes.ENUM('like', 'dislike'),
    allowNull: false
  },
  data_interacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
  // Cada utilizador só pode ter uma interação por mensagem
  uniqueKeys: {
    unique_user_message: {
      fields: ['id_mensagem', 'id_utilizador']
    }
  }
});

module.exports = ChatInteracao;