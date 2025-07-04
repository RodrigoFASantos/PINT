// =============================================================================
// MODELO: DENÚNCIAS DE MENSAGENS DE CHAT
// =============================================================================
// Sistema de moderação que permite aos utilizadores denunciar mensagens inadequadas
// Inclui controlo de estado e ações tomadas pelos moderadores

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
    },
    comment: "Mensagem que foi denunciada"
  },
  id_denunciante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    },
    comment: "Utilizador que fez a denúncia"
  },
  motivo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: "Motivo da denúncia (ex: spam, conteúdo inadequado, etc.)"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição detalhada da denúncia (opcional)"
  },
  data_denuncia: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora em que a denúncia foi feita"
  },
  resolvida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se a denúncia já foi analisada e resolvida"
  },
  acao_tomada: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Descrição da ação tomada pelo moderador (se resolvida)"
  }
}, {
  tableName: 'chat_denuncias',
  timestamps: false,
  indexes: [
    {
      name: 'idx_chat_denuncia_mensagem',
      fields: ['id_mensagem']
    },
    {
      name: 'idx_chat_denuncia_denunciante',
      fields: ['id_denunciante']
    }
  ]
});

module.exports = ChatDenuncia;