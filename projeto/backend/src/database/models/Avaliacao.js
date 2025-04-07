const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Avaliacao = sequelize.define("avaliacoes", {
  id_avaliacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_inscricao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "inscricoes_cursos",
      key: "id_inscricao",
    },
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  certificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  horas_totais: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  horas_presenca: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data_avaliacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  url_certificado: {
    type: DataTypes.STRING(500),
    allowNull: true,
  }
}, {
  tableName: "avaliacoes",
  timestamps: false,
});

module.exports = Avaliacao;