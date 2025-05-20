const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Formando_Presenca = sequelize.define("formando_presenca", {
  id_formando_presenca: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_curso_presenca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso_presenca",
      key: "id_curso_presenca",
    },
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
  },
  presenca: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  duracao: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Duração da sessão em horas',
  }
}, {
  tableName: "formando_presenca",
  timestamps: false,
});

module.exports = Formando_Presenca;