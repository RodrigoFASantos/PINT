const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso = sequelize.define("curso", {
  id_curso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM("sincrono", "assincrono"),
    allowNull: false,
  },
  vagas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM("planeado", "em_curso", "terminado"),
    allowNull: false,
    defaultValue: "planeado",
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  id_formador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "areas",
      key: "id_area",
    },
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
  },
  id_topico_organizacional: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "topicos_categorias",
      key: "id_topico",
    },
  },
  imagem_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  dir_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: "curso",
  timestamps: false,
});

module.exports = Curso;