const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Conteudo = sequelize.define("conteudos", {
  id_conteudo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "cursos",
      key: "id_curso",
    },
  },
  tipo: {
    type: DataTypes.ENUM("link", "ficheiro", "video", "outro"),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  url_ou_ficheiro: {
    type: DataTypes.STRING(500),
    allowNull: false, // Pode ser um URL ou caminho para o ficheiro no servidor
  },
}, {
  tableName: "conteudos",
  timestamps: false,
});

module.exports = Conteudo;
