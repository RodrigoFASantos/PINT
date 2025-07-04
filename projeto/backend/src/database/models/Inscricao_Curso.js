// =============================================================================
// MODELO: INSCRIÇÕES EM CURSOS
// =============================================================================
// Gere as inscrições dos formandos nos cursos disponíveis
// Inclui controlo de estado, motivações e resultados finais

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Inscricao_Curso = sequelize.define("Inscricao_Curso", {
  id_inscricao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Formando que se inscreveu no curso"
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Curso no qual o formando se inscreveu"
  },
  data_inscricao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data de inscrição no curso"
  },
  estado: {
    type: DataTypes.ENUM("inscrito", "cancelado"),
    allowNull: false,
    defaultValue: "inscrito",
    comment: "Estado atual da inscrição"
  },
  motivacao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Motivação expressa pelo formando na inscrição"
  },
  expectativas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Expectativas do formando relativamente ao curso"
  },
  nota_final: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: "Nota final obtida no curso (0.00 a 20.00)"
  },
  certificado_gerado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o certificado foi gerado e emitido"
  },
  horas_presenca: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Total de horas de presença registadas"
  },
  motivo_cancelamento: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Motivo do cancelamento (se aplicável)"
  },
  data_cancelamento: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data do cancelamento da inscrição"
  }
}, {
  tableName: "inscricoes_cursos",
  timestamps: false,
});

module.exports = Inscricao_Curso;