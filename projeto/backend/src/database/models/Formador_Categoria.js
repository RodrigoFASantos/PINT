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
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
  },
  data_associacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "formador_categoria",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_formador', 'id_categoria']
    }
  ]
});

module.exports = FormadorCategoria;