const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Comentario_Topico = sequelize.define("comentarios_topico", {
  id_comentario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "topicos_categorias",
      key: "id_topico",
    },
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true, // Permite comentários apenas com anexo
  },
  anexo_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  anexo_nome: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tipo_anexo: {
    type: DataTypes.ENUM('imagem', 'video', 'file'),
    allowNull: true,
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  dislikes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  denuncias: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: "comentarios_topico",
  timestamps: false,
  indexes: [
    {
      name: "idx_comentarios_topico",
      fields: ["id_topico"]
    },
    {
      name: "idx_comentarios_utilizador",
      fields: ["id_utilizador"]
    }
  ]
});

module.exports = Comentario_Topico;