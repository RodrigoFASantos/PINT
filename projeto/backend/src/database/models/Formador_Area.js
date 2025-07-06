// =============================================================================
// MODELO: ÁREAS DE ESPECIALIZAÇÃO DOS FORMADORES
// =============================================================================
// Define as áreas específicas de conhecimento nas quais cada formador está habilitado
// Permite controlo granular sobre quais cursos cada formador pode lecionar

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

/**
 * Tabela de associação entre formadores e áreas específicas de conhecimento
 * 
 * Esta tabela estabelece a relação muitos-para-muitos entre formadores e áreas,
 * permitindo que um formador tenha múltiplas especializações e que uma área
 * possa ser lecionada por múltiplos formadores.
 * 
 * Estrutura da relação:
 * - Um formador pode estar associado a múltiplas áreas
 * - Uma área pode ter múltiplos formadores habilitados
 * - Cada associação tem data de criação para auditoria
 */
const FormadorArea = sequelize.define("formador_area", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Identificador único da associação formador-área"
  },
  id_formador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Referência ao formador que tem a especialização"
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "areas",
      key: "id_area",
    },
    comment: "Referência à área específica de conhecimento"
  },
  data_associacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data em que a especialização foi atribuída ao formador"
  }
}, {
  tableName: "formador_area",
  timestamps: false,
  indexes: [
    {
      // Índice único para evitar duplicação da mesma associação
      unique: true,
      fields: ['id_formador', 'id_area'],
      name: 'unique_formador_area'
    },
    {
      // Índice para consultas por formador
      fields: ['id_formador'],
      name: 'idx_formador_area_formador'
    },
    {
      // Índice para consultas por área
      fields: ['id_area'],
      name: 'idx_formador_area_area'
    }
  ],
  comment: "Associações entre formadores e áreas específicas de especialização"
});

module.exports = FormadorArea;