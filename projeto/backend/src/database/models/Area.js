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
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
  },
}, {
  tableName: "areas",
  timestamps: false,
});

module.exports = Area;
