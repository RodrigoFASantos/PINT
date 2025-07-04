// =============================================================================
// MODELO: TÓPICOS DOS CURSOS
// =============================================================================
// Organiza os cursos em tópicos/módulos temáticos
// Cada tópico pode conter múltiplas pastas com conteúdos

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso_Topicos = sequelize.define("curso_topico", {
  id_topico: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: "Nome do tópico/módulo"
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Curso ao qual o tópico pertence"
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Ordem de apresentação do tópico no curso"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se o tópico está ativo/visível"
  },
  arquivo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho para ficheiro anexo do tópico"
  },
  dir_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho para o diretório de ficheiros do tópico"
  }
}, {
  tableName: "curso_topico",
  timestamps: false,
});

module.exports = Curso_Topicos;