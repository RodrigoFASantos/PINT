const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ForumTema = sequelize.define('forum_tema', {
  id_tema: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'topico_area',
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
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true
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
  comentarios: {
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
  tableName: 'forum_tema',
  timestamps: false,
  indexes: [
    {
      name: 'idx_forum_tema_topico',
      fields: ['id_topico']
    },
    {
      name: 'idx_forum_tema_utilizador',
      fields: ['id_utilizador']
    }
  ]
});

module.exports = ForumTema;