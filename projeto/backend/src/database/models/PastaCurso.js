const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const PastaCurso = sequelize.define("curso_topico_pasta", {
  id_pasta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  arquivo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso_topico",
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
  data_limite: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: "curso_topico_pasta",
  timestamps: false,
});

module.exports = PastaCurso;