const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatMensagem = sequelize.define('chat_mensagens', {
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
      model: 'topico_categoria',
      key: 'id_topico'
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
  texto: {
    type: DataTypes.TEXT,
    allowNull: true // Permite mensagens só com anexo
  },
  anexo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  anexo_nome: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipo_anexo: {
    type: DataTypes.ENUM('imagem', 'video', 'file'),
    allowNull: true
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  dislikes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  foi_denunciada: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  oculta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'chat_mensagens',
  timestamps: false
});

module.exports = ChatMensagem;