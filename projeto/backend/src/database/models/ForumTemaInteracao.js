// =============================================================================
// MODELO: INTERAÇÕES DOS TEMAS DO FÓRUM
// =============================================================================
// Regista as interações (likes/dislikes) dos utilizadores nos temas do fórum
// Cada utilizador pode dar apenas uma interação por tema

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ForumTemaInteracao = sequelize.define('forum_tema_interacao', {
  id_interacao: {
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
    },
    comment: "Tema que recebeu a interação"
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
  tableName: 'forum_tema_interacao',
  timestamps: false,
  indexes: [
    {
      name: 'idx_forum_tema_interacao_tema',
      fields: ['id_tema']
    },
    {
      name: 'idx_forum_tema_interacao_utilizador',
      fields: ['id_utilizador']
    }
  ],
  // Restrição única: cada utilizador só pode ter uma interação por tema
  uniqueKeys: {
    unique_user_tema: {
      fields: ['id_tema', 'id_utilizador']
    }
  }
});

module.exports = ForumTemaInteracao;