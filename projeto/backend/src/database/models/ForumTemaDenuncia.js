// =============================================================================
// MODELO: DENÚNCIAS DE TEMAS DO FÓRUM
// =============================================================================
// Sistema de moderação que permite denunciar temas inadequados do fórum
// Inclui gestão de estado e ações tomadas pelos moderadores

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
   },
   comment: "Tema que foi denunciado"
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
    comment: "Motivo da denúncia (ex: spam, conteúdo inadequado, ofensivo)"
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