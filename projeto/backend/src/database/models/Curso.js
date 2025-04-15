const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso = sequelize.define("cursos", {
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
  imagem_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: "cursos",
  timestamps: false,
});

// Adicione as associações aqui
const User = require("./User");
const Area = require("./Area");
const Categoria = require("./Categoria");

// Associação com o formador (User)
Curso.belongsTo(User, {
  foreignKey: "id_formador",
  as: "formador"
});

// Associação com a área
Curso.belongsTo(Area, {
  foreignKey: "id_area",
  as: "area"
});

// Associação com a categoria
Curso.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria"
});


module.exports = Curso;