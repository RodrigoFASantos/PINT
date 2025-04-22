const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const PastaCurso = sequelize.define("pastas_curso", {
  id_pasta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "topicos_curso",
      key: "id_topico",
    },
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: "pastas_curso",
  timestamps: false,
});


PastaCurso.associate = function(models) {
  // Associação com ConteudoCurso
  PastaCurso.hasMany(models.ConteudoCurso, {
    foreignKey: 'id_pasta',
    as: 'conteudos'
  });
  
  // Associação com TopicoCurso
  PastaCurso.belongsTo(models.TopicoCurso, {
    foreignKey: 'id_topico',
    as: 'topico'
  });
};

module.exports = PastaCurso;