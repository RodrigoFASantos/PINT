// =============================================================================
// MODELO: SISTEMA DE AVALIAÇÕES
// =============================================================================
// Gere as avaliações finais dos formandos nos cursos
// Inclui notas, certificados, controlo de presenças e prazos

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
    comment: "Inscrição do formando que está a ser avaliado"
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: "Nota final do formando (ex: 0.00 a 20.00)"
  },
  certificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Indica se o certificado foi emitido"
  },
  horas_totais: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Total de horas programadas para o curso"
  },
  horas_presenca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Horas de presença efetiva do formando"
  },
  data_avaliacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: "Data em que a avaliação foi registada"
  },
  url_certificado: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho para o ficheiro do certificado gerado"
  },
  data_limite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data limite para submissão de trabalhos ou avaliações"
  }
}, {
  tableName: "avaliacoes",
  timestamps: false,
});

module.exports = Avaliacao;