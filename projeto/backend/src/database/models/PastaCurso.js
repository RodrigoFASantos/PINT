// =============================================================================
// MODELO: PASTAS DOS CURSOS
// =============================================================================
// Organiza os conteúdos dos cursos em pastas dentro de cada tópico
// Permite estruturação hierárquica: Curso > Tópico > Pasta > Conteúdos

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
    comment: "Nome da pasta (ex: Aula 1, Exercícios, Recursos)"
  },
  arquivo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho para ficheiro anexo da pasta (opcional)"
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso_topico",
      key: "id_topico",
    },
    comment: "Tópico ao qual a pasta pertence"
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Ordem de apresentação da pasta no tópico"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se a pasta está ativa/visível"
  },
  data_limite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data limite para submissão de trabalhos (se aplicável)"
  }
}, {
  tableName: "curso_topico_pasta",
  timestamps: false,
});

module.exports = PastaCurso;