const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso_Presenca = sequelize.define("curso_presenca", {
  id_curso_presenca: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
  },
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  data_fim: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hora_fim: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
}, {
  tableName: "curso_presenca",
  timestamps: false,
});

module.exports = Curso_Presenca;