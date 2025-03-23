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
  },
  imagem: {
    type: DataTypes.STRING(255),
    allowNull: true, // Permite categorias sem imagem inicialmente
  },
}, {
  tableName: "categorias",
  timestamps: false,
});

module.exports = Categoria;
