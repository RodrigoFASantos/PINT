const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatMensagem = sequelize.define('ChatMensagem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Topicos',
      key: 'id'
    }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true // Permite mensagens só com anexo
  },
  anexoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  anexoNome: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipoAnexo: {
    type: DataTypes.ENUM('imagem', 'video', 'file'),
    allowNull: true
  },
  dataCriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chat_mensagens',
  timestamps: false, // Usamos dataCriacao em vez de createdAt
  indexes: [
    {
      name: 'idx_chat_mensagens_topico',
      fields: ['id_topico']
    },
    {
      name: 'idx_chat_mensagens_usuario',
      fields: ['id_usuario']
    }
  ]
});

module.exports = ChatMensagem;