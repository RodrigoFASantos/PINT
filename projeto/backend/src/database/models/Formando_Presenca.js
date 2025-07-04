// =============================================================================
// MODELO: PRESENÇAS DOS FORMANDOS
// =============================================================================
// Regista a presença individual de cada formando nas sessões dos cursos
// Inclui controlo de duração para cálculo de horas de formação

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
    comment: "Sessão de presença à qual este registo se refere"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Formando que registou presença"
  },
  presenca: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se o formando esteve presente (true) ou ausente (false)"
  },
  duracao: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Duração efetiva da presença em horas (para presenças parciais)'
  }
}, {
  tableName: "formando_presenca",
  timestamps: false,
});

module.exports = Formando_Presenca;