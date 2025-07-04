// =============================================================================
// MODELO: ÁREAS DE FORMAÇÃO
// =============================================================================
// Define as áreas específicas dentro de cada categoria de formação
// Exemplo: Categoria "Informática" pode ter áreas como "Programação", "Redes", etc.

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Area = sequelize.define("areas", {
  id_area: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Nome da área de formação (ex: Programação Web, Design Gráfico)"
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Categoria pai à qual esta área pertence"
  },
}, {
  tableName: "areas",
  timestamps: false,
});

module.exports = Area;