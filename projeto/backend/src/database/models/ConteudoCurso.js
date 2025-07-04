// =============================================================================
// MODELO: CONTEÚDOS DOS CURSOS
// =============================================================================
// Representa os materiais de estudo dentro de cada pasta de tópico
// Suporta ficheiros, links externos e vídeos organizados hierarquicamente

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const ConteudoCurso = sequelize.define("curso_topico_pasta_conteudo", {
  id_conteudo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Título do conteúdo"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição do conteúdo"
  },
  tipo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['file', 'link', 'video']]
    },
    comment: "Tipo: file (ficheiro), link (URL externa) ou video"
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "URL externa (para tipo 'link')"
  },
  arquivo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho do ficheiro no servidor (para tipos 'file' e 'video')"
  },
  id_pasta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso_topico_pasta",
      key: "id_pasta",
    },
    comment: "Pasta onde o conteúdo está organizado"
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Curso ao qual o conteúdo pertence"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação do conteúdo"
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Ordem de apresentação dentro da pasta"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se o conteúdo está ativo/visível"
  },
}, {
  tableName: "curso_topico_pasta_conteudo",
  timestamps: false,
});

module.exports = ConteudoCurso;