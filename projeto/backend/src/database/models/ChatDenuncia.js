const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatDenuncia = sequelize.define('chat_denuncias', {
  id_denuncia: {
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
  id_denunciante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  motivo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_denuncia: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  resolvida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  acao_tomada: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
});

module.exports = ChatDenuncia;