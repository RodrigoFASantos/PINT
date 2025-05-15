const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ForumTemaDenuncia = sequelize.define('forum_tema_denuncia', {
  id_denuncia: {
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
}, {
  tableName: 'forum_tema_denuncia',
  timestamps: false,
  indexes: [
    {
      name: 'idx_forum_tema_denuncia_tema',
      fields: ['id_tema']
    },
    {
      name: 'idx_forum_tema_denuncia_denunciante',
      fields: ['id_denunciante']
    }
  ]
});

module.exports = ForumTemaDenuncia;