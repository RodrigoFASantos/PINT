// =============================================================================
// MODELO: TÓPICOS DE ÁREA
// =============================================================================
// Define tópicos de discussão específicos para cada área de formação
// Serve como base para chat, fórum e associação com cursos

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Topico_Area = sequelize.define("topico_area", {
  id_topico: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Categoria à qual o tópico pertence"
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "areas",
      key: "id_area",
    },
    comment: "Área específica do tópico"
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Título do tópico de discussão"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição detalhada do tópico"
  },
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Utilizador que criou o tópico"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação do tópico"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se o tópico está ativo/disponível"
  }
}, {
  tableName: "topico_area",
  timestamps: false,
});

module.exports = Topico_Area;