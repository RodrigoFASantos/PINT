// =============================================================================
// MODELO: CATEGORIAS DE FORMAÇÃO
// =============================================================================
// Define as grandes categorias de cursos (ex: Informática, Gestão, Saúde)
// Cada categoria pode ter múltiplas áreas específicas

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Categoria = sequelize.define("categorias", {
  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: "Nome único da categoria de formação"
  },
}, {
  tableName: "categorias",
  timestamps: false,
});

module.exports = Categoria;