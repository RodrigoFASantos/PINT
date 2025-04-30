const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const FormadorArea = sequelize.define("formador_area", {
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
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "areas",
      key: "id_area",
    },
  },
  data_associacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "formador_area",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_formador', 'id_area']
    }
  ]
});

module.exports = FormadorArea;