// =============================================================================
// MODELO: TRABALHOS ENTREGUES
// =============================================================================
// Regista os trabalhos/projetos submetidos pelos formandos
// Inclui sistema de avaliação e feedback dos formadores

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Trabalho_Entregue = sequelize.define("trabalhos_entregues", {
  id_trabalho: {
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
    comment: "Formando que submeteu o trabalho"
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Curso ao qual o trabalho se refere"
  },
  id_pasta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "pastas_curso",
      key: "id_pasta",
    },
    comment: "Pasta específica onde o trabalho foi solicitado"
  },
  ficheiro_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: "Caminho do ficheiro submetido no servidor"
  },
  nome_ficheiro: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Nome original do ficheiro submetido"
  },
  data_entrega: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora de submissão do trabalho"
  },
  avaliacao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 20
    },
    comment: "Nota atribuída pelo formador (0-20, null se não avaliado)"
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Observações e feedback do formador"
  }
}, {
  tableName: "trabalhos_entregues",
  timestamps: false,
});

module.exports = Trabalho_Entregue;