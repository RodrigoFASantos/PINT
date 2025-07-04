// =============================================================================
// MODELO: CATEGORIAS DOS FORMADORES
// =============================================================================
// Define as categorias de formação nas quais cada formador está habilitado
// Permite controlar quais cursos cada formador pode lecionar

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const FormadorCategoria = sequelize.define("formador_categoria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_formador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Formador a quem a categoria é atribuída"
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Categoria na qual o formador está habilitado"
  },
  data_associacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data em que a habilitação foi atribuída"
  }
}, {
  tableName: "formador_categoria",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_formador', 'id_categoria'],
      name: 'unique_formador_categoria'
    }
  ]
});

module.exports = FormadorCategoria;