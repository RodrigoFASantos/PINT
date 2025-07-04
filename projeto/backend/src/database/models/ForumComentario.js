// =============================================================================
// MODELO: COMENTÁRIOS DO FÓRUM
// =============================================================================
// Representa as respostas/comentários feitos pelos utilizadores nos temas do fórum
// Suporta texto, anexos multimídia e sistema de likes/dislikes

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
    },
    comment: "Tema ao qual o comentário pertence"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    },
    comment: "Utilizador que fez o comentário"
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Conteúdo textual do comentário (pode ser null se só tiver anexo)"
  },
  anexo_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "URL do ficheiro anexo"
  },
  anexo_nome: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Nome original do ficheiro anexo"
  },
  tipo_anexo: {
    type: DataTypes.ENUM('imagem', 'video', 'file'),
    allowNull: true,
    comment: "Tipo de anexo do comentário"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora de criação do comentário"
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de likes do comentário"
  },
  dislikes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de dislikes do comentário"
  },
  foi_denunciado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o comentário foi denunciado"
  },
  oculto: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o comentário está oculto (moderação)"
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