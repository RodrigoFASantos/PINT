const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const PastaCurso = sequelize.define("pastas_curso", {
  id_pasta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "topicos_curso",
      key: "id_topico",
    },
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: "pastas_curso",
  timestamps: false,
});

module.exports = PastaCurso;