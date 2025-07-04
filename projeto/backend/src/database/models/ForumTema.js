// =============================================================================
// MODELO: TEMAS DO FÓRUM
// =============================================================================
// Representa os temas/tópicos de discussão criados pelos utilizadores no fórum
// Cada tema pode ter múltiplos comentários e suporta anexos multimídia

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
    },
    comment: "Tópico/área onde o tema foi criado"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    },
    comment: "Utilizador que criou o tema"
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Título do tema de discussão"
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Conteúdo textual do tema (pode ser null se só tiver anexo)"
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
    comment: "Tipo de anexo do tema"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora de criação do tema"
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de likes do tema"
  },
  dislikes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de dislikes do tema"
  },
  comentarios: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de comentários do tema"
  },
  foi_denunciado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o tema foi denunciado"
  },
  oculto: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o tema está oculto (moderação)"
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