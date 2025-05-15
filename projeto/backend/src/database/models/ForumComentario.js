const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ForumComentario = sequelize.define('forum_comentario', {
  id_comentario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_tema: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'forum_tema',
      key: 'id_tema'
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
    allowNull: true // Permite comentários só com anexo
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
  foi_denunciado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  oculto: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'forum_comentario',
  timestamps: false,
  indexes: [
    {
      name: 'idx_forum_comentario_tema',
      fields: ['id_tema']
    },
    {
      name: 'idx_forum_comentario_utilizador',
      fields: ['id_utilizador']
    }
  ]
});

module.exports = ForumComentario;